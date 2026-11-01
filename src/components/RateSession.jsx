import { useEffect, useRef, useState } from 'react'
import { rateSession } from '../ratings'

const LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent']

export default function RateSession({ session, onClose, onDone }) {
  const dialog = useRef(null)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { dialog.current?.showModal() }, [])

  async function submit(e) {
    e.preventDefault()
    if (!stars) return setError('Choose a star rating first.')
    setBusy(true)
    setError('')
    const message = await rateSession({ sessionId: session.id, rateeId: session.other.id, stars, comment })
    setBusy(false)
    if (message) return setError(message)
    await onDone()
    dialog.current.close()
  }

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="rate-title"
      className="w-[min(28rem,calc(100%-2rem))] rounded bg-card p-0 text-card-foreground backdrop:bg-foreground/50">
      <form onSubmit={submit} className="space-y-4 p-6">
        <div>
          <h2 id="rate-title" className="text-2xl font-semibold">Rate your session</h2>
          <p className="mt-1 text-muted-foreground">{session.skill} with {session.other.full_name}</p>
        </div>

        <fieldset>
          <legend className="field-label">How did it go?</legend>
          <div className="flex flex-wrap gap-2">
            {LABELS.map((label, i) => {
              const n = i + 1
              return (
                <label key={n} className={`cursor-pointer rounded border px-3 py-2 text-sm font-semibold focus-within:ring-2 focus-within:ring-ring ${
                  stars === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border/40 hover:bg-muted'}`}>
                  <input type="radio" name="stars" value={n} checked={stars === n}
                    onChange={() => setStars(n)} className="sr-only" />
                  {n} ★ {label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="rate-comment" className="field-label">Comment (optional)</label>
          <textarea id="rate-comment" rows={3} maxLength={300} className="field" value={comment}
            onChange={(e) => setComment(e.target.value)} placeholder="What went well? Ratings are visible on their profile." />
        </div>

        <p className="text-sm text-muted-foreground">A rating can’t be changed after you send it.</p>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Sending…' : 'Send rating'}</button>
          <button type="button" className="btn-outline" onClick={() => dialog.current.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  )
}
