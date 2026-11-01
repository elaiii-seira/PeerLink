import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

const GROUP_FIELDS = `id, created_at, owner_id, name, description, max_members,
  owner:profiles!study_groups_owner_id_fkey(id, full_name),
  skills(name),
  group_members(user_id)`

// Add the fields the pages need: member count, whether I'm in, whether it's full
function shape(row, userId) {
  const ids = row.group_members.map((m) => m.user_id)
  return {
    ...row,
    subject: row.skills?.name ?? '',
    count: ids.length,
    isMember: ids.includes(userId),
    isOwner: row.owner_id === userId,
    full: ids.length >= row.max_members,
  }
}

// Join, leave and delete share the same shape: do it, reload, return an error message or ''
function useActions(reload) {
  const run = async (query) => {
    const { error } = await query
    if (error) return error.message
    await reload()
    return ''
  }
  return {
    join: (groupId) => run(supabase.from('group_members').insert({ group_id: groupId })),
    leave: (groupId, userId) =>
      run(supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)),
    remove: (groupId) => run(supabase.from('study_groups').delete().eq('id', groupId)),
  }
}

export function useGroups(userId) {
  const [state, setState] = useState({ loading: true, error: '', groups: [] })

  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('study_groups').select(GROUP_FIELDS).order('created_at', { ascending: false })
    if (error) return setState({ loading: false, error: error.message, groups: [] })
    setState({ loading: false, error: '', groups: data.map((g) => shape(g, userId)) })
  }, [userId])

  useEffect(() => { reload() }, [reload])
  return { ...state, reload, ...useActions(reload) }
}

// One group plus its member list
export function useGroup(groupId, userId) {
  const [state, setState] = useState({ loading: true, error: '', group: null, members: [] })

  const reload = useCallback(async () => {
    const [g, m] = await Promise.all([
      supabase.from('study_groups').select(GROUP_FIELDS).eq('id', groupId).maybeSingle(),
      supabase.from('group_members')
        .select('user_id, joined_at, profiles!group_members_user_id_fkey(id, full_name, course)')
        .eq('group_id', groupId).order('joined_at'),
    ])
    const error = g.error?.message || m.error?.message || ''
    setState({
      loading: false,
      error,
      group: g.data ? shape(g.data, userId) : null,
      members: (m.data ?? []).map((r) => r.profiles).filter(Boolean),
    })
  }, [groupId, userId])

  useEffect(() => {
    setState({ loading: true, error: '', group: null, members: [] })
    reload()
  }, [reload])
  return { ...state, reload, ...useActions(reload) }
}

export async function createGroup({ name, description, skillId, maxMembers, userId }) {
  const made = await supabase.from('study_groups').insert({
    name: name.trim(),
    description: description.trim() || null,
    skill_id: skillId ? Number(skillId) : null,
    max_members: Number(maxMembers),
  }).select('id').single()
  if (made.error) return { error: made.error.message }
  // The creator joins their own group straight away
  const joined = await supabase.from('group_members').insert({ group_id: made.data.id, user_id: userId })
  return { error: joined.error?.message ?? '', id: made.data.id }
}

const MESSAGE = 'id, created_at, sender_id, body, sender:profiles!group_messages_sender_id_fkey(full_name)'

// The group's chat, kept current through Supabase Realtime (members only, enforced by the database)
export function useGroupChat(groupId, enabled) {
  const [state, setState] = useState({ loading: true, error: '', messages: [] })

  useEffect(() => {
    if (!enabled) return
    let active = true
    const add = (m) =>
      active && setState((s) => (s.messages.some((x) => x.id === m.id) ? s : { ...s, messages: [...s.messages, m] }))

    setState({ loading: true, error: '', messages: [] })
    supabase.from('group_messages').select(MESSAGE).eq('group_id', groupId).order('created_at')
      .then(({ data, error }) => active && setState({ loading: false, error: error?.message ?? '', messages: data ?? [] }))

    const channel = supabase
      .channel(`group-${groupId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` },
        async ({ new: row }) => {
          // The event has no sender name, so fetch the finished row
          const { data } = await supabase.from('group_messages').select(MESSAGE).eq('id', row.id).single()
          if (data) add(data)
        })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [groupId, enabled])

  const send = useCallback(async (text, userId) => {
    const { data, error } = await supabase.from('group_messages')
      .insert({ group_id: groupId, body: text.trim() }).select(MESSAGE).single()
    if (error) return error.message
    setState((s) => (s.messages.some((x) => x.id === data.id) ? s : { ...s, messages: [...s.messages, data] }))
    return ''
  }, [groupId])

  return { ...state, send }
}
