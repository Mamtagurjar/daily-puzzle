const AUTH_KEY = 'puzzle_auth'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Save auth state
export const saveAuthState = (authData) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
}

// Get auth state
export const getAuthState = () => {
  const data = localStorage.getItem(AUTH_KEY)
  return data ? JSON.parse(data) : null
}

// Clear auth state
export const clearAuthState = () => {
  localStorage.removeItem(AUTH_KEY)
}

// Check if authenticated
export const isAuthenticated = () => {
  return getAuthState() !== null
}

// Initiate Google OAuth login
export const initiateGoogleLogin = async () => {
  // Redirect to backend OAuth endpoint
  window.location.href = `${API_URL}/api/auth/google`
}

// Handle OAuth callback
export const handleOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const error = urlParams.get('error')
  
  if (error) {
    console.error('OAuth error:', error)
    return null
  }
  
  if (token) {
    try {
      // Verify token and get user info
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Token verification failed')
      }
      
      const userData = await response.json()
      
      const authData = {
        mode: 'google',
        token: token,
        userId: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
      }
      
      saveAuthState(authData)
      
      // Clean URL
      window.history.replaceState({}, document.title, '/')
      
      return authData
    } catch (error) {
      console.error('Auth callback error:', error)
      return null
    }
  }
  
  return null
}