import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'
import GoogleAuth from '../components/GoogleAuth'
import IconField from '../components/IconField'
import { YEAR_LEVELS } from '../options'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', course: '', year_level: '', email: '', password: '',
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { full_name, course, year_level, email, password } = form

    // Details are also stored in user metadata so the profile can be created
    // after email confirmation if no session exists yet.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name, course, year_level } },
    })

    if (error) {
      setBusy(false)
      return setError(error.message)
    }

    if (data.session) {
      setBusy(false)
      navigate('/dashboard')
    } else {
      setBusy(false)
      setNotice('Check your email to confirm your account, then log in.')
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute. You can add your skills next."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-foreground underline">Log in</Link>
        </>
      }
    >
      {notice ? (
        <p role="status" className="rounded border border-border/40 bg-card p-4 text-foreground">{notice}</p>
      ) : (
        <>
          <GoogleAuth label="Sign up with Google" />
          <form onSubmit={onSubmit} className="space-y-5">
            <IconField id="full_name" label="Full name" icon="user" required maxLength={100} autoComplete="name"
              placeholder="Juan Dela Cruz" value={form.full_name} onChange={set('full_name')} />
            <div className="grid gap-5 sm:grid-cols-2">
              <IconField id="course" label="Course" icon="book" required maxLength={100}
                placeholder="BSCpE" value={form.course} onChange={set('course')} />
              <IconField id="year_level" label="Year level" icon="calendar" as="select" required
                value={form.year_level} onChange={set('year_level')}>
                <option value="" disabled>Select</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </IconField>
            </div>
            <IconField id="email" label="Email" icon="mail" type="email" required autoComplete="email"
              placeholder="you@example.com" value={form.email} onChange={set('email')} />
            <IconField id="password" label="Password" icon="lock" type="password" required minLength={8}
              autoComplete="new-password" placeholder="At least 8 characters" hint="At least 8 characters."
              value={form.password} onChange={set('password')} />
            {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
