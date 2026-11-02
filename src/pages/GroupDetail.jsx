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
  const list = useRef(null)

  // Keep the newest message in view by scrolling the list itself, not the whole page
  useEffect(() => { if (list.current) list.current.scrollTop = list.current.scrollHeight }, [messages.length])

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
    <section className="flex h-[75vh] min-h-[30rem] flex-col rounded border border-border/25 bg-card text-card-foreground" aria-labelledby="group-chat-heading">
      <h2 id="group-chat-heading" className="border-b border-border/25 px-6 py-4 text-xl font-semibold">Group chat</h2>
      <ul ref={list} role="log" aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-6 py-5 text-base">
        {loading && <li className="text-muted-foreground">Loading messages…</li>}
        {!loading && messages.length === 0 && <li className="text-muted-foreground">No messages yet. Say hello!</li>}
        {messages.map((m) => {
          const mine = m.sender_id === userId
          return (
            <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-2.5 sm:max-w-[75%] ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {!mine && <p className="text-sm font-semibold">{m.sender?.full_name ?? 'Former member'}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-xs ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{fmtStamp(m.created_at)}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <form onSubmit={submit} className="border-t border-border/25 p-4">
        {(error || problem) && <p role="alert" className="mb-2 text-sm font-semibold text-destructive">{error || problem}</p>}
        <div className="flex items-end gap-3">
          <label className="sr-only" htmlFor="group-message">Message</label>
          <textarea id="group-message" rows={2} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) } }}
            placeholder="Write to the group…"
            className="field max-h-40 min-h-[3.5rem] flex-1 resize-none text-base" />
          <button type="submit" className="btn-primary h-[3.5rem] px-6" disabled={sending || !text.trim()}>
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
  const { loading, error, group, members, requestJoin, cancelRequest, decline, approve, leave, removeMember, remove } =
    useGroup(groupId, user.id)
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
      <main id="main" className="mx-auto max-w-5xl space-y-6 px-6 py-10">
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
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {!group.isMember && !group.myRequest && (
                    <button className="btn-primary" disabled={busy || group.full}
                      onClick={() => act(() => requestJoin(group.id))}>
                      {group.full ? 'Group is full' : 'Request to join'}
                    </button>
                  )}
                  {!group.isMember && group.myRequest && (
                    <>
                      <p role="status" className="font-semibold">Request sent. The group leader will review it.</p>
                      <button className="btn-outline" disabled={busy}
                        onClick={() => act(() => cancelRequest(group.myRequest.id))}>Cancel request</button>
                    </>
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

              {group.isOwner && (
                <section className={card} aria-labelledby="requests-heading">
                  <h2 id="requests-heading" className="text-xl font-semibold">
                    Join requests{group.requests.length > 0 && ` (${group.requests.length})`}
                  </h2>
                  {group.requests.length === 0 ? (
                    <p className="mt-2 text-muted-foreground">No one is waiting to join.</p>
                  ) : (
                    <ul className="mt-3">
                      {group.requests.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border/25 py-3 first:border-t-0">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{r.requester?.full_name ?? 'A student'}</span>
                            {r.requester?.course && <span className="text-sm text-muted-foreground">{r.requester.course}</span>}
                          </span>
                          <span className="flex gap-2">
                            <button className="btn-primary py-2" disabled={busy || group.full}
                              onClick={() => act(() => approve(r))}>
                              {group.full ? 'Group full' : 'Approve'}
                            </button>
                            <button className="btn-outline" disabled={busy} onClick={() => act(() => decline(r.id))}>Decline</button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {group.isMember ? (
                <GroupChat groupId={group.id} userId={user.id} />
              ) : (
                <p className={`${card} text-muted-foreground`}>
                  The group chat is for members only. Ask to join, and the group leader decides.
                </p>
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
                      <span className="flex shrink-0 flex-col items-end gap-1 text-sm font-semibold">
                        {group.isMember && <Link to={`/chat/${m.id}`} className="underline">Message</Link>}
                        {group.isOwner && (
                          <button type="button" className="text-muted-foreground underline" disabled={busy}
                            onClick={() => act(() => removeMember(group.id, m.id), `Remove ${m.full_name} from the group?`)}>
                            Remove
                          </button>
                        )}
                      </span>
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
