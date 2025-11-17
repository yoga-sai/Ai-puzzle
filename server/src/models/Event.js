import crypto from 'crypto'
import { getDb } from './db.js'

export class Event {
  static async create({ user_id, puzzle_id, session_id, event_type, metadata = {} }) {
    const db = await getDb()
    const id = crypto.randomUUID()
    const created_at = new Date().toISOString()
    const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
    const result = await db.query(
      `INSERT INTO events (id, user_id, puzzle_id, session_id, event_type, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, user_id || null, puzzle_id || null, session_id || null, event_type, meta, created_at]
    )
    return result.rows[0]
  }
}
