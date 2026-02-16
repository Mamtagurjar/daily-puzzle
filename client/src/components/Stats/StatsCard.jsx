import React from 'react'
import { motion } from 'framer-motion'

const StatsCard = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-600',
    green: 'from-green-50 to-emerald-50 border-green-200 text-green-600',
    purple: 'from-purple-50 to-pink-50 border-purple-200 text-purple-600',
  }
  
  const iconColors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-6 border`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-700 text-sm font-medium mb-1">{title}</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-4xl md:text-5xl font-extrabold ${colorClasses[color]}`}
          >
            {value}
          </motion.div>
        </div>
        <div className={`text-4xl md:text-5xl px-4 py-3 rounded-2xl ${iconColors[color]} shadow-sm`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

export default StatsCard