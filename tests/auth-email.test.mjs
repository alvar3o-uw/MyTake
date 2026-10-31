import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, EMAIL_MAX_LENGTH } from '../lib/auth/email.ts';

test('the slow-pattern attack input is rejected quickly', () => {
  const attack = 'a@' + '.'.repeat(64000) + '@';
  const started = performance.now();
  assert.equal(isValidEmail(attack), false);
  assert.ok(performance.now() - started < 100, 'took too long: the pattern ran on the whole input');
});
test('emails are capped at 254 characters', () => {
  assert.equal(EMAIL_MAX_LENGTH, 254);
  const at254 = 'a'.repeat(242) + '@example.com';
  assert.equal(at254.length, 254);
  assert.equal(isValidEmail(at254), true);
  assert.equal(isValidEmail('a' + at254), false);
});
test('ordinary valid and invalid emails behave as before', () => {
  for (const email of ['alv@example.com', 'a.b+tag@mail.example.co.uk', 'x@y.z']) assert.equal(isValidEmail(email), true, email);
  for (const email of ['', 'alv', 'alv@', '@example.com', 'alv@example', 'alv@@example.com', 'a lv@example.com', 'alv@exa mple.com', 'alv@example.']) assert.equal(isValidEmail(email), false, email);
});
