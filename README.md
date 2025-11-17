# Adaptive Parsons

An adaptive Parsons puzzle learning platform built with React, Node.js, PostgreSQL, and Redis.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **Editor**: WebParsons
- **LLM Adapter**: Fetch-based LLM adapter on backend

## Project Structure

```
adaptive-parsons/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express backend
└── infra/           # Infrastructure configuration
```

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

## Quick Start

### Using Docker (Recommended)

1. Start all services:
```bash
docker-compose up -d
```

2. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Local Development

#### Client Setup

```bash
cd client
npm install
npm run dev
```

#### Server Setup

```bash
cd server
npm install
npm run dev
```

#### Database Setup

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d postgres redis
```

## Environment Variables

Create `.env` files in `client/` and `server/` directories with your configuration.

## Development

- Client runs on port 5173 (Vite default)
- Server runs on port 3000
- PostgreSQL on port 5432
- Redis on port 6379

## License

MIT

