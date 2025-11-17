import crypto from "crypto"
import { db } from "../db/connection.js"

export async function recordSolution({ user_id, puzzle_id, solution_order, is_correct, score, time_taken, feedback }) {
  const id = crypto.randomUUID()
  await db.run("INSERT INTO solutions(id, user_id, puzzle_id, solution_order, is_correct, score, time_taken, feedback) VALUES(?,?,?,?,?,?,?,?)", [id, user_id || null, puzzle_id, JSON.stringify(solution_order), is_correct ? 1 : 0, score, time_taken, feedback ? JSON.stringify(feedback) : null])
  return id
}