import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'
import { LoadingScreen } from './components/LoadingScreen'
import { AuthScreen } from './components/AuthScreen'
import { CustomerDashboard } from './components/CustomerDashboard'
import EnhancedAdminDashboard from './components/EnhancedAdminDashboard'

interface User {
  id: string
  email: string
  fullName?: string
  role?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  // Check if user is admin
  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      {isAdmin ? (
        <EnhancedAdminDashboard />
      ) : (
        <CustomerDashboard user={user} />
      )}
      <Toaster />
    </div>
  )
}

export default App