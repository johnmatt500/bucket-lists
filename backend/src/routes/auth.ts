import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/client'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  })
}

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' })
    return
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const { rows } = await pool.query(
      `INSERT INTO "user" (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash],
    )
    const user = rows[0]
    res.status(201).json({ token: signToken(user.id), user })
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }
    next(err)
  }
})

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, created_at
       FROM "user" WHERE email = $1`,
      [email.toLowerCase().trim()],
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    await pool.query(`UPDATE "user" SET last_login_at = NOW() WHERE id = $1`, [user.id])
    const { password_hash: _pw, ...safeUser } = user
    res.json({ token: signToken(safeUser.id), user: safeUser })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, created_at, last_login_at
       FROM "user" WHERE id = $1`,
      [req.userId],
    )
    if (!rows[0]) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

export default router
