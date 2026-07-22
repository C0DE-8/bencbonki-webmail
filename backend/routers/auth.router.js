const express = require('express')
const { config, publicUser } = require('../lib/config')
const {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSession,
  requireAuth,
  setSessionCookie,
} = require('../lib/session')

const router = express.Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}

  if (email !== config.email || password !== config.password) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = createSession({ email: config.email, name: config.name })
  setSessionCookie(res, token)
  return res.json({ user: publicUser() })
})

router.post('/logout', requireAuth, (req, res) => {
  const { token } = getSession(req)
  deleteSession(token)
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.get('/session', (req, res) => {
  const { session } = getSession(req)
  res.json({ user: session ? publicUser() : null })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser() })
})

module.exports = router
