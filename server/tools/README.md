# Puzzle Generation Test Harness

Automated test harness for generating and validating Parsons puzzles using the LLM adapter.

## Usage

```bash
# Set environment variable
export OPENROUTER_API_KEY=your_api_key_here

# Run harness
cd server
node tools/harness.js
```

## Features

- **Auto-generates 200 puzzles** across easy/medium/hard difficulties
- **Validates parsed output** matches expected schema
- **Tests solvability** using ideal solver simulator
- **Logs failures** for manual review
- **Outputs CSV summary** with pass/fail counts

## Output Structure

```
server/harness-output/
├── logs/              # Detailed logs (if implemented)
├── failures/          # Failed puzzles with error details
│   └── failure-*.json
└── summary-*.csv      # CSV summary report
```

## CSV Summary Format

The CSV includes:
- Per-puzzle results (ID, Difficulty, Language, Status)
- Summary statistics (Total, Passed, Failed)
- Breakdown by difficulty and language
- Failure reason counts

## Failure Logs

Each failure is saved as a JSON file containing:
- Timestamp
- Puzzle data (if generated)
- Error details
- Failure reason classification

