import express from 'express'
import pool from '../db/pool.js'
import { validateSyncData } from '../middleware/validate.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Sync daily scores
router.post('/daily-scores', authenticateToken, validateSyncData, async (req, res) => {
  const { entries } = req.body
  const userId = req.user.id
  
  // Guest mode - don't save to DB
  if (req.user.mode === 'guest') {
    return res.json({
      success: true,
      synced: 0,
      message: 'Guest mode - data not synced',
    })
  }
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Ensure user exists
    const userCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    )
    
    if (userCheck.rows.length === 0) {
      // Create user
      await client.query(
        'INSERT INTO users (id, email) VALUES ($1, $2)',
        [userId, `user-${userId}@puzzle.app`]
      )
    }
    
    // Upsert scores
    let synced = 0
    for (const entry of entries) {
      await client.query(`
        INSERT INTO daily_scores (user_id, date, score, time_taken)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, date)
        DO UPDATE SET
          score = EXCLUDED.score,
          time_taken = EXCLUDED.time_taken,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, entry.date, entry.score, entry.timeTaken])
      
      synced++
    }
    
    await client.query('COMMIT')
    
    res.json({
      success: true,
      synced,
      message: `Successfully synced ${synced} entries`,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Sync error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to sync data',
    })
  } finally {
    client.release()
  }
})

// Get user scores (for multi-device sync)
router.get('/daily-scores', authenticateToken, async (req, res) => {
  const userId = req.user.id
  
  if (req.user.mode === 'guest') {
    return res.json({ scores: [] })
  }
  
  try {
    const result = await pool.query(`
      SELECT date, score, time_taken
      FROM daily_scores
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 365
    `, [userId])
    
    res.json({ scores: result.rows })
  } catch (error) {
    console.error('Fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch scores' })
  }
})

export default router