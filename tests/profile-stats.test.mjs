import { test } from 'node:test';
import assert from 'node:assert/strict';
import { titleStats, genreStats } from '../lib/profiles/stats.ts';
test('profile counters exclude unrated titles and include zero; decimal buckets do not round scores', () => {
  const stats = titleStats([
    { mediaType: 'movie', rating: null }, { mediaType: 'movie', rating: 0 },
    { mediaType: 'tv', rating: 8.9 }, { mediaType: 'tv', rating: 9 },
    { mediaType: 'movie', rating: 10 }, { mediaType: 'tv', rating: null },
  ]);
  assert.equal(stats.moviesRated, 2);
  assert.equal(stats.showsRated, 2);
  assert.equal(stats.distribution[0], 1);
  assert.equal(stats.distribution[8], 1);
  assert.equal(stats.distribution[9], 1);
  assert.equal(stats.distribution[10], 1);
  assert.equal(stats.distribution.reduce((a,b) => a+b, 0), 4);
  assert.deepEqual(titleStats([]), { moviesRated: 0, showsRated: 0, showsCompleted: 0, showsInProgress: 0, averageRating: null, distribution: Array(11).fill(0) });
});

test('show statuses include unrated shows and average uses only overall rated titles', () => {
  const stats = titleStats([
    { mediaType: 'tv', rating: null, status: 'Completed' },
    { mediaType: 'tv', rating: 10, status: 'In Progress' },
    { mediaType: 'movie', rating: 0, status: 'Completed' },
  ]);
  assert.equal(stats.showsCompleted, 1);
  assert.equal(stats.showsInProgress, 1);
  assert.equal(stats.averageRating, 5);
});
test('genre stats deduplicate genres, retain zero and expose incomplete metadata coverage', () => {
  const entries = [{ id: 'a', rating: 10 }, { id: 'b', rating: 0 }, { id: 'c', rating: 8 }, { id: 'd', rating: null }];
  const stats = genreStats(entries, { a: ['Drama', 'Drama', 'Comedy'], b: ['Drama'], d: ['Comedy'] });
  assert.equal(stats.coveredTitles, 2);
  assert.equal(stats.ratedTitles, 3);
  assert.deepEqual(stats.mostRated, [{ name: 'Drama', count: 2, average: 5 }, { name: 'Comedy', count: 1, average: 10 }]);
  assert.equal(stats.highestRated[0].name, 'Comedy');
  assert.deepEqual(genreStats([], {}), { coveredTitles: 0, ratedTitles: 0, mostRated: [], highestRated: [] });
});
