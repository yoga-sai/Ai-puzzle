import { describe, it, expect } from '@jest/globals'
import { validateAndParseLLMResponse } from '../../services/promptTemplates.js'

describe('promptTemplates parser', () => {
  it('parses plain JSON', () => {
    const raw = JSON.stringify({
      lines: ['a', 'b'],
      distractors: ['x'],
      solutionOrder: [0, 1]
    })
    const parsed = validateAndParseLLMResponse(raw)
    expect(parsed.lines).toEqual(['a', 'b'])
    expect(parsed.solutionOrder).toEqual([0, 1])
  })

  it('parses JSON in markdown code block', () => {
    const raw = "```json\n{\"lines\":[\"l1\",\"l2\"],\"distractors\":[\"d1\"],\"solutionOrder\":[0,1]}\n```"
    const parsed = validateAndParseLLMResponse(raw)
    expect(parsed.lines.length).toBe(2)
    expect(parsed.solutionOrder).toEqual([0, 1])
  })

  it('falls back to regex extraction', () => {
    const raw = 'lines: ["x","y"], distractors: ["z"], solutionOrder: [0,1]'
    const parsed = validateAndParseLLMResponse(raw)
    expect(parsed.lines).toEqual(['x', 'y'])
    expect(parsed.distractors).toEqual(['z'])
    expect(parsed.solutionOrder).toEqual([0, 1])
  })

  it('throws on invalid input', () => {
    expect(() => validateAndParseLLMResponse('not valid')).toThrow()
  })
})
