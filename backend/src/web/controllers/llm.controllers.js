import { chatCompletion } from "../../services/llm.service.js"

export async function chatController(req, res) {
  const { model, messages, extra_body } = req.body || {}
  if (!Array.isArray(messages) || !model) return res.status(400).json({ message: "invalid" })
  try {
    const data = await chatCompletion({ model, messages, extra_body })
    return res.json(data)
  } catch (e) {
    if (e.message === "missing_api_key") return res.status(500).json({ message: "missing_api_key" })
    return res.status(502).json({ message: "llm_error" })
  }
}