import { gasStore } from './store';
import { liveConfig } from './session';
import { supabaseStore } from './supabase-store';

// Keep existing deployments on Sheets until migration has been verified and this
// explicit server-side switch is set. Never fall back after a DB connection error.
export function storageProvider(): 'supabase' | 'sheets' {
  const provider = process.env.STORAGE_PROVIDER || 'sheets';
  if (provider !== 'supabase' && provider !== 'sheets') throw new Error('STORAGE_PROVIDER는 supabase 또는 sheets여야 합니다.');
  return provider;
}

export function serverStore() {
  if (storageProvider() === 'supabase') {
    return configuredSupabaseStore();
  }
  const { url, gasSecret } = liveConfig();
  return gasStore(url, gasSecret);
}

export function configuredSupabaseStore() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  return supabaseStore(url, key);
}
