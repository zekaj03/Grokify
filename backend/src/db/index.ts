import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.db.path);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────
db.exec(`
  -- Each Shopify store that installs Grokify gets one row here
  CREATE TABLE IF NOT EXISTS shops (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_domain   TEXT UNIQUE NOT NULL,          -- e.g. ikaufen.myshopify.com
    access_token  TEXT NOT NULL,                 -- Shopify OAuth token or private app token
    plan          TEXT NOT NULL DEFAULT 'trial', -- trial | starter | pro | agency
    is_active     INTEGER NOT NULL DEFAULT 1,
    installed_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- AI optimization jobs (audit trail of everything the AI did)
  CREATE TABLE IF NOT EXISTS ai_jobs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id       INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    job_type      TEXT NOT NULL,                 -- optimize_products | seo | marketing | etc.
    status        TEXT NOT NULL DEFAULT 'pending', -- pending | running | done | failed
    input         TEXT,                          -- JSON input
    output        TEXT,                          -- JSON output
    applied       INTEGER NOT NULL DEFAULT 0,    -- 1 = changes pushed to Shopify
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at   TEXT
  );

  -- Autopilot settings per shop
  CREATE TABLE IF NOT EXISTS autopilot_settings (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id             INTEGER UNIQUE NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    enabled             INTEGER NOT NULL DEFAULT 0,
    optimize_products   INTEGER NOT NULL DEFAULT 1,
    optimize_seo        INTEGER NOT NULL DEFAULT 1,
    auto_tag            INTEGER NOT NULL DEFAULT 1,
    auto_collections    INTEGER NOT NULL DEFAULT 0,
    price_monitoring    INTEGER NOT NULL DEFAULT 0,
    schedule_cron       TEXT NOT NULL DEFAULT '0 3 * * *', -- 3am daily
    last_run            TEXT,
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Webhook event log
  CREATE TABLE IF NOT EXISTS webhook_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id     INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    topic       TEXT NOT NULL,                   -- products/create, orders/create, etc.
    payload     TEXT NOT NULL,                   -- raw JSON
    processed   INTEGER NOT NULL DEFAULT 0,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Cached Shopify data (reduces API calls)
  CREATE TABLE IF NOT EXISTS product_cache (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_id     INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    shopify_id  TEXT NOT NULL,
    data        TEXT NOT NULL,                   -- full product JSON
    synced_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(shop_id, shopify_id)
  );
`);

export default db;

// ─────────────────────────────────────────────────────────
// TYPED QUERY HELPERS
// ─────────────────────────────────────────────────────────

export interface ShopRow {
  id: number;
  shop_domain: string;
  access_token: string;
  plan: string;
  is_active: number;
  installed_at: string;
  updated_at: string;
}

export interface AiJobRow {
  id: number;
  shop_id: number;
  job_type: string;
  status: string;
  input: string | null;
  output: string | null;
  applied: number;
  created_at: string;
  finished_at: string | null;
}

export const shopQueries = {
  findByDomain: db.prepare<[string], ShopRow>(
    'SELECT * FROM shops WHERE shop_domain = ?'
  ),
  upsert: db.prepare(
    `INSERT INTO shops (shop_domain, access_token)
     VALUES (?, ?)
     ON CONFLICT(shop_domain) DO UPDATE SET
       access_token = excluded.access_token,
       is_active    = 1,
       updated_at   = datetime('now')`
  ),
  all: db.prepare<[], ShopRow>('SELECT * FROM shops WHERE is_active = 1'),
};

export const aiJobQueries = {
  create: db.prepare(
    `INSERT INTO ai_jobs (shop_id, job_type, input) VALUES (?, ?, ?)`
  ),
  setRunning: db.prepare(
    `UPDATE ai_jobs SET status = 'running' WHERE id = ?`
  ),
  setDone: db.prepare(
    `UPDATE ai_jobs SET status = 'done', output = ?, finished_at = datetime('now') WHERE id = ?`
  ),
  setFailed: db.prepare(
    `UPDATE ai_jobs SET status = 'failed', output = ?, finished_at = datetime('now') WHERE id = ?`
  ),
  setApplied: db.prepare(
    `UPDATE ai_jobs SET applied = 1 WHERE id = ?`
  ),
  listForShop: db.prepare<[number], AiJobRow>(
    `SELECT * FROM ai_jobs WHERE shop_id = ? ORDER BY created_at DESC LIMIT 50`
  ),
};

export const autopilotQueries = {
  get: db.prepare<[number]>('SELECT * FROM autopilot_settings WHERE shop_id = ?'),
  upsert: db.prepare(
    `INSERT INTO autopilot_settings (shop_id)
     VALUES (?)
     ON CONFLICT(shop_id) DO NOTHING`
  ),
  update: db.prepare(
    `UPDATE autopilot_settings SET
       enabled = ?,
       optimize_products = ?,
       optimize_seo = ?,
       auto_tag = ?,
       auto_collections = ?,
       price_monitoring = ?,
       schedule_cron = ?,
       updated_at = datetime('now')
     WHERE shop_id = ?`
  ),
  setLastRun: db.prepare(
    `UPDATE autopilot_settings SET last_run = datetime('now') WHERE shop_id = ?`
  ),
};

export const productCacheQueries = {
  upsert: db.prepare(
    `INSERT INTO product_cache (shop_id, shopify_id, data)
     VALUES (?, ?, ?)
     ON CONFLICT(shop_id, shopify_id) DO UPDATE SET
       data = excluded.data,
       synced_at = datetime('now')`
  ),
  list: db.prepare<[number]>(
    'SELECT * FROM product_cache WHERE shop_id = ? ORDER BY synced_at DESC'
  ),
  clear: db.prepare('DELETE FROM product_cache WHERE shop_id = ?'),
};
