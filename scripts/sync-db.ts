import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL!;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is missing');
  process.exit(1);
}

const db = postgres(dbUrl, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

async function sync() {
  console.log('🚀 Starting Database Schema Sync...\n');

  try {
    // 1. Get applied migrations
    let appliedVersions: string[] = [];
    try {
      const rows = await db`SELECT version FROM supabase_migrations.schema_migrations`;
      appliedVersions = rows.map(r => r.version);
      console.log(`📦 Found ${appliedVersions.length} migrations already applied in the DB.`);
    } catch (e: any) {
      if (e.message.includes('does not exist')) {
        console.log('⚠️ supabase_migrations.schema_migrations table missing. This might be a fresh DB.');
      } else {
        throw e;
      }
    }

    // 2. Read migration files
    const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${files.length} migration files in supabase/migrations/`);

    // 3. Find missing migrations
    const pendingFiles = files.filter(f => {
      const version = f.split('_')[0];
      return !appliedVersions.includes(version!);
    });

    if (pendingFiles.length === 0) {
      console.log('✅ Database is already up to date!');
      return;
    }

    console.log(`\n🔜 Found ${pendingFiles.length} pending migrations:`);
    pendingFiles.forEach(f => console.log(`   - ${f}`));

    // 4. Apply migrations sequentially
    for (const file of pendingFiles) {
      const version = file.split('_')[0]!;
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`\n🛠 Applying ${file}...`);
      
      await db.begin(async sql_conn => {
        // Execute the migration SQL
        // Note: Some migrations might have multiple statements. 
        // postgres-js handles multiple statements if they don't use special features like COPY.
        await sql_conn.unsafe(sql);

        // Record the migration
        // Ensure the schema and table exist first just in case
        await sql_conn.unsafe(`CREATE SCHEMA IF NOT EXISTS supabase_migrations`);
        await sql_conn.unsafe(`
          CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
            version text PRIMARY KEY,
            statements text[],
            name text
          )
        `);
        
        await sql_conn`
          INSERT INTO supabase_migrations.schema_migrations (version, name)
          VALUES (${version}, ${file})
          ON CONFLICT (version) DO NOTHING
        `;
      });
      
      console.log(`✅ Successfully applied ${file}`);
    }

    console.log('\n✨ Database synchronization complete!');

  } catch (err) {
    console.error('\n💥 Sync failed:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

sync();
