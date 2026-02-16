import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import SudokuPuzzle from './SudokuPuzzle'
import SequencePuzzle from './SequencePuzzle'
import { 
  getTodaysPuzzle, 
  validateSudoku, 
  validateSequence, 
  calculateScore 
} from '../../lib/puzzleEngine'
import { 
  saveActivity, 
  getActivityByDate, 
  savePuzzleProgress, 
  getPuzzleProgress 
} from '../../lib/db'

const PuzzleContainer = ({ onComplete }) => {
  const [puzzle, setPuzzle] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [savedProgress, setSavedProgress] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  const todayDate = dayjs().format('YYYY-MM-DD')
  
  // useEffect to initialize puzzle on mount
  useEffect(() => {
    let mounted = true
    
    const initPuzzle = async () => {
      try {
        // Check if already completed today
        const activity = await getActivityByDate(todayDate)
        if (!mounted) return
        
        if (activity && activity.solved) {
          setCompleted(true)
          return
        }
        
        // Load puzzle
        const dailyPuzzle = getTodaysPuzzle()
        if (!mounted) return
        
        setPuzzle(dailyPuzzle)
        console.log('📋 Today\'s Puzzle:', dailyPuzzle)
        
        // Load saved progress
        const progress = await getPuzzleProgress(todayDate)
        if (!mounted) return
        
        if (progress) {
          setSavedProgress(progress.progress)
          setStartTime(new Date(progress.savedAt).getTime())
          setHintsUsed(progress.hintsUsed || 0)
          console.log('💾 Loaded saved progress')
        } else {
          setStartTime(Date.now())
        }
      } catch (error) {
        if (!mounted) return
        console.error('Error initializing puzzle:', error)
        setErrorMessage('Failed to load puzzle. Please refresh the page.')
      }
    }
    
    initPuzzle()
    
    return () => {
      mounted = false
    }
  }, [todayDate])
  
  const handleSuccess = async () => {
    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000)
      const score = calculateScore(puzzle.difficulty, timeTaken, hintsUsed)
      
      console.log('🎉 Puzzle completed!')
      console.log('Time taken:', timeTaken, 'seconds')
      console.log('Hints used:', hintsUsed)
      console.log('Score:', score)
      
      await saveActivity({
        date: todayDate,
        solved: true,
        score,
        timeTaken,
        difficulty: puzzle.difficulty,
        hintsUsed,
      })
      
      setCompleted(true)
      onComplete({ score, timeTaken, difficulty: puzzle.difficulty })
    } catch (error) {
      console.error('Error saving completion:', error)
      alert('Puzzle completed but failed to save. Please try syncing manually.')
    }
  }
  
  const handleSolveAttempt = async (userSolution) => {
    setIsValidating(true)
    setShowError(false)
    setErrorMessage('')
    
    console.log('🔍 Validating solution...')
    console.log('Puzzle type:', puzzle.type)
    console.log('User solution:', userSolution)
    
    // Save progress automatically
    try {
      await savePuzzleProgress(todayDate, {
        progress: userSolution,
        hintsUsed,
      })
      console.log('💾 Progress saved')
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
    
    // Validate solution
    let isCorrect = false
    
    if (puzzle.type === 'sudoku') {
      console.log('Original puzzle:', puzzle.puzzle)
      console.log('User grid:', userSolution)
      
      // Check if grid is completely filled
      let hasEmptyCells = false
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (userSolution[i][j] === 0 || userSolution[i][j] === null || userSolution[i][j] === undefined) {
            hasEmptyCells = true
            console.log(`❌ Empty cell at [${i}][${j}]`)
            break
          }
        }
        if (hasEmptyCells) break
      }
      
      if (hasEmptyCells) {
        setErrorMessage('Please fill all cells before submitting!')
        setShowError(true)
        setTimeout(() => setShowError(false), 2000)
        setIsValidating(false)
        return
      }
      
      isCorrect = validateSudoku(puzzle.puzzle, userSolution)
      
    } else if (puzzle.type === 'sequence') {
      console.log('Expected answer:', puzzle.solution)
      console.log('User answer:', userSolution)
      
      isCorrect = validateSequence(puzzle.solution, userSolution)
    }
    
    console.log('✅ Validation result:', isCorrect ? 'CORRECT' : 'INCORRECT')
    
    setTimeout(() => {
      if (isCorrect) {
        handleSuccess()
      } else {
        setErrorMessage('Incorrect solution. Keep trying!')
        setShowError(true)
        setTimeout(() => setShowError(false), 2000)
      }
      setIsValidating(false)
    }, 500)
  }
  
  const handleUseHint = () => {
    if (hintsUsed < 3) {
      setHintsUsed(prev => prev + 1)
      setShowHint(true)
      setTimeout(() => setShowHint(false), 5000)
    }
  }
  
  const getHintText = () => {
    if (!puzzle) return ''
    
    if (puzzle.type === 'sudoku') {
      return "Look for rows or columns with only one empty cell! Each row, column, and 2×2 box must contain 1, 2, 3, and 4."
    } else if (puzzle.type === 'sequence') {
      if (puzzle.puzzle.length > 0) {
        const diff = puzzle.puzzle[1] - puzzle.puzzle[0]
        return `The pattern involves adding ${diff} each time`
      }
    }
    return ''
  }
  
  // Show completion screen
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-8xl mb-4"
        >
          ✅
        </motion.div>
        <h2 className="text-3xl font-bold text-green-800 mb-2">
          Puzzle Completed!
        </h2>
        <p className="text-green-700 text-lg">
          Great job! Come back tomorrow for a new challenge
        </p>
        <div className="mt-4 text-sm text-green-600">
          Next puzzle: {dayjs().add(1, 'day').format('dddd, MMMM D')}
        </div>
      </motion.div>
    )
  }
  
  // Loading state
  if (!puzzle) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading today's puzzle...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Today's {puzzle.type === 'sudoku' ? 'Sudoku' : 'Number Sequence'} Puzzle
            </h2>
            <p className="text-gray-600 mt-1">
              Difficulty: <span className={`font-semibold ${
                puzzle.difficulty === 'easy' ? 'text-green-600' :
                puzzle.difficulty === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {puzzle.difficulty.toUpperCase()}
              </span>
            </p>
          </div>
          
          <div className="text-left md:text-right">
            <div className="text-sm text-gray-600">Hints Used</div>
            <div className="text-3xl font-bold text-blue-600">{hintsUsed}/3</div>
          </div>
        </div>
        
        {/* Hint Button */}
        <button
          onClick={handleUseHint}
          disabled={hintsUsed >= 3}
          className={`
            w-full py-3 rounded-lg font-medium transition-all
            ${hintsUsed < 3 
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          💡 Use Hint ({3 - hintsUsed} remaining)
        </button>
        
        {/* Hint Display */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                <div className="flex items-start gap-2">
                  <span className="text-xl">💡</span>
                  <div>
                    <strong className="block mb-1">Hint:</strong>
                    <span>{getHintText()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error Display */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 bg-red-50 border-l-4 border-red-400 text-red-800 rounded">
                <div className="flex items-start gap-2">
                  <span className="text-xl">❌</span>
                  <div>
                    <strong className="block">Error:</strong>
                    <span>{errorMessage || 'Incorrect solution. Try again!'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Puzzle Area */}
      <div className="relative">
        {/* Validation Overlay */}
        {isValidating && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-10 rounded-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Checking your solution...</p>
          </div>
        )}
        
        {/* Puzzle Component */}
        {puzzle.type === 'sudoku' ? (
          <SudokuPuzzle 
            puzzle={puzzle.puzzle} 
            solution={puzzle.solution}
            onSolve={handleSolveAttempt}
            initialState={savedProgress}
          />
        ) : (
          <SequencePuzzle 
            puzzle={puzzle.puzzle} 
            solution={puzzle.solution}
            onSolve={handleSolveAttempt}
            initialAnswer={savedProgress}
          />
        )}
      </div>
      
      {/* Development Tools (only in dev mode) */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
          <div className="text-xs text-gray-600 mb-2">🔧 Development Tools</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                console.log('📋 Current Puzzle:', puzzle)
                console.log('💾 Saved Progress:', savedProgress)
              }}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              Log Puzzle Info
            </button>
            
            {puzzle.type === 'sudoku' && (
              <button
                onClick={() => {
                  console.log('✅ Correct Solution:', puzzle.solution)
                }}
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
              >
                Show Solution in Console
              </button>
            )}
            
            {puzzle.type === 'sequence' && (
              <button
                onClick={() => {
                  console.log('✅ Correct Answer:', puzzle.solution)
                }}
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
              >
                Show Answer in Console
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PuzzleContainer