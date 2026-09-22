import fs from 'fs';
import path from 'path';
import pool from './pool';

async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // run in filename order (001_, 002_, ...)

  const client = await pool.connect();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`[migrate] Running ${file}...`);
      await client.query(sql);
      console.log(`[migrate] ✓ ${file} done`);
    }
    console.log('[migrate] All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
});
