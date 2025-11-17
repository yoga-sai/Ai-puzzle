# POST /api/v1/puzzle/:id/submit - Example Responses

## Request

```json
POST /api/v1/puzzle/abc123/submit
Headers:
  Content-Type: application/json
  x-user-id: user123

Body:
{
  "solution_order": [0, 1, 2, 3],
  "steps_log": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "action": "move",
      "from": 2,
      "to": 0,
      "item": "def greet(name):"
    },
    {
      "timestamp": "2024-01-15T10:00:05Z",
      "action": "move",
      "from": 1,
      "to": 3,
      "item": "print(message)"
    }
  ],
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T10:02:30Z",
  "attempts_count": 1,
  "hints_used": 0
}
```

## Response: Correct Solution (First Attempt)

```json
{
  "correct": true,
  "is_correct": true,
  "score": 100,
  "skill_before": 45.5,
  "skill_after": 48.2,
  "updated_skill": 48.2,
  "recommended_difficulty": "medium",
  "attempts_count": 1,
  "time_taken": 150,
  "attempt_id": "attempt-uuid-123",
  "feedback": "Great job! Your solution is correct.",
  "message": "Excellent! Your skill has improved. Try a medium puzzle next."
}
```

## Response: Correct Solution (Second Attempt)

```json
{
  "correct": true,
  "is_correct": true,
  "score": 100,
  "skill_before": 48.2,
  "skill_after": 49.1,
  "updated_skill": 49.1,
  "recommended_difficulty": "medium",
  "attempts_count": 2,
  "time_taken": 180,
  "attempt_id": "attempt-uuid-124",
  "feedback": "Great job! Your solution is correct.",
  "message": "Excellent! Your skill has improved. Try a medium puzzle next."
}
```

## Response: Incorrect Solution (First Attempt)

```json
{
  "correct": false,
  "is_correct": false,
  "score": 0,
  "skill_before": 45.5,
  "skill_after": 45.0,
  "updated_skill": 45.0,
  "recommended_difficulty": "easy",
  "attempts_count": 1,
  "time_taken": 120,
  "attempt_id": "attempt-uuid-125",
  "feedback": "Not quite right. Keep trying!",
  "message": "Good effort! Try the same difficulty or an easier puzzle to build your skills."
}
```

## Response: Incorrect Solution (Multiple Attempts)

```json
{
  "correct": false,
  "is_correct": false,
  "score": 0,
  "skill_before": 45.0,
  "skill_after": 44.3,
  "updated_skill": 44.3,
  "recommended_difficulty": "easy",
  "attempts_count": 3,
  "time_taken": 300,
  "attempt_id": "attempt-uuid-126",
  "feedback": "Not quite right. Keep trying!",
  "message": "Good effort! Try the same difficulty or an easier puzzle to build your skills."
}
```

## Error Response: Missing Fields

```json
{
  "error": "Missing or invalid solution_order (must be an array)"
}
```

## Error Response: Puzzle Not Found

```json
{
  "error": "Puzzle not found"
}
```

## Error Response: User Not Found

```json
{
  "error": "User not found"
}
```

