import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResults } from '../lib/tmdb/media.ts';

test('keeps movie and TV identities separate and normalizes titles and dates', () => {
  assert.deepEqual(normalizeResults([
    { id: 10, media_type: 'movie', title: 'Arrival', release_date: '2016-11-10', poster_path: '/poster.jpg' },
    { id: 10, media_type: 'tv', name: 'Vinland Saga', first_air_date: '2019-07-08' },
  ]), [
    { tmdbId: 10, mediaType: 'movie', title: 'Arrival', year: '2016', posterPath: '/poster.jpg' },
    { tmdbId: 10, mediaType: 'tv', title: 'Vinland Saga', year: '2019', posterPath: null },
  ]);
});
test('excludes people, adult titles, and malformed results; never forwards arbitrary image URLs', () => {
  assert.deepEqual(normalizeResults([
    null, { id: 1, media_type: 'person', name: 'Actor' },
    { id: 2, media_type: 'movie', title: 'Adult', adult: true },
    { id: -1, media_type: 'tv', name: 'Invalid' },
    { id: 3, media_type: 'movie', title: ' ' },
    { id: 4, media_type: 'movie', title: 'Valid', poster_path: 'https://other.example/image.jpg' },
  ]), [{ tmdbId: 4, mediaType: 'movie', title: 'Valid', year: '', posterPath: null }]);
  assert.deepEqual(normalizeResults({}), []);
});

test('episode data supports specials and retains explicit episode identity', async () => {
  const { normalizeSeasons, normalizeEpisodes, progressLabel } = await import('../lib/tmdb/episodes.ts');
  assert.deepEqual(normalizeSeasons([
    { season_number: 2, name: 'Season 2', episode_count: 12 },
    { season_number: 0, name: 'Specials', episode_count: 2 },
    { season_number: 1, name: 'Season 1', episode_count: 0 },
  ]), [{ number: 0, name: 'Specials' }, { number: 2, name: 'Season 2' }]);
  const episodes = normalizeEpisodes([
    { id: 102, season_number: 0, episode_number: 2, name: 'Finale' },
    { id: 101, season_number: 0, episode_number: 1, name: 'Beginning' },
    { id: 103, season_number: 1, episode_number: 1, name: 'Wrong season' },
  ], 0);
  assert.equal(episodes.length, 2);
  assert.equal(episodes[0].episodeId, 101);
  assert.equal(progressLabel('In Progress', episodes[1]), 'In Progress · Through Specials E02');
  assert.equal(progressLabel('Completed', episodes[1]), 'Completed');
  assert.equal(progressLabel('In Progress'), 'In Progress');
});

test('episode metadata handles missing descriptions and rejects external image URLs', async () => {
  const { normalizeEpisodeDetails } = await import('../lib/tmdb/episodes.ts');
  const episodes = normalizeEpisodeDetails([
    { id: 1, season_number: 0, episode_number: 1, name: 'Special', overview: ' A description. ', still_path: '/still.jpg' },
    { id: 2, season_number: 0, episode_number: 2, name: 'No image', overview: null, still_path: 'https://untrusted.example/image.jpg' },
    { id: 3, season_number: 1, episode_number: 1, name: 'Other season', overview: 'Excluded' },
  ], 0);
  assert.equal(episodes.length, 2);
  assert.equal(episodes[0].overview, 'A description.');
  assert.equal(episodes[0].stillPath, '/still.jpg');
  assert.equal(episodes[1].overview, '');
  assert.equal(episodes[1].stillPath, null);
});
