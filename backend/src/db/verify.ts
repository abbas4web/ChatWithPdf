import pool from './pool';

async function verify(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'documents'
      ORDER BY ordinal_position;
    `);
    if (result.rows.length === 0) {
      console.error('[verify] Table "documents" not found.');
      process.exit(1);
    }
    console.log('[verify] Table "documents" exists with columns:\n');
    console.table(result.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(err => {
  console.error('[verify] Failed:', err.message);
  process.exit(1);
});
