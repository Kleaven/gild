import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
import db from '../src/lib/db';

async function checkColumns() {
  try {
    const columns = await db`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    `;
    console.log('Profiles table columns:');
    columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
  } catch (err) {
    console.error('Error querying columns:', err);
  } finally {
    process.exit();
  }
}

checkColumns();
