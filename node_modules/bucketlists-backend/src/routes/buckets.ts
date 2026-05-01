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

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        b.id,
        b.name,
        b.location,
        b.created_at,
        b.expiration_date,
        b.is_completed,
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
      WHERE b.id = $2
      GROUP BY b.id`,
      [req.userId, req.params.id],
    )
    if (!rows[0]) {
      res.status(404).json({ error: 'Bucket not found' })
      return
    }
    res.json({ bucket: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/items', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows: membership } = await pool.query(
      `SELECT 1 FROM bucket_member WHERE bucket_id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    )
    if (!membership[0]) {
      res.status(404).json({ error: 'Bucket not found' })
      return
    }
    const { rows } = await pool.query(
      `SELECT
        id, bucket_id, name, full_address, importance,
        amount_time_required, time_scale, total_hours_required,
        status, is_completed, completion_date, created_at
       FROM item
       WHERE bucket_id = $1
         AND status != 'rejected'
       ORDER BY created_at ASC`,
      [req.params.id],
    )
    res.json({ items: rows })
  } catch (err) {
    next(err)
  }
})

router.get('/:id/members', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rows: membership } = await pool.query(
      `SELECT 1 FROM bucket_member WHERE bucket_id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    )
    if (!membership[0]) {
      res.status(404).json({ error: 'Bucket not found' })
      return
    }
    const { rows } = await pool.query(
      `SELECT
        u.id         AS user_id,
        u.name,
        u.email,
        bm.joined_at,
        'accepted'   AS invite_status
       FROM bucket_member bm
       JOIN "user" u ON u.id = bm.user_id
       WHERE bm.bucket_id = $1
       UNION ALL
       SELECT
        NULL              AS user_id,
        NULL              AS name,
        inv.invited_email AS email,
        NULL              AS joined_at,
        'pending'         AS invite_status
       FROM invitation inv
       WHERE inv.bucket_id = $1
         AND inv.accepted_at IS NULL
       ORDER BY invite_status ASC, joined_at ASC NULLS LAST`,
      [req.params.id],
    )
    res.json({ members: rows })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/items', async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { name, importance, amount_time_required, time_scale, full_address } = req.body

  if (!name?.trim()) {
    res.status(400).json({ error: 'Item name is required' })
    return
  }
  const imp = Number(importance)
  if (!importance || !Number.isInteger(imp) || imp < 1 || imp > 5) {
    res.status(400).json({ error: 'Importance must be an integer between 1 and 5' })
    return
  }
  const amt = Number(amount_time_required)
  if (!amount_time_required || !Number.isInteger(amt) || amt < 1) {
    res.status(400).json({ error: 'Amount of time required must be a positive integer' })
    return
  }
  if (time_scale !== 'hours' && time_scale !== 'days') {
    res.status(400).json({ error: 'Time scale must be "hours" or "days"' })
    return
  }

  try {
    const { rows: membership } = await pool.query(
      `SELECT 1 FROM bucket_member WHERE bucket_id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    )
    if (!membership[0]) {
      res.status(404).json({ error: 'Bucket not found' })
      return
    }

    const total_hours_required = time_scale === 'hours' ? amt : amt * 8

    const { rows: [{ cnt }] } = await pool.query(
      `SELECT COUNT(*)::integer AS cnt FROM bucket_member WHERE bucket_id = $1`,
      [req.params.id],
    )
    const status = cnt === 1 ? 'approved' : 'pending'

    const { rows: [item] } = await pool.query(
      `INSERT INTO item
         (bucket_id, name, full_address, importance, amount_time_required, time_scale, total_hours_required, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING
         id, bucket_id, name, full_address, importance,
         amount_time_required, time_scale, total_hours_required,
         status, is_completed, completion_date, created_at`,
      [req.params.id, name.trim(), full_address?.trim() || null, imp, amt, time_scale, total_hours_required, status, req.userId],
    )
    res.status(201).json({ item })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/invitations', async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { email } = req.body
  if (!email?.trim()) {
    res.status(400).json({ error: 'Email is required' })
    return
  }
  const normalizedEmail = email.trim().toLowerCase()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: membership } = await client.query(
      `SELECT 1 FROM bucket_member WHERE bucket_id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    )
    if (!membership[0]) {
      await client.query('ROLLBACK')
      res.status(404).json({ error: 'Bucket not found' })
      return
    }

    const { rows: existingMember } = await client.query(
      `SELECT 1 FROM bucket_member bm
       JOIN "user" u ON u.id = bm.user_id
       WHERE bm.bucket_id = $1 AND u.email = $2`,
      [req.params.id, normalizedEmail],
    )
    if (existingMember[0]) {
      await client.query('ROLLBACK')
      res.status(409).json({ error: 'This person is already a member of this bucket' })
      return
    }

    const { rows: existingInvite } = await client.query(
      `SELECT 1 FROM invitation
       WHERE bucket_id = $1 AND invited_email = $2 AND accepted_at IS NULL`,
      [req.params.id, normalizedEmail],
    )
    if (existingInvite[0]) {
      await client.query('ROLLBACK')
      res.status(409).json({ error: 'An invitation is already pending for this email' })
      return
    }

    const { rows: [inv] } = await client.query(
      `INSERT INTO invitation (bucket_id, invited_email, invited_by)
       VALUES ($1, $2, $3)
       RETURNING token, invited_email`,
      [req.params.id, normalizedEmail, req.userId],
    )
    const { rows: [bucket] } = await client.query(
      `SELECT name FROM bucket WHERE id = $1`,
      [req.params.id],
    )
    const { rows: [inviter] } = await client.query(
      `SELECT name FROM "user" WHERE id = $1`,
      [req.userId],
    )

    await client.query('COMMIT')

    sendInvitationEmail({
      toEmail: inv.invited_email,
      inviterName: inviter.name,
      bucketName: bucket.name,
      token: inv.token,
    }).catch(err => console.error(`[email] Failed to send to ${inv.invited_email}:`, err))

    res.status(201).json({ message: 'Invitation sent' })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

export default router
