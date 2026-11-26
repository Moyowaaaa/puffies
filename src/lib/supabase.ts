import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Mock by default until both keys are present. Never put the service role key here. */
export const backendEnabled = Boolean(url && anonKey) && import.meta.env.VITE_USE_MOCK !== 'true'

export const supabase = backendEnabled ? createClient(url!, anonKey!) : null
