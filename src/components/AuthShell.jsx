import { useEffect } from 'react'

export default function AuthShell({ title, subtitle, children, footer }) {
  useEffect(() => { document.title = `${title} · PeerLink` }, [title])
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="flex flex-col justify-between bg-primary px-8 py-10 text-primary-foreground lg:px-14 lg:py-14">
        <p className="font-heading text-2xl font-semibold">PeerLink</p>
        <div className="my-10 max-w-md lg:my-0">
          <h2 className="text-4xl font-semibold leading-tight lg:text-5xl">
            Teach what you know. Learn what you don’t.
          </h2>
          <p className="mt-5 text-lg text-primary-foreground/80">
            Match with classmates for tutoring, study groups, and skills like Canva,
            video editing, and coding.
          </p>
        </div>
        <p className="hidden text-sm text-primary-foreground/70 lg:block">
          Built for PRMSU students.
        </p>
      </aside>

      <main id="main" className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  )
}
