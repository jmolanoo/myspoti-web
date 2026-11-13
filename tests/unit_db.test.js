import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { createDatabase } from '../src/server/db.js';

describe('Database Local Persistence (SQLite WAL)', () => {
  let db;
  const testDbPath = 'test_myspoti.db';

  before(() => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    db = createDatabase(testDbPath);
  });

  after(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  test('should create tables and enable WAL mode', () => {
    const journalMode = db.pragma('journal_mode', { simple: true });
    assert.strictEqual(journalMode.toLowerCase(), 'wal');
  });

  test('should insert and fetch playlists', () => {
    const now = Date.now();
    db.prepare(`
      INSERT INTO playlists (id, name, description, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('pl_test_1', 'Rock Clasico', 'Lista de rock', 1, now, now);

    const row = db.prepare('SELECT * FROM playlists WHERE id = ?').get('pl_test_1');
    assert.ok(row);
    assert.strictEqual(row.name, 'Rock Clasico');
  });

  test('should add tracks to playlist and maintain order', () => {
    db.prepare(`
      INSERT INTO playlist_tracks (playlist_id, track_uri, title, artist, album, duration_ms, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('pl_test_1', 'spotify:track:123', 'Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 354000, 1);

    const tracks = db.prepare('SELECT * FROM playlist_tracks WHERE playlist_id = ?').all('pl_test_1');
    assert.strictEqual(tracks.length, 1);
    assert.strictEqual(tracks[0].title, 'Bohemian Rhapsody');
  });

  test('should toggle favorites (Liked Songs)', () => {
    db.prepare(`
      INSERT INTO favorites (track_uri, title, artist, album, added_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('spotify:track:fav1', 'Starboy', 'The Weeknd', 'Starboy', Date.now());

    const favs = db.prepare('SELECT * FROM favorites').all();
    assert.strictEqual(favs.length, 1);
    assert.strictEqual(favs[0].artist, 'The Weeknd');
  });
});
