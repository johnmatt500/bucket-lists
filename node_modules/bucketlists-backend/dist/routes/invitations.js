"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../db/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/:token', async (req, res, next) => {
    try {
        const { rows } = await client_1.default.query(`SELECT
        inv.id,
        inv.bucket_id,
        b.name AS bucket_name,
        inv.invited_email,
        u.name AS inviter_name,
        inv.accepted_at
       FROM invitation inv
       JOIN bucket b ON b.id = inv.bucket_id
       JOIN "user" u ON u.id = inv.invited_by
       WHERE inv.token = $1`, [req.params.token]);
        if (!rows[0]) {
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }
        res.json({ invitation: rows[0] });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:token/accept', auth_1.requireAuth, async (req, res, next) => {
    const client = await client_1.default.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(`SELECT id, bucket_id, accepted_at FROM invitation WHERE token = $1 FOR UPDATE`, [req.params.token]);
        if (!rows[0]) {
            await client.query('ROLLBACK');
            res.status(404).json({ error: 'Invitation not found' });
            return;
        }
        const inv = rows[0];
        if (inv.accepted_at) {
            await client.query('ROLLBACK');
            res.status(410).json({ error: 'Invitation already accepted' });
            return;
        }
        const { rows: existing } = await client.query(`SELECT 1 FROM bucket_member WHERE bucket_id = $1 AND user_id = $2`, [inv.bucket_id, req.userId]);
        if (existing[0]) {
            await client.query('ROLLBACK');
            res.status(409).json({ error: 'Already a member of this bucket' });
            return;
        }
        await client.query(`INSERT INTO bucket_member (bucket_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [inv.bucket_id, req.userId]);
        await client.query(`UPDATE invitation SET accepted_at = NOW() WHERE id = $1`, [inv.id]);
        await client.query('COMMIT');
        res.json({ bucket_id: inv.bucket_id });
    }
    catch (err) {
        await client.query('ROLLBACK');
        next(err);
    }
    finally {
        client.release();
    }
});
exports.default = router;
