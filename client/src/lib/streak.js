import dayjs from 'dayjs'

// Calculate current streak (CLIENT ONLY - NEVER trust server)
export const calculateStreak = (activityMap) => {
  let streak = 0
  let current = dayjs()
  
  while (true) {
    const dateStr = current.format('YYYY-MM-DD')
    const activity = activityMap[dateStr]
    
    if (activity && activity.solved) {
      streak++
      current = current.subtract(1, 'day')
    } else {
      // If today isn't solved yet, don't break streak
      if (streak === 0 && current.isSame(dayjs(), 'day')) {
        current = current.subtract(1, 'day')
        continue
      }
      break
    }
  }
  
  return streak
}

// Calculate longest streak ever
export const calculateLongestStreak = (activityMap) => {
  const dates = Object.keys(activityMap).sort()
  let longestStreak = 0
  let currentStreak = 0
  let prevDate = null
  
  dates.forEach(date => {
    const activity = activityMap[date]
    if (!activity.solved) {
      currentStreak = 0
      prevDate = null
      return
    }
    
    if (prevDate) {
      const daysDiff = dayjs(date).diff(dayjs(prevDate), 'day')
      if (daysDiff === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }
    
    longestStreak = Math.max(longestStreak, currentStreak)
    prevDate = date
  })
  
  return longestStreak
}

// Get streak statistics
export const getStreakStats = (activityMap) => {
  const currentStreak = calculateStreak(activityMap)
  const longestStreak = calculateLongestStreak(activityMap)
  
  return {
    current: currentStreak,
    longest: longestStreak,
    isActive: currentStreak > 0,
  }
}