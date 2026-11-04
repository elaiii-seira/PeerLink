import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Brand, { BRAND } from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

const pill = 'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

// Home page for visitors who are not signed in
export default function Landing() {
  useEffect(() => { document.title = BRAND }, [])

  return (
    <div className="min-h-screen"
      style={{ backgroundImage: 'radial-gradient(60rem 28rem at 15% 0%, rgb(var(--card)), transparent 70%)' }}>
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:font-semibold focus:text-foreground">
        Skip to main content
      </a>

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-5">
        <Brand />
        <nav className="ml-auto flex items-center gap-2 sm:gap-5" aria-label="Account">
          <ThemeToggle />
          <Link to="/login"
            className="whitespace-nowrap rounded px-1 font-semibold text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Log in
          </Link>
          <Link to="/register" className={`${pill} whitespace-nowrap bg-primary !px-4 !py-2 text-primary-foreground hover:bg-foreground sm:!px-5 sm:!py-2.5`}>
            Sign up
          </Link>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6 pb-16 pt-4">
        <section aria-labelledby="hero-heading"
          className="rounded-3xl border border-border/20 bg-card p-8 text-card-foreground shadow-sm sm:p-12">
          <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
            <SearchIcon />
            For PRMSU students
          </p>

          <h1 id="hero-heading"
            className="mt-6 max-w-3xl font-heading text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Teach what you know.
            <br />
            Learn what you need.
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            {BRAND} matches PRMSU students for peer tutoring and skill-swapping — academic subjects and
            practical skills alike. Find a match, schedule a session, and grow together.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={`${pill} bg-primary text-primary-foreground hover:bg-foreground`}>
              Get started
              <ArrowIcon />
            </Link>
            <Link to="/login" className={`${pill} border border-border/30 bg-muted text-foreground hover:bg-card`}>
              I already have an account
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
