import { useAuth } from '../AuthContext'

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

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'there'
  const firstName = fullName.split(' ')[0]

  return (
    <div className="min-h-screen">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-heading text-xl font-semibold">PeerLink</span>
          <button onClick={signOut}
            className="rounded border border-primary-foreground/40 px-3 py-1.5 text-sm font-semibold hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
            Log out
          </button>
        </div>
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-6">
          <h1 className="text-4xl font-semibold sm:text-5xl">Welcome, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-lg text-primary-foreground/80">
            Your hub for tutoring, study groups, and skill swaps with classmates.
          </p>
        </div>
      </header>

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
              <Row label="Can teach" value="0 skills" />
              <Row label="Want to learn" value="0 skills" />
            </dl>
          </section>
        </aside>
      </main>
    </div>
  )
}
