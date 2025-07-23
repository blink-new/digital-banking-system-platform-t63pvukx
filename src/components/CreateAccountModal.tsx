import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { CreditCard, Plus } from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountCreated: () => void
  userId: string
}

export function CreateAccountModal({ isOpen, onClose, onAccountCreated, userId }: CreateAccountModalProps) {
  const [accountType, setAccountType] = useState('')
  const [accountName, setAccountName] = useState('')
  const [initialDeposit, setInitialDeposit] = useState('')
  const [purpose, setPurpose] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const accountTypes = [
    { value: 'checking', label: 'Checking Account', description: 'For everyday transactions', rate: '0.01%' },
    { value: 'savings', label: 'Savings Account', description: 'Earn interest on your balance', rate: '2.5%' },
    { value: 'business', label: 'Business Account', description: 'For business operations', rate: '1.8%' },
    { value: 'investment', label: 'Investment Account', description: 'High-yield investment account', rate: '4.2%' }
  ]

  const generateAccountNumber = () => {
    const prefix = accountType === 'checking' ? '1001' : 
                   accountType === 'savings' ? '2001' : 
                   accountType === 'business' ? '3001' : '4001'
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
    return `${prefix}${random}`
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountType || !accountName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    const deposit = parseFloat(initialDeposit) || 0
    if (deposit < 0) {
      toast({
        title: 'Error',
        description: 'Initial deposit cannot be negative',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const accountNumber = generateAccountNumber()
      const selectedType = accountTypes.find(type => type.value === accountType)
      
      await blink.db.accounts.create({
        id: `acc_${Date.now()}`,
        userId,
        accountNumber,
        accountType,
        accountName,
        balance: deposit,
        currency: 'USD',
        status: 'active',
        interestRate: selectedType?.rate,
        purpose: purpose || undefined
      })

      // If there's an initial deposit, create a transaction record
      if (deposit > 0) {
        await blink.db.transactions.create({
          id: `txn_${Date.now()}`,
          toAccountId: `acc_${Date.now()}`,
          amount: deposit,
          transactionType: 'deposit',
          description: 'Initial deposit',
          referenceNumber: `DEP${Date.now()}`,
          status: 'completed'
        })
      }

      toast({
        title: 'Success',
        description: `${selectedType?.label} created successfully!`,
      })

      // Reset form
      setAccountType('')
      setAccountName('')
      setInitialDeposit('')
      setPurpose('')
      
      onAccountCreated()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAccountType = accountTypes.find(type => type.value === accountType)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Create New Account</span>
          </DialogTitle>
          <DialogDescription>
            Choose the type of account that best fits your needs
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleCreateAccount} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {type.description} • {type.rate} APY
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccountType && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedAccountType.label}</p>
                <p className="text-sm text-muted-foreground">{selectedAccountType.description}</p>
                <p className="text-sm text-green-600 font-medium">
                  Annual Percentage Yield: {selectedAccountType.rate}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g., My Primary Checking"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-deposit">Initial Deposit (Optional)</Label>
            <Input
              id="initial-deposit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              You can add funds to your account later
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (Optional)</Label>
            <Textarea
              id="purpose"
              placeholder="What will you use this account for?"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading || !accountType || !accountName}
            >
              {isLoading ? (
                'Creating...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}