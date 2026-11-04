import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'
import IconField from '../components/IconField'

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
    return <AuthShell title="Reset your password" subtitle="One moment." footer={null}><p role="status" className="text-center text-muted-foreground">Checking your link…</p></AuthShell>
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
        <IconField id="password" label="New password" icon="lock" type="password" required minLength={8}
          autoComplete="new-password" placeholder="At least 8 characters" hint="At least 8 characters."
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <IconField id="confirm" label="Confirm new password" icon="lock" type="password" required minLength={8}
          autoComplete="new-password" placeholder="Type it again" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} />
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}
