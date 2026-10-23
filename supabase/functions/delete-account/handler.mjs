// The caller's ID always comes from verified Auth data, never request input.
export function createDeleteHandler(admin) {
  const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  return async (request) => {
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed.' });
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Sign in again.' });
    try {
      const { data: { user }, error } = await admin.auth.getUser(authorization.slice(7));
      if (error || !user) return reply(401, { error: 'Sign in again.' });
      const body = await request.json().catch(() => null);
      if (body?.confirmation !== 'DELETE') return reply(400, { error: 'Confirm account deletion.' });
      const { error: deletionError } = await admin.auth.admin.deleteUser(user.id, false);
      if (deletionError) return reply(500, { error: 'Could not delete your account. Please try again.' });
      return reply(200, { deleted: true });
    } catch {
      return reply(500, { error: 'Could not delete your account. Please try again.' });
    }
  };
}
