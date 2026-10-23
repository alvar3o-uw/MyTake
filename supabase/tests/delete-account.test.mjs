import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDeleteHandler } from '../functions/delete-account/handler.mjs';

function fixture({ valid = true, fails = false } = {}) {
  const deleted = [];
  const handler = createDeleteHandler({ auth: {
    getUser: async (token) => ({ data: { user: valid && token === 'valid' ? { id: 'signed-in-user' } : null }, error: null }),
    admin: { deleteUser: async (...args) => { deleted.push(args); return { error: fails ? new Error('private internal error') : null }; } },
  } });
  return { handler, deleted };
}
const request = (body, token = 'valid') => new Request('https://example.com', {
  method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body),
});

test('missing or invalid authentication never deletes an account', async () => {
  for (const token of [null, 'invalid']) {
    const { handler, deleted } = fixture();
    assert.equal((await handler(request({ confirmation: 'DELETE' }, token))).status, 401);
    assert.deepEqual(deleted, []);
  }
});
test('requires explicit confirmation and POST', async () => {
  const { handler, deleted } = fixture();
  assert.equal((await handler(request({}))).status, 400);
  assert.equal((await handler(new Request('https://example.com'))).status, 405);
  assert.deepEqual(deleted, []);
});
test('deletes only verified identity, ignoring supplied target IDs', async () => {
  const { handler, deleted } = fixture();
  const response = await handler(request({ confirmation: 'DELETE', id: 'someone-else' }));
  assert.deepEqual(await response.json(), { deleted: true });
  assert.deepEqual(deleted, [['signed-in-user', false]]);
});
test('failed deletion cannot report success or expose internal errors', async () => {
  const { handler } = fixture({ fails: true });
  const response = await handler(request({ confirmation: 'DELETE' }));
  assert.equal(response.status, 500);
  assert.equal((await response.text()).includes('private internal error'), false);
});
