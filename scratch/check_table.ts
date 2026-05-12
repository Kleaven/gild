import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import db from '../src/lib/db';

async function checkTable() {
  try {
    const result = await db`SELECT count(*) FROM community_revenue`;
    console.log('Table community_revenue exists, count:', result[0].count);
  } catch (err) {
    console.error('Error querying community_revenue:', err);
  } finally {
    process.exit();
  }
}

checkTable();
