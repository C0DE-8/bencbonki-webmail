import { addressLabel, formatDate } from '../utils/mail'

export function MessageList({
  activeMailbox,
  error,
  loadingMessages,
  messages,
  onRefresh,
  onSelectMessage,
  selectedUid,
}) {
  return (
    <section className="message-list">
      <header className="toolbar">
        <div>
          <p className="eyebrow">Mailbox</p>
          <h1>{activeMailbox}</h1>
        </div>
        <button className="icon-btn" type="button" onClick={onRefresh} title="Refresh">
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
            onClick={() => onSelectMessage(message.uid)}
          >
            <span className="sender">{addressLabel(message.from)}</span>
            <span className="subject">{message.subject}</span>
            <time>{formatDate(message.date)}</time>
          </button>
        ))}
      </div>
    </section>
  )
}
