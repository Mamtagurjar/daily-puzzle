import CryptoJS from 'crypto-js'
import dayjs from 'dayjs'

const SECRET_KEY = import.meta.env.VITE_PUZZLE_SECRET || 'default-secret'

// Generate deterministic seed from date
export const generateDailySeed = (date) => {
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  const hash = CryptoJS.SHA256(dateStr + SECRET_KEY).toString()
  return parseInt(hash.substring(0, 8), 16)
}

// Seeded random number generator (for deterministic puzzles)
class SeededRandom {
  constructor(seed) {
    this.seed = seed
  }
  
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
  
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
  
  shuffle(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}

// Get difficulty based on day of week
const getDifficultyLevel = (date) => {
  const dayOfWeek = dayjs(date).day()
  // Monday, Tuesday = easy
  if (dayOfWeek === 1 || dayOfWeek === 2) return 'easy'
  // Friday, Saturday = hard
  if (dayOfWeek === 5 || dayOfWeek === 6) return 'hard'
  // Rest = medium
  return 'medium'
}

// PUZZLE TYPE 1: Mini Sudoku (4x4)
export const generateSudoku = (date) => {
  const seed = generateDailySeed(date)
  const rng = new SeededRandom(seed)
  
  // Base valid 4x4 sudoku
  const base = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 3, 4, 1],
    [4, 1, 2, 3]
  ]
  
  // Shuffle numbers to create variation
  const numbers = [1, 2, 3, 4]
  const mapping = {}
  const shuffled = rng.shuffle(numbers)
  numbers.forEach((num, idx) => {
    mapping[num] = shuffled[idx]
  })
  
  // Apply mapping to create solution
  const solution = base.map(row => 
    row.map(cell => mapping[cell])
  )
  
  // Create puzzle by removing cells based on difficulty
  const puzzle = solution.map(row => [...row])
  const difficulty = getDifficultyLevel(date)
  const cellsToRemove = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10
  
  let removed = 0
  while (removed < cellsToRemove) {
    const row = rng.nextInt(0, 3)
    const col = rng.nextInt(0, 3)
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0
      removed++
    }
  }
  
  return {
    type: 'sudoku',
    puzzle,
    solution,
    difficulty,
  }
}

// PUZZLE TYPE 2: Number Sequence
export const generateSequence = (date) => {
  const seed = generateDailySeed(date)
  const rng = new SeededRandom(seed)
  const difficulty = getDifficultyLevel(date)
  
  // Generate arithmetic sequence
  const start = rng.nextInt(1, 20)
  const step = rng.nextInt(2, 8)
  const length = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 6 : 7
  
  const sequence = []
  for (let i = 0; i < length; i++) {
    sequence.push(start + step * i)
  }
  
  // Remove one number (not first or last for fairness)
  const missingIndex = rng.nextInt(1, length - 2)
  const answer = sequence[missingIndex]
  const puzzle = [...sequence]
  puzzle[missingIndex] = null
  
  return {
    type: 'sequence',
    puzzle,
    solution: answer,
    difficulty,
  }
}

// Get today's puzzle (deterministic)
export const getTodaysPuzzle = () => {
  const today = dayjs().format('YYYY-MM-DD')
  const seed = generateDailySeed(today)
  
  // Alternate between puzzle types based on seed
  const puzzleType = seed % 2 === 0 ? 'sudoku' : 'sequence'
  
  return puzzleType === 'sudoku' ? generateSudoku(today) : generateSequence(today)
}

// Validate Sudoku solution - FIXED VERSION
export const validateSudoku = (puzzle, userSolution) => {
  if (!userSolution || userSolution.length !== 4) {
    console.log('Invalid solution format')
    return false
  }
  
  // Check if all cells are filled
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const value = userSolution[i][j]
      if (value === 0 || value === null || value === undefined) {
        console.log('Empty cell found at', i, j)
        return false
      }
      if (value < 1 || value > 4) {
        console.log('Invalid value at', i, j, ':', value)
        return false
      }
    }
  }
  
  // Validate rows
  for (let i = 0; i < 4; i++) {
    const row = new Set()
    for (let j = 0; j < 4; j++) {
      const value = userSolution[i][j]
      if (row.has(value)) {
        console.log('Duplicate in row', i, ':', value)
        return false
      }
      row.add(value)
    }
    if (row.size !== 4) {
      console.log('Row', i, 'incomplete')
      return false
    }
  }
  
  // Validate columns
  for (let j = 0; j < 4; j++) {
    const col = new Set()
    for (let i = 0; i < 4; i++) {
      const value = userSolution[i][j]
      if (col.has(value)) {
        console.log('Duplicate in column', j, ':', value)
        return false
      }
      col.add(value)
    }
    if (col.size !== 4) {
      console.log('Column', j, 'incomplete')
      return false
    }
  }
  
  // Validate 2x2 boxes
  for (let boxRow = 0; boxRow < 2; boxRow++) {
    for (let boxCol = 0; boxCol < 2; boxCol++) {
      const box = new Set()
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const value = userSolution[boxRow * 2 + i][boxCol * 2 + j]
          if (box.has(value)) {
            console.log('Duplicate in box', boxRow, boxCol, ':', value)
            return false
          }
          box.add(value)
        }
      }
      if (box.size !== 4) {
        console.log('Box', boxRow, boxCol, 'incomplete')
        return false
      }
    }
  }
  
  console.log('✅ Sudoku valid!')
  return true
}

// Validate Sequence solution
export const validateSequence = (solution, userAnswer) => {
  return parseInt(userAnswer) === solution
}

// Calculate score based on difficulty, time, and hints
export const calculateScore = (difficulty, timeTaken, hintsUsed) => {
  let baseScore = 100
  
  // Difficulty multiplier
  if (difficulty === 'easy') baseScore = 60
  if (difficulty === 'medium') baseScore = 80
  if (difficulty === 'hard') baseScore = 100
  
  // Time bonus (faster = better, max 20 bonus points)
  const timeBonus = Math.max(0, Math.min(20, 20 - Math.floor(timeTaken / 30)))
  
  // Hint penalty (10 points per hint)
  const hintPenalty = hintsUsed * 10
  
  // Calculate final score (0-100 range)
  const finalScore = Math.max(0, Math.min(100, baseScore + timeBonus - hintPenalty))
  
  return Math.round(finalScore)
}

// Get puzzle for specific date (for testing)
export const getPuzzleForDate = (date) => {
  const seed = generateDailySeed(date)
  const puzzleType = seed % 2 === 0 ? 'sudoku' : 'sequence'
  
  return puzzleType === 'sudoku' ? generateSudoku(date) : generateSequence(date)
}