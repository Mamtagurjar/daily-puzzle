import React from 'react'
import dayjs from 'dayjs'

const Tooltip = ({ cellData }) => {
  const { date, activity } = cellData
  const formattedDate = dayjs(date).format('MMM D, YYYY')
  
  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
        <div className="font-semibold mb-1">{formattedDate}</div>
        {activity ? (
          <>
            <div>Score: {activity.score}/100</div>
            <div>Time: {activity.timeTaken}s</div>
            <div>Difficulty: {activity.difficulty}</div>
            {activity.hintsUsed > 0 && (
              <div>Hints: {activity.hintsUsed}</div>
            )}
            <div className="mt-1 text-emerald-400 font-semibold">✓ Completed</div>
          </>
        ) : (
          <div className="text-gray-400">No activity</div>
        )}
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}

export default Tooltip