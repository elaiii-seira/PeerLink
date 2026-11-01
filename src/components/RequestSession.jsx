import { useEffect, useRef, useState } from 'react'
import { requestSession } from '../sessions'

const DURATIONS = [30, 60, 90, 120]
const pad = (n) => String(n).padStart(2, '0')
const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function RequestSession({ peer, onClose }) {
  const tomorrow = new Date(Date.now() + 86_400_000)
  // Skills worth suggesting: what they can teach me first, then what I can teach them
  const skills = [...peer.canHelpMe, ...peer.iCanHelp, ...peer.teach, ...peer.learn]
    .filter((s, i, all) => all.findIndex((x) => x.id === s.id) === i)

  const [form, setForm] = useState({
    skillId: skills[0]?.id ?? '', date: toDateInput(tomorrow), time: '15:00',
    minutes: 60, location: '', note: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const dialog = useRef(null)

  // Native <dialog>: traps focus and closes on Escape
  useEffect(() => {
    dialog.current?.showModal()
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const start = new Date(`${form.date}T${form.time}`)
    if (start <= new Date()) return setError('Pick a time in the future.')
    setBusy(true)
    setError('')
    const message = await requestSession({ partnerId: peer.id, ...form, start, minutes: Number(form.minutes) })
    setBusy(false)
    if (message) return setError(message)
    setSent(true)
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="request-title"
      className="w-[min(32rem,calc(100%-2rem))] rounded bg-card p-0 text-card-foreground backdrop:bg-foreground/50">
      <div className="p-6">
        <h2 id="request-title" className="text-2xl font-semibold">Request a session</h2>
        <p className="mt-1 text-muted-foreground">with {peer.full_name}</p>

        {sent ? (
          <div className="mt-5">
            <p role="status">
              Request sent. {peer.full_name.split(' ')[0]} can accept or decline it on their Sessions page.
            </p>
            <button type="button" className="btn-primary mt-5" onClick={() => dialog.current.close()}>Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="rs-skill" className="field-label">Topic</label>
              <select id="rs-skill" className="field" value={form.skillId} onChange={set('skillId')}>
                {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                <option value="">General study</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="rs-date" className="field-label">Date</label>
                <input id="rs-date" type="date" required className="field" min={toDateInput(new Date())}
                  value={form.date} onChange={set('date')} />
              </div>
              <div>
                <label htmlFor="rs-time" className="field-label">Start time</label>
                <input id="rs-time" type="time" required className="field" value={form.time} onChange={set('time')} />
              </div>
              <div>
                <label htmlFor="rs-minutes" className="field-label">Length</label>
                <select id="rs-minutes" className="field" value={form.minutes} onChange={set('minutes')}>
                  {DURATIONS.map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="rs-location" className="field-label">Where</label>
              <input id="rs-location" className="field" maxLength={120} value={form.location} onChange={set('location')}
                placeholder="Library, room number, or a Google Meet link" />
            </div>
            <div>
              <label htmlFor="rs-note" className="field-label">Note (optional)</label>
              <textarea id="rs-note" rows={2} maxLength={300} className="field" value={form.note} onChange={set('note')}
                placeholder="What you'd like to cover" />
            </div>
            {peer.availability?.length > 0 && (
              <p className="text-sm text-muted-foreground">Usually available: {peer.availability.join(', ')}</p>
            )}
            {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Send request'}</button>
              <button type="button" className="btn-outline" onClick={() => dialog.current.close()}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
