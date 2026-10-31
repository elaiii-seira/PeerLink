import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import AuthShell from '../components/AuthShell'
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
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="field-label">Full name</label>
            <input id="full_name" required autoComplete="name" className="field"
              value={form.full_name} onChange={set('full_name')} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="course" className="field-label">Course</label>
              <input id="course" required placeholder="e.g. BSCpE" className="field"
                value={form.course} onChange={set('course')} />
            </div>
            <div>
              <label htmlFor="year_level" className="field-label">Year level</label>
              <select id="year_level" required className="field"
                value={form.year_level} onChange={set('year_level')}>
                <option value="" disabled>Select</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="email" className="field-label">Email</label>
            <input id="email" type="email" required autoComplete="email" className="field"
              value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label htmlFor="password" className="field-label">Password</label>
            <input id="password" type="password" required minLength={6} autoComplete="new-password"
              className="field" value={form.password} onChange={set('password')} />
            <p className="mt-1.5 text-sm text-muted-foreground">At least 6 characters.</p>
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
