# Skill Band to Difficulty Mapping Table

## Overview

This table maps user skill levels (0-100) to puzzle difficulty parameters. The system uses 6 skill bands, each corresponding to specific difficulty parameters.

## Skill Band Mapping

| Band | Skill Range | Difficulty Score | Difficulty Name | Lines (Optimal) | Distractors (Optimal) | Semantic Traps (Optimal) |
|------|-------------|------------------|-----------------|-----------------|----------------------|-------------------------|
| 0    | 0-20        | 1.0              | easy            | 5               | 1                    | 0                       |
| 1    | 21-35       | 1.5              | easy            | 6               | 2                    | 0                       |
| 2    | 36-50       | 2.0              | medium          | 7               | 2                    | 1                       |
| 3    | 51-70       | 2.5              | medium          | 10              | 3                    | 2                       |
| 4    | 71-85       | 3.0              | hard            | 12              | 4                    | 3                       |
| 5    | 86-100      | 3.5              | hard            | 15              | 5                    | 4                       |

## Detailed Parameters

### Band 0: Beginner (0-20 skill)
```json
{
  "difficultyScore": 1.0,
  "difficulty": "easy",
  "lines": {
    "min": 4,
    "max": 6,
    "optimal": 5
  },
  "distractors": {
    "min": 1,
    "max": 2,
    "optimal": 1
  },
  "semanticTraps": {
    "min": 0,
    "max": 1,
    "optimal": 0
  }
}
```

**Characteristics:**
- Simple puzzles with minimal complexity
- Few lines (4-6)
- Minimal distractors (1-2)
- No semantic traps to avoid confusion

### Band 1: Novice (21-35 skill)
```json
{
  "difficultyScore": 1.5,
  "difficulty": "easy",
  "lines": {
    "min": 5,
    "max": 7,
    "optimal": 6
  },
  "distractors": {
    "min": 1,
    "max": 2,
    "optimal": 2
  },
  "semanticTraps": {
    "min": 0,
    "max": 1,
    "optimal": 0
  }
}
```

**Characteristics:**
- Slightly more complex than beginner
- 5-7 lines
- 1-2 distractors
- Still minimal semantic traps

### Band 2: Intermediate (36-50 skill)
```json
{
  "difficultyScore": 2.0,
  "difficulty": "medium",
  "lines": {
    "min": 6,
    "max": 9,
    "optimal": 7
  },
  "distractors": {
    "min": 2,
    "max": 3,
    "optimal": 2
  },
  "semanticTraps": {
    "min": 0,
    "max": 2,
    "optimal": 1
  }
}
```

**Characteristics:**
- Medium difficulty puzzles
- 6-9 lines
- 2-3 distractors
- Introduction of semantic traps (0-2)

### Band 3: Advanced (51-70 skill)
```json
{
  "difficultyScore": 2.5,
  "difficulty": "medium",
  "lines": {
    "min": 8,
    "max": 12,
    "optimal": 10
  },
  "distractors": {
    "min": 2,
    "max": 4,
    "optimal": 3
  },
  "semanticTraps": {
    "min": 1,
    "max": 3,
    "optimal": 2
  }
}
```

**Characteristics:**
- Medium-hard puzzles
- 8-12 lines
- 2-4 distractors
- 1-3 semantic traps

### Band 4: Expert (71-85 skill)
```json
{
  "difficultyScore": 3.0,
  "difficulty": "hard",
  "lines": {
    "min": 10,
    "max": 15,
    "optimal": 12
  },
  "distractors": {
    "min": 3,
    "max": 5,
    "optimal": 4
  },
  "semanticTraps": {
    "min": 2,
    "max": 4,
    "optimal": 3
  }
}
```

**Characteristics:**
- Hard difficulty puzzles
- 10-15 lines
- 3-5 distractors
- 2-4 semantic traps

### Band 5: Master (86-100 skill)
```json
{
  "difficultyScore": 3.5,
  "difficulty": "hard",
  "lines": {
    "min": 12,
    "max": 20,
    "optimal": 15
  },
  "distractors": {
    "min": 4,
    "max": 6,
    "optimal": 5
  },
  "semanticTraps": {
    "min": 3,
    "max": 5,
    "optimal": 4
  }
}
```

**Characteristics:**
- Very hard puzzles
- 12-20 lines
- 4-6 distractors
- 3-5 semantic traps

## Guardrails

### Maximum Jump Per Attempt
- **Value:** 1 band
- **Purpose:** Prevents sudden difficulty spikes
- **Effect:** If skill increases by 2+ bands, limit to 1 band jump

### Minimum/Maximum Lines
- **Minimum:** 4 lines
- **Maximum:** 20 lines
- **Purpose:** Ensures puzzles are always within reasonable bounds

### Minimum/Maximum Distractors
- **Minimum:** 1 distractor
- **Maximum:** 6 distractors
- **Purpose:** Maintains puzzle quality and solvability

### Minimum/Maximum Semantic Traps
- **Minimum:** 0 semantic traps
- **Maximum:** 5 semantic traps
- **Purpose:** Prevents puzzles from becoming unsolvable

## Smoothing

### Moving Average Window
- **Window Size:** 5 recent skill updates
- **Purpose:** Reduces noise from single attempts
- **Formula:** Average of last N skill values

### Example
```
Recent skills: [45, 47, 46, 48, 49]
Window: last 5 = [45, 47, 46, 48, 49]
Smoothed: (45 + 47 + 46 + 48 + 49) / 5 = 47.0
```

## Usage Examples

### Basic Usage
```javascript
// Map skill level 45 to difficulty parameters
const params = mapSkillToDifficulty(45);
// Returns: Band 2 (Intermediate) parameters
```

### With Smoothing
```javascript
// Use recent skill history for smoothing
const params = mapSkillToDifficulty({
  currentSkill: 48,
  recentSkills: [45, 47, 46, 48]
});
// Calculates moving average before mapping
```

### With Guardrails
```javascript
// Ensure no sudden jumps
const params = mapSkillToDifficulty({
  currentSkill: 75,
  recentSkills: [45, 47, 46, 48],
  previousBand: 2  // Was at band 2
});
// Limits jump from band 2 to band 4 (max 1 band jump)
```

