import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Storyline, StorylineType } from "./types";

const DEFAULT_PATH = path.join(process.cwd(), "data", "storylines.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || DEFAULT_PATH;
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS storylines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      season TEXT NOT NULL,
      week INTEGER,
      manager_ids TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      dedupe_key TEXT NOT NULL UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_storylines_created_at ON storylines(created_at);
  `);
  return db;
}

interface StorylineRow {
  id: number;
  type: string;
  title: string;
  body: string;
  season: string;
  week: number | null;
  manager_ids: string;
  source: string;
  created_at: string;
  dedupe_key: string;
}

function rowToStoryline(row: StorylineRow): Storyline {
  return {
    id: row.id,
    type: row.type as StorylineType,
    title: row.title,
    body: row.body,
    season: row.season,
    week: row.week,
    managerIds: JSON.parse(row.manager_ids),
    source: row.source as Storyline["source"],
    createdAt: row.created_at,
    dedupeKey: row.dedupe_key,
  };
}

/** Inserts a storyline, skipping silently if its dedupe key already exists. */
export function saveStoryline(input: Omit<Storyline, "id" | "createdAt">): void {
  const stmt = getDb().prepare(`
    INSERT OR IGNORE INTO storylines
      (type, title, body, season, week, manager_ids, source, created_at, dedupe_key)
    VALUES (@type, @title, @body, @season, @week, @managerIds, @source, @createdAt, @dedupeKey)
  `);
  stmt.run({
    type: input.type,
    title: input.title,
    body: input.body,
    season: input.season,
    week: input.week,
    managerIds: JSON.stringify(input.managerIds),
    source: input.source,
    createdAt: new Date().toISOString(),
    dedupeKey: input.dedupeKey,
  });
}

export function listStorylines(limit = 50): Storyline[] {
  const rows = getDb()
    .prepare(`SELECT * FROM storylines ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as StorylineRow[];
  return rows.map(rowToStoryline);
}
