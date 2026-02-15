import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'

dayjs.extend(customParseFormat)

export const validateSyncData = (req, res, next) => {
  const { entries } = req.body
  
  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: 'Entries must be an array' })
  }
  
  if (entries.length === 0) {
    return res.status(400).json({ error: 'No entries provided' })
  }
  
  if (entries.length > 100) {
    return res.status(400).json({ error: 'Too many entries (max 100)' })
  }
  
  for (const entry of entries) {
    // Validate date
    if (!dayjs(entry.date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ error: `Invalid date format: ${entry.date}` })
    }
    
    // No future dates
    if (dayjs(entry.date).isAfter(dayjs(), 'day')) {
      return res.status(400).json({ error: 'Cannot sync future dates' })
    }
    
    // Validate score
    if (typeof entry.score !== 'number' || entry.score < 0 || entry.score > 100) {
      return res.status(400).json({ error: 'Invalid score (must be 0-100)' })
    }
    
    // Validate time
    if (typeof entry.timeTaken !== 'number' || entry.timeTaken < 1 || entry.timeTaken > 7200) {
      return res.status(400).json({ error: 'Invalid time (must be 1-7200 seconds)' })
    }
  }
  
  next()
}