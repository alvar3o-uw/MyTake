import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthOrigin, authCallbackDestination } from '../lib/auth/urls.ts';
import { changeRecoveredPassword, sendPasswordResetEmail } from '../lib/auth/recovery.ts';

test('production origins require explicit HTTPS and never trust arbitrary request origins', () => {
  assert.equal(resolveAuthOrigin('https://mytake.example/', 'https://mytake.example', false, true), 'https://mytake.example');
  for (const configured of [undefined, 'http://localhost:3000', 'http://mytake.example', 'https://mytake.example/path', 'https://user:pass@mytake.example', 'https://mytake.example?next=bad']) assert.throws(() => resolveAuthOrigin(configured, null, false, true));
  assert.throws(() => resolveAuthOrigin('https://mytake.example', 'https://attacker.example', false, true));
  assert.equal(resolveAuthOrigin('http://localhost:3000', 'http://127.0.0.1:3000', true, false), 'http://localhost:3000');
  assert.equal(resolveAuthOrigin('http://localhost:3000', 'https://attacker.example', true, false), 'http://localhost:3000');
});
test('callback destinations allow only the library and reset form', () => {
  assert.equal(authCallbackDestination('/reset-password'), '/reset-password');
  for (const next of [null, '/library', '//attacker.example', 'https://attacker.example', '/reset-password?next=bad', '/settings']) assert.equal(authCallbackDestination(next), '/library');
});
function gateway(overrides = {}) {
  const calls = [];
  return { calls, auth: {
    getUser: async () => { calls.push('getUser'); return { data: { user: { id: 'authenticated-account' } }, error: null }; },
    updateUser: async attributes => { calls.push(['updateUser', attributes]); return { data: {}, error: null }; },
    signOut: async options => { calls.push(['signOut', options]); return { error: null }; },
    ...overrides,
  } };
}
test('invalid passwords and unauthenticated sessions cannot update a password', async () => {
  for (const [password, confirmation] of [['short', 'short'], ['long-enough', 'different'], [null, null]]) {
    const client = gateway();
    assert.ok((await changeRecoveredPassword(client.auth, password, confirmation)).error);
    assert.deepEqual(client.calls, []);
  }
  const client = gateway({ getUser: async () => ({ data: { user: null }, error: null }) });
  assert.ok((await changeRecoveredPassword(client.auth, 'fake-new-password', 'fake-new-password')).error);
  assert.deepEqual(client.calls, []);
});
test('confirmed password update signs out globally and never returns the password', async () => {
  const client = gateway();
  const result = await changeRecoveredPassword(client.auth, 'fake-new-password', 'fake-new-password');
  assert.deepEqual(result, { updated: true, signedOut: true });
  assert.deepEqual(client.calls, ['getUser', ['updateUser', { password: 'fake-new-password' }], ['signOut', { scope: 'global' }]]);
  assert.ok(!JSON.stringify(result).includes('fake-new-password'));
});
test('provider rejection and partial sign-out failure are reported accurately', async () => {
  const rejected = gateway({ updateUser: async () => ({ error: { code: 'same_password' } }) });
  assert.match((await changeRecoveredPassword(rejected.auth, 'fake-new-password', 'fake-new-password')).error, /different/);
  assert.deepEqual(rejected.calls, ['getUser']);
  const partial = gateway({ signOut: async () => ({ error: new Error('unavailable') }) });
  assert.deepEqual(await changeRecoveredPassword(partial.auth, 'fake-new-password', 'fake-new-password'), { updated: true, signedOut: false });
});
const NEUTRAL = 'If an account exists for that address, you’ll receive a password reset link.';
function resetGateway(reply) {
  const calls = [];
  return { calls, auth: { resetPasswordForEmail: async (email, options) => { calls.push([email, options]); if (reply instanceof Error) throw reply; return reply; } } };
}
test('every reset-email reply from Supabase, including rate limits, gives the same neutral message', async () => {
  for (const error of [null, { code: 'over_email_send_rate_limit', status: 429 }, { status: 429 }, { code: 'user_not_found', status: 400 }, { status: 500 }, { name: 'AuthRetryableFetchError', status: 503 }]) {
    const client = resetGateway({ data: {}, error });
    assert.deepEqual(await sendPasswordResetEmail(client.auth, 'someone@example.com', 'https://mytake.example/auth/callback?next=/reset-password'), { message: NEUTRAL }, JSON.stringify(error));
    assert.deepEqual(client.calls, [['someone@example.com', { redirectTo: 'https://mytake.example/auth/callback?next=/reset-password' }]]);
  }
});
test('a network failure reaching Supabase is reported as a connection problem', async () => {
  for (const reply of [new Error('fetch failed'), { data: null, error: { name: 'AuthRetryableFetchError', status: 0, message: 'fetch failed' } }]) {
    const client = resetGateway(reply);
    assert.deepEqual(await sendPasswordResetEmail(client.auth, 'someone@example.com', 'https://mytake.example/x'), { error: 'Couldn’t reach the sign-in service. Please try again.' });
  }
});
