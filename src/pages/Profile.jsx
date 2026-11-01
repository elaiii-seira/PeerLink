import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import PageHeader from '../components/PageHeader'
import ProfileActivity from '../components/ProfileActivity'
import { AVAILABILITY, YEAR_LEVELS } from '../options'

const MINE = 'id, type, skill_id, skills(name, category)'
const GROUPS = { academic: 'Academic subjects', practical: 'Practical skills' }
const card = 'rounded border border-border/25 bg-card p-6 text-card-foreground'

function SkillList({ title, hint, type, mine, catalog, onAdd, onRemove }) {
  const [pick, setPick] = useState('')
  const taken = new Set(mine.map((r) => r.skill_id))
  const options = catalog.filter((s) => !taken.has(s.id))
  const rows = mine.filter((r) => r.type === type)

  return (
    <section className={card}>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-muted-foreground">{hint}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {rows.length === 0 && <li className="text-muted-foreground">None yet.</li>}
        {rows.map((r) => (
          <li key={r.id}
            className="inline-flex items-center gap-1 rounded-full bg-primary py-1 pl-3 pr-1 text-sm font-semibold text-primary-foreground">
            {r.skills.name}
            <button onClick={() => onRemove(r.id)} aria-label={`Remove ${r.skills.name}`}
              className="rounded-full px-2 hover:bg-primary-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
              ×
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex gap-2">
        <select aria-label={`Add to ${title}`} className="field" value={pick}
          onChange={(e) => setPick(e.target.value)}>
          <option value="">Add a skill…</option>
          {Object.entries(GROUPS).map(([key, label]) => (
            <optgroup key={key} label={label}>
              {options.filter((s) => s.category === key).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="btn-primary shrink-0" disabled={!pick}
          onClick={async () => { await onAdd(type, pick); setPick('') }}>
          Add
        </button>
      </div>
    </section>
  )
}

export default function Profile() {
  const { user, profile, setProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: '', course: '', year_level: '', bio: '', availability: [],
  })
  const [catalog, setCatalog] = useState([])
  const [mine, setMine] = useState([])
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  // Fill the form from the saved profile
  useEffect(() => {
    if (!profile) return
    setForm({
      full_name: profile.full_name ?? '',
      course: profile.course ?? '',
      year_level: profile.year_level ?? '',
      bio: profile.bio ?? '',
      availability: profile.availability ?? [],
    })
  }, [profile])

  // READ: skill catalog and my own tags
  useEffect(() => {
    async function load() {
      const [cat, rows] = await Promise.all([
        supabase.from('skills').select('id, name, category').order('name'),
        supabase.from('user_skills').select(MINE).eq('user_id', user.id),
      ])
      const err = cat.error || rows.error
      if (err) return setError(err.message)
      setCatalog(cat.data)
      setMine(rows.data)
    }
    load()
  }, [user.id])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const toggleSlot = (slot) =>
    setForm((f) => ({
      ...f,
      availability: f.availability.includes(slot)
        ? f.availability.filter((s) => s !== slot)
        : [...f.availability, slot],
    }))

  // UPDATE: profile details
  async function saveDetails(e) {
    e.preventDefault()
    setSaving(true)
    setStatus('')
    setError('')
    const { data, error } = await supabase
      .from('profiles').update(form).eq('id', user.id).select().single()
    setSaving(false)
    if (error) return setError(error.message)
    setProfile(data)
    setStatus('Profile saved.')
  }

  // CREATE: add a skill tag
  async function addSkill(type, skillId) {
    setError('')
    const { data, error } = await supabase
      .from('user_skills')
      .insert({ user_id: user.id, skill_id: Number(skillId), type })
      .select(MINE).single()
    if (error) return setError(error.message)
    setMine((m) => [...m, data])
  }

  // DELETE: remove a skill tag
  async function removeSkill(id) {
    setError('')
    const { error } = await supabase.from('user_skills').delete().eq('id', id)
    if (error) return setError(error.message)
    setMine((m) => m.filter((r) => r.id !== id))
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Your profile"
        subtitle="Tell classmates what you can teach and what you want to learn." />

      <main id="main" className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}

        <section className={card}>
          <h2 className="text-xl font-semibold">Details</h2>
          <form onSubmit={saveDetails} className="mt-4 space-y-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="full_name" className="field-label">Full name</label>
                <input id="full_name" required className="field" value={form.full_name} onChange={set('full_name')} />
              </div>
              <div>
                <label htmlFor="course" className="field-label">Course</label>
                <input id="course" required className="field" value={form.course} onChange={set('course')} />
              </div>
              <div>
                <label htmlFor="year_level" className="field-label">Year level</label>
                <select id="year_level" required className="field" value={form.year_level} onChange={set('year_level')}>
                  <option value="" disabled>Select</option>
                  {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="field-label">About you</label>
              <textarea id="bio" rows={3} maxLength={300} className="field"
                placeholder="A short intro for classmates who might study with you."
                value={form.bio} onChange={set('bio')} />
            </div>

            <fieldset>
              <legend className="field-label">Availability</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {AVAILABILITY.map((slot) => (
                  <label key={slot} className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 accent-primary"
                      checked={form.availability.includes(slot)} onChange={() => toggleSlot(slot)} />
                    {slot}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {status && <p role="status" className="text-muted-foreground">{status}</p>}
            </div>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SkillList title="I can teach" hint="Subjects and skills you can help others with."
            type="teach" mine={mine} catalog={catalog} onAdd={addSkill} onRemove={removeSkill} />
          <SkillList title="I want to learn" hint="What you would like a classmate to help you with."
            type="learn" mine={mine} catalog={catalog} onAdd={addSkill} onRemove={removeSkill} />
        </div>

        <ProfileActivity userId={user.id} />
      </main>
    </div>
  )
}
