import React from 'react'
import { motion } from 'framer-motion'

const StreakDisplay = ({ streak }) => {
  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-md p-6 border border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-700 text-sm font-medium mb-1">Current Streak</p>
          <motion.div
            className="text-4xl md:text-5xl font-extrabold text-orange-600"
            key={streak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {streak}
          </motion.div>
          <p className="text-gray-600 text-sm mt-1">
            {streak === 1 ? 'day' : 'days'}
          </p>
        </div>
        
        <motion.div
          className="text-6xl md:text-7xl"
          animate={{
            scale: streak > 0 ? [1, 1.15, 1] : 1,
            rotate: streak > 0 ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            repeat: streak > 0 ? Infinity : 0,
            duration: 2,
            ease: 'easeInOut',
          }}
        >
          🔥
        </motion.div>
      </div>
      
      {streak >= 7 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-3 py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-lg text-sm font-semibold text-center"
        >
          🎉 Week Streak! Incredible!
        </motion.div>
      )}
      
      {streak >= 30 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-semibold text-center"
        >
          💪 Month Streak! You're Unstoppable!
        </motion.div>
      )}
    </div>
  )
}

export default StreakDisplay