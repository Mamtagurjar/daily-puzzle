import React, { useState } from 'react'
import { motion } from 'framer-motion'

const SequencePuzzle = ({ puzzle, onSolve, initialAnswer }) => {
  const [answer, setAnswer] = useState(initialAnswer || '')
  
  const handleSubmit = () => {
    if (answer) {
      onSolve(answer)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && answer) {
      handleSubmit()
    }
  }
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Sequence Display */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
          Find the missing number in the sequence
        </h3>
        
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          {puzzle.map((num, idx) => (
            <React.Fragment key={idx}>
              {num === null ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-dashed border-blue-500 rounded-lg flex items-center justify-center bg-blue-50">
                    <span className="text-3xl md:text-4xl text-blue-500 font-bold">?</span>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                    Position {idx + 1}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md"
                >
                  <span className="text-2xl md:text-3xl text-white font-bold">{num}</span>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Answer Input */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm px-4">
        <input
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your answer"
          className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
        />
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!answer}
          className={`
            w-full py-4 rounded-lg font-semibold text-lg transition-all
            ${answer 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Submit Answer
        </motion.button>
      </div>
      
      <div className="text-sm text-gray-600 text-center max-w-md">
        <p>Look for the pattern in the sequence</p>
        <p className="mt-1">Each number follows a mathematical rule</p>
      </div>
    </div>
  )
}

export default SequencePuzzle