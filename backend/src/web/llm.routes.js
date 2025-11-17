import { Router } from "express"
import { chatController } from "./controllers/llm.controllers.js"

const router = Router()
router.post("/chat", chatController)

export default router