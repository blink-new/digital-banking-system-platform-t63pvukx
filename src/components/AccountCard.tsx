import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CreditCard, Eye, EyeOff } from 'lucide-react'

interface Account {
  id: string
  userId: string
  accountNumber: string
  accountType: string
  balance: number
  currency: string
  status: string
  createdAt: string
}

interface AccountCardProps {
  account: Account
  balanceVisible: boolean
}

export function AccountCard({ account, balanceVisible }: AccountCardProps) {
  const formatAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'savings':
        return 'bg-green-100 text-green-800'
      case 'checking':
        return 'bg-blue-100 text-blue-800'
      case 'business':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {formatAccountType(account.accountType)} Account
        </CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Number</p>
            <p className="font-mono text-sm">{account.accountNumber}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">
                {balanceVisible 
                  ? `$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
                  : '••••••'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge className={getAccountTypeColor(account.accountType)}>
              {formatAccountType(account.accountType)}
            </Badge>
            <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
              {account.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}