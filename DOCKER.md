# Docker Setup Guide

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your configuration:**
   - Set `OPENROUTER_API_KEY` to your actual API key
   - Adjust database credentials if needed
   - Update ports if there are conflicts

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Services

- **Client**: React frontend on port 5173 (dev) or 80 (production)
- **Server**: Node.js API on port 4000
- **PostgreSQL**: Database on port 5432
- **Redis**: Cache on port 6379

## Environment Variables

### Root `.env` file
Contains configuration for docker-compose services. Key variables:

- `OPENROUTER_API_KEY`: Required - Your OpenRouter API key
- `POSTGRES_USER`, `POSTGRES_PASSWORD`: Database credentials
- `SERVER_PORT`, `CLIENT_PORT`: Port mappings
- `NODE_ENV`: Environment mode (development/production)

### Server `.env` file
Used when running server directly (not in Docker). Same variables as root `.env` but with localhost URLs.

### Client `.env` file
Used by Vite during build/runtime. Main variable:

- `VITE_API_URL`: Backend API URL (default: http://localhost:4000)

## Dockerfiles

### Development
- `server/Dockerfile.dev`: Development server with hot reload
- `client/Dockerfile.dev`: Development client with Vite dev server

### Production
- `server/Dockerfile`: Production server with Node.js
- `client/Dockerfile`: Production client with Nginx

## Usage

### Development Mode
```bash
docker-compose up
```

### Production Mode
```bash
# Update docker-compose.yml to use production Dockerfiles
SERVER_DOCKERFILE=Dockerfile CLIENT_DOCKERFILE=Dockerfile docker-compose up -d
```

### Individual Services
```bash
# Start only database and cache
docker-compose up postgres redis

# Start server only
docker-compose up server

# Start client only
docker-compose up client
```

## Troubleshooting

### Port Conflicts
If ports are already in use, update them in `.env`:
```env
SERVER_PORT=4001
CLIENT_PORT=5174
POSTGRES_PORT=5433
```

### Database Connection
Ensure `DATABASE_URL` in server matches PostgreSQL service name:
```
postgresql://user:password@postgres:5432/database
```

### API Key Not Working
Verify `OPENROUTER_API_KEY` is set in `.env` and restart containers:
```bash
docker-compose restart server
```

