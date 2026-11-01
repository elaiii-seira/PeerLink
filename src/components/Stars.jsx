// Read-only stars. Filled stars use the primary colour, empty ones are faded.
export default function Stars({ value }) {
  const filled = Math.round(value)
  return (
    <span role="img" aria-label={`${value.toFixed(1)} out of 5 stars`} className="whitespace-nowrap text-primary">
      {'★'.repeat(filled)}
      <span className="text-border/40">{'★'.repeat(5 - filled)}</span>
    </span>
  )
}

// "★★★★☆ 4.5 (3)" for cards, or a plain note when nobody has rated yet
export function RatingSummary({ avg, count }) {
  if (!count) return <span className="text-sm text-muted-foreground">No ratings yet</span>
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Stars value={avg} />
      <span className="font-semibold">{avg.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </span>
  )
}
