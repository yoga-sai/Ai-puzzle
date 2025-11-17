import { Router } from "express"
import { createPuzzleController, getPuzzlesController, submitSolutionController } from "./controllers/puzzles.controllers.js"

const router = Router()
router.get("/", getPuzzlesController)
router.post("/", createPuzzleController)
router.post("/:id/submit", submitSolutionController)

export default router