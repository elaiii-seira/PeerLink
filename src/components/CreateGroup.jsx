import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGroup } from '../groups'
import { supabase } from '../supabase'

const SIZES = [3, 5, 8, 10, 15, 20]

export default function CreateGroup({ userId, onClose }) {
  const navigate = useNavigate()
  const dialog = useRef(null)
  const [skills, setSkills] = useState([])
  const [form, setForm] = useState({ name: '', description: '', skillId: '', maxMembers: 10 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    dialog.current?.showModal()
    supabase.from('skills').select('id, name').order('name').then(({ data }) => setSkills(data ?? []))
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: message, id } = await createGroup({ ...form, userId })
    setBusy(false)
    if (message) return setError(message)
    navigate(`/groups/${id}`)
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="create-group-title"
      className="w-[min(32rem,calc(100%-2rem))] rounded bg-card p-0 text-card-foreground backdrop:bg-foreground/50">
      <form onSubmit={submit} className="space-y-4 p-6">
        <h2 id="create-group-title" className="text-2xl font-semibold">Create a study group</h2>
        <div>
          <label htmlFor="cg-name" className="field-label">Group name</label>
          <input id="cg-name" required minLength={3} maxLength={60} className="field" value={form.name}
            onChange={set('name')} placeholder="e.g. Calculus 2 review" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cg-skill" className="field-label">Subject</label>
            <select id="cg-skill" className="field" value={form.skillId} onChange={set('skillId')}>
              <option value="">General study</option>
              {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cg-size" className="field-label">Max members</label>
            <select id="cg-size" className="field" value={form.maxMembers} onChange={set('maxMembers')}>
              {SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="cg-desc" className="field-label">What is it for? (optional)</label>
          <textarea id="cg-desc" rows={3} maxLength={500} className="field" value={form.description}
            onChange={set('description')} placeholder="When you meet, what you'll cover" />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create group'}</button>
          <button type="button" className="btn-outline" onClick={() => dialog.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  )
}
