import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// { avg, count } for a list of star values
export function summarize(stars) {
  const count = stars.length
  return { count, avg: count ? stars.reduce((a, b) => a + b, 0) / count : 0 }
}

// Ratings other students gave me, and the ones I gave (to know which sessions I've already rated)
export function useRatings(userId) {
  const [state, setState] = useState({ loading: true, error: '', received: [], given: new Map() })

  const reload = useCallback(async () => {
    const [got, gave] = await Promise.all([
      supabase.from('ratings')
        .select(`id, created_at, stars, comment,
          rater:profiles!ratings_rater_id_fkey(full_name),
          sessions(skills(name))`)
        .eq('ratee_id', userId)
        .order('created_at', { ascending: false }),
      supabase.from('ratings').select('session_id, stars').eq('rater_id', userId),
    ])
    const error = got.error?.message || gave.error?.message || ''
    setState({
      loading: false,
      error,
      received: got.data ?? [],
      given: new Map((gave.data ?? []).map((r) => [r.session_id, r.stars])),
    })
  }, [userId])

  useEffect(() => { reload() }, [reload])
  return { ...state, reload, summary: summarize(state.received.map((r) => r.stars)) }
}

export async function rateSession({ sessionId, rateeId, stars, comment }) {
  const { error } = await supabase.from('ratings').insert({
    session_id: sessionId,
    ratee_id: rateeId,
    stars: Number(stars),
    comment: comment.trim() || null,
  })
  return error?.message ?? ''
}
