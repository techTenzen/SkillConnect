import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Parse the connection string
const connectionString = process.env.DATABASE_URL;

export const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  // Configure connection pool settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // Enable debug logging
  log: (msg: string) => console.log('Pool log:', msg)
});

export const db = drizzle(pool, { schema });

// Test the connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database');

    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('Database query successful:', result.rows[0]);

    client.release();
  } catch (err) {
    console.error('Error connecting to database:', err);
    console.error('Connection details:', {
      host: pool.options.host,
      port: pool.options.port,
      database: pool.options.database,
      user: pool.options.user,
      ssl: pool.options.ssl
    });
  }
}

testConnection();

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});