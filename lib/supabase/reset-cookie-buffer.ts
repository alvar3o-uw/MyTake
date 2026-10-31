import type { CookieOptions } from "@supabase/ssr";

type CookieWrite = { name: string; value: string; options: CookieOptions };

// Holds the cookie writes made while a reset email is requested, so they can be
// sent in one go afterwards. Supabase writes the reset's cookies before asking
// for the email, then deletes or rewrites them if the request is refused. A
// refusal can mean the account exists (a second request within 60 seconds), so
// only the first write to each cookie is kept: every outcome sends the same
// cookies, and an accepted reset keeps the cookies its link needs.
export function createResetCookieBuffer(read: () => { name: string; value: string }[]) {
  const writes = new Map<string, CookieWrite>();
  return {
    getAll() {
      const current = new Map(read().map(cookie => [cookie.name, cookie]));
      for (const write of writes.values()) {
        if (write.options.maxAge === 0) current.delete(write.name);
        else current.set(write.name, { name: write.name, value: write.value });
      }
      return [...current.values()];
    },
    setAll(cookiesToSet: CookieWrite[]) {
      for (const write of cookiesToSet) if (!writes.has(write.name)) writes.set(write.name, write);
    },
    writes() { return [...writes.values()]; },
  };
}
