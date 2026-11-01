import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'
import RateSession from '../components/RateSession'
import Stars from '../components/Stars'
import { useRatings } from '../ratings'
import {
  addDays, fmtDay, fmtRange, fmtTime, sameDay, startOfWeek, startsIn, upcoming, useSessions,
} from '../sessions'

const card = 'rounded border border-border/25 bg-card p-6 text-card-foreground'
const FIRST_HOUR = 7   // calendar shows 7 AM
const LAST_HOUR = 22   // to 10 PM
const ROW = 48         // pixels per hour
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)
const hourLabel = (h) => new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' })

// Put overlapping sessions side by side. Sessions are grouped into clusters that
// overlap each other; only a cluster's sessions share the column width.
function layoutDay(items) {
  const out = []
  let cluster = []
  let lanes = []
  let clusterEnd = 0
  const flush = () => {
    cluster.forEach((p) => out.push({ ...p, lanes: lanes.length }))
    cluster = []
    lanes = []
  }
  for (const s of [...items].sort((a, b) => a.start - b.start)) {
    if (cluster.length && s.start >= clusterEnd) flush()
    let lane = lanes.findIndex((end) => end <= s.start)
    if (lane === -1) lane = lanes.push(s.end) - 1
    else lanes[lane] = s.end
    cluster.push({ s, lane })
    clusterEnd = Math.max(clusterEnd, s.end)
  }
  flush()
  return out
}

function Block({ s, lane, lanes }) {
  const hours = (d) => d.getHours() + d.getMinutes() / 60
  const top = Math.max(hours(s.start) - FIRST_HOUR, 0) * ROW
  const bottom = Math.min(hours(s.end) - FIRST_HOUR, LAST_HOUR - FIRST_HOUR) * ROW
  const pending = s.status === 'pending'
  return (
    <div title={`${s.skill} with ${s.other.full_name}, ${fmtTime(s.start)}–${fmtTime(s.end)}${pending ? ' (pending)' : ''}`}
      style={{ top, height: Math.max(bottom - top, 22), left: `${(lane / lanes) * 100}%`, width: `${100 / lanes}%` }}
      className={`absolute overflow-hidden rounded border px-1.5 py-1 text-xs leading-tight ${
        pending
          ? 'border-dashed border-primary bg-card text-foreground'
          : 'border-primary bg-primary text-primary-foreground'
      }`}>
      <p className="truncate font-semibold">{fmtTime(s.start)}</p>
      <p className="truncate">{s.skill}</p>
      <p className="truncate opacity-80">{s.other.full_name}</p>
    </div>
  )
}

function WeekCalendar({ sessions }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 7)
  const shown = sessions.filter(
    (s) => ['accepted', 'pending'].includes(s.status) && s.start < weekEnd && s.end > weekStart,
  )
  const forDay = (day) => shown.filter((s) => sameDay(s.start, day))
  const today = new Date()

  return (
    <section className={card} aria-labelledby="calendar-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="calendar-heading" className="text-xl font-semibold">
          Week of {weekStart.toLocaleDateString([], { month: 'long', day: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button className="btn-outline px-3" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">←</button>
          <button className="btn-outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>This week</button>
          <button className="btn-outline px-3" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">→</button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Solid blocks are confirmed. Dashed blocks are requests still waiting for an answer.
      </p>

      {/* Grid on wider screens */}
      <div className="mt-5 hidden md:block">
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border/25 pb-2 text-sm">
          <span />
          {days.map((d) => (
            <span key={d} className={`text-center font-semibold ${sameDay(d, today) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {d.toLocaleDateString([], { weekday: 'short' })}
              <span className={`ml-1 inline-block min-w-[1.75rem] rounded-full px-1 ${sameDay(d, today) ? 'bg-primary text-primary-foreground' : ''}`}>
                {d.getDate()}
              </span>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
          <div>
            {HOURS.map((h) => (
              <div key={h} style={{ height: ROW }} className="-translate-y-2 pr-2 text-right text-xs text-muted-foreground">
                {hourLabel(h)}
              </div>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} className={`relative border-l border-border/25 ${sameDay(d, today) ? 'bg-muted' : ''}`}
              style={{ height: ROW * HOURS.length }}>
              {HOURS.map((h) => (
                <div key={h} style={{ top: (h - FIRST_HOUR) * ROW }} className="absolute inset-x-0 border-t border-border/15" />
              ))}
              <div className="absolute inset-x-1 inset-y-0">
                {layoutDay(forDay(d)).map(({ s, lane, lanes }) => <Block key={s.id} s={s} lane={lane} lanes={lanes} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day list on phones */}
      <ol className="mt-5 space-y-3 md:hidden">
        {days.map((d) => (
          <li key={d} className="border-t border-border/25 pt-3">
            <p className={`text-sm font-semibold ${sameDay(d, today) ? 'text-foreground' : 'text-muted-foreground'}`}>
              {fmtDay(d)}{sameDay(d, today) && ' · Today'}
            </p>
            {forDay(d).length === 0 ? (
              <p className="text-sm text-muted-foreground">Free</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {forDay(d).map((s) => (
                  <li key={s.id} className="text-sm">
                    <span className="font-semibold">{fmtTime(s.start)}–{fmtTime(s.end)}</span>{' '}
                    {s.skill} with {s.other.full_name}
                    {s.status === 'pending' && <span className="text-muted-foreground"> (pending)</span>}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

function Details({ s }) {
  return (
    <>
      <p className="font-semibold">{s.skill} with {s.other.full_name}</p>
      <p className="text-sm text-muted-foreground">{fmtRange(s)}{s.location && ` · ${s.location}`}</p>
      {s.note && <p className="mt-1 text-sm text-muted-foreground">“{s.note}”</p>}
    </>
  )
}

const messageLink = (s) => (
  <Link key="msg" to={`/chat/${s.other.id}`} className="btn-outline">Message</Link>
)

function Item({ children, actions }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-t border-border/25 py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">{children}</div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </li>
  )
}

export default function Sessions() {
  const { user } = useAuth()
  const { loading, error, sessions, setStatus } = useSessions(user.id)
  const { given, reload: reloadRatings } = useRatings(user.id)
  const [rating, setRating] = useState(null) // the past session being rated
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  async function act(id, status) {
    if (status === 'cancelled' && !window.confirm('Cancel this session?')) return
    setBusyId(id)
    setActionError(await setStatus(id, status))
    setBusyId(null)
  }
  const button = (s, status, label, primary = false) => (
    <button className={primary ? 'btn-primary py-2' : 'btn-outline'} disabled={busyId === s.id}
      onClick={() => act(s.id, status)}>{label}</button>
  )

  const now = new Date()
  const pending = sessions.filter((s) => s.status === 'pending' && s.start > now)
  const incoming = pending.filter((s) => !s.iSent)
  const sent = pending.filter((s) => s.iSent)
  const next = sessions.filter(upcoming)
  const past = sessions.filter((s) => s.status === 'accepted' && s.end <= now).reverse()

  return (
    <div className="min-h-screen">
      <PageHeader title="Sessions" subtitle="Your tutoring requests and weekly schedule." />

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        {(error || actionError) && (
          <p role="alert" className="text-sm font-semibold text-destructive">{error || actionError}</p>
        )}
        {loading ? (
          <p className="text-muted-foreground">Loading sessions…</p>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className={card} aria-labelledby="incoming-heading">
                <h2 id="incoming-heading" className="text-xl font-semibold">Requests for you</h2>
                {incoming.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">No requests waiting for your answer.</p>
                ) : (
                  <ul className="mt-4">
                    {incoming.map((s) => (
                      <Item key={s.id} actions={<>{button(s, 'accepted', 'Accept', true)}{button(s, 'declined', 'Decline')}</>}>
                        <Details s={s} />
                      </Item>
                    ))}
                  </ul>
                )}
              </section>

              <section className={card} aria-labelledby="sent-heading">
                <h2 id="sent-heading" className="text-xl font-semibold">Requests you sent</h2>
                {sent.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">
                    None pending. <Link to="/browse" className="font-semibold text-foreground underline">Find a classmate</Link> to request a session.
                  </p>
                ) : (
                  <ul className="mt-4">
                    {sent.map((s) => (
                      <Item key={s.id} actions={button(s, 'cancelled', 'Cancel request')}>
                        <Details s={s} />
                        <p className="mt-1 text-sm text-muted-foreground">Waiting for {s.other.full_name.split(' ')[0]}</p>
                      </Item>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <WeekCalendar sessions={sessions} />

            <section className={card} aria-labelledby="upcoming-heading">
              <h2 id="upcoming-heading" className="text-xl font-semibold">Upcoming confirmed sessions</h2>
              {next.length === 0 ? (
                <p className="mt-2 text-muted-foreground">Nothing confirmed yet.</p>
              ) : (
                <ul className="mt-4">
                  {next.map((s) => (
                    <Item key={s.id} actions={<>{messageLink(s)}{button(s, 'cancelled', 'Cancel')}</>}>
                      <Details s={s} />
                      <p className="mt-1 text-sm font-semibold">Starts {startsIn(s.start)}</p>
                    </Item>
                  ))}
                </ul>
              )}
            </section>

            <section className={card} aria-labelledby="past-heading">
              <h2 id="past-heading" className="text-xl font-semibold">Past sessions</h2>
              {past.length === 0 ? (
                <p className="mt-2 text-muted-foreground">Finished sessions will appear here so you can rate them.</p>
              ) : (
                <ul className="mt-4">
                  {past.map((s) => (
                    <Item key={s.id} actions={
                      given.has(s.id) ? (
                        <p className="text-sm text-muted-foreground">You rated <Stars value={given.get(s.id)} /></p>
                      ) : (
                        <button className="btn-outline" onClick={() => setRating(s)}>
                          Rate {s.other.full_name.split(' ')[0]}
                        </button>
                      )}>
                      <Details s={s} />
                    </Item>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
      {rating && <RateSession session={rating} onClose={() => setRating(null)} onDone={reloadRatings} />}
    </div>
  )
}
