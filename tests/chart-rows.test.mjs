import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartEpisodeRows } from '../lib/episodes/chart-rows.ts';

test('rows run from 1 to the longest season when nothing is rated beyond it', () => {
  assert.deepEqual(chartEpisodeRows([3, 5], [2, 4]), [1, 2, 3, 4, 5]);
});
test('a rated episode far beyond the real count adds one row, not every number up to it', () => {
  assert.deepEqual(chartEpisodeRows([3], [2, 99999]), [1, 2, 3, 99999]);
});
test('rated episodes past the count appear once each, in order', () => {
  assert.deepEqual(chartEpisodeRows([2], [40, 7, 40]), [1, 2, 7, 40]);
});
test('no seasons and no ratings give no rows', () => {
  assert.deepEqual(chartEpisodeRows([], []), []);
  assert.deepEqual(chartEpisodeRows([0], []), []);
});
