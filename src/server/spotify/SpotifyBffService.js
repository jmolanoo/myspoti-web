import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetch } from 'undici';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SpotifyBffService {
  constructor(options = {}) {
    this.opsPath = options.opsPath || path.join(__dirname, 'gql-ops.json');
    this.varsPath = options.varsPath || path.join(__dirname, 'gql-variables.json');
    this.clientVersion = '1.2.53.440.g7b2f582a';
    this.clientId = 'd8a5de950d304dd28ea8549d44f734f1';
    
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.clientToken = null;
    this.clientTokenExpiresAt = 0;

    this.operations = {};
    this.variablesTemplates = {};

    this.loadCatalog();
  }

  loadCatalog() {
    try {
      if (fs.existsSync(this.opsPath)) {
        const opsData = JSON.parse(fs.readFileSync(this.opsPath, 'utf8'));
        this.operations = opsData.operations || {};
        if (opsData.clientVersion) this.clientVersion = opsData.clientVersion;
      }
      if (fs.existsSync(this.varsPath)) {
        this.variablesTemplates = JSON.parse(fs.readFileSync(this.varsPath, 'utf8'));
      }
    } catch (err) {
      console.error('[SpotifyBffService] Error loading GQL catalog:', err.message);
    }
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.accessToken && this.accessTokenExpiresAt > now + 60000) {
      return this.accessToken;
    }

    try {
      // 1. Fetch anonymous access token from open.spotify.com
      const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'App-Platform': 'WebPlayer'
        }
      });

      if (res.ok) {
        const data = await res.json();
        this.accessToken = data.accessToken;
        this.accessTokenExpiresAt = data.accessTokenExpirationTimestampMs || (now + 3600000);
        if (data.clientId) this.clientId = data.clientId;
        return this.accessToken;
      }
    } catch (err) {
      console.warn('[SpotifyBffService] Failed to obtain open.spotify.com token:', err.message);
    }

    // Fallback: Token will be populated from user session or client bridge
    return this.accessToken || '';
  }

  async getClientToken() {
    const now = Date.now();
    if (this.clientToken && this.clientTokenExpiresAt > now + 60000) {
      return this.clientToken;
    }

    try {
      const res = await fetch('https://clienttoken.spotify.com/v1/clienttoken', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          client_data: {
            client_id: this.clientId,
            client_version: this.clientVersion,
            js_sdk_data: {
              device_brand: 'Apple',
              device_model: 'Browser',
              os: 'iOS',
              os_version: '17.4'
            }
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response_type === 'RESPONSE_GRANTED_TOKEN_RESPONSE') {
          this.clientToken = data.granted_token_response.token;
          this.clientTokenExpiresAt = now + (data.granted_token_response.expires_after_seconds * 1000);
          return this.clientToken;
        }
      }
    } catch (err) {
      console.warn('[SpotifyBffService] Failed to get clientToken:', err.message);
    }

    return this.clientToken || '';
  }

  async queryGql(operationName, variables = {}) {
    const op = this.operations[operationName];
    const hash = op ? (op.hash || op.sha256Hash) : null;
    if (!op || !hash) {
      throw new Error(`GraphQL operation '${operationName}' not found in captured catalog`);
    }

    const token = await this.getAccessToken();
    const clientToken = await this.getClientToken();

    const url = new URL('https://api-partner.spotify.com/pathfinder/v1/query');
    url.searchParams.set('operationName', operationName);
    url.searchParams.set('variables', JSON.stringify(variables));
    url.searchParams.set('extensions', JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: hash
      }
    }));

    const headers = {
      'Accept': 'application/json',
      'App-Platform': 'WebPlayer',
      'Spotify-App-Version': this.clientVersion,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (clientToken) headers['client-token'] = clientToken;

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Spotify GQL query failed [${res.status}]: ${errText.slice(0, 200)}`);
    }

    return await res.json();
  }

  async getLyrics(trackId) {
    const token = await this.getAccessToken();
    const cleanId = trackId.replace('spotify:track:', '');
    const url = `https://spclient.wg.spotify.com/color-lyrics/v2/track/${cleanId}?format=json&vocalRemoval=false&market=from_token`;

    const headers = {
      'App-Platform': 'WebPlayer',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  }

  async getTrack(trackUri) {
    const cleanUri = trackUri.startsWith('spotify:track:') ? trackUri : `spotify:track:${trackUri}`;
    return this.queryGql('getTrack', { uri: cleanUri });
  }

  async getAlbum(albumUri) {
    const cleanUri = albumUri.startsWith('spotify:album:') ? albumUri : `spotify:album:${albumUri}`;
    return this.queryGql('getAlbum', { uri: cleanUri, locale: '' });
  }

  async getArtist(artistUri) {
    const cleanUri = artistUri.startsWith('spotify:artist:') ? artistUri : `spotify:artist:${artistUri}`;
    return this.queryGql('queryArtistOverview', { uri: cleanUri, locale: '' });
  }

  async getSearchTop(query, limit = 10) {
    return this.queryGql('searchTopResultsList', {
      searchTerm: query,
      offset: 0,
      limit: limit,
      numberOfTopResults: 5,
      includeAudiobooks: true
    });
  }

  async getSearchTracks(query, offset = 0, limit = 30) {
    return this.queryGql('searchTracks', {
      searchTerm: query,
      offset,
      limit
    });
  }

  async getCanvas(trackUri) {
    const cleanUri = trackUri.startsWith('spotify:track:') ? trackUri : `spotify:track:${trackUri}`;
    return this.queryGql('canvas', { uris: [cleanUri] });
  }
}
