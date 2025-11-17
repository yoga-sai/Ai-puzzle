import { getAll, create, getById } from "../../repositories/puzzles.js"
import { recordSolution } from "../../repositories/solutions.js"
import { upsertProgress } from "../../repositories/progress.js"

export async function getPuzzlesController(req, res) {
  const { difficulty, category, limit } = req.query
  const puzzles = await getAll({ difficulty, category, limit })
  return res.json({ puzzles })
}

export async function createPuzzleController(req, res) {
  const { title, description, difficulty, category, segments, correct_order } = req.body
  if (!title || !description || !difficulty || !category || !Array.isArray(segments) || !Array.isArray(correct_order)) return res.status(400).json({ message: "invalid" })
  const p = await create({ title, description, difficulty, category, segments, correct_order })
  return res.status(201).json(p)
}

export async function submitSolutionController(req, res) {
  const { id } = req.params
  const { solution_order, time_taken, user_id } = req.body
  if (!Array.isArray(solution_order) || typeof time_taken !== "number") return res.status(400).json({ message: "invalid" })
  const puzzle = await getById(id)
  if (!puzzle) return res.status(404).json({ message: "not_found" })
  const correct = JSON.stringify(solution_order) === JSON.stringify(puzzle.correct_order)
  const score = correct ? 100 : 0
  const feedback = correct ? "Great job! Your solution is correct." : "Incorrect."
  await recordSolution({ user_id, puzzle_id: id, solution_order, is_correct: correct, score, time_taken, feedback })
  if (user_id) await upsertProgress({ user_id, puzzle_id: id, is_correct: correct, score, time_taken })
  return res.json({ correct, feedback, score, hints: [] })
}