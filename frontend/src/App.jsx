import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { AuthPage } from './pages/AuthPage'
import { MailboxPage } from './pages/MailboxPage'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

function RequireAuth({ children }) {
  const { booting, user } = useAuth()
  const location = useLocation()

  if (booting) {
    return <main className="loading-screen">Loading mailbox...</main>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/mail"
        element={(
          <RequireAuth>
            <MailboxPage />
          </RequireAuth>
        )}
      />
      <Route path="/" element={<Navigate to="/mail" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
