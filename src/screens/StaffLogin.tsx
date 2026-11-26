import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function StaffLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError(signInError.message)
    setBusy(false)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: 'var(--cream)',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 380,
        }}
      >
        <div style={{ fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>
          puffies
        </div>
        <div style={{ color: 'var(--fg2)', fontSize: 13, marginBottom: 24 }}>Staff sign in</div>

        <label className="field-label" htmlFor="staff-email">
          Email
        </label>
        <input
          id="staff-email"
          className="field"
          type="email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <div style={{ height: 12 }} />
        <label className="field-label" htmlFor="staff-password">
          Password
        </label>
        <input
          id="staff-password"
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600, marginTop: 12 }}>{error}</div>
        )}

        <button
          className="btn-blue"
          type="submit"
          disabled={busy}
          style={{ width: '100%', marginTop: 20, padding: 14 }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div style={{ fontSize: 11, color: 'var(--fg2)', marginTop: 14, textAlign: 'center' }}>
          Kiosk and pre-order stay open to customers.
        </div>
      </form>
    </div>
  )
}
