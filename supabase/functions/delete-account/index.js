/* global Deno */
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { createDeleteHandler } from './handler.mjs';

const admin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(createDeleteHandler(admin));
