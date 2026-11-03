import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'

// The link in the reset email signs the student in for a moment (Supabase reads the link),
// so this page just asks for a new password while that session exists.
export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (password !== confirm) return setError('The two passwords do not match.')
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    setDone(true)
  }

  if (loading) {
    return <AuthShell title="Reset your password" subtitle="Checking your link…" footer={null}>{null}</AuthShell>
  }

  if (!user) {
    return (
      <AuthShell
        title="This link has expired"
        subtitle="Reset links work once and stop working after a short time."
        footer={null}
      >
        <Link to="/forgot-password" className="btn-primary w-full">Send me a new link</Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You can now use your new password to log in." footer={null}>
        <p role="status" className="sr-only">Your password was changed.</p>
        <button type="button" className="btn-primary w-full" onClick={() => navigate('/dashboard')}>
          Go to my dashboard
        </button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you have not used elsewhere." footer={null}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="field-label">New password</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" className="field"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1.5 text-sm text-muted-foreground">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="field-label">Confirm new password</label>
          <input id="confirm" type="password" required minLength={8} autoComplete="new-password" className="field"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}
