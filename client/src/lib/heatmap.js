import dayjs from 'dayjs'
import isLeapYear from 'dayjs/plugin/isLeapYear'

dayjs.extend(isLeapYear)

// Get intensity level based on activity
export const getIntensityLevel = (activity) => {
  if (!activity || !activity.solved) return 0
  
  const { difficulty, score } = activity
  
  // Perfect score
  if (score >= 95) return 4
  
  // Based on difficulty and score
  if (difficulty === 'hard' && score >= 80) return 3
  if (difficulty === 'medium' && score >= 70) return 2
  if (difficulty === 'easy' || score >= 60) return 1
  
  // Default for solved but low score
  return 1
}

// Get color class for intensity level
export const getIntensityColor = (level) => {
  const colors = {
    0: 'bg-gray-200 hover:bg-gray-300',
    1: 'bg-emerald-200 hover:bg-emerald-300',
    2: 'bg-emerald-400 hover:bg-emerald-500',
    3: 'bg-emerald-600 hover:bg-emerald-700',
    4: 'bg-emerald-800 hover:bg-emerald-900',
  }
  return colors[level] || colors[0]
}

// Generate heatmap data for full year (365/366 days)
export const generateHeatmapData = (activities) => {
  // Convert activities array to map for O(1) lookup
  const activityMap = {}
  activities.forEach(activity => {
    activityMap[activity.date] = activity
  })
  
  const today = dayjs()
  const startOfYear = dayjs().startOf('year')
  const endOfYear = dayjs().endOf('year')
  
  // Find first Sunday of the grid (may be in previous year)
  let currentDate = startOfYear
  while (currentDate.day() !== 0) {
    currentDate = currentDate.subtract(1, 'day')
  }
  
  const weeks = []
  
  // Generate all weeks until we cover the entire year
  while (currentDate.isBefore(endOfYear) || currentDate.isSame(endOfYear, 'day')) {
    const week = []
    
    for (let i = 0; i < 7; i++) {
      const dateStr = currentDate.format('YYYY-MM-DD')
      const activity = activityMap[dateStr]
      const isCurrentYear = currentDate.year() === today.year()
      const isFuture = currentDate.isAfter(today, 'day')
      const isToday = currentDate.isSame(today, 'day')
      
      week.push({
        date: dateStr,
        dayOfWeek: currentDate.day(),
        activity: activity || null,
        intensity: getIntensityLevel(activity),
        isCurrentYear,
        isFuture,
        isToday,
      })
      
      currentDate = currentDate.add(1, 'day')
    }
    
    weeks.push(week)
    
    // Stop if we've gone past the end of year
    if (currentDate.isAfter(endOfYear, 'day')) {
      break
    }
  }
  
  return weeks
}

// Get month labels for heatmap header
export const getMonthLabels = () => {
  const months = []
  const startOfYear = dayjs().startOf('year')
  
  for (let i = 0; i < 12; i++) {
    months.push(startOfYear.add(i, 'month').format('MMM'))
  }
  
  return months
}

// Get day of week labels
export const getDayLabels = () => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

// Calculate total contributions
export const calculateTotalContributions = (activities) => {
  return activities.filter(a => a.solved).length
}

// Get contribution stats for current year
export const getYearStats = (activities) => {
  const currentYear = dayjs().year()
  const yearActivities = activities.filter(a => 
    dayjs(a.date).year() === currentYear && a.solved
  )
  
  return {
    total: yearActivities.length,
    average: (yearActivities.length / dayjs().dayOfYear()).toFixed(1),
  }
}