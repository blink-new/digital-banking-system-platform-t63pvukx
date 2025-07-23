import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Shield, CreditCard, TrendingUp, Users } from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

export function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = () => {
    setIsLoading(true)
    try {
      blink.auth.login()
    } catch (error) {
      toast({
        title: 'Login Error',
        description: 'Failed to initiate login process',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 bg-primary rounded-md"></div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              SecureBank
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your trusted digital banking platform with enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Bank-Grade Security</h3>
              <p className="text-sm text-muted-foreground">256-bit encryption</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Instant Transfers</h3>
              <p className="text-sm text-muted-foreground">Real-time processing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">Smart Analytics</h3>
              <p className="text-sm text-muted-foreground">Track your spending</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-1">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your secure banking dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  {isLoading ? 'Connecting...' : 'Sign In Securely'}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Secured by Blink Authentication</p>
                  <p className="mt-2">🔒 Your data is encrypted and protected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo accounts available:</p>
            <p className="mt-1">
              <span className="font-medium">Customer:</span> Any email • 
              <span className="font-medium ml-2">Admin:</span> admin@securebank.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}