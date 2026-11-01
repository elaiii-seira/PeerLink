import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import PageHeader from '../components/PageHeader'
import PeerCard from '../components/PeerCard'
import { AVAILABILITY, YEAR_LEVELS } from '../options'
import { isMatch, usePeers } from '../peers'

const card = 'rounded border border-border/25 bg-card p-6 text-card-foreground'
const GROUPS = { academic: 'Academic subjects', practical: 'Practical skills' }
const FILTER_KEYS = ['q', 'role', 'skill', 'category', 'slot', 'course', 'year', 'sort']

// Which of a peer's tags count, based on the "Looking for someone who" filter
const tagsFor = (p, role) =>
  role === 'teach' ? p.teach : role === 'learn' ? p.learn : [...p.teach, ...p.learn]

export default function Browse() {
  const { user } = useAuth()
  const { loading, error, me, peers, catalog } = usePeers(user.id)
  const [params, setParams] = useSearchParams()
  const f = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? '']))
  const role = f.role || 'teach'

  const setFilter = (key) => (e) => {
    const next = new URLSearchParams(params)
    e.target.value ? next.set(key, e.target.value) : next.delete(key)
    setParams(next, { replace: true })
  }
  const clearAll = () => setParams({}, { replace: true })
  // "role" and "sort" only change how results are read, so they don't count as filters
  const hasFilters = FILTER_KEYS.some((k) => k !== 'sort' && k !== 'role' && f[k])

  const courses = useMemo(
    () => [...new Set(peers.map((p) => p.course?.trim()).filter(Boolean))].sort(),
    [peers],
  )

  const results = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    const list = peers.filter((p) => {
      const tags = tagsFor(p, role)
      if (q) {
        const haystack = [p.full_name, p.course, p.bio, ...p.teach.map((s) => s.name),
          ...p.learn.map((s) => s.name)].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (f.skill && !tags.some((s) => String(s.id) === f.skill)) return false
      if (f.category && !tags.some((s) => s.category === f.category)) return false
      if (f.slot && !(p.availability ?? []).includes(f.slot)) return false
      if (f.course && p.course?.trim() !== f.course) return false
      if (f.year && p.year_level !== f.year) return false
      return true
    })
    if (f.sort === 'name') return [...list].sort((a, b) => a.full_name.localeCompare(b.full_name))
    return list // already sorted by best match
  }, [peers, f.q, f.skill, f.category, f.slot, f.course, f.year, f.sort, role])

  const suggested = peers.filter(isMatch).slice(0, 3)
  const hasTags = me && me.teach.length + me.learn.length > 0

  return (
    <div className="min-h-screen">
      <PageHeader title="Find classmates"
        subtitle="Search by subject or skill, or start with the people who match your tags." />

      <main id="main" className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}

        {!loading && !hasFilters && (
          <section aria-labelledby="suggested-heading">
            <h2 id="suggested-heading" className="text-2xl font-semibold">Suggested for you</h2>
            {!hasTags ? (
              <p className="mt-2 text-muted-foreground">
                <Link to="/profile" className="font-semibold text-foreground underline">Add skills to your profile</Link>{' '}
                to get matched with classmates.
              </p>
            ) : suggested.length === 0 ? (
              <p className="mt-2 text-muted-foreground">
                No one matches your tags yet. Try adding more skills, or browse everyone below.
              </p>
            ) : (
              <>
                <p className="mt-1 text-muted-foreground">
                  Ranked by overlap between your tags and theirs. Mutual matches come first.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {suggested.map((p) => <PeerCard key={p.id} peer={p} compact />)}
                </div>
              </>
            )}
          </section>
        )}

        <section className={card} aria-label="Search and filters">
          <label htmlFor="q" className="field-label">Search</label>
          <input id="q" type="search" className="field" value={f.q} onChange={setFilter('q')}
            placeholder="Name, course, or skill (e.g. Calculus, Canva)" />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="role" className="field-label">Looking for someone who</label>
              <select id="role" className="field" value={role} onChange={setFilter('role')}>
                <option value="teach">can teach</option>
                <option value="learn">wants to learn</option>
                <option value="any">teaches or learns</option>
              </select>
            </div>
            <div>
              <label htmlFor="skill" className="field-label">Subject or skill</label>
              <select id="skill" className="field" value={f.skill} onChange={setFilter('skill')}>
                <option value="">Any</option>
                {Object.entries(GROUPS).map(([key, label]) => (
                  <optgroup key={key} label={label}>
                    {catalog.filter((s) => s.category === key).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="category" className="field-label">Category</label>
              <select id="category" className="field" value={f.category} onChange={setFilter('category')}>
                <option value="">Any</option>
                <option value="academic">Academic</option>
                <option value="practical">Practical</option>
              </select>
            </div>
            <div>
              <label htmlFor="slot" className="field-label">Availability</label>
              <select id="slot" className="field" value={f.slot} onChange={setFilter('slot')}>
                <option value="">Any time</option>
                {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="course" className="field-label">Course</label>
              <select id="course" className="field" value={f.course} onChange={setFilter('course')}>
                <option value="">Any</option>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="field-label">Year level</label>
              <select id="year" className="field" value={f.year} onChange={setFilter('year')}>
                <option value="">Any</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="field-label">Sort by</label>
              <select id="sort" className="field" value={f.sort} onChange={setFilter('sort')}>
                <option value="">Best match</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" className="btn-outline w-full" onClick={clearAll} disabled={!hasFilters}>
                Clear filters
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="results-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="results-heading" className="text-2xl font-semibold">
              {hasFilters ? 'Results' : 'All classmates'}
            </h2>
            {!loading && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {results.length} {results.length === 1 ? 'student' : 'students'}
              </p>
            )}
          </div>

          {loading ? (
            <p className="mt-4 text-muted-foreground">Loading classmates…</p>
          ) : results.length === 0 ? (
            <p className="mt-4 text-muted-foreground">
              No classmates match these filters.{' '}
              {hasFilters && (
                <button onClick={clearAll} className="font-semibold text-foreground underline">Clear filters</button>
              )}
            </p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {results.map((p) => <PeerCard key={p.id} peer={p} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
