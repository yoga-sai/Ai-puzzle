const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export async function chatCompletion({ model, messages, extra_body }) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("missing_api_key")
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, messages, extra_body })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || "llm_error")
  return data
}