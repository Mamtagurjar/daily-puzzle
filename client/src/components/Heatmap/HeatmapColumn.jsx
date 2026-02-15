import React, { memo } from 'react'
import HeatmapCell from './HeatmapCell'

const HeatmapColumn = memo(({ week, weekIndex }) => {
  return (
    <div className="flex flex-col gap-1">
      {week.map((cellData, dayIndex) => (
        <HeatmapCell
          key={cellData.date}
          cellData={cellData}
          index={weekIndex * 7 + dayIndex}
        />
      ))}
    </div>
  )
})

HeatmapColumn.displayName = 'HeatmapColumn'

export default HeatmapColumn