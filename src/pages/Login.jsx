import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
    else navigate('/dashboard')
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          New to PeerLink?{' '}
          <Link to="/register" className="font-semibold text-foreground underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" type="email" required autoComplete="email" className="field"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input id="password" type="password" required autoComplete="current-password" className="field"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  )
}
