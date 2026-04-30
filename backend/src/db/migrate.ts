import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import pool from './client'

async function migrate() {
  const sql = readFileSync(join(__dirname, 'migrations', '001_initial_schema.sql'), 'utf8')
  await pool.query(sql)
  console.log('Migration complete.')
  await pool.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
