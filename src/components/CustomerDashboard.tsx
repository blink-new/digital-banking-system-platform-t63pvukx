import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  CreditCard, 
  Send, 
  History, 
  Eye, 
  EyeOff, 
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  LogOut,
  User,
  Shield,
  Settings
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'
import { AccountCard } from './AccountCard'
import { TransferForm } from './TransferForm'
import { TransactionHistory } from './TransactionHistory'
import { CreateAccountModal } from './CreateAccountModal'
import { SecuritySettings } from './SecuritySettings'
import { InterestCalculator } from './InterestCalculator'
import AnalyticsDashboard from './AnalyticsDashboard'

interface User {
  id: string
  email: string
  fullName?: string
  role?: string
}

interface Account {
  id: string
  userId: string
  accountNumber: string
  accountType: string
  accountName?: string
  balance: number
  currency: string
  status: string
  interestRate?: string
  purpose?: string
  createdAt: string
}

interface Transaction {
  id: string
  fromAccountId?: string
  toAccountId?: string
  amount: number
  transactionType: string
  description?: string
  referenceNumber: string
  status: string
  createdAt: string
}

export function CustomerDashboard({ user }: { user: User }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const { toast } = useToast()

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load user accounts
      const userAccounts = await blink.db.accounts.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setAccounts(userAccounts)

      // Load recent transactions
      const accountIds = userAccounts.map(acc => acc.id)
      if (accountIds.length > 0) {
        const recentTransactions = await blink.db.transactions.list({
          where: {
            OR: [
              { fromAccountId: { in: accountIds } },
              { toAccountId: { in: accountIds } }
            ]
          },
          orderBy: { createdAt: 'desc' },
          limit: 10
        })
        setTransactions(recentTransactions)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load account data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [user.id, toast])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

  const handleCreateAccount = () => {
    setShowCreateAccount(true)
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-md"></div>
              </div>
              <div>
                <h1 className="text-xl font-semibold">SecureBank</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Balance Overview */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-100 mb-1">Total Balance</p>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-3xl font-bold">
                      {balanceVisible ? `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="text-white hover:bg-white/20"
                    >
                      {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 mb-1">{accounts.length} Account{accounts.length !== 1 ? 's' : ''}</p>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="flex items-center text-blue-100">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+2.5% this month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="accounts" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span>Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Transfer</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Accounts</h3>
              <Button onClick={handleCreateAccount}>
                <Plus className="w-4 h-4 mr-2" />
                New Account
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard 
                  key={account.id} 
                  account={account} 
                  balanceVisible={balanceVisible}
                />
              ))}
              {accounts.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first account to start banking with us
                    </p>
                    <Button onClick={handleCreateAccount}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transfer">
            <TransferForm accounts={accounts} onTransferComplete={loadUserData} />
          </TabsContent>

          <TabsContent value="history">
            <TransactionHistory transactions={transactions} accounts={accounts} />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings user={user} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <AnalyticsDashboard />
              <InterestCalculator accounts={accounts} onInterestApplied={loadUserData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        onAccountCreated={loadUserData}
        userId={user.id}
      />
    </div>
  )
}