import { Router, Response, NextFunction } from 'express'
import pool from '../db/client'
import { AuthRequest } from '../middleware/auth'
import { sendInvitationEmail } from '../lib/email'

const router = Router()

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        b.id,
        b.name,
        b.location,
        b.created_at,
        b.expiration_date,
        b.is_completed,
        -- Completion %: completed approved-item weight / total approved-item weight
        COALESCE(
          ROUND(
            100.0
            * SUM(CASE WHEN i.is_completed AND i.status = 'approved' THEN i.importance * i.total_hours_required ELSE 0 END)
            / NULLIF(SUM(CASE WHEN i.status = 'approved' THEN i.importance * i.total_hours_required ELSE 0 END), 0)
          )::integer,
          0
        ) AS completion_pct,
        COUNT(DISTINCT bm.user_id)::integer AS member_count
      FROM bucket b
      JOIN bucket_member bm_self ON bm_self.bucket_id = b.id AND bm_self.user_id = $1
      LEFT JOIN item i ON i.bucket_id = b.id
      LEFT JOIN bucket_member bm ON bm.bucket_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC`,
      [req.userId],
    )
    res.json({ buckets: rows })
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, location, expiration_date, invite_emails } = req.body

  if (!name?.trim()) {
    res.status(400).json({ error: 'Bucket name is required' })
    return
  }
  if (expiration_date && new Date(expiration_date) <= new Date()) {
    res.status(400).json({ error: 'Expiration date must be a future date' })
    return
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: [bucket] } = await client.query(
      `INSERT INTO bucket (name, location, expiration_date, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, location, created_at, expiration_date, is_completed`,
      [name.trim(), location?.trim() || null, expiration_date || null, req.userId],
    )

    await client.query(
      `INSERT INTO bucket_member (bucket_id, user_id) VALUES ($1, $2)`,
      [bucket.id, req.userId],
    )

    const emails: string[] = Array.isArray(invite_emails) ? invite_emails : []
    const invitations: { token: string; invited_email: string }[] = []

    for (const email of emails) {
      const { rows: [inv] } = await client.query(
        `INSERT INTO invitation (bucket_id, invited_email, invited_by)
         VALUES ($1, $2, $3)
         RETURNING token, invited_email`,
        [bucket.id, email.toLowerCase().trim(), req.userId],
      )
      invitations.push(inv)
    }

    await client.query('COMMIT')

    // Send emails after commit so DB state is always clean
    if (invitations.length > 0) {
      const { rows: [creator] } = await pool.query(
        `SELECT name FROM "user" WHERE id = $1`,
        [req.userId],
      )
      for (const inv of invitations) {
        sendInvitationEmail({
          toEmail: inv.invited_email,
          inviterName: creator.name,
          bucketName: bucket.name,
          token: inv.token,
        }).catch(err => console.error(`[email] Failed to send to ${inv.invited_email}:`, err))
      }
    }

    res.status(201).json({ bucket: { ...bucket, completion_pct: 0, member_count: 1 } })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

export default router
