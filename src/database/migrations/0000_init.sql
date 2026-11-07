-- Finly Database Migration 0000_init.sql
-- Enforces foreign keys and creates normalized tables and indexes

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS salary_cycles (
  id TEXT PRIMARY KEY NOT NULL,
  salary_amount INTEGER NOT NULL,
  received_date TEXT NOT NULL,
  expected_next_date TEXT,
  opening_balance INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  cycle_id TEXT,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  transaction_date TEXT NOT NULL,
  input_method TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cycle_id) REFERENCES salary_cycles(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_metadata (
  id TEXT PRIMARY KEY NOT NULL,
  provider TEXT NOT NULL,
  last_backup_at TEXT NOT NULL,
  backup_version TEXT NOT NULL,
  status TEXT NOT NULL,
  remote_backup_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_cycle ON transactions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_salary_cycles_received_date ON salary_cycles(received_date);
