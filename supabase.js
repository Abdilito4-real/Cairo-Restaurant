// ═══════════════════════════════════════════════════════════
//  CAIRO RESTAURANT — SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://phdxddaflaaatmuakqgm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZHhkZGFmbGFhYXRtdWFrcWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzE5OTUsImV4cCI6MjA4ODgwNzk5NX0.SXArhEPNXBF0-6Dr-ziw90KE2W7xsbdZRoccBvmlL0I';

// ── Validate: just check it looks like a real URL and key ──
const _credentialsSet =
  typeof SUPABASE_URL === 'string' &&
  typeof SUPABASE_KEY === 'string' &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('YOUR_') &&
  SUPABASE_KEY.startsWith('eyJ') &&
  SUPABASE_KEY.length > 100;

// ── Stub client (used only when credentials are missing) ───
function _makeStub() {
  function queryBuilder(isSingle) {
    const result = isSingle
      ? { data: { id: 'demo-' + Math.random().toString(36).slice(2,10) }, error: null }
      : { data: [], error: null };
    const p = Promise.resolve(result);
    ['select','eq','neq','gt','gte','lt','lte','like','ilike','in','is',
     'order','limit','range','single','maybeSingle','insert','update',
     'upsert','delete','filter','match','not'].forEach(m => {
      p[m] = () => (m === 'single' || m === 'maybeSingle')
        ? queryBuilder(true) : queryBuilder(false);
    });
    return p;
  }
  return {
    from: () => queryBuilder(false),
    auth: {
      getSession:         () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured.' } }),
      signOut:            () => Promise.resolve({ error: null })
    },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {}
  };
}

// ── Initialise ─────────────────────────────────────────────
let supabaseClient;

if (_credentialsSet) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true },
    global: { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  });
  console.log('%c✓ Cairo Restaurant — Supabase connected', 'color:#c9a84c;font-weight:bold');
} else {
  supabaseClient = _makeStub();
  console.warn('⚠ Cairo Restaurant — Supabase credentials missing or invalid in supabase.js');
}
