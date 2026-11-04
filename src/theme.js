import { useCallback, useState } from 'react'

const KEY = 'peerlink-theme'
const isDark = () => document.documentElement.classList.contains('dark')

// Light/dark theme. public/theme.js applies the saved choice before first paint;
// this hook lets a button switch it and remembers the choice.
export function useTheme() {
  const [dark, setDark] = useState(isDark)

  const toggle = useCallback(() => {
    const next = !isDark()
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem(KEY, next ? 'dark' : 'light') } catch { /* storage can be blocked */ }
    setDark(next)
  }, [])

  return { dark, toggle }
}
