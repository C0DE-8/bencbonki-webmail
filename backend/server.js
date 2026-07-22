require('dotenv').config()

const express = require('express')
const cors = require('cors')
const authRouter = require('./routers/auth.router')
const mailRouter = require('./routers/mail.router')

const app = express()
const port = Number(process.env.PORT || 4000)

const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin not allowed by CORS'))
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
