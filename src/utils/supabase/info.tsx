/* AUTO-GENERATED: leer variables de entorno (VITE) */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; // server-only
export const SUPABASE_PROJECT_ID = (() => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    return url.replace('https://','').replace('.supabase.co','');
  } catch { return ''; }
})();
