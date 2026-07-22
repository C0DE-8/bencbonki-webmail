const express = require('express')
const { requireAuth } = require('../lib/session')
const { getMessage, listMailboxes, listMessages, sendMessage } = require('../lib/mail')

const router = express.Router()

router.use(requireAuth)

router.get('/mailboxes', async (req, res) => {
  try {
    const mailboxes = await listMailboxes()
    res.json({ mailboxes })
  } catch (error) {
    res.status(502).json({ error: error.message || 'Unable to load mailboxes' })
  }
})

router.get('/messages', async (req, res) => {
  const mailboxPath = req.query.mailbox || 'INBOX'
  const limit = Math.min(Number(req.query.limit || 30), 100)

  try {
    const result = await listMessages(mailboxPath, limit)
    res.json(result)
  } catch (error) {
    res.status(502).json({ error: error.message || 'Unable to load messages' })
  }
})

router.get('/messages/:uid', async (req, res) => {
  const mailboxPath = req.query.mailbox || 'INBOX'
  const uid = Number(req.params.uid)

  if (!Number.isInteger(uid)) {
    return res.status(400).json({ error: 'Invalid message id' })
  }

  try {
    const message = await getMessage(mailboxPath, uid)

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    return res.json({ message })
  } catch (error) {
    return res.status(502).json({ error: error.message || 'Unable to load message' })
  }
})

router.post('/messages/send', async (req, res) => {
  try {
    const info = await sendMessage(req.body || {})
    res.json({ ok: true, messageId: info.messageId })
  } catch (error) {
    res.status(error.status || 502).json({ error: error.message || 'Unable to send message' })
  }
})

module.exports = router
