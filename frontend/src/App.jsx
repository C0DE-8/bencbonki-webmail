/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const MOBILE_QUERY = '(max-width: 720px)'

function api(path, options = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  })
}

function formatDate(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function addressLabel(addresses = []) {
  if (!addresses.length) return 'Unknown sender'
  return addresses.map((item) => item.name || item.address).join(', ')
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY)
    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isMobile
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('support-bencbonki@veliport24.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <form className="login-panel" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Veliport24 Webmail</p>
          <h1>Sign in to mailbox</h1>
        </div>

        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button className="primary-btn" type="submit" disabled={loading}>
          <span aria-hidden="true">{'->'}</span>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

function Compose({ onClose, onSent }) {
  const [form, setForm] = useState({ to: '', cc: '', bcc: '', subject: '', text: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function send(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api('/api/messages/send', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onSent()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="compose-backdrop" role="presentation">
      <form className="compose" onSubmit={send}>
        <header>
          <h2>New message</h2>
          <button className="icon-btn" type="button" onClick={onClose} title="Close compose">
            x
          </button>
        </header>

        <input
          value={form.to}
          onChange={(event) => update('to', event.target.value)}
          placeholder="To"
          required
        />
        <input
          value={form.cc}
          onChange={(event) => update('cc', event.target.value)}
          placeholder="Cc"
        />
        <input
          value={form.bcc}
          onChange={(event) => update('bcc', event.target.value)}
          placeholder="Bcc"
        />
        <input
          value={form.subject}
          onChange={(event) => update('subject', event.target.value)}
          placeholder="Subject"
        />
        <textarea
          value={form.text}
          onChange={(event) => update('text', event.target.value)}
          placeholder="Write your message"
          required
        />

        {error ? <p className="error">{error}</p> : null}

        <footer>
          <button className="secondary-btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" type="submit" disabled={loading}>
            <span aria-hidden="true">+</span>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </footer>
      </form>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [mailboxes, setMailboxes] = useState([])
  const [activeMailbox, setActiveMailbox] = useState('INBOX')
  const [messages, setMessages] = useState([])
  const [selectedUid, setSelectedUid] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(false)
  const [error, setError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [mobileView, setMobileView] = useState('list')
  const isMobile = useIsMobile()

  const selectedSummary = useMemo(
    () => messages.find((message) => message.uid === selectedUid),
    [messages, selectedUid]
  )

  const loadMailboxes = useCallback(async () => {
    const data = await api('/api/mailboxes')
    const boxes = data.mailboxes.length ? data.mailboxes : [{ path: 'INBOX', name: 'INBOX' }]
    setMailboxes(boxes)

    setActiveMailbox((current) => (
      boxes.some((box) => box.path === current) ? current : boxes[0].path
    ))
  }, [])

  const loadMessages = useCallback(async (mailbox) => {
    setError('')
    setMessageError('')
    setSelectedUid(null)
    setSelectedMessage(null)
    setLoadingMessages(true)

    try {
      const data = await api(`/api/messages?mailbox=${encodeURIComponent(mailbox)}`)
      setMessages(data.messages)
      setSelectedUid(data.messages[0]?.uid || null)
    } catch (err) {
      setError(err.message)
      setMessages([])
      setSelectedUid(null)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
    setMessages([])
    setSelectedMessage(null)
    setSelectedUid(null)
  }

  useEffect(() => {
    api('/api/auth/session')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setBooting(false))
  }, [])

  useEffect(() => {
    if (!user) return

    loadMailboxes().catch((err) => setError(err.message))
  }, [loadMailboxes, user])

  useEffect(() => {
    if (!user) return

    loadMessages(activeMailbox)
  }, [activeMailbox, loadMessages, user])

  useEffect(() => {
    if (!selectedUid) {
      setSelectedMessage(null)
      setLoadingMessage(false)
      return
    }

    let ignore = false

    setLoadingMessage(true)
    setMessageError('')
    api(`/api/messages/${selectedUid}?mailbox=${encodeURIComponent(activeMailbox)}`)
      .then((data) => {
        if (!ignore) {
          setSelectedMessage(data.message)
        }
      })
      .catch((err) => {
        if (ignore) return

        setSelectedMessage(null)
        setMessageError(err.message === 'Message not found'
          ? 'That message is no longer available in this folder. Refresh the mailbox to update the list.'
          : err.message)
      })
      .finally(() => {
        if (!ignore) {
          setLoadingMessage(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [activeMailbox, selectedUid])

  useEffect(() => {
    if (!isMobile) {
      setMobileView('list')
    }
  }, [isMobile])

  if (booting) {
    return <main className="loading-screen">Loading mailbox...</main>
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <main className={`mail-app mobile-${mobileView}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <button className="compose-btn" type="button" onClick={() => setComposeOpen(true)}>
          <span aria-hidden="true">+</span>
          Compose
        </button>

        <nav className="folders" aria-label="Mailboxes">
          {mailboxes.map((box) => (
            <button
              key={box.path}
              type="button"
              className={box.path === activeMailbox ? 'active' : ''}
              onClick={() => {
                setActiveMailbox(box.path)
                setMobileView('list')
              }}
            >
              <span aria-hidden="true">{box.path === 'INBOX' ? '#' : '-'}</span>
              {box.name}
            </button>
          ))}
        </nav>

        <button className="logout-btn" type="button" onClick={logout}>
          <span aria-hidden="true">&lt;-</span>
          Logout
        </button>
      </aside>

      <section className="message-list">
        <header className="toolbar">
          <div>
            <p className="eyebrow">Mailbox</p>
            <h1>{activeMailbox}</h1>
          </div>
          <button className="icon-btn" type="button" onClick={() => loadMessages(activeMailbox)} title="Refresh">
            r
          </button>
        </header>

        {error ? <p className="error inline">{error}</p> : null}
        {loadingMessages ? <p className="empty">Loading messages...</p> : null}

        {!loadingMessages && !messages.length ? <p className="empty">No messages found.</p> : null}

        <div className="messages">
          {messages.map((message) => (
            <button
              key={message.uid}
              type="button"
              className={`message-row ${message.uid === selectedUid ? 'selected' : ''} ${
                message.seen ? '' : 'unread'
              }`}
              onClick={() => {
                setSelectedUid(message.uid)
                setMobileView('reader')
              }}
            >
              <span className="sender">{addressLabel(message.from)}</span>
              <span className="subject">{message.subject}</span>
              <time>{formatDate(message.date)}</time>
            </button>
          ))}
        </div>
      </section>

      <article className="reader">
        <header className="mobile-reader-bar">
          <button className="secondary-btn" type="button" onClick={() => setMobileView('list')}>
            Back
          </button>
          <span>{activeMailbox}</span>
        </header>

        {loadingMessage ? <p className="empty">Opening message...</p> : null}
        {messageError ? <p className="error inline">{messageError}</p> : null}

        {!loadingMessage && !messageError && selectedSummary && selectedMessage ? (
          <>
            <header className="reader-head">
              <p className="eyebrow">{formatDate(selectedMessage.date)}</p>
              <h2>{selectedMessage.subject}</h2>
              <div className="meta">
                <span>From: {addressLabel(selectedMessage.from)}</span>
                <span>To: {addressLabel(selectedMessage.to)}</span>
              </div>
            </header>

            <div className="body">
              {selectedMessage.html ? (
                <iframe title="Message body" srcDoc={selectedMessage.html} sandbox="" />
              ) : (
                <pre>{selectedMessage.text || 'This message has no readable body.'}</pre>
              )}
            </div>
          </>
        ) : null}

        {!loadingMessage && !selectedSummary ? (
          <p className="empty reader-empty">Select a message to read it.</p>
        ) : null}
      </article>

      {composeOpen ? (
        <Compose
          onClose={() => setComposeOpen(false)}
          onSent={() => {
            setComposeOpen(false)
            loadMessages(activeMailbox)
          }}
        />
      ) : null}
    </main>
  )
}

export default App
