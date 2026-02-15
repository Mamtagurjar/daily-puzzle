import React, { useMemo } from 'react'
import HeatmapColumn from './HeatmapColumn'
import { generateHeatmapData, getMonthLabels } from '../../lib/heatmap'

const HeatmapGrid = ({ activities }) => {
  const weeks = useMemo(() => generateHeatmapData(activities), [activities])
  const monthLabels = useMemo(() => getMonthLabels(), [])
  
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return (
    <div className="overflow-x-auto pb-4">
      {/* Month labels */}
      <div className="flex gap-1 mb-2 ml-12">
        {monthLabels.map((month, i) => (
          <div key={i} className="text-xs text-gray-600 min-w-[48px]">
            {month}
          </div>
        ))}
      </div>
      
      {/* Grid container */}
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 justify-start pt-0">
          {dayLabels.map((day, i) => (
            <div
              key={day}
              className="text-xs text-gray-600 h-3 flex items-center"
              style={{ opacity: i % 2 === 0 ? 1 : 0 }}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Weeks grid */}
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <HeatmapColumn
              key={weekIndex}
              week={week}
              weekIndex={weekIndex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default HeatmapGrid