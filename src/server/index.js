import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { fetch } from 'undici';
import { createDatabase } from './db.js';
import { SpotifyBffService } from './spotify/SpotifyBffService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'myspoti_local.db');

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
const db = createDatabase(DB_PATH);
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

// --- Audio Stream Resolver (SoundCloud / Full Music streaming via yt-dlp & FFmpeg) ---
const streamCache = new Map();

async function resolveAudioStream(query, targetDuration = null) {
  if (!query) return null;
  const cacheKey = query.trim().toLowerCase();
  const cached = streamCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.directUrl;
  }

  return new Promise((resolve) => {
    const child = spawn('yt-dlp', [
      '--dump-json',
      '--no-warnings',
      '--flat-playlist',
      `scsearch5:${query}`
    ]);
    let out = '';
    child.stdout.on('data', chunk => { out += chunk; });
    child.on('close', () => {
      const lines = out.trim().split('\n').filter(Boolean);
      const candidates = [];
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          if ((item.duration || 0) >= 45 && item.url) candidates.push(item);
        } catch (e) {}
      }
      if (candidates.length === 0) return resolve(null);
      if (targetDuration && targetDuration > 30) {
        candidates.sort((a, b) => Math.abs((a.duration || 0) - targetDuration) - Math.abs((b.duration || 0) - targetDuration));
      }
      const best = candidates[0];

      const getUrl = spawn('yt-dlp', ['-g', '-f', 'bestaudio', best.url]);
      let urlOut = '';
      getUrl.stdout.on('data', chunk => { urlOut += chunk; });
      getUrl.on('close', () => {
        const directUrl = urlOut.trim().split('\n')[0];
        if (directUrl && directUrl.startsWith('http')) {
          streamCache.set(cacheKey, {
            directUrl,
            duration: best.duration,
            expiresAt: Date.now() + 4 * 3600 * 1000
          });
          resolve(directUrl);
        } else {
          resolve(null);
        }
      });
      getUrl.on('error', () => resolve(null));
    });
    child.on('error', () => resolve(null));
  });
}

// Fallback search formatting from Deezer to match Spotify GQL schema
async function searchDeezerFallback(q, limit = 20) {
  try {
    const res = await fetch(`https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=${limit}`);
    if (!res.ok) return { tracks: [] };
    const json = await res.json();
    const tracks = (json.data || []).map(t => ({
      matchedFields: [],
      item: {
        data: {
          __typename: 'Track',
          uri: `spotify:track:${t.id}`,
          id: String(t.id),
          name: t.title,
          duration: { totalMilliseconds: (t.duration || 180) * 1000 },
          albumOfTrack: {
            uri: `spotify:album:${t.album?.id || ''}`,
            name: t.album?.title || '',
            coverArt: {
              sources: [
                { url: t.album?.cover_xl || t.album?.cover_big || t.album?.cover_medium || '' }
              ]
            }
          },
          artists: {
            items: [
              {
                uri: `spotify:artist:${t.artist?.id || ''}`,
                profile: { name: t.artist?.name || 'Artista' }
              }
            ]
          }
        }
      }
    }));
    return {
      data: {
        searchV2: {
          tracksV2: {
            totalCount: tracks.length,
            items: tracks
          }
        }
      }
    };
  } catch (e) {
    return { tracks: [] };
  }
}

// 4. Spotify BFF Routes

// 4.1 Search
fastify.get('/api/spotify/search', async (req, reply) => {
  const { q = '', type = 'all', limit = 20, offset = 0 } = req.query;
  if (!q.trim()) return { tracks: [], artists: [], albums: [], playlists: [] };

  try {
    if (type === 'tracks') {
      const res = await spotifyBff.getSearchTracks(q, parseInt(offset), parseInt(limit));
      if (res && res.data && res.data.searchV2) return res;
      return await searchDeezerFallback(q, parseInt(limit));
    }
    const res = await spotifyBff.getSearchTop(q, parseInt(limit));
    if (res && res.data) return res;
    return await searchDeezerFallback(q, parseInt(limit));
  } catch (err) {
    req.log.warn(`Spotify search fallback triggered for "${q}": ${err.message}`);
    return await searchDeezerFallback(q, parseInt(limit));
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
    if (res && res.data && res.data.searchSuggestions) return res;
    throw new Error('Fallback needed');
  } catch (err) {
    try {
      const dzRes = await fetch(`https://api.deezer.com/search/track?q=${encodeURIComponent(q)}&limit=5`);
      if (dzRes.ok) {
        const json = await dzRes.json();
        return {
          data: {
            searchSuggestions: {
              items: (json.data || []).map(t => ({ name: `${t.title} - ${t.artist?.name}` }))
            }
          }
        };
      }
    } catch (e) {}
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

// --- Audio Streaming Endpoints ---

// 4.9 Full Progressive MP3 stream (/api/stream)
fastify.get('/api/stream', async (req, reply) => {
  const { q, duration, seek } = req.query;
  if (!q) return reply.status(400).send({ error: 'Missing query parameter q' });

  const directAudioUrl = await resolveAudioStream(q, duration ? Number(duration) : null);
  if (!directAudioUrl) {
    return reply.status(404).send({ error: 'Full audio stream could not be resolved' });
  }

  const seekSeconds = seek ? Number(seek) : 0;
  const ffmpegArgs = [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', directAudioUrl
  ];
  if (seekSeconds > 0) ffmpegArgs.push('-ss', String(seekSeconds));
  ffmpegArgs.push('-vn', '-c:a', 'libmp3lame', '-b:a', '192k', '-f', 'mp3', '-');

  const ffmpeg = spawn('ffmpeg', ffmpegArgs);
  reply.raw.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'public, max-age=86400',
    'Transfer-Encoding': 'chunked'
  });

  ffmpeg.stdout.pipe(reply.raw);
  ffmpeg.stderr.on('data', () => {});
  req.raw.on('close', () => {
    try { ffmpeg.kill('SIGKILL'); } catch (e) {}
  });
});

// 4.10 Track Audio Stream (/api/audio/stream/:id)
fastify.get('/api/audio/stream/:id', async (req, reply) => {
  const { id } = req.params;
  const { q, duration } = req.query;
  let query = q;

  if (!query) {
    try {
      const trackData = await spotifyBff.getTrack(id);
      const t = trackData?.data?.trackUnion;
      if (t) {
        query = `${t.name} ${t.firstArtist?.items?.[0]?.profile?.name || ''}`.trim();
      }
    } catch (e) {}
  }
  if (!query) {
    query = id.replace('spotify:track:', '');
  }

  const directAudioUrl = await resolveAudioStream(query, duration ? Number(duration) : null);
  if (!directAudioUrl) {
    return reply.status(404).send({ error: 'Audio stream could not be resolved' });
  }

  const ffmpeg = spawn('ffmpeg', [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', directAudioUrl,
    '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', '-f', 'mp3', '-'
  ]);

  reply.raw.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'public, max-age=86400',
    'Transfer-Encoding': 'chunked'
  });

  ffmpeg.stdout.pipe(reply.raw);
  ffmpeg.stderr.on('data', () => {});
  req.raw.on('close', () => {
    try { ffmpeg.kill('SIGKILL'); } catch (e) {}
  });
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
