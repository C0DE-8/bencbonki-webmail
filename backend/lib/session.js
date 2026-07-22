const crypto = require('crypto')

const maxAgeSeconds = 28800

function sessionSecret() {
  return process.env.SESSION_SECRET || 'change-this-before-production'
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((cookie) => cookie.trim().split('='))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  )
}

function isSecureRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https'
}

function cookieOptions(req) {
  return [
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    isSecureRequest(req) ? 'SameSite=None' : 'SameSite=Lax',
    isSecureRequest(req) ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', sessionSecret())
    .update(body)
    .digest('base64url')

  return `${body}.${signature}`
}

function readSignedPayload(token) {
  try {
    if (!token || !token.includes('.')) return null

    const [body, signature] = token.split('.')
    const expected = crypto
      .createHmac('sha256', sessionSecret())
      .update(body)
      .digest('base64url')

    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))

    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function setSessionCookie(req, res, token) {
  res.setHeader(
    'Set-Cookie',
    `mail_session=${encodeURIComponent(token)}; ${cookieOptions(req)}`
  )
}

function clearSessionCookie(req, res) {
  const sameSite = isSecureRequest(req) ? 'SameSite=None; Secure' : 'SameSite=Lax'
  res.setHeader('Set-Cookie', `mail_session=; HttpOnly; ${sameSite}; Path=/; Max-Age=0`)
}

function createSession(user) {
  return signPayload({
    email: user.email,
    name: user.name,
    createdAt: Date.now(),
    expiresAt: Date.now() + maxAgeSeconds * 1000,
  })
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie).mail_session
  const session = readSignedPayload(token)

  return {
    token,
    session,
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

module.exports = {
  clearSessionCookie,
  createSession,
  getSession,
  requireAuth,
  setSessionCookie,
}
