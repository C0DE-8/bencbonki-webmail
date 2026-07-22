/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Compose } from '../components/Compose'
import { MailSidebar } from '../components/MailSidebar'
import { MessageList } from '../components/MessageList'
import { MessageReader } from '../components/MessageReader'
import { useIsMobile } from '../hooks/useIsMobile'

export function MailboxPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
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
  const [drawerOpen, setDrawerOpen] = useState(false)
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

  const handleLogout = useCallback(async () => {
    await logout()
    setMessages([])
    setSelectedMessage(null)
    setSelectedUid(null)
    navigate('/login', { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    loadMailboxes().catch((err) => setError(err.message))
  }, [loadMailboxes])

  useEffect(() => {
    loadMessages(activeMailbox)
  }, [activeMailbox, loadMessages])

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
      setDrawerOpen(false)
    }
  }, [isMobile])

  return (
    <main className={`mail-app mobile-${mobileView} ${drawerOpen ? 'drawer-open' : ''}`}>
      <button
        className="drawer-scrim"
        type="button"
        aria-label="Close menu"
        onClick={() => setDrawerOpen(false)}
      />

      <MailSidebar
        activeMailbox={activeMailbox}
        mailboxes={mailboxes}
        onClose={() => setDrawerOpen(false)}
        onCompose={() => setComposeOpen(true)}
        onLogout={handleLogout}
        onSelectMailbox={(mailbox) => {
          setActiveMailbox(mailbox)
          setMobileView('list')
          setDrawerOpen(false)
        }}
        user={user}
      />

      <MessageList
        activeMailbox={activeMailbox}
        error={error}
        loadingMessages={loadingMessages}
        messages={messages}
        onOpenMenu={() => setDrawerOpen(true)}
        onRefresh={() => loadMessages(activeMailbox)}
        onSelectMessage={(uid) => {
          setSelectedUid(uid)
          setMobileView('reader')
        }}
        selectedUid={selectedUid}
      />

      <MessageReader
        activeMailbox={activeMailbox}
        loadingMessage={loadingMessage}
        messageError={messageError}
        onBack={() => setMobileView('list')}
        onOpenMenu={() => setDrawerOpen(true)}
        selectedMessage={selectedMessage}
        selectedSummary={selectedSummary}
      />

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
