import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const MOCK_STORAGE_KEY = 'puffies_use_mock'

/** True when the public Supabase keys are configured. Never put the service role key here. */
export const supabaseConfigured = Boolean(url && anonKey)

export const supabase = supabaseConfigured ? createClient(url!, anonKey!) : null

/** Prefer localStorage so Admin can flip mock without an env restart. No keys → always mock. */
export function readUseMock(): boolean {
  if (!supabaseConfigured) return true
  try {
    return window.localStorage.getItem(MOCK_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setUseMock(value: boolean): void {
  try {
    window.localStorage.setItem(MOCK_STORAGE_KEY, value ? 'true' : 'false')
  } catch {
    // private mode / blocked storage — toggle still needs a reload path from the caller
  }
}

export function isBackendEnabled(): boolean {
  return supabaseConfigured && !readUseMock()
}
