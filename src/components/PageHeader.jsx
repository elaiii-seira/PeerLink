import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const navClass = ({ isActive }) =>
  `border-b-2 pb-1 text-sm font-semibold ${
    isActive
      ? 'border-primary-foreground text-primary-foreground'
      : 'border-transparent text-primary-foreground/70 hover:text-primary-foreground'
  }`

export default function PageHeader({ title, subtitle }) {
  const { signOut } = useAuth()
  useEffect(() => { document.title = `${title} · PeerLink - Skill Up` }, [title])
  return (
    <header className="bg-primary text-primary-foreground">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:font-semibold focus:text-foreground">
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <span className="font-heading text-xl font-semibold">PeerLink - Skill Up</span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
          <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
          <NavLink to="/browse" className={navClass}>Browse</NavLink>
          <NavLink to="/sessions" className={navClass}>Sessions</NavLink>
          <NavLink to="/chat" className={navClass}>Chat</NavLink>
          <NavLink to="/groups" className={navClass}>Groups</NavLink>
          <NavLink to="/profile" className={navClass}>Profile</NavLink>
          <button
            onClick={signOut}
            className="whitespace-nowrap rounded border border-primary-foreground/40 px-3 py-1.5 text-sm font-semibold hover:bg-primary-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
          >
            Log out
          </button>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-2 sm:pb-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 hidden max-w-2xl text-lg text-primary-foreground/80 sm:block">{subtitle}</p>}
      </div>
    </header>
  )
}
