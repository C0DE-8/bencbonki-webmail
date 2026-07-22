const crypto = require('crypto')

const sessions = new Map()

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((cookie) => cookie.trim().split('='))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  )
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `mail_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`
  )
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'mail_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { ...user, createdAt: Date.now() })
  return token
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie).mail_session
  return {
    token,
    session: token ? sessions.get(token) : null,
  }
}

function requireAuth(req, res, next) {
  const { session } = getSession(req)

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  req.user = session
  return next()
}

function deleteSession(token) {
  sessions.delete(token)
}

module.exports = {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSession,
  requireAuth,
  setSessionCookie,
}
