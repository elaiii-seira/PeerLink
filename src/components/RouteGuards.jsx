import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Loading…
    </div>
  )
}

// Only signed-in users
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? children : <Navigate to="/login" replace />
}

// Only signed-out users (login, register)
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Navigate to="/dashboard" replace /> : children
}
