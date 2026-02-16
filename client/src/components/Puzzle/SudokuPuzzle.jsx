import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const SudokuPuzzle = ({ puzzle, onSolve, initialState }) => {
  const [grid, setGrid] = useState(initialState || puzzle.map(row => [...row]))
  const [selectedCell, setSelectedCell] = useState(null)
  
  useEffect(() => {
    if (initialState) {
      setGrid(initialState)
    }
  }, [initialState])
  
  const handleCellClick = (row, col) => {
    if (puzzle[row][col] === 0) {
      setSelectedCell({ row, col })
    }
  }
  
  const handleNumberInput = (num) => {
    if (selectedCell) {
      const { row, col } = selectedCell
      const newGrid = grid.map(r => [...r])
      newGrid[row][col] = num
      setGrid(newGrid)
      onSolve(newGrid)
    }
  }
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Grid */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const isGiven = puzzle[rowIdx][colIdx] !== 0
              const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx
              const isInSelectedRow = selectedCell?.row === rowIdx
              const isInSelectedCol = selectedCell?.col === colIdx
              
              return (
                <motion.button
                  key={`${rowIdx}-${colIdx}`}
                  whileHover={{ scale: isGiven ? 1 : 1.05 }}
                  whileTap={{ scale: isGiven ? 1 : 0.95 }}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                  disabled={isGiven}
                  className={`
                    w-12 h-12 md:w-16 md:h-16 text-xl md:text-2xl font-bold rounded-md transition-all
                    ${isGiven 
                      ? 'bg-gray-100 text-gray-900 cursor-not-allowed' 
                      : 'bg-white text-blue-600 hover:bg-blue-50 cursor-pointer'
                    }
                    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-100' : ''}
                    ${(isInSelectedRow || isInSelectedCol) && !isSelected ? 'bg-blue-50' : ''}
                    ${(rowIdx === 1 || rowIdx === 3) && (colIdx === 1 || colIdx === 3) ? 'border-r-2 border-gray-400' : ''}
                    ${(rowIdx === 1 || rowIdx === 3) && 'border-b-2 border-gray-400'}
                    border border-gray-300
                  `}
                >
                  {cell || ''}
                </motion.button>
              )
            })
          )}
        </div>
      </div>
      
      {/* Number Pad */}
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 'X'].map((num) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberInput(num === 'X' ? 0 : num)}
            disabled={!selectedCell}
            className={`
              w-12 h-12 md:w-14 md:h-14 text-xl font-bold rounded-lg transition-all
              ${selectedCell 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {num}
          </motion.button>
        ))}
      </div>
      
      <div className="text-sm text-gray-600 text-center max-w-md">
        <p>Fill each row, column, and 2×2 box with numbers 1-4</p>
        <p className="mt-1">Click a cell, then select a number</p>
      </div>
    </div>
  )
}

export default SudokuPuzzle