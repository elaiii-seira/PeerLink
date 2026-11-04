import { useTheme } from '../theme'

function Sun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function Moon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

// tone="chrome" sits on the dark page header, tone="plain" on the light page background
export default function ThemeToggle({ tone = 'plain' }) {
  const { dark, toggle } = useTheme()
  const colors = tone === 'chrome'
    ? 'border-chrome-foreground/40 text-chrome-foreground hover:bg-chrome-foreground/10 focus-visible:ring-chrome-foreground'
    : 'border-border/30 text-foreground hover:bg-muted focus-visible:ring-ring'
  return (
    <button type="button" onClick={toggle} aria-pressed={dark}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border focus:outline-none focus-visible:ring-2 ${colors}`}>
      {dark ? <Sun /> : <Moon />}
    </button>
  )
}
