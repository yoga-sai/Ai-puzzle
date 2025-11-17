import { useState } from "react"
import { env } from "../lib/env"

export default function LLMPlayground() {
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const run = async () => {
    setError("")
    setLoading(true)
    try {
      const messages = [{ role: "user", content: prompt }]
      const res = await fetch(`${env.apiBase}/api/llm/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/gpt-oss-20b:free", messages, extra_body: { reasoning: { enabled: true } } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "llm_error")
      setResult(data?.choices?.[0]?.message || data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">LLM Playground</h2>
      <textarea className="w-full border rounded px-3 py-2" rows={4} value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Ask a question" />
      <button onClick={run} disabled={loading} className="px-3 py-2 rounded bg-primary text-white">{loading ? "Running" : "Run"}</button>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="border rounded p-4 bg-white space-y-2">
          <div className="font-medium">Response</div>
          <div className="whitespace-pre-wrap text-sm">{result.content}</div>
        </div>
      )}
    </div>
  )
}