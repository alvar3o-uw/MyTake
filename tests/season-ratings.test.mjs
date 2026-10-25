import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSeasonRating } from '../lib/episodes/season-rating.ts';
const id = '12345678-1234-4123-8123-123456789abc';
test('season ratings accept Specials, zero and blank but reject invalid identities, seasons and precision', () => {
  for (const rating of [null, 0, 0.1, 8.8, 10]) assert.equal(validateSeasonRating(id, 0, rating), null);
  for (const rating of [undefined, '', '8.8', NaN, Infinity, -0.1, 10.1, 8.85]) assert.ok(validateSeasonRating(id, 1, rating));
  for (const season of [-1, 0.1, 100000, '1', null]) assert.ok(validateSeasonRating(id, season, 8));
  assert.ok(validateSeasonRating('bad-id', 1, 8));
});
