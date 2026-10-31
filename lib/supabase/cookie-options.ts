// Only server code reads the Supabase session cookies (there is no browser
// Supabase client), so page scripts never need to see them.
export const supabaseCookieOptions = { httpOnly: true } as const;
