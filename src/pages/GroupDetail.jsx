import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'
import { fmtStamp } from '../chat'
import { useGroup, useGroupChat } from '../groups'

const card = 'rounded border border-border/25 bg-card p-6 text-card-foreground'

function GroupChat({ groupId, userId }) {
  const { loading, error, messages, send } = useGroupChat(groupId, true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState('')
  const bottom = useRef(null)

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  async function submit(e) {
    e.preventDefault()
    if (sending || !text.trim()) return
    setSending(true)
    const err = await send(text, userId)
    setProblem(err)
    if (!err) setText('')
    setSending(false)
  }

  return (
    <section className={`${card} flex h-[60vh] flex-col p-0`} aria-labelledby="group-chat-heading">
      <h2 id="group-chat-heading" className="border-b border-border/25 px-5 py-4 text-xl font-semibold">Group chat</h2>
      <ul role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading && <li className="text-muted-foreground">Loading messages…</li>}
        {!loading && messages.length === 0 && <li className="text-muted-foreground">No messages yet. Say hello!</li>}
        {messages.map((m) => {
          const mine = m.sender_id === userId
          return (
            <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {!mine && <p className="text-xs font-semibold">{m.sender?.full_name ?? 'Former member'}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-xs ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{fmtStamp(m.created_at)}</p>
              </div>
            </li>
          )
        })}
        <li ref={bottom} aria-hidden="true" />
      </ul>
      <form onSubmit={submit} className="border-t border-border/25 p-4">
        {(error || problem) && <p role="alert" className="mb-2 text-sm font-semibold text-destructive">{error || problem}</p>}
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="group-message">Message</label>
          <textarea id="group-message" rows={1} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) } }}
            placeholder="Write to the group…" className="field max-h-32 flex-1 resize-none" />
          <button type="submit" className="btn-primary" disabled={sending || !text.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default function GroupDetail() {
  const { user } = useAuth()
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { loading, error, group, members, join, leave, remove } = useGroup(groupId, user.id)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  async function act(fn, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(true)
    setActionError(await fn())
    setBusy(false)
  }

  async function onDelete() {
    if (!window.confirm('Delete this group and its chat for everyone?')) return
    setBusy(true)
    const err = await remove(group.id)
    setBusy(false)
    if (err) setActionError(err)
    else navigate('/groups', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <PageHeader title={group?.name ?? 'Study group'}
        subtitle={group ? `${group.subject || 'General study'} · led by ${group.owner?.full_name ?? 'a student'}` : ''} />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <Link to="/groups" className="inline-block text-sm font-semibold underline">← All groups</Link>
        {(error || actionError) && <p role="alert" className="text-sm font-semibold text-destructive">{error || actionError}</p>}

        {loading ? (
          <p className="text-muted-foreground">Loading group…</p>
        ) : !group ? (
          <p className={`${card} text-muted-foreground`}>This group doesn’t exist any more.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-6">
              <section className={card} aria-labelledby="about-heading">
                <h2 id="about-heading" className="text-xl font-semibold">About</h2>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{group.description || 'No description yet.'}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {!group.isMember && (
                    <button className="btn-primary" disabled={busy || group.full}
                      onClick={() => act(() => join(group.id))}>
                      {group.full ? 'Group is full' : 'Join group'}
                    </button>
                  )}
                  {group.isMember && !group.isOwner && (
                    <button className="btn-outline" disabled={busy}
                      onClick={() => act(() => leave(group.id, user.id), 'Leave this group?')}>Leave group</button>
                  )}
                  {group.isOwner && (
                    <button className="btn-outline" disabled={busy} onClick={onDelete}>Delete group</button>
                  )}
                </div>
              </section>

              {group.isMember ? (
                <GroupChat groupId={group.id} userId={user.id} />
              ) : (
                <p className={`${card} text-muted-foreground`}>Join this group to read and write in its chat.</p>
              )}
            </div>

            <section className={`${card} h-fit`} aria-labelledby="members-heading">
              <h2 id="members-heading" className="text-xl font-semibold">Members ({group.count}/{group.max_members})</h2>
              <ul className="mt-3">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 border-t border-border/25 py-2.5 first:border-t-0">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {m.full_name}{m.id === group.owner_id && ' (leader)'}{m.id === user.id && ' (you)'}
                      </span>
                      {m.course && <span className="text-sm text-muted-foreground">{m.course}</span>}
                    </span>
                    {m.id !== user.id && (
                      <Link to={`/chat/${m.id}`} className="shrink-0 text-sm font-semibold underline">Message</Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
