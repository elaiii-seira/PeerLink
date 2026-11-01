import Stars, { RatingSummary } from './Stars'
import { useRatings } from '../ratings'
import { fmtRange, useSessions } from '../sessions'

const card = 'rounded border border-border/25 bg-card p-6 text-card-foreground'

// Ratings I received and the sessions I've completed, shown on my profile
export default function ProfileActivity({ userId }) {
  const { received, summary, error: ratingsError } = useRatings(userId)
  const { sessions, error: sessionsError } = useSessions(userId)
  const done = sessions.filter((s) => s.status === 'accepted' && s.end <= new Date()).reverse()
  const error = ratingsError || sessionsError

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card} aria-labelledby="ratings-heading">
        <h2 id="ratings-heading" className="text-xl font-semibold">Ratings received</h2>
        <p className="mt-2"><RatingSummary avg={summary.avg} count={summary.count} /></p>
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
        {received.length > 0 && (
          <ul className="mt-4">
            {received.map((r) => (
              <li key={r.id} className="border-t border-border/25 py-3 first:border-t-0 first:pt-0">
                <p className="flex flex-wrap items-center gap-x-2">
                  <Stars value={r.stars} />
                  <span className="text-sm text-muted-foreground">
                    {r.rater?.full_name?.split(' ')[0] ?? 'A student'}
                    {r.sessions?.skills?.name && ` · ${r.sessions.skills.name}`}
                  </span>
                </p>
                {r.comment && <p className="mt-1 text-sm">“{r.comment}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card} aria-labelledby="history-heading">
        <h2 id="history-heading" className="text-xl font-semibold">Session history</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {done.length} completed {done.length === 1 ? 'session' : 'sessions'}
        </p>
        {done.length === 0 ? (
          <p className="mt-3 text-muted-foreground">Finished sessions will show up here.</p>
        ) : (
          <ul className="mt-4">
            {done.map((s) => (
              <li key={s.id} className="border-t border-border/25 py-3 first:border-t-0 first:pt-0">
                <p className="font-semibold">{s.skill} with {s.other.full_name}</p>
                <p className="text-sm text-muted-foreground">{fmtRange(s)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
