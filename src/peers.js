import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Group each user's tags into { teach: [...skills], learn: [...skills] }
function groupTags(rows) {
  const byUser = {}
  for (const r of rows) {
    if (!r.skills) continue
    const entry = (byUser[r.user_id] ??= { teach: [], learn: [] })
    entry[r.type]?.push(r.skills)
  }
  return byUser
}

const overlap = (skills, ids) => skills.filter((s) => ids.has(s.id))

// Score one peer against me.
// canHelpMe:  they teach something I want to learn
// iCanHelp:   they want to learn something I teach
// Mutual matches (both directions) always rank above one-way matches.
export function scorePeer(peer, me) {
  const myTeach = new Set(me.teach.map((s) => s.id))
  const myLearn = new Set(me.learn.map((s) => s.id))
  const canHelpMe = overlap(peer.teach, myLearn)
  const iCanHelp = overlap(peer.learn, myTeach)
  const sharedSlots = (peer.availability ?? []).filter((a) => (me.availability ?? []).includes(a))
  const mutual = canHelpMe.length > 0 && iCanHelp.length > 0
  const score =
    (mutual ? 100 : 0) + (canHelpMe.length + iCanHelp.length) * 10 + sharedSlots.length
  return { ...peer, canHelpMe, iCanHelp, sharedSlots, mutual, score }
}

export const isMatch = (p) => p.canHelpMe.length + p.iCanHelp.length > 0

export const byBestMatch = (a, b) =>
  b.score - a.score || (a.full_name ?? '').localeCompare(b.full_name ?? '')

// Loads every profile and tag once, then scores everyone against the signed-in user.
export function usePeers(userId) {
  const [state, setState] = useState({
    loading: true, error: '', me: null, peers: [], catalog: [],
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [profiles, tags, catalog] = await Promise.all([
        supabase.from('profiles').select('id, full_name, course, year_level, bio, availability'),
        supabase.from('user_skills').select('user_id, type, skills(id, name, category)'),
        supabase.from('skills').select('id, name, category').order('name'),
      ])
      if (cancelled) return
      const err = profiles.error || tags.error || catalog.error
      if (err) return setState((s) => ({ ...s, loading: false, error: err.message }))

      const tagMap = groupTags(tags.data)
      const withTags = profiles.data.map((p) => ({
        ...p,
        teach: tagMap[p.id]?.teach ?? [],
        learn: tagMap[p.id]?.learn ?? [],
      }))
      const me = withTags.find((p) => p.id === userId) ?? { teach: [], learn: [], availability: [] }
      const peers = withTags
        .filter((p) => p.id !== userId && p.full_name)
        .map((p) => scorePeer(p, me))
        .sort(byBestMatch)

      setState({ loading: false, error: '', me, peers, catalog: catalog.data })
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return state
}
