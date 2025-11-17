import express from "express"
import cors from "cors"
import authRouter from "../web/auth.routes.js"
import puzzleRouter from "../web/puzzles.routes.js"
import llmRouter from "../web/llm.routes.js"

const app = express()
app.use(cors())
app.use(express.json())

// health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use("/api/auth", authRouter)
app.use("/api/puzzles", puzzleRouter)
app.use("/api/llm", llmRouter)

export default app