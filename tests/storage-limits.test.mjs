import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORAGE_CAPS, storageLimitMessage } from '../lib/storage-limits.ts';

test('titles limit gives the approved removal message', () => {
  assert.equal(storageLimitMessage({ code: 'MTLIM', message: 'titles' }),
    'You’ve reached MyTake’s limit of 1,000 saved titles (library and watchlist together). Remove a title to add another.');
});

test('episode_ratings limit gives the approved clearing message', () => {
  assert.equal(storageLimitMessage({ code: 'MTLIM', message: 'episode_ratings' }),
    'You’ve reached the limit of 10,000 episode ratings. Clear some to rate more.');
});

test('season_ratings limit gives the approved clearing message', () => {
  assert.equal(storageLimitMessage({ code: 'MTLIM', message: 'season_ratings' }),
    'You’ve reached the limit of 1,000 season ratings. Clear some to rate more.');
});

test('episode_reviews limit gives the approved removal message', () => {
  assert.equal(storageLimitMessage({ code: 'MTLIM', message: 'episode_reviews' }),
    'You’ve reached the limit of 2,000 episode reviews. Remove some to add more.');
});

test('text limit gives the approved draft-preserving message', () => {
  assert.equal(storageLimitMessage({ code: 'MTLIM', message: 'text' }),
    'Your saved text has reached MyTake’s 1 MB limit (reviews, titles and episode names together). Shorten or remove a review to save this one. Your draft is still here.');
});

test('unknown limit names and malformed errors give null', () => {
  for (const message of ['unknown', '', 'titles\n', 'constructor', '__proto__', 'toString', 1000, null]) {
    assert.equal(storageLimitMessage({ code: 'MTLIM', message }), null, `unknown message ${String(message)}`);
  }
  for (const error of [null, undefined, 'MTLIM', 1, {}, { code: 'MTLIM' }]) {
    assert.equal(storageLimitMessage(error), null);
  }
});

test('non-MTLIM errors give null even when their message is a known limit', () => {
  for (const code of ['23505', '23514', 'P0001', 'mtlim', '', undefined, null]) {
    for (const message of ['titles', 'episode_ratings', 'season_ratings', 'episode_reviews', 'text']) {
      assert.equal(storageLimitMessage({ code, message }), null, `non-limit code ${String(code)}`);
    }
  }
});

test('exported caps match the approved limits and the SQL enforcement constants', () => {
  assert.deepEqual(STORAGE_CAPS, {
    titles: 1000,
    episode_ratings: 10000,
    season_ratings: 1000,
    episode_reviews: 2000,
    text: 1000000,
  });
  const sql = readFileSync(new URL('../supabase/storage-limits.sql', import.meta.url), 'utf8');
  for (const [limit, cap] of Object.entries(STORAGE_CAPS)) {
    const declaration = sql.match(new RegExp(`\\b${limit}_cap\\s+constant\\s+bigint\\s*:=\\s*(\\d+)\\s*;`, 'i'));
    assert.ok(declaration, `SQL cap declaration missing: ${limit}`);
    assert.equal(Number(declaration[1]), cap, `${limit} cap drifted between app and SQL`);
  }
});
