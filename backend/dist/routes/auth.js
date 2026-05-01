"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = __importDefault(require("../db/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d'),
    });
}
router.post('/signup', async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
    }
    if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
    }
    try {
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const { rows } = await client_1.default.query(`INSERT INTO "user" (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`, [name.trim(), email.toLowerCase().trim(), passwordHash]);
        const user = rows[0];
        res.status(201).json({ token: signToken(user.id), user });
    }
    catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ error: 'An account with this email already exists' });
            return;
        }
        next(err);
    }
});
router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }
    try {
        const { rows } = await client_1.default.query(`SELECT id, name, email, password_hash, created_at
       FROM "user" WHERE email = $1`, [email.toLowerCase().trim()]);
        const user = rows[0];
        if (!user || !(await bcryptjs_1.default.compare(password, user.password_hash))) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        await client_1.default.query(`UPDATE "user" SET last_login_at = NOW() WHERE id = $1`, [user.id]);
        const { password_hash: _pw, ...safeUser } = user;
        res.json({ token: signToken(safeUser.id), user: safeUser });
    }
    catch (err) {
        next(err);
    }
});
router.get('/me', auth_1.requireAuth, async (req, res, next) => {
    try {
        const { rows } = await client_1.default.query(`SELECT id, name, email, created_at, last_login_at
       FROM "user" WHERE id = $1`, [req.userId]);
        if (!rows[0]) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(rows[0]);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
