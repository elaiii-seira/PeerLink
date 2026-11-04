import { useEffect } from 'react'
import Brand, { BRAND } from './Brand'
import ThemeToggle from './ThemeToggle'

// Centered card used by the login, register and password pages
export default function AuthShell({ title, subtitle, children, footer }) {
  useEffect(() => { document.title = `${title} · ${BRAND}` }, [title])
  return (
    <div className="min-h-screen"
      style={{ backgroundImage: 'radial-gradient(60rem 28rem at 15% 0%, rgb(var(--card)), transparent 70%)' }}>
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:font-semibold focus:text-foreground">
        Skip to main content
      </a>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Brand />
        <ThemeToggle />
      </header>

      <main id="main" className="mx-auto flex max-w-md flex-col px-6 pb-16 pt-6 sm:pt-10">
        <h1 className="text-center text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-muted-foreground">{subtitle}</p>}
        <div className="mt-8 rounded-2xl border border-border/20 bg-card p-6 text-card-foreground shadow-sm sm:p-8">
          {children}
        </div>
        {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
      </main>
    </div>
  )
}
