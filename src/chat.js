import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export const MAX_FILE_MB = 5
export const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.docx,.pptx'
const ALLOWED = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const FIELDS = 'id, created_at, sender_id, recipient_id, body, file_path, file_name, file_type'

// Why a file can't be sent, or '' if it's fine (the bucket enforces the same rules)
export function checkFile(file) {
  if (!ALLOWED.includes(file.type)) return 'Only images, PDF, Word, PowerPoint and text files can be sent.'
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Files must be ${MAX_FILE_MB} MB or smaller.`
  return ''
}

// Messages between me and one classmate, kept up to date through Supabase Realtime
export function useThread(userId, partnerId) {
  const [state, setState] = useState({ loading: true, error: '', messages: [] })

  useEffect(() => {
    let active = true
    const inThread = (m) =>
      (m.sender_id === userId && m.recipient_id === partnerId) ||
      (m.sender_id === partnerId && m.recipient_id === userId)
    const add = (m) =>
      setState((s) => (s.messages.some((x) => x.id === m.id) ? s : { ...s, messages: [...s.messages, m] }))

    setState({ loading: true, error: '', messages: [] })
    supabase
      .from('messages')
      .select(FIELDS)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order('created_at')
      .then(({ data, error }) => {
        if (!active) return
        setState({ loading: false, error: error?.message ?? '', messages: data ?? [] })
      })

    // Row level security means this only ever delivers messages I'm allowed to read
    const channel = supabase
      .channel(`thread-${userId}-${partnerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        ({ new: m }) => inThread(m) && add(m))
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId, partnerId])

  // Send text, a file, or both. Returns an error message or ''.
  const send = useCallback(async (text, file) => {
    const row = { recipient_id: partnerId, body: text.trim() || null }
    if (file) {
      const problem = checkFile(file)
      if (problem) return problem
      const safe = file.name.replace(/[^\w.-]+/g, '_')
      const path = `${userId}/${crypto.randomUUID()}-${safe}`
      const up = await supabase.storage.from('chat-attachments').upload(path, file)
      if (up.error) return up.error.message
      Object.assign(row, { file_path: path, file_name: file.name, file_type: file.type })
    }
    const { data, error } = await supabase.from('messages').insert(row).select(FIELDS).single()
    if (error) return error.message
    setState((s) => (s.messages.some((x) => x.id === data.id) ? s : { ...s, messages: [...s.messages, data] }))
    return ''
  }, [userId, partnerId])

  return { ...state, send }
}

// One entry per classmate I've chatted with, newest conversation first
export function useConversations(userId) {
  const [state, setState] = useState({ loading: true, error: '', chats: [] })

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`${FIELDS},
        sender:profiles!messages_sender_id_fkey(id, full_name, course),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, course)`)
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) return setState({ loading: false, error: error.message, chats: [] })

    const seen = new Map()
    for (const m of data) {
      const other = m.sender_id === userId ? m.recipient : m.sender
      if (!seen.has(other.id)) seen.set(other.id, { other, last: m })
    }
    setState({ loading: false, error: '', chats: [...seen.values()] })
  }, [userId])

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`inbox-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId, load])

  return state
}

// A temporary link to open a private attachment
export async function attachmentUrl(path) {
  const { data } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 3600)
  return data?.signedUrl ?? ''
}

export const fmtStamp = (iso) => {
  const d = new Date(iso)
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}
