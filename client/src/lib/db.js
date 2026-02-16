import { openDB } from 'idb'
import { getAuthState } from './auth'

const DB_NAME = 'PuzzleHeatmapDB'
const DB_VERSION = 4  // New version for clean start
const ACTIVITY_STORE = 'dailyActivity'
const PROGRESS_STORE = 'puzzleProgress'

// Get current user ID
const getCurrentUserId = () => {
  const auth = getAuthState()
  return auth?.userId || 'guest-default'
}

// Create user-specific key
const getUserKey = (date) => {
  const userId = getCurrentUserId()
  return `${userId}::${date}`
}

// Initialize IndexedDB
export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      console.log(`🔄 DB upgrade from v${oldVersion} to v${DB_VERSION}`)
      
      // Delete old stores if they exist
      if (db.objectStoreNames.contains(ACTIVITY_STORE)) {
        db.deleteObjectStore(ACTIVITY_STORE)
      }
      if (db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.deleteObjectStore(PROGRESS_STORE)
      }
      
      // Create activity store
      const activityStore = db.createObjectStore(ACTIVITY_STORE, { keyPath: 'id' })
      activityStore.createIndex('userId', 'userId', { unique: false })
      activityStore.createIndex('userDate', ['userId', 'date'], { unique: false })
      
      // Create progress store
      const progressStore = db.createObjectStore(PROGRESS_STORE, { keyPath: 'id' })
      progressStore.createIndex('userId', 'userId', { unique: false })
      
      console.log('✅ Database recreated with clean schema')
    },
  })
  return db
}

// Save activity
export const saveActivity = async (activity) => {
  try {
    const db = await initDB()
    const userId = getCurrentUserId()
    const id = getUserKey(activity.date)
    
    // Check if already exists to preserve synced status
    const existing = await db.get(ACTIVITY_STORE, id)
    
    await db.put(ACTIVITY_STORE, {
      id,
      userId,
      date: activity.date,
      solved: activity.solved,
      score: activity.score,
      timeTaken: activity.timeTaken,
      difficulty: activity.difficulty,
      hintsUsed: activity.hintsUsed || 0,
      synced: activity.synced !== undefined ? activity.synced : (existing?.synced || false),
      completedAt: activity.completedAt || existing?.completedAt || new Date().toISOString(),
    })
    
    console.log(`✅ Saved activity for ${userId} on ${activity.date}`)
  } catch (error) {
    console.error('Error saving activity:', error)
    throw error
  }
}

// Get all activities for current user
export const getActivities = async () => {
  try {
    const db = await initDB()
    const userId = getCurrentUserId()
    
    const tx = db.transaction(ACTIVITY_STORE, 'readonly')
    const index = tx.store.index('userId')
    const activities = await index.getAll(userId)
    
    console.log(`📊 Loaded ${activities.length} activities for user ${userId}`)
    return activities
  } catch (error) {
    console.error('Error getting activities:', error)
    return []
  }
}

// Get activity by date for current user
export const getActivityByDate = async (date) => {
  try {
    const db = await initDB()
    const id = getUserKey(date)
    const activity = await db.get(ACTIVITY_STORE, id)
    return activity || null
  } catch (error) {
    console.error('Error getting activity by date:', error)
    return null
  }
}

// Save puzzle progress
export const savePuzzleProgress = async (date, progress) => {
  try {
    const db = await initDB()
    const userId = getCurrentUserId()
    const id = getUserKey(date)
    
    await db.put(PROGRESS_STORE, {
      id,
      userId,
      date,
      progress: progress.progress,
      hintsUsed: progress.hintsUsed || 0,
      savedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error saving progress:', error)
  }
}

// Get puzzle progress for current user
export const getPuzzleProgress = async (date) => {
  try {
    const db = await initDB()
    const id = getUserKey(date)
    return await db.get(PROGRESS_STORE, id)
  } catch (error) {
    console.error('Error getting progress:', error)
    return null
  }
}

// Get unsynced activities for current user
export const getUnsyncedActivities = async () => {
  try {
    const db = await initDB()
    const userId = getCurrentUserId()
    
    const tx = db.transaction(ACTIVITY_STORE, 'readonly')
    const index = tx.store.index('userId')
    const all = await index.getAll(userId)
    
    const unsynced = all.filter(activity => !activity.synced)
    console.log(`🔄 Found ${unsynced.length} unsynced activities for ${userId}`)
    return unsynced
  } catch (error) {
    console.error('Error getting unsynced activities:', error)
    return []
  }
}

// Mark activities as synced
export const markAsSynced = async (dates) => {
  try {
    const db = await initDB()
    const tx = db.transaction(ACTIVITY_STORE, 'readwrite')
    
    for (const date of dates) {
      const id = getUserKey(date)
      const activity = await tx.store.get(id)
      if (activity) {
        activity.synced = true
        await tx.store.put(activity)
      }
    }
    
    await tx.done
    console.log(`✅ Marked ${dates.length} activities as synced`)
  } catch (error) {
    console.error('Error marking as synced:', error)
  }
}

// Clear all data (for complete reset)
export const clearAllData = async () => {
  try {
    const db = await initDB()
    await db.clear(ACTIVITY_STORE)
    await db.clear(PROGRESS_STORE)
    console.log('✅ All data cleared')
  } catch (error) {
    console.error('Error clearing all data:', error)
  }
}