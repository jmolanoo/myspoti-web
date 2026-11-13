import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SpotifyBffService } from '../src/server/spotify/SpotifyBffService.js';

describe('Spotify BFF Service & GraphQL Operation Registry', () => {
  const bff = new SpotifyBffService();

  test('should load all 179 captured GraphQL operations from gql-ops.json', () => {
    const opCount = Object.keys(bff.operations).length;
    assert.strictEqual(opCount, 179, 'Expected exactly 179 GraphQL operations');
  });

  test('should contain critical operations with valid SHA256 hashes', () => {
    const criticalOps = [
      'searchTopResultsList',
      'searchTracks',
      'searchSuggestions',
      'getTrack',
      'getAlbum',
      'queryArtistOverview',
      'libraryV3',
      'fetchLibraryTracks',
      'canvas'
    ];

    for (const op of criticalOps) {
      assert.ok(bff.operations[op], `Operation ${op} must be present`);
      const hash = bff.operations[op].hash || bff.operations[op].sha256Hash;
      assert.ok(hash, `Operation ${op} must have a valid hash`);
      assert.strictEqual(hash.length, 64, `Hash length for ${op} must be 64 characters`);
    }
  });

  test('should throw error on unknown operation', async () => {
    await assert.rejects(
      async () => {
        await bff.queryGql('nonExistentOperation_XYZ');
      },
      /not found in captured catalog/
    );
  });
});
