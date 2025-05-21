// /scripts/testPostgres.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool)

async function test() {
  try {
    const result = await db.execute('SELECT * FROM projects LIMIT 1;')
    console.log('PostgreSQL OK. Data:', result)
  } catch (error) {
    console.error('PostgreSQL Error:', error)
  }
}

test()