import { Loader2 } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">SecureBank</h1>
          <p className="text-muted-foreground">Digital Banking Platform</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    </div>
  )
}