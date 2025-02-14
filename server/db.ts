import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for required environment variables
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL environment variable is not set");
}

export const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 20, // Increase max connections
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
});

export const db = drizzle(pool, { schema });

// Test the connection
pool.connect()
  .then(() => console.log('Successfully connected to Supabase database'))
  .catch((err: Error) => console.error('Error connecting to database:', err.message));

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});