import pg from 'pg'
import { createClient } from 'redis'

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'adaptive_parsons'
})

const redis = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`
})
redis.on('error', () => {})
redis.connect().catch(() => {})

export { pool, redis }
