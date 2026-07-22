import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function NotFoundPage() {
  const { user } = useAuth()

  return (
    <main className="not-found-shell">
      <section className="not-found-panel">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="not-found-copy">The page you are looking for does not exist.</p>
        <Link className="primary-btn not-found-link" to={user ? '/mail' : '/login'}>
          <span aria-hidden="true">{'->'}</span>
          {user ? 'Go to mail' : 'Go to login'}
        </Link>
      </section>
    </main>
  )
}
