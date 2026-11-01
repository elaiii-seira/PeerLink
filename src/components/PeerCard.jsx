import { useState } from 'react'
import { Link } from 'react-router-dom'
import RequestSession from './RequestSession'

const card = 'flex flex-col rounded border border-border/25 bg-card p-5 text-card-foreground'

// Matched skills are filled, the rest are outlined
function Tags({ label, skills, highlight }) {
  const hit = new Set(highlight.map((s) => s.id))
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {skills.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">None listed</p>
      ) : (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <li key={s.id}
              className={`rounded-full border px-2.5 py-0.5 text-sm ${
                hit.has(s.id)
                  ? 'border-primary bg-primary font-semibold text-primary-foreground'
                  : 'border-border/40 text-foreground'
              }`}>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const names = (skills) => skills.map((s) => s.name).join(', ')

export default function PeerCard({ peer, compact = false }) {
  const { full_name, course, year_level, bio, availability, teach, learn,
    canHelpMe, iCanHelp, sharedSlots, mutual } = peer
  const [requesting, setRequesting] = useState(false)

  return (
    <article className={card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold leading-snug">{full_name}</h3>
          <p className="text-sm text-muted-foreground">
            {[course, year_level].filter(Boolean).join(' · ') || 'No course listed'}
          </p>
        </div>
        {mutual && (
          <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Mutual match
          </span>
        )}
      </div>

      {(canHelpMe.length > 0 || iCanHelp.length > 0) && (
        <ul className="mt-3 space-y-1 rounded bg-muted px-3 py-2 text-sm">
          {canHelpMe.length > 0 && (
            <li><span className="font-semibold">Can teach you:</span> {names(canHelpMe)}</li>
          )}
          {iCanHelp.length > 0 && (
            <li><span className="font-semibold">Wants to learn from you:</span> {names(iCanHelp)}</li>
          )}
        </ul>
      )}

      {!compact && bio && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{bio}</p>}

      {!compact && (
        <>
          <Tags label="Can teach" skills={teach} highlight={canHelpMe} />
          <Tags label="Wants to learn" skills={learn} highlight={iCanHelp} />
        </>
      )}

      <p className="mt-auto pt-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Available:</span>{' '}
        {availability?.length ? availability.join(', ') : 'Not set'}
        {sharedSlots.length > 0 && ` (${sharedSlots.length} in common with you)`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className="btn-outline" onClick={() => setRequesting(true)}>
          Request session
        </button>
        <Link to={`/chat/${peer.id}`} className="btn-outline">Message</Link>
      </div>
      {requesting && <RequestSession peer={peer} onClose={() => setRequesting(false)} />}
    </article>
  )
}
