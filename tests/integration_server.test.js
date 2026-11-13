import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { createDatabase } from '../src/server/db.js';
import { SpotifyBffService } from '../src/server/spotify/SpotifyBffService.js';

describe('Server API Endpoints Integration', () => {
  let app;
  let db;

  before(async () => {
    app = Fastify();
    await app.register(fastifyCors);
    db = createDatabase(':memory:');
    const spotifyBff = new SpotifyBffService();

    // Register health
    app.get('/api/health', async () => ({
      status: 'ok',
      opsLoaded: Object.keys(spotifyBff.operations).length
    }));

    // Register library endpoints
    app.get('/api/library/playlists', async () => {
      return db.prepare('SELECT * FROM playlists').all();
    });

    app.post('/api/library/playlists', async (req) => {
      const { name } = req.body;
      const id = 'pl_' + Date.now();
      db.prepare('INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, name, Date.now(), Date.now());
      return { id, name };
    });

    await app.ready();
  });

  after(async () => {
    await app.close();
    db.close();
  });

  test('GET /api/health returns status ok and 179 loaded operations', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/health'
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.opsLoaded, 179);
  });

  test('POST and GET /api/library/playlists creates and lists playlists', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/library/playlists',
      payload: { name: 'Gym Motivation' }
    });
    assert.strictEqual(createRes.statusCode, 200);
    const created = JSON.parse(createRes.body);
    assert.strictEqual(created.name, 'Gym Motivation');

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/library/playlists'
    });
    assert.strictEqual(listRes.statusCode, 200);
    const list = JSON.parse(listRes.body);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].name, 'Gym Motivation');
  });
});
