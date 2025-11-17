import { describe, it, expect } from '@jest/globals';
import { mapSkillToDifficulty, getBandParameters } from '../difficultyScheduler.js';

describe('difficultyScheduler', () => {
  describe('mapSkillToDifficulty', () => {
    it('should return difficulty parameters for low skill', () => {
      const result = mapSkillToDifficulty(15);
      
      expect(result).toHaveProperty('difficultyScore');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('distractors');
      expect(result).toHaveProperty('semanticTraps');
      expect(result).toHaveProperty('difficulty');
      expect(result.difficulty).toBe('easy');
    });

    it('should return difficulty parameters for medium skill', () => {
      const result = mapSkillToDifficulty(45);
      
      expect(result).toHaveProperty('difficultyScore');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('distractors');
      expect(result).toHaveProperty('semanticTraps');
      expect(result.difficulty).toBe('medium');
    });

    it('should return difficulty parameters for high skill', () => {
      const result = mapSkillToDifficulty(80);
      
      expect(result).toHaveProperty('difficultyScore');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('distractors');
      expect(result).toHaveProperty('semanticTraps');
      expect(result.difficulty).toBe('hard');
    });

    it('should apply guardrails for minimum lines', () => {
      const result = mapSkillToDifficulty(0);
      
      expect(result.lines.optimal).toBeGreaterThanOrEqual(4);
      expect(result.lines.min).toBeGreaterThanOrEqual(4);
    });

    it('should apply guardrails for maximum lines', () => {
      const result = mapSkillToDifficulty(100);
      
      expect(result.lines.optimal).toBeLessThanOrEqual(20);
      expect(result.lines.max).toBeLessThanOrEqual(20);
    });

    it('should apply smoothing with recent skills', () => {
      const result = mapSkillToDifficulty({
        currentSkill: 50,
        recentSkills: [45, 47, 46, 48]
      });
      
      expect(result).toHaveProperty('smoothedSkill');
      expect(result.smoothedSkill).toBeDefined();
    });
  });

  describe('getBandParameters', () => {
    it('should return parameters for valid band index', () => {
      const result = getBandParameters(2);
      
      expect(result).toHaveProperty('difficultyScore');
      expect(result).toHaveProperty('lines');
      expect(result).toHaveProperty('distractors');
      expect(result).toHaveProperty('semanticTraps');
    });

    it('should throw error for invalid band index', () => {
      expect(() => getBandParameters(10)).toThrow();
      expect(() => getBandParameters(-1)).toThrow();
    });
  });
});

