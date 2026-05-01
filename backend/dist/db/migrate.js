"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = __importDefault(require("./client"));
async function migrate() {
    const sql = (0, fs_1.readFileSync)((0, path_1.join)(__dirname, 'migrations', '001_initial_schema.sql'), 'utf8');
    await client_1.default.query(sql);
    console.log('Migration complete.');
    await client_1.default.end();
}
migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
