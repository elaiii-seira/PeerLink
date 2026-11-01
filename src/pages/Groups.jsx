import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import CreateGroup from '../components/CreateGroup'
import PageHeader from '../components/PageHeader'
import { useGroups } from '../groups'

const card = 'flex flex-col rounded border border-border/25 bg-card p-5 text-card-foreground'

function GroupCard({ group, onJoin, busy }) {
  const { id, name, description, subject, count, max_members, owner, isMember, full } = group
  return (
    <article className={card}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{name}</h3>
        {isMember && (
          <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Joined
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {subject || 'General study'} · led by {owner?.full_name ?? 'a student'}
      </p>
      {description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{description}</p>}
      <p className="mt-auto pt-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{count}/{max_members}</span> members{full && ' · Full'}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to={`/groups/${id}`} className="btn-outline">{isMember ? 'Open' : 'View'}</Link>
        {!isMember && (
          <button type="button" className="btn-primary py-2" disabled={full || busy} onClick={() => onJoin(id)}>
            {full ? 'Full' : 'Join'}
          </button>
        )}
      </div>
    </article>
  )
}

export default function Groups() {
  const { user } = useAuth()
  const { loading, error, groups, join } = useGroups(user.id)
  const [creating, setCreating] = useState(false)
  const [q, setQ] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  async function onJoin(id) {
    setBusy(true)
    setActionError(await join(id))
    setBusy(false)
  }

  const term = q.trim().toLowerCase()
  const shown = groups.filter((g) =>
    (!onlyMine || g.isMember) &&
    (!term || `${g.name} ${g.subject} ${g.description ?? ''}`.toLowerCase().includes(term)))

  return (
    <div className="min-h-screen">
      <PageHeader title="Study groups" subtitle="Join a group to study together, or start your own." />
      <main id="main" className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-48 flex-1">
            <label htmlFor="group-search" className="field-label">Search groups</label>
            <input id="group-search" type="search" className="field" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Name, subject or description" />
          </div>
          <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
            My groups only
          </label>
          <button type="button" className="btn-primary" onClick={() => setCreating(true)}>Create group</button>
        </div>

        {(error || actionError) && (
          <p role="alert" className="mt-4 text-sm font-semibold text-destructive">{error || actionError}</p>
        )}

        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading groups…</p>
        ) : shown.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            {groups.length === 0 ? 'No groups yet. Create the first one!' : 'No groups match your search.'}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((g) => <li key={g.id} className="flex"><div className="flex-1 [&>article]:h-full">
              <GroupCard group={g} onJoin={onJoin} busy={busy} />
            </div></li>)}
          </ul>
        )}
      </main>
      {creating && <CreateGroup userId={user.id} onClose={() => setCreating(false)} />}
    </div>
  )
}
