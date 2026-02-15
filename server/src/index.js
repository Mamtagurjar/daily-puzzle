import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import syncRoutes from './routes/sync.js'
import pool from './db/pool.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Routes
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
🔄 Sync endpoint: http://localhost:${PORT}/api/sync/daily-scores
  `)
})