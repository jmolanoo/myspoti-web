import Database from 'better-sqlite3';
import path from 'path';

export function createDatabase(dbFilePath = 'myspoti_local.db') {
  const db = new Database(dbFilePath);
  
  // High-performance WAL mode & Pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_public INTEGER DEFAULT 1,
      is_collab INTEGER DEFAULT 0,
      cover_url TEXT DEFAULT '',
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL,
      track_uri TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      cover_url TEXT DEFAULT '',
      duration_ms INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      added_at INTEGER,
      PRIMARY KEY (playlist_id, track_uri),
      FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      track_uri TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      cover_url TEXT DEFAULT '',
      duration_ms INTEGER DEFAULT 0,
      added_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_uri TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      cover_url TEXT DEFAULT '',
      duration_ms INTEGER DEFAULT 0,
      played_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS search_history (
      query TEXT PRIMARY KEY,
      searched_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS pinned_items (
      uri TEXT PRIMARY KEY,
      pinned_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS extensions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      type TEXT NOT NULL, -- audio, lyrics, downloader
      manifest TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      created_at INTEGER
    );
  `);

  return db;
}
