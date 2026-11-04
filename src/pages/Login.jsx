import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'
import GoogleAuth from '../components/GoogleAuth'
import IconField from '../components/IconField'

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
      title="Log in to your account"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          Don’t have an account?{' '}
          <Link to="/register" className="font-semibold text-foreground underline">Create one</Link>
        </>
      }
    >
      <GoogleAuth label="Continue with Google" />
      <form onSubmit={onSubmit} className="space-y-5">
        <IconField id="email" label="Email" icon="mail" type="email" required autoComplete="email"
          placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <IconField id="password" label="Password" icon="lock" type="password" required
          autoComplete="current-password" placeholder="Your password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          right={
            <Link to="/forgot-password" className="text-sm font-semibold text-muted-foreground underline hover:text-foreground">
              Forgot password?
            </Link>
          } />
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  )
}
