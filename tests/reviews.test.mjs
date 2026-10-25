import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReview, REVIEW_LIMIT } from '../lib/reviews/input.ts';

test('review input preserves paragraphs and literal markup while normalizing line endings', () => {
  assert.deepEqual(normalizeReview('  First paragraph.\r\n\r\n<script>literal text</script>  '), { review: 'First paragraph.\n\n<script>literal text</script>' });
});
test('blank reviews clear the saved value; invalid input and oversized reviews are rejected', () => {
  assert.deepEqual(normalizeReview(' \n\t '), { review: null });
  for (const input of [null, undefined, {}, 0]) assert.ok(normalizeReview(input).error);
  assert.equal(normalizeReview('x'.repeat(REVIEW_LIMIT)).review.length, REVIEW_LIMIT);
  assert.ok(normalizeReview('x'.repeat(REVIEW_LIMIT + 1)).error);
});
