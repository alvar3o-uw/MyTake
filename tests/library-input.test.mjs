import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLibraryInput } from '../lib/library/input.ts';
import { toLibraryEntry } from '../lib/library/records.ts';
const base = { requestId: '12345678-1234-4123-8123-123456789abc', tmdbId: 88803, mediaType: 'tv', status: 'In Progress', rating: 8.8 };
test('server validation preserves optional rating and enforces decimal range', () => {
  for (const rating of [null, 0, 0.1, 8.8, 10]) assert.equal(validateLibraryInput({ ...base, rating }), null);
  for (const rating of [undefined, '', '8.8', NaN, Infinity, -0.1, 10.1, 8.85, 1.0000000001]) assert.ok(validateLibraryInput({ ...base, rating }));
});
test('server validation rejects malformed identities, statuses and episode progress', () => {
  for (const patch of [{ requestId: '' }, { tmdbId: -1 }, { mediaType: 'person' }, { status: 'Watching' }, { progress: null }, { progress: { episodeId: 1, seasonNumber: -1, episodeNumber: 3 } }]) assert.ok(validateLibraryInput({ ...base, ...patch }));
  const progress = { episodeId: 123, seasonNumber: 0, episodeNumber: 3 };
  assert.equal(validateLibraryInput({ ...base, progress }), null);
  assert.ok(validateLibraryInput({ ...base, mediaType: 'movie', progress }));
  assert.ok(validateLibraryInput({ ...base, status: 'Completed', progress }));
});
test('database records restore rating and structured episode progress', () => {
  const row = { id: base.requestId, rating: 8.8, viewing_status: 'in_progress', episode_id: 123, season_number: 1, episode_number: 3, episode_name: 'Troll', media_snapshots: { tmdb_id: 88803, media_type: 'tv', title: 'Vinland Saga', release_year: '2019', poster_path: '/poster.jpg' } };
  const entry = toLibraryEntry(row);
  assert.equal(entry.rating, 8.8);
  assert.equal(entry.status, 'In Progress');
  assert.deepEqual(entry.progress, { episodeId: 123, seasonNumber: 1, episodeNumber: 3, episodeName: 'Troll' });
  assert.equal(toLibraryEntry({ ...row, rating: 0 }).rating, 0);
  assert.equal(toLibraryEntry({ ...row, rating: null, episode_id: null, season_number: null, episode_number: null, episode_name: null }).progress, undefined);
});
