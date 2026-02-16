import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import isLeapYear from 'dayjs/plugin/isLeapYear'

import HeatmapContainer from './components/Heatmap/HeatmapContainer'
import StreakDisplay from './components/Stats/StreakDisplay'
import StatsCard from './components/Stats/StatsCard'
import PuzzleContainer from './components/Puzzle/PuzzleContainer'
import AuthModal from './components/Auth/AuthModal'

import { getActivities } from './lib/db'
import { calculateStreak } from './lib/streak'
import { syncActivities } from './lib/sync'
import { getAuthState, saveAuthState, clearAuthState, handleOAuthCallback } from './lib/auth'

dayjs.extend(isLeapYear)

function App() {
  const [activities, setActivities] = useState([])
  const [streak, setStreak] = useState(0)
  const [totalSolved, setTotalSolved] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [user, setUser] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    initApp()
  }, [])

  const initApp = async () => {
    console.log('🚀 Initializing app...')
    
    // Check for OAuth callback
    const oauthResult = await handleOAuthCallback()
    if (oauthResult) {
      console.log('✅ OAuth callback received:', oauthResult.userId)
      setUser(oauthResult)
      await loadActivities()
      await autoSyncIfPossible(oauthResult)
      setLoading(false)
      return
    }
    
    // Check existing auth
    const auth = getAuthState()
    if (!auth) {
      console.log('❌ No auth found, showing login')
      setShowAuth(true)
      setLoading(false)
      return
    }
    
    console.log('✅ Found existing auth:', auth.userId)
    setUser(auth)
    await loadActivities()
    await autoSyncIfPossible(auth)
    setLoading(false)
  }

  const autoSyncIfPossible = async (auth) => {
    if (auth.mode !== 'guest' && navigator.onLine) {
      console.log('🔄 Auto-syncing...')
      try {
        await syncActivities()
        await loadActivities()
      } catch (err) {
        console.log('⚠️ Auto-sync failed, working offline')
      }
    }
  }

  const loadActivities = async () => {
    try {
      console.log('📊 Loading activities...')
      const data = await getActivities()
      setActivities(data)
      
      const activityMap = {}
      data.forEach(activity => {
        activityMap[activity.date] = activity
      })
      
      const currentStreak = calculateStreak(activityMap)
      setStreak(currentStreak)
      
      const solved = data.filter(a => a.solved).length
      setTotalSolved(solved)
      
      console.log(`✅ Loaded: ${data.length} activities, ${currentStreak} day streak`)
    } catch (error) {
      console.error('❌ Error loading activities:', error)
    }
  }

  const handleSync = async () => {
    if (user?.mode === 'guest') {
      alert('🔐 Sign in with Google to sync your data across devices!')
      return
    }
    
    try {
      setIsSyncing(true)
      await syncActivities()
      await loadActivities()
      alert('✅ Synced successfully!')
    } catch (error) {
      console.error('Sync error:', error)
      alert('❌ Sync failed. Working offline.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePuzzleComplete = async (data) => {
    console.log('🎉 Puzzle completed!')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
    await loadActivities()
  }

  const handleAuthSuccess = async (authData) => {
    console.log('✅ Auth success:', authData.userId)
    saveAuthState(authData)
    setUser(authData)
    await loadActivities()
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      console.log('👋 Logging out')
      clearAuthState()
      setUser(null)
      setActivities([])
      setStreak(0)
      setTotalSolved(0)
      setShowAuth(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your puzzles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <AuthModal
        isOpen={showAuth}
        onClose={() => {}}
        onAuthSuccess={handleAuthSuccess}
      />
      
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <span className="font-bold text-lg">Puzzle Completed!</span>
              <span className="text-3xl">✨</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Daily Puzzle Tracker
              </h1>
              <p className="text-gray-600 text-lg">
                Complete puzzles daily and track your progress 📊
              </p>
            </div>
            
            {user && (
              <div className="flex items-center gap-4">
                {user.mode === 'google' && user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-md"
                  />
                )}
                <div className="text-left md:text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {user.name || 'Guest User'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {user.mode === 'guest' ? '👤 Guest Mode' : '🔐 Google Account'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.header>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <StreakDisplay streak={streak} />
          <StatsCard
            title="Total Solved"
            value={totalSolved}
            icon="✓"
            color="green"
          />
          <StatsCard
            title="This Year"
            value={totalSolved}
            icon="📅"
            color="purple"
          />
        </motion.div>

        {/* Puzzle Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <PuzzleContainer onComplete={handlePuzzleComplete} />
        </motion.div>

        {/* Heatmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Your Activity
            </h2>
            <div className="flex items-center gap-3">
              {user?.mode === 'guest' && (
                <span className="text-sm text-amber-600 font-medium">
                  ⚠️ Local storage only
                </span>
              )}
              {user?.mode === 'google' && (
                <span className="text-sm text-green-600 font-medium">
                  ☁️ Cloud sync enabled
                </span>
              )}
              <button
                onClick={handleSync}
                disabled={isSyncing || user?.mode === 'guest'}
                className={`
                  px-6 py-3 rounded-xl font-semibold transition-all shadow-lg
                  ${user?.mode === 'guest'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isSyncing
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                  }
                `}
              >
                {isSyncing ? '⏳ Syncing...' : '☁️ Sync Now'}
              </button>
            </div>
          </div>
          
          <HeatmapContainer activities={activities} />
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-gray-500 text-sm pb-8"
        >
          <p className="mb-2">
            ✨ Works 100% offline • Data stored locally with IndexedDB
          </p>
          <p className="text-xs">
            {user?.mode === 'guest' 
              ? '🔐 Sign in with Google to sync across devices' 
              : '☁️ Cloud sync active • Your data is safe'}
          </p>
        </motion.footer>
      </div>
    </div>
  )
}

export default App