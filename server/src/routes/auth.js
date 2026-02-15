import express from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'

const router = express.Router()

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value
      const googleId = profile.id
      const name = profile.displayName
      const picture = profile.photos[0]?.value
      
      // Check if user exists
      let result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )
      
      let user
      
      if (result.rows.length === 0) {
        // Create new user
        result = await pool.query(`
          INSERT INTO users (email, google_id, display_name, picture)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [email, googleId, name, picture])
        
        user = result.rows[0]
      } else {
        // Update existing user
        result = await pool.query(`
          UPDATE users
          SET google_id = $1, display_name = $2, picture = $3, updated_at = CURRENT_TIMESTAMP
          WHERE email = $4
          RETURNING *
        `, [googleId, name, picture, email])
        
        user = result.rows[0]
      }
      
      return done(null, user)
    } catch (error) {
      return done(error, null)
    }
  }
))

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    done(null, result.rows[0])
  } catch (error) {
    done(error, null)
  }
})

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      {
        id: req.user.id,
        email: req.user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`)
  }
)

// Verify token and return user info
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    const result = await pool.query(
      'SELECT id, email, display_name, picture FROM users WHERE id = $1',
      [decoded.id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const user = result.rows[0]
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.display_name,
      picture: user.picture,
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(403).json({ error: 'Invalid token' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    res.json({ success: true })
  })
})

export default router