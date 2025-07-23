import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  TrendingUp, 
  Calculator, 
  DollarSign,
  Calendar,
  Percent,
  ArrowUpRight
} from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'
import { format, addMonths, differenceInDays } from 'date-fns'

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

interface InterestCalculatorProps {
  accounts: Account[]
  onInterestApplied: () => void
}

export function InterestCalculator({ accounts, onInterestApplied }: InterestCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const { toast } = useToast()

  const interestEligibleAccounts = accounts.filter(
    account => account.accountType === 'savings' || 
               account.accountType === 'investment' ||
               account.accountType === 'business'
  )

  const calculateInterest = (account: Account, period: 'monthly' | 'quarterly' | 'yearly') => {
    const rate = parseFloat(account.interestRate?.replace('%', '') || '0') / 100
    const balance = account.balance
    
    let periodMultiplier = 1
    switch (period) {
      case 'monthly':
        periodMultiplier = 1/12
        break
      case 'quarterly':
        periodMultiplier = 1/4
        break
      case 'yearly':
        periodMultiplier = 1
        break
    }
    
    return balance * rate * periodMultiplier
  }

  const getNextInterestDate = (account: Account) => {
    const created = new Date(account.createdAt)
    const now = new Date()
    const daysSinceCreation = differenceInDays(now, created)
    
    // Calculate next monthly interest date
    const monthsSinceCreation = Math.floor(daysSinceCreation / 30)
    return addMonths(created, monthsSinceCreation + 1)
  }

  const handleApplyInterest = async () => {
    if (interestEligibleAccounts.length === 0) {
      toast({
        title: 'No Eligible Accounts',
        description: 'You need savings, investment, or business accounts to earn interest',
        variant: 'destructive'
      })
      return
    }

    setIsCalculating(true)
    try {
      let totalInterestApplied = 0

      for (const account of interestEligibleAccounts) {
        const interestAmount = calculateInterest(account, 'monthly')
        if (interestAmount > 0) {
          // Update account balance
          await blink.db.accounts.update(account.id, {
            balance: account.balance + interestAmount
          })

          // Create interest transaction
          await blink.db.transactions.create({
            id: `int_${Date.now()}_${account.id}`,
            toAccountId: account.id,
            amount: interestAmount,
            transactionType: 'interest',
            description: `Monthly interest payment - ${account.interestRate} APY`,
            referenceNumber: `INT${Date.now()}`,
            status: 'completed'
          })

          totalInterestApplied += interestAmount
        }
      }

      toast({
        title: 'Interest Applied Successfully',
        description: `$${totalInterestApplied.toFixed(2)} in interest has been added to your accounts`,
      })

      onInterestApplied()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply interest',
        variant: 'destructive'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const totalProjectedInterest = interestEligibleAccounts.reduce(
    (sum, account) => sum + calculateInterest(account, selectedPeriod), 
    0
  )

  const totalBalance = interestEligibleAccounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <div className="space-y-6">
      {/* Interest Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {interestEligibleAccounts.length} interest-bearing accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Interest</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${totalProjectedInterest.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} projection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interestEligibleAccounts.length > 0 
                ? (interestEligibleAccounts.reduce((sum, acc) => 
                    sum + parseFloat(acc.interestRate?.replace('%', '') || '0'), 0
                  ) / interestEligibleAccounts.length).toFixed(2)
                : '0.00'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Weighted average rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interest Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Interest Calculator</span>
          </CardTitle>
          <CardDescription>
            Calculate and apply interest to your eligible accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Period Selection */}
            <div className="flex space-x-2">
              {(['monthly', 'quarterly', 'yearly'] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>

            {/* Account Interest Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium">Interest Breakdown by Account</h4>
              {interestEligibleAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Interest-Bearing Accounts</h3>
                  <p className="text-muted-foreground">
                    Create a savings, investment, or business account to start earning interest
                  </p>
                </div>
              ) : (
                interestEligibleAccounts.map((account) => {
                  const interestAmount = calculateInterest(account, selectedPeriod)
                  const nextInterestDate = getNextInterestDate(account)
                  const progressDays = differenceInDays(new Date(), new Date(account.createdAt)) % 30
                  const progressPercent = (progressDays / 30) * 100

                  return (
                    <div key={account.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-medium">{account.accountName || account.accountNumber}</h5>
                          <p className="text-sm text-muted-foreground">
                            {account.accountType} • {account.interestRate} APY
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <Badge variant="outline" className="text-green-600">
                            +${interestAmount.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Next interest payment</span>
                          <span>{format(nextInterestDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {Math.max(0, 30 - progressDays)} days remaining
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Apply Interest Button */}
            {interestEligibleAccounts.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">Apply Monthly Interest</h4>
                    <p className="text-sm text-muted-foreground">
                      Add ${calculateInterest({ balance: totalBalance, interestRate: '2.5%' } as Account, 'monthly').toFixed(2)} to your accounts
                    </p>
                  </div>
                  <Button 
                    onClick={handleApplyInterest}
                    disabled={isCalculating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCalculating ? (
                      'Calculating...'
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Apply Interest
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Interest is typically applied monthly on the anniversary of account creation
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interest History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Interest History</span>
          </CardTitle>
          <CardDescription>
            Track your interest earnings over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Interest History Yet</h3>
              <p className="text-muted-foreground">
                Your interest payments will appear here once they start being applied
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}