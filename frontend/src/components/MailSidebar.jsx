export function MailSidebar({
  activeMailbox,
  mailboxes,
  onCompose,
  onLogout,
  onSelectMailbox,
  user,
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">B</div>
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
      </div>

      <button className="compose-btn" type="button" onClick={onCompose}>
        <span aria-hidden="true">+</span>
        Compose
      </button>

      <nav className="folders" aria-label="Mailboxes">
        {mailboxes.map((box) => (
          <button
            key={box.path}
            type="button"
            className={box.path === activeMailbox ? 'active' : ''}
            onClick={() => onSelectMailbox(box.path)}
          >
            <span aria-hidden="true">{box.path === 'INBOX' ? '#' : '-'}</span>
            {box.name}
          </button>
        ))}
      </nav>

      <button className="logout-btn" type="button" onClick={onLogout}>
        <span aria-hidden="true">&lt;-</span>
        Logout
      </button>
    </aside>
  )
}
