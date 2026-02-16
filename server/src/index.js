import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import session from 'express-session'
import passport from 'passport'
import syncRoutes from './routes/sync.js'
import authRoutes from './routes/auth.js'
import pool from './db/pool.js'

dotenv.config({ override: false })

console.log("NODE_ENV =", process.env.NODE_ENV)
console.log("GOOGLE_CALLBACK_URL =", process.env.GOOGLE_CALLBACK_URL)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/sync', syncRoutes)

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()')
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
🔐 Google OAuth: http://localhost:${PORT}/api/auth/google
🔄 Sync endpoint: http://localhost:${PORT}/api/sync/daily-scores
  `)
})