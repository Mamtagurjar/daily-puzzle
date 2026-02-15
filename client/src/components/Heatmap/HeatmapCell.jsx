import React, { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { getIntensityColor } from '../../lib/heatmap'
import Tooltip from './Tooltip'

const HeatmapCell = memo(({ cellData, index }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const { date, activity, intensity, isFuture, isToday } = cellData
  
  if (isFuture) {
    return <div className="w-3 h-3 bg-gray-100 rounded-sm" />
  }
  
  const colorClass = getIntensityColor(intensity)
  
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: index * 0.001,
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        className={`
          w-3 h-3 rounded-sm cursor-pointer transition-all
          ${colorClass}
          ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && <Tooltip cellData={cellData} />}
    </div>
  )
})

HeatmapCell.displayName = 'HeatmapCell'

export default HeatmapCell