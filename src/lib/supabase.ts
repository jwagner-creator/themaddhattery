import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// YOUR OWN SUPABASE project credentials.
// 1. Sign up at https://supabase.com (free)
// 2. Create a new project
// 3. Go to Settings → API
// 4. Copy "Project URL" and "anon public" key
// 5. Paste them below OR store in .env as:
//      VITE_SUPABASE_URL=https://xxxx.supabase.co
//      VITE_SUPABASE_ANON_KEY=eyJ...
// ─────────────────────────────────────────────────────────────────────────────
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);
