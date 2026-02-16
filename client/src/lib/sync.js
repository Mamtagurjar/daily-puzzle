import { getUnsyncedActivities, markAsSynced, saveActivity, getActivityByDate, getActivities } from './db'
import { getAuthState } from './auth'
import dayjs from 'dayjs'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Track if this is the first sync for this user session
const SYNC_FLAG_KEY = 'last_sync_user'

export const syncActivities = async () => {
  const auth = getAuthState()
  
  if (!auth || auth.mode === 'guest') {
    console.log('👤 Guest mode - no sync')
    return { success: true, message: 'Guest mode' }
  }
  
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
      
      await markAsSynced(entries.map(e => e.date))
      console.log(`✅ Pushed ${entries.length} activities`)
    }
    
    // STEP 2: Pull server activities (ONLY on first sync or if local is empty)
    const localActivities = await getActivities()
    const lastSyncUser = sessionStorage.getItem(SYNC_FLAG_KEY)
    const isFirstSync = lastSyncUser !== auth.userId
    
    // Only pull if first sync for this user OR if we have no local data
    if (isFirstSync || localActivities.length === 0) {
      console.log(`⬇️ First sync for ${auth.userId}, pulling from server...`)
      
      const pullResponse = await fetch(`${API_URL}/api/sync/daily-scores`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      })
      
      if (pullResponse.ok) {
        const { scores } = await pullResponse.json()
        console.log(`📥 Received ${scores.length} activities from server`)
        
        let imported = 0
        
        for (const score of scores) {
          let dateStr = typeof score.date === 'string' 
            ? score.date.split('T')[0] 
            : score.date
          
          // Double check it doesn't exist
          const existing = await getActivityByDate(dateStr)
          if (!existing) {
            await saveActivity({
              date: dateStr,
              solved: true,
              score: score.score,
              timeTaken: score.time_taken,
              difficulty: 'medium',
              hintsUsed: 0,
              synced: true,  // Mark as synced since from server
            })
            imported++
          }
        }
        
        console.log(`✅ Imported ${imported} activities from server`)
        
        // Mark that we've synced for this user
        sessionStorage.setItem(SYNC_FLAG_KEY, auth.userId)
      }
    } else {
      console.log(`⏭️ Skipping pull - already synced for ${auth.userId}`)
    }
    
    return { success: true, synced: unsynced.length }
    
  } catch (error) {
    console.error('❌ Sync error:', error)
    throw error
  }
}