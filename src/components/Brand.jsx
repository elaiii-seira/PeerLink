import { Link } from 'react-router-dom'

export const BRAND = 'PeerLink - Skill Up'

// Logo badge and name. Links to the home page.
export default function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded sm:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground sm:h-10 sm:w-10">
        PL
      </span>
      <span className="whitespace-nowrap text-base font-bold sm:text-lg">{BRAND}</span>
    </Link>
  )
}
