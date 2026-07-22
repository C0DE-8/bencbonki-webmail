import { useState } from 'react'
import { api } from '../api/client'

export function Compose({ onClose, onSent }) {
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
