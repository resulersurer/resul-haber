import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'postgres://fallback:fallback@localhost:5432/fallback';
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
