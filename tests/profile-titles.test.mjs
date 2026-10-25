import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileTitles } from '../lib/profiles/titles.ts';
const entries = [
  { id: '1', title: 'Unrated favourite', rating: null, isFavourite: true, mediaType: 'tv' },
  { id: '2', title: 'Zulu', rating: 9.3, isFavourite: false, mediaType: 'movie' },
  { id: '3', title: 'Arrival', rating: 9.3, isFavourite: false, mediaType: 'movie' },
  { id: '4', title: 'Zero', rating: 0, isFavourite: true, mediaType: 'movie' },
  { id: '5', title: 'Show', rating: 8.8, isFavourite: false, mediaType: 'tv' },
  { id: '6', title: 'Fifth score', rating: 1, isFavourite: false, mediaType: 'tv' },
];
test('manual favourites include unrated titles independently of highest scores', () => {
  const result = profileTitles(entries, 'all');
  assert.deepEqual(result.favourites.map(entry => entry.id), ['1', '4']);
  assert.deepEqual(result.highestRated.map(entry => entry.id), ['3', '2', '5', '6']);
  assert.equal(entries[0].id, '1');
});
test('profile filters both collections, excludes null scores and retains zero', () => {
  const movies = profileTitles(entries, 'movie');
  assert.deepEqual(movies.favourites.map(entry => entry.id), ['4']);
  assert.deepEqual(movies.highestRated.map(entry => entry.id), ['3', '2', '4']);
  assert.deepEqual(profileTitles([], 'tv'), { favourites: [], highestRated: [] });
});
