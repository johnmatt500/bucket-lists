"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const buckets_1 = __importDefault(require("./routes/buckets"));
const invitations_1 = __importDefault(require("./routes/invitations"));
const auth_2 = require("./middleware/auth");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/buckets', auth_2.requireAuth, buckets_1.default);
app.use('/api/invitations', invitations_1.default);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
