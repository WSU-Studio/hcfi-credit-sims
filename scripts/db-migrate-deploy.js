#!/usr/bin/env node
/**
 * Runs pending Prisma migrations via pg (no Prisma CLI needed).
 * Use when Prisma CLI fails on server (e.g. missing WASM).
 * Requires: DATABASE_URL env, pg package
 * Adds sslmode=no-verify for RDS (bypasses cert validation, fixes SELF_SIGNED_CERT_IN_CHAIN).
 */
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS for plain Node (EB, db:migrate) */
const { Client } = require('pg');
const crypto = require('crypto');
const { readFileSync } = require('fs');
const { join } = require('path');

const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');
const PENDING_MIGRATIONS = [
  '20260121092324_initial_migration',
  '20260126165659_add_lead_model',
  '20260129050001_add_article_subtitle_author',
  '20260129050437_add_article_meta_category_tags_reading_featured',
  '20260130063814_add_static_page_layout',
  '20260130070501_add_static_page_menu_fields',
  '20260130120000_add_promo_layout_slug',
  '20260202043818_add_article_layout',
  '20260202050033_add_article_banner_options',
  '20260202060000_rename_banner_to_use_container',
  '20260202070000_add_article_show_banner_image',
  '20260202100000_add_promo_banner_options',
  '20260208180539_add_show_basic_content',
  '20260211170108_add_product_is_featured',
  '20260212073824_add_locale_en_columns',
  '20260225120000_add_product_content_layout',
  '20260307082009_add_sims_discount',
  '20260316060951_add_credit_scoring_and_consent',
  '20260316070447_add_lead_vehicle_and_ktp_fields',
  '20260316072257_add_slik_status',
  '20260316103604_add_activity_permission',
];

function getConnectionConfig() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  // RDS needs sslmode=no-verify to avoid SELF_SIGNED_CERT_IN_CHAIN
  if (url.includes('sslmode=')) {
    url = url.replace(/sslmode=[^&]+/, 'sslmode=no-verify');
  } else {
    url += url.includes('?') ? '&sslmode=no-verify' : '?sslmode=no-verify';
  }
  return { connectionString: url };
}

async function main() {
  const client = new Client(getConnectionConfig());
  await client.connect();

  try {
    for (const name of PENDING_MIGRATIONS) {
      const sqlPath = join(MIGRATIONS_DIR, name, 'migration.sql');
      let sql;
      try {
        sql = readFileSync(sqlPath, 'utf8').trim();
      } catch {
        console.warn(`Migration ${name} not found, skipping`);
        continue;
      }

      const existing = await client.query(
        'SELECT 1 FROM _prisma_migrations WHERE migration_name = $1',
        [name]
      );
      if (existing.rowCount > 0) {
        console.log(`Migration ${name} already applied`);
        continue;
      }

      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const id = crypto.randomUUID();

      await client.query('BEGIN');
      try {
        try {
          await client.query(sql);
        } catch (err) {
          if (err.code === '42701') {
            console.log(`Migration ${name}: column already exists, marking as applied`);
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
