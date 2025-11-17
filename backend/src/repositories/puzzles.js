import crypto from "crypto"
import { db } from "../db/connection.js"

export async function getAll({ difficulty, category, limit }) {
  let sql = "SELECT id, title, description, difficulty, category, segments, correct_order, created_by FROM puzzles WHERE 1=1"
  const params = []
  if (difficulty) { sql += " AND difficulty = ?"; params.push(difficulty) }
  if (category) { sql += " AND category = ?"; params.push(category) }
  sql += " ORDER BY created_at DESC"
  if (limit) { sql += " LIMIT ?"; params.push(Number(limit)) }
  const rows = await db.all(sql, params)
  return rows.map(r => ({
    ...r,
    segments: JSON.parse(r.segments),
    correct_order: JSON.parse(r.correct_order)
  }))
}

export async function create({ title, description, difficulty, category, segments, correct_order, created_by }) {
  const id = crypto.randomUUID()
  await db.run("INSERT INTO puzzles(id, title, description, difficulty, category, segments, correct_order, created_by) VALUES(?,?,?,?,?,?,?,?)", [id, title, description, difficulty, category, JSON.stringify(segments), JSON.stringify(correct_order), created_by || null])
  return { id, title, description, difficulty, category, segments, correct_order, created_by }
}

export async function getById(id) {
  const r = await db.get("SELECT id, title, description, difficulty, category, segments, correct_order, created_by FROM puzzles WHERE id = ?", [id])
  if (!r) return null
  return { ...r, segments: JSON.parse(r.segments), correct_order: JSON.parse(r.correct_order) }
}