import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServerClient } from '@supabase/ssr';
import { createResetCookieBuffer } from '../lib/supabase/reset-cookie-buffer.ts';
import { sendPasswordResetEmail } from '../lib/auth/recovery.ts';

const LIMITED = [429, { code: 'over_email_send_rate_limit', msg: 'For security purposes, you can only request this after 60 seconds.' }];

// Runs a reset through the real Supabase library with the network mocked.
async function reset([status, body], requestCookies = []) {
  const buffer = createResetCookieBuffer(() => requestCookies);
  const fetch = async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  const supabase = createServerClient('https://project.supabase.co', 'publishable-key', { cookies: buffer, global: { fetch } });
  const result = await sendPasswordResetEmail(supabase.auth, 'someone@example.com', 'https://mytake.example/auth/callback?next=/reset-password');
  return { result, writes: buffer.writes() };
}
// What an observer of the response can compare: each cookie's name, whether it
// is deleted, and the flows index's contents. Random flow IDs and verifier
// secrets differ on every request, so they are masked.
function visible(writes) {
  const mask = text => text.replace(/[0-9a-f]{32}/g, '<flow>');
  return writes.map(({ name, value, options }) => [mask(name), options.maxAge === 0 ? 'deleted' : name.endsWith('-flows-code-verifier') ? mask(Buffer.from(value.replace(/^base64-/, ''), 'base64url').toString()) : 'set']).sort();
}

test('a rate-limited reset sends the same cookies as an accepted one, so cookies can’t reveal an account', async () => {
  const accepted = await reset([200, {}]);
  const limited = await reset(LIMITED);
  assert.deepEqual(visible(limited.writes), visible(accepted.writes));
  assert.ok(visible(accepted.writes).every(([, state]) => state !== 'deleted'));
  assert.deepEqual(limited.result, accepted.result);
});
test('a server error during a reset sends the same cookies as an accepted one', async () => {
  assert.deepEqual(visible((await reset([500, { msg: 'internal error' }])).writes), visible((await reset([200, {}])).writes));
});
test('with a reset already pending, a rate-limited reset still matches an accepted one', async () => {
  const pending = (await reset([200, {}])).writes.map(({ name, value }) => ({ name, value }));
  assert.deepEqual(visible((await reset(LIMITED, pending)).writes), visible((await reset([200, {}], pending)).writes));
});
