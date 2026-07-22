const { ImapFlow } = require('imapflow')
const { simpleParser } = require('mailparser')
const nodemailer = require('nodemailer')
const { config } = require('./config')

function createImapClient() {
  return new ImapFlow({
    host: config.server,
    port: config.imapPort,
    secure: true,
    auth: {
      user: config.email,
      pass: config.password,
    },
    logger: false,
  })
}

function createSmtpTransport() {
  return nodemailer.createTransport({
    host: config.server,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.email,
      pass: config.password,
    },
  })
}

function addressList(addresses = []) {
  return addresses.map((address) => ({
    name: address.name || '',
    address: address.address || '',
  }))
}

function summarizeMessage(message) {
  return {
    uid: message.uid,
    subject: message.envelope?.subject || '(no subject)',
    from: addressList(message.envelope?.from),
    to: addressList(message.envelope?.to),
    date: message.envelope?.date || message.internalDate || null,
    seen: Boolean(message.flags && message.flags.has('\\Seen')),
    flagged: Boolean(message.flags && message.flags.has('\\Flagged')),
  }
}

function parseRecipients(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function textToHtml(value) {
  return escapeHtml(value)
    .split(/\r?\n/)
    .map((line) => line || '&nbsp;')
    .join('<br>')
}

function brandedMessage({ subject, text }) {
  const plainText = [
    `${config.company}`,
    '',
    String(text || '').trim(),
    '',
    `--`,
    `${config.name}`,
    `${config.company} Support`,
    config.email,
  ].join('\n')

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dce4ee;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#16202b;color:#ffffff;padding:22px 28px;">
                <div style="font-size:20px;font-weight:700;">${escapeHtml(config.company)}</div>
                <div style="font-size:13px;color:#b7c5d5;margin-top:4px;">Customer Support</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-size:15px;line-height:1.6;">
                <h1 style="font-size:20px;line-height:1.3;margin:0 0 18px;color:#17202a;">${escapeHtml(subject || 'Message from support')}</h1>
                <div>${textToHtml(text)}</div>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e3e9f0;padding:18px 28px;color:#5c6b7c;font-size:13px;line-height:1.5;">
                <strong style="color:#17202a;">${escapeHtml(config.name)}</strong><br>
                ${escapeHtml(config.company)} Support<br>
                <a href="mailto:${escapeHtml(config.email)}" style="color:#1264a3;">${escapeHtml(config.email)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { html, text: plainText }
}

async function withMailbox(path, callback) {
  const client = createImapClient()

  try {
    await client.connect()
    const mailbox = await client.mailboxOpen(path)
    return await callback(client, mailbox)
  } finally {
    await client.logout().catch(() => {})
  }
}

async function listMailboxes() {
  const client = createImapClient()

  try {
    await client.connect()
    const boxes = await client.list()
    return boxes.map((box) => ({
      path: box.path,
      name: box.name,
      delimiter: box.delimiter,
      specialUse: box.specialUse || null,
    }))
  } finally {
    await client.logout().catch(() => {})
  }
}

async function listMessages(mailboxPath, limit) {
  return withMailbox(mailboxPath, async (client, mailbox) => {
    if (!mailbox.exists) {
      return { mailbox: mailboxPath, total: 0, messages: [] }
    }

    const start = Math.max(1, mailbox.exists - limit + 1)
    const messages = []

    for await (const message of client.fetch(`${start}:*`, {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
    })) {
      if (message.uid) {
        messages.push(summarizeMessage(message))
      }
    }

    messages.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    return { mailbox: mailboxPath, total: mailbox.exists, messages }
  })
}

async function getMessage(mailboxPath, uid) {
  return withMailbox(mailboxPath, async (client) => {
    const item = await client.fetchOne(uid, {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
      source: true,
    }, { uid: true })

    if (!item) {
      return null
    }

    await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true }).catch(() => {})
    const parsed = await simpleParser(item.source)

    return {
      ...summarizeMessage(item),
      html: parsed.html || '',
      text: parsed.text || '',
      attachments: parsed.attachments.map((attachment) => ({
        filename: attachment.filename || 'attachment',
        contentType: attachment.contentType,
        size: attachment.size,
      })),
    }
  })
}

async function sendMessage({ to, cc, bcc, subject, text }) {
  const recipients = parseRecipients(to)

  if (!recipients.length || !String(text || '').trim()) {
    const error = new Error('Recipient and message are required')
    error.status = 400
    throw error
  }

  const transport = createSmtpTransport()
  const message = brandedMessage({ subject, text })

  return transport.sendMail({
    from: `"${config.name}" <${config.email}>`,
    to: recipients,
    cc: parseRecipients(cc),
    bcc: parseRecipients(bcc),
    subject: String(subject || ''),
    text: message.text,
    html: message.html,
    headers: {
      'X-Company': config.company,
      'X-Mailer': `${config.company} Webmail`,
    },
  })
}

module.exports = {
  getMessage,
  listMailboxes,
  listMessages,
  sendMessage,
}
