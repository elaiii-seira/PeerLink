import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Two links to profiles (requester and partner), so each needs its foreign key name
const SELECT = `id, starts_at, ends_at, status, location, note, requester_id, partner_id,
  requester:profiles!sessions_requester_id_fkey(id, full_name, course),
  partner:profiles!sessions_partner_id_fkey(id, full_name, course),
  skills(name)`

// Add fields the pages need: who the other student is, and Date objects
function shape(row, userId) {
  const iSent = row.requester_id === userId
  return {
    ...row,
    iSent,
    other: iSent ? row.partner : row.requester,
    skill: row.skills?.name ?? 'General study',
    start: new Date(row.starts_at),
    end: new Date(row.ends_at),
  }
}

// All of my sessions (row level security only returns ones I'm part of)
export function useSessions(userId) {
  const [state, setState] = useState({ loading: true, error: '', sessions: [] })

  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('sessions').select(SELECT).order('starts_at')
    if (error) return setState({ loading: false, error: error.message, sessions: [] })
    setState({ loading: false, error: '', sessions: data.map((r) => shape(r, userId)) })
  }, [userId])

  useEffect(() => { reload() }, [reload])

  // Accept, decline, or cancel. The database checks who is allowed to do what.
  const setStatus = async (id, status) => {
    const { error } = await supabase.from('sessions').update({ status }).eq('id', id)
    if (error) return error.message
    await reload()
    return ''
  }

  return { ...state, reload, setStatus }
}

export async function requestSession({ partnerId, skillId, start, minutes, location, note }) {
  const end = new Date(start.getTime() + minutes * 60_000)
  const { error } = await supabase.from('sessions').insert({
    partner_id: partnerId,
    skill_id: skillId ? Number(skillId) : null,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    location: location.trim() || null,
    note: note.trim() || null,
  })
  return error?.message ?? ''
}

// ---- Date helpers (all in the student's local time) ----

export const upcoming = (s) => s.status === 'accepted' && s.end > new Date()

export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // Monday
  return d
}

export const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export const sameDay = (a, b) => a.toDateString() === b.toDateString()

export const fmtTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
export const fmtDay = (d) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
export const fmtRange = (s) => `${fmtDay(s.start)}, ${fmtTime(s.start)}–${fmtTime(s.end)}`

// "in 3 hours", "tomorrow", "in 4 days": used as an in-app reminder
export function startsIn(date) {
  const mins = Math.round((date - new Date()) / 60_000)
  if (mins <= 0) return 'happening now'
  if (mins < 60) return `in ${mins} min`
  if (mins < 24 * 60) return `in ${Math.round(mins / 60)} h`
  const days = Math.round(mins / (24 * 60))
  return days === 1 ? 'tomorrow' : `in ${days} days`
}
