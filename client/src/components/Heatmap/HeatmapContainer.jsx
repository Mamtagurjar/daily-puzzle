import React from 'react'
import HeatmapGrid from './HeatmapGrid'
import Legend from './Legend'

const HeatmapContainer = ({ activities }) => {
  return (
    <div>
      <HeatmapGrid activities={activities} />
      <Legend />
    </div>
  )
}

export default HeatmapContainer