import { addressLabel, formatDate } from '../utils/mail'

export function MessageReader({
  activeMailbox,
  loadingMessage,
  messageError,
  onBack,
  selectedMessage,
  selectedSummary,
}) {
  return (
    <article className="reader">
      <header className="mobile-reader-bar">
        <button className="secondary-btn" type="button" onClick={onBack}>
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

      {!loadingMessage && !messageError && !selectedSummary ? (
        <p className="empty reader-empty">Select a message to read it.</p>
      ) : null}
    </article>
  )
}
