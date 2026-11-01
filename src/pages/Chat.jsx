import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'
import { supabase } from '../supabase'
import {
  ACCEPT, MAX_FILE_MB, attachmentUrl, checkFile, fmtStamp, useConversations, useThread,
} from '../chat'

const card = 'rounded border border-border/25 bg-card text-card-foreground'

function Inbox({ userId, activeId }) {
  const { loading, error, chats } = useConversations(userId)
  return (
    <section className={`${card} p-4`} aria-labelledby="chats-heading">
      <h2 id="chats-heading" className="px-2 pb-2 text-xl font-semibold">Chats</h2>
      {error && <p role="alert" className="px-2 text-sm font-semibold text-destructive">{error}</p>}
      {loading ? (
        <p className="px-2 text-muted-foreground">Loading…</p>
      ) : chats.length === 0 ? (
        <p className="px-2 text-sm text-muted-foreground">
          No chats yet. Press Message on a classmate’s card in{' '}
          <Link to="/browse" className="font-semibold text-foreground underline">Browse</Link>.
        </p>
      ) : (
        <ul>
          {chats.map(({ other, last }) => (
            <li key={other.id}>
              <Link to={`/chat/${other.id}`}
                aria-current={other.id === activeId ? 'page' : undefined}
                className={`block rounded px-2 py-2.5 hover:bg-muted ${other.id === activeId ? 'bg-muted' : ''}`}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-semibold">{other.full_name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtStamp(last.created_at)}</span>
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                  {last.sender_id === userId && 'You: '}
                  {last.body || `Sent ${last.file_name}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Images show inline, other files are a download link. The bucket is private,
// so each file is opened through a temporary signed link.
function Attachment({ message, mine }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let active = true
    const isImage = message.file_type?.startsWith('image/')
    // Images open in the browser; other files download with their original name
    attachmentUrl(message.file_path, isImage ? undefined : message.file_name).then((u) => active && setUrl(u))
    return () => { active = false }
  }, [message.file_path, message.file_type, message.file_name])

  if (!url) return <p className="text-sm opacity-80">Loading file…</p>
  if (message.file_type?.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img src={url} alt={message.file_name} className="max-h-56 rounded" />
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`text-sm font-semibold underline ${mine ? 'text-primary-foreground' : 'text-foreground'}`}>
      {message.file_name}
    </a>
  )
}

function Bubble({ message, mine }) {
  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] space-y-2 rounded-lg px-3 py-2 ${
        mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
        {message.file_path && <Attachment message={message} mine={mine} />}
        {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
        <p className={`text-xs ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {fmtStamp(message.created_at)}
        </p>
      </div>
    </li>
  )
}

function Thread({ userId, partnerId }) {
  const { loading, error, messages, send } = useThread(userId, partnerId)
  const [partner, setPartner] = useState(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState('')
  const fileInput = useRef(null)
  const bottom = useRef(null)

  useEffect(() => {
    setPartner(null)
    supabase.from('profiles').select('id, full_name, course').eq('id', partnerId).maybeSingle()
      .then(({ data }) => setPartner(data ?? { id: partnerId, full_name: 'Unknown student' }))
  }, [partnerId])

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  function pick(e) {
    const chosen = e.target.files[0]
    if (!chosen) return
    const bad = checkFile(chosen)
    setProblem(bad)
    setFile(bad ? null : chosen)
    if (bad) e.target.value = ''
  }

  function clearFile() {
    setFile(null)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function submit(e) {
    e.preventDefault()
    if (sending || (!text.trim() && !file)) return
    setSending(true)
    const err = await send(text, file)
    setProblem(err)
    if (!err) { setText(''); clearFile() }
    setSending(false)
  }

  return (
    <section className={`${card} flex h-[70vh] flex-col`} aria-label="Conversation">
      <div className="border-b border-border/25 px-5 py-4">
        <h2 className="text-xl font-semibold">{partner?.full_name ?? 'Loading…'}</h2>
        {partner?.course && <p className="text-sm text-muted-foreground">{partner.course}</p>}
      </div>

      <ul role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading && <li className="text-muted-foreground">Loading messages…</li>}
        {!loading && messages.length === 0 && (
          <li className="text-muted-foreground">No messages yet. Say hello!</li>
        )}
        {messages.map((m) => <Bubble key={m.id} message={m} mine={m.sender_id === userId} />)}
        <li ref={bottom} aria-hidden="true" />
      </ul>

      <form onSubmit={submit} className="border-t border-border/25 p-4">
        {(error || problem) && (
          <p role="alert" className="mb-2 text-sm font-semibold text-destructive">{error || problem}</p>
        )}
        {file && (
          <p className="mb-2 flex items-center gap-2 text-sm">
            <span className="truncate font-semibold">{file.name}</span>
            <button type="button" onClick={clearFile} className="text-muted-foreground underline">Remove</button>
          </p>
        )}
        <div className="flex items-end gap-2">
          <label className="btn-outline cursor-pointer" title={`Attach a file (up to ${MAX_FILE_MB} MB)`}>
            Attach
            <input ref={fileInput} type="file" accept={ACCEPT} onChange={pick} className="sr-only" />
          </label>
          <label className="sr-only" htmlFor="message-text">Message</label>
          <textarea id="message-text" rows={1} maxLength={2000} value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) }
            }}
            placeholder="Write a message…" className="field max-h-32 flex-1 resize-none" />
          <button type="submit" className="btn-primary" disabled={sending || (!text.trim() && !file)}>
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default function Chat() {
  const { user } = useAuth()
  const { partnerId } = useParams()
  const navigate = useNavigate()

  // Chatting with yourself isn't allowed
  useEffect(() => {
    if (partnerId === user.id) navigate('/chat', { replace: true })
  }, [partnerId, user.id, navigate])

  return (
    <div className="min-h-screen">
      <PageHeader title="Chat" subtitle="Message classmates to plan sessions and share notes." />
      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-[18rem_1fr]">
        <div className={partnerId ? 'hidden md:block' : ''}>
          <Inbox userId={user.id} activeId={partnerId} />
        </div>
        <div className={partnerId ? '' : 'hidden md:block'}>
          {partnerId && partnerId !== user.id ? (
            <>
              <Link to="/chat" className="mb-3 inline-block text-sm font-semibold underline md:hidden">
                ← All chats
              </Link>
              <Thread key={partnerId} userId={user.id} partnerId={partnerId} />
            </>
          ) : (
            <p className={`${card} p-6 text-muted-foreground`}>Choose a chat to start messaging.</p>
          )}
        </div>
      </main>
    </div>
  )
}
