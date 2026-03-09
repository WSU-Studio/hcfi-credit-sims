#!/usr/bin/env node
/**
 * Runs pending Prisma migrations using raw pg client.
 * Use when Prisma CLI (npx prisma migrate deploy) fails on server (e.g. missing wasm).
 * Requires: DATABASE_URL env, pg package
 */
const { Client } = require('pg');
const crypto = require('crypto');
const { createHash } = crypto;
const { readFileSync } = require('fs');
const { join } = require('path');

const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');

// Only migrations that may not have been applied yet (add new ones here if needed)
const PENDING_MIGRATIONS = ['20260307082009_add_sims_discount'];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    for (const name of PENDING_MIGRATIONS) {
      const migrationDir = join(MIGRATIONS_DIR, name);
      const sqlPath = join(migrationDir, 'migration.sql');
      let sql;
      try {
        sql = readFileSync(sqlPath, 'utf8').trim();
      } catch (err) {
        console.warn(`Migration ${name} not found, skipping`);
        continue;
      }

      const existing = await client.query(
        `SELECT 1 FROM _prisma_migrations WHERE migration_name = $1`,
        [name]
      );
      if (existing.rowCount > 0) {
        console.log(`Migration ${name} already applied`);
        continue;
      }

      const checksum = createHash('sha256').update(sql).digest('hex');
      const id = crypto.randomUUID();

      await client.query('BEGIN');
      try {
        try {
          await client.query(sql);
        } catch (err) {
          if (err.code === '42701') {
            console.log(`Migration ${name}: column/object already exists, marking as applied`);
          } else {
            throw err;
          }
        }
        await client.query(
          `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
          [id, checksum, name]
        );
        await client.query('COMMIT');
        console.log(`Applied migration: ${name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
