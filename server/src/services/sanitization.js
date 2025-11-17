const MAX_LINES = 30
const MAX_DISTRACTORS = 10
const MAX_LINE_LENGTH = 200
const MAX_TOTAL_JSON_SIZE = 64 * 1024

export function sanitizePuzzleData(data) {
  const jsonStr = JSON.stringify(data)
  if (Buffer.byteLength(jsonStr, 'utf8') > MAX_TOTAL_JSON_SIZE) {
    throw new Error('LLM output too large')
  }

  const lines = Array.isArray(data.lines) ? data.lines.slice(0, MAX_LINES) : []
  const distractors = Array.isArray(data.distractors) ? data.distractors.slice(0, MAX_DISTRACTORS) : []
  const trim = (s) => String(s).slice(0, MAX_LINE_LENGTH)

  const sanitizedLines = lines.map(trim)
  const sanitizedDistractors = distractors.map(trim)

  let solutionOrder = Array.isArray(data.solutionOrder) ? data.solutionOrder : []
  solutionOrder = solutionOrder
    .map(n => Number(n))
    .filter(n => Number.isInteger(n) && n >= 0 && n < sanitizedLines.length)

  if (solutionOrder.length === 0) throw new Error('Invalid solutionOrder after sanitation')
  if (sanitizedLines.length === 0) throw new Error('Invalid lines after sanitation')

  return {
    lines: sanitizedLines,
    distractors: sanitizedDistractors,
    solutionOrder,
    problem: trim(data.problem || ''),
    hint: trim(data.hint || '')
  }
}

