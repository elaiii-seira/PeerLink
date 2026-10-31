import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabase } from '../supabase'
import PageHeader from '../components/PageHeader'

function Section({ title, children }) {
  return (
    <section className="rounded border border-border/25 bg-card p-6 text-card-foreground">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 text-muted-foreground">{children}</div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-t border-border/25 py-3 first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold text-foreground">{value || '—'}</dd>
    </div>
  )
}

const plural = (n) => `${n} ${n === 1 ? 'skill' : 'skills'}`

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [counts, setCounts] = useState({ teach: 0, learn: 0 })

  useEffect(() => {
    supabase.from('user_skills').select('type').eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return
        setCounts({
          teach: data.filter((r) => r.type === 'teach').length,
          learn: data.filter((r) => r.type === 'learn').length,
        })
      })
  }, [user.id])

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'there'
  const firstName = fullName.split(' ')[0]

  return (
    <div className="min-h-screen">
      <PageHeader title={`Welcome, ${firstName}.`}
        subtitle="Your hub for tutoring, study groups, and skill swaps with classmates." />

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Section title="Upcoming sessions">
            <p>No sessions yet. Once you match with a peer, confirmed sessions will appear here.</p>
          </Section>
          <Section title="Suggested peers">
            <p>Add what you can teach and what you want to learn, and matching classmates will appear here.</p>
          </Section>
        </div>

        <aside>
          <section className="rounded border border-border/25 bg-card p-6 text-card-foreground">
            <h2 className="text-xl font-semibold">Your profile</h2>
            <dl className="mt-3">
              <Row label="Name" value={profile?.full_name} />
              <Row label="Course" value={profile?.course} />
              <Row label="Year level" value={profile?.year_level} />
              <Row label="Email" value={user?.email} />
              <Row label="Can teach" value={plural(counts.teach)} />
              <Row label="Want to learn" value={plural(counts.learn)} />
            </dl>
            <Link to="/profile" className="btn-outline mt-4 w-full">Edit profile</Link>
          </section>
        </aside>
      </main>
    </div>
  )
}
