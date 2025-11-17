import { db } from "../db/connection.js"
import crypto from "crypto"

export async function upsertProgress({ user_id, puzzle_id, is_correct, score, time_taken }) {
  const existing = await db.get("SELECT id, attempts, best_score, best_time FROM progress WHERE user_id = ? AND puzzle_id = ?", [user_id, puzzle_id])
  if (!existing) {
    const id = crypto.randomUUID()
    await db.run("INSERT INTO progress(id, user_id, puzzle_id, status, attempts, best_score, best_time, last_attempt) VALUES(?,?,?,?,?,?,?,datetime('now'))", [id, user_id, puzzle_id, is_correct ? 'completed' : 'in_progress', 1, score, time_taken])
    return id
  } else {
    const attempts = (existing.attempts || 0) + 1
    const best_score = Math.max(existing.best_score || 0, score)
    const best_time = existing.best_time ? Math.min(existing.best_time, time_taken) : time_taken
    await db.run("UPDATE progress SET status = ?, attempts = ?, best_score = ?, best_time = ?, last_attempt = datetime('now'), updated_at = datetime('now') WHERE id = ?", [is_correct ? 'completed' : 'in_progress', attempts, best_score, best_time, existing.id])
    return existing.id
  }
}