import React from 'react'
import { getIntensityColor } from '../../lib/heatmap'

const Legend = () => {
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-gray-600 mt-4">
      <span className="mr-1">Less</span>
      {[0, 1, 2, 3, 4].map(level => (
        <div
          key={level}
          className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
          title={`Level ${level}`}
        />
      ))}
      <span className="ml-1">More</span>
    </div>
  )
}

export default Legend