const config = {
  name: process.env.MAIL_NAME || 'Mailbox',
  company: process.env.MAIL_COMPANY || 'Veliport24',
  email: process.env.MAIL_EMAIL,
  password: process.env.MAIL_PASSWORD,
  server: process.env.MAIL_SERVER,
  imapPort: Number(process.env.IMAP_PORT || 993),
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: String(process.env.SMTP_SECURE || 'true') === 'true',
}

function publicUser() {
  return {
    name: config.name,
    email: config.email,
    company: config.company,
  }
}

module.exports = {
  config,
  publicUser,
}
