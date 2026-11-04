import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'
import IconField from '../components/IconField'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    // The email contains a link that brings the student back to /reset-password
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (error) return setError(error.message)
    setSent(true)
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-foreground underline">Back to log in</Link>
        </>
      }
    >
      {sent ? (
        <div role="status" className="rounded border border-border/25 bg-card p-4">
          <p className="font-semibold">Check your email</p>
          <p className="mt-1 text-muted-foreground">
            If an account exists for {email.trim()}, a reset link is on its way. It may take a minute, and
            it can land in your spam folder.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <IconField id="email" label="Email" icon="mail" type="email" required autoComplete="email"
            placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
