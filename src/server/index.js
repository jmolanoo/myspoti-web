import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { createDatabase } from './db.js';
import { SpotifyBffService } from './spotify/SpotifyBffService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'warn'
  }
});

// 1. Plugins
await fastify.register(fastifyCors, {
  origin: true,
  credentials: true
});

await fastify.register(fastifyRateLimit, {
  max: 120,
  timeWindow: '1 minute'
});

// 2. Initialize Database & Spotify BFF
const db = createDatabase(path.join(__dirname, '..', '..', 'myspoti_local.db'));
const spotifyBff = new SpotifyBffService({
  opsPath: path.join(__dirname, 'spotify', 'gql-ops.json'),
  varsPath: path.join(__dirname, 'spotify', 'gql-variables.json')
});

// 3. Health check
fastify.get('/api/health', async () => {
  return {
    status: 'ok',
    version: '1.0.0',
    opsLoaded: Object.keys(spotifyBff.operations).length,
    clientVersion: spotifyBff.clientVersion,
    timestamp: Date.now()
  };
});

// 4. Spotify BFF Routes

// 4.1 Search
fastify.get('/api/spotify/search', async (req, reply) => {
  const { q = '', type = 'all', limit = 20, offset = 0 } = req.query;
  if (!q.trim()) return { tracks: [], artists: [], albums: [], playlists: [] };

  try {
    if (type === 'tracks') {
      const res = await spotifyBff.getSearchTracks(q, parseInt(offset), parseInt(limit));
      return res;
    }
    const res = await spotifyBff.getSearchTop(q, parseInt(limit));
    return res;
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: err.message });
  }
});

// 4.2 Suggestions
fastify.get('/api/spotify/suggestions', async (req) => {
  const { q = '' } = req.query;
  if (!q.trim()) return { suggestions: [] };
  try {
    const res = await spotifyBff.queryGql('searchSuggestions', {
      searchTerm: q,
      includeAudiobooks: false
    });
    return res;
  } catch (err) {
    return { suggestions: [] };
  }
});

// 4.3 Track details
fastify.get('/api/spotify/track/:id', async (req, reply) => {
  try {
    const res = await spotifyBff.getTrack(req.params.id);
    return res;
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
});

// 4.4 Album details
fastify.get('/api/spotify/album/:id', async (req, reply) => {
  try {
    const res = await spotifyBff.getAlbum(req.params.id);
    return res;
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
});

// 4.5 Artist details
fastify.get('/api/spotify/artist/:id', async (req, reply) => {
  try {
    const res = await spotifyBff.getArtist(req.params.id);
    return res;
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
});

// 4.6 Lyrics (color-lyrics/v2)
fastify.get('/api/spotify/lyrics/:id', async (req) => {
  try {
    const lyrics = await spotifyBff.getLyrics(req.params.id);
    return lyrics || { lines: [], syncType: 'UNSYNCED' };
  } catch (err) {
    return { lines: [], syncType: 'UNSYNCED' };
  }
});

// 4.7 Canvas
fastify.get('/api/spotify/canvas/:id', async (req) => {
  try {
    const canvas = await spotifyBff.getCanvas(req.params.id);
    return canvas || null;
  } catch (err) {
    return null;
  }
});

// 4.8 Generic GQL Proxy for any of the 179 captured operations
fastify.post('/api/spotify/gql/:opName', async (req, reply) => {
  try {
    const { opName } = req.params;
    const variables = req.body || {};
    const result = await spotifyBff.queryGql(opName, variables);
    return result;
  } catch (err) {
    return reply.status(500).send({ error: err.message });
  }
});

// 5. Local Library & SQLite Persistence

// 5.1 Playlists
fastify.get('/api/library/playlists', async () => {
  return db.prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all();
});

fastify.post('/api/library/playlists', async (req) => {
  const { name, description = '', is_public = 1, is_collab = 0, cover_url = '' } = req.body;
  const id = 'pl_' + Date.now().toString(36);
  const now = Date.now();

  db.prepare(`
    INSERT INTO playlists (id, name, description, is_public, is_collab, cover_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description, is_public, is_collab, cover_url, now, now);

  return { id, name, description, is_public, is_collab, cover_url };
});

fastify.get('/api/library/playlists/:id', async (req, reply) => {
  const pl = db.prepare('SELECT * FROM playlists WHERE id = ?').get(req.params.id);
  if (!pl) return reply.status(404).send({ error: 'Playlist not found' });

  const tracks = db.prepare('SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC').all(req.params.id);
  return { ...pl, tracks };
});

fastify.post('/api/library/playlists/:id/tracks', async (req) => {
  const { id } = req.params;
  const { track_uri, title, artist, album, cover_url = '', duration_ms = 0 } = req.body;
  const now = Date.now();

  const maxPos = db.prepare('SELECT MAX(position) as m FROM playlist_tracks WHERE playlist_id = ?').get(id)?.m || 0;

  db.prepare(`
    INSERT OR REPLACE INTO playlist_tracks (playlist_id, track_uri, title, artist, album, cover_url, duration_ms, position, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, track_uri, title, artist, album, cover_url, duration_ms, maxPos + 1, now);

  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(now, id);
  return { ok: true };
});

fastify.delete('/api/library/playlists/:id/tracks/:trackUri', async (req) => {
  const { id, trackUri } = req.params;
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_uri = ?').run(id, trackUri);
  return { ok: true };
});

// 5.2 Favorites (Liked Songs)
fastify.get('/api/library/favorites', async () => {
  return db.prepare('SELECT * FROM favorites ORDER BY added_at DESC').all();
});

fastify.post('/api/library/favorites', async (req) => {
  const { track_uri, title, artist, album, cover_url = '', duration_ms = 0 } = req.body;
  const existing = db.prepare('SELECT track_uri FROM favorites WHERE track_uri = ?').get(track_uri);

  if (existing) {
    db.prepare('DELETE FROM favorites WHERE track_uri = ?').run(track_uri);
    return { liked: false };
  } else {
    db.prepare(`
      INSERT INTO favorites (track_uri, title, artist, album, cover_url, duration_ms, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(track_uri, title, artist, album, cover_url, duration_ms, Date.now());
    return { liked: true };
  }
});

// 5.3 History
fastify.get('/api/library/history', async () => {
  return db.prepare('SELECT * FROM history ORDER BY played_at DESC LIMIT 50').all();
});

fastify.post('/api/library/history', async (req) => {
  const { track_uri, title, artist, album, cover_url = '', duration_ms = 0 } = req.body;
  db.prepare(`
    INSERT INTO history (track_uri, title, artist, album, cover_url, duration_ms, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(track_uri, title, artist, album, cover_url, duration_ms, Date.now());
  return { ok: true };
});

// 6. Serve static files from dist in production
const distPath = path.join(__dirname, '..', '..', 'dist');
await fastify.register(fastifyStatic, {
  root: distPath,
  prefix: '/',
  wildcard: false
});

fastify.setNotFoundHandler((req, reply) => {
  if (req.raw.url && req.raw.url.startsWith('/api')) {
    reply.status(404).send({ error: 'Endpoint not found' });
  } else {
    reply.sendFile('index.html');
  }
});

// Start Server
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[Myspoti BFF Server] Running on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
