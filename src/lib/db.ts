// Use this for raw SQL. For auth-scoped queries use supabase clients.
import postgres from 'postgres';
import { env } from './env';

const db = postgres(env.DATABASE_URL, {
  max: 10,
  debug: env.NODE_ENV !== 'production',
});

export default db;
