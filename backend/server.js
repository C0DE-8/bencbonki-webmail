require('dotenv').config()

const express = require('express')
const cors = require('cors')
const authRouter = require('./routers/auth.router')
const mailRouter = require('./routers/mail.router')

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(cors({
  origin(origin, callback) {
    return callback(null, origin || true)
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api', mailRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(port, () => {
  console.log(`Mail API running on http://localhost:${port}`)
})
