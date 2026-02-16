import { getUnsyncedActivities, markAsSynced, saveActivity } from './db'
import { getAuthState } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Sync activities to server (push local, pull server data)
export const syncActivities = async () => {
  const auth = getAuthState()
  
  // Guest mode - no sync
  if (!auth || auth.mode === 'guest') {
    console.log('👤 Guest mode - no sync')
    return { success: true, message: 'Guest mode' }
  }
  
  // Check online
  if (!navigator.onLine) {
    throw new Error('No internet connection')
  }
  
  console.log(`🔄 Starting sync for user: ${auth.userId}`)
  
  try {
    // STEP 1: Push unsynced local activities to server
    const unsynced = await getUnsyncedActivities()
    
    if (unsynced.length > 0) {
      console.log(`⬆️ Pushing ${unsynced.length} activities to server...`)
      
      const entries = unsynced.map(activity => ({
        date: activity.date,
        score: activity.score,
        timeTaken: activity.timeTaken,
      }))
      
      const pushResponse = await fetch(`${API_URL}/api/sync/daily-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ entries }),
      })
      
      if (!pushResponse.ok) {
        const errorData = await pushResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Push failed: ${pushResponse.status}`)
      }
      
      // Mark as synced
      await markAsSynced(entries.map(e => e.date))
      console.log(`✅ Pushed ${entries.length} activities`)
    }
    
    // STEP 2: Pull server activities to local
    console.log(`⬇️ Pulling activities from server...`)
    
    const pullResponse = await fetch(`${API_URL}/api/sync/daily-scores`, {
      headers: {
        'Authorization': `Bearer ${auth.token}`,
      },
    })
    
    if (pullResponse.ok) {
      const { scores } = await pullResponse.json()
      console.log(`📥 Received ${scores.length} activities from server`)
      
      // Save server data to local (it will use current user's ID)
      for (const score of scores) {
        // Format the date properly
        const dateStr = typeof score.date === 'string' 
          ? score.date.split('T')[0]  // Handle ISO date
          : score.date
        
        await saveActivity({
          date: dateStr,
          solved: true,
          score: score.score,
          timeTaken: score.time_taken,
          difficulty: 'medium', // Server doesn't store this
          hintsUsed: 0,
        })
      }
      
      console.log(`✅ Pulled ${scores.length} activities from server`)
    }
    
    return { success: true, synced: unsynced.length, pulled: 0 }
    
  } catch (error) {
    console.error('❌ Sync error:', error)
    throw error
  }
}