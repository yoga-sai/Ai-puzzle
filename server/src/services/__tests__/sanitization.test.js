import { describe, it, expect } from '@jest/globals'
import { sanitizePuzzleData } from '../../services/sanitization.js'

describe('sanitization', () => {
  it('enforces size and bounds', () => {
    const data = {
      lines: Array.from({ length: 50 }, (_, i) => 'L' + i),
      distractors: Array.from({ length: 20 }, (_, i) => 'D' + i),
      solutionOrder: [0, 1, 2, 3],
      problem: 'p',
      hint: 'h'
    }
    const s = sanitizePuzzleData(data)
    expect(s.lines.length).toBeLessThanOrEqual(30)
    expect(s.distractors.length).toBeLessThanOrEqual(10)
  })

  it('throws on invalid solutionOrder', () => {
    expect(() => sanitizePuzzleData({ lines: ['a'], distractors: [], solutionOrder: [5] })).toThrow()
  })
})

