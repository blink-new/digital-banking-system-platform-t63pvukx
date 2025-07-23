import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Send, ArrowRight } from 'lucide-react'
import { blink } from '../blink/client'
import { useToast } from '../hooks/use-toast'

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

interface TransferFormProps {
  accounts: Account[]
  onTransferComplete: () => void
}

export function TransferForm({ accounts, onTransferComplete }: TransferFormProps) {
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fromAccount || !toAccount || !amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    if (fromAccount === toAccount) {
      toast({
        title: 'Error',
        description: 'Cannot transfer to the same account',
        variant: 'destructive'
      })
      return
    }

    const transferAmount = parseFloat(amount)
    if (transferAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Transfer amount must be greater than 0',
        variant: 'destructive'
      })
      return
    }

    const sourceAccount = accounts.find(acc => acc.id === fromAccount)
    if (!sourceAccount || sourceAccount.balance < transferAmount) {
      toast({
        title: 'Error',
        description: 'Insufficient funds in source account',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      // Generate reference number
      const referenceNumber = `TXN${Date.now()}`
      
      // Create transaction record
      await blink.db.transactions.create({
        id: `txn_${Date.now()}`,
        fromAccountId: fromAccount,
        toAccountId: toAccount,
        amount: transferAmount,
        transactionType: 'transfer',
        description: description || 'Fund transfer',
        referenceNumber,
        status: 'completed'
      })

      // Update account balances
      await blink.db.accounts.update(fromAccount, {
        balance: sourceAccount.balance - transferAmount
      })

      const targetAccount = accounts.find(acc => acc.id === toAccount)
      if (targetAccount) {
        await blink.db.accounts.update(toAccount, {
          balance: targetAccount.balance + transferAmount
        })
      }

      // Reset form
      setFromAccount('')
      setToAccount('')
      setAmount('')
      setDescription('')
      
      toast({
        title: 'Success',
        description: `Transfer of $${transferAmount.toFixed(2)} completed successfully`,
      })

      // Refresh data
      onTransferComplete()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process transfer',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFromAccount = accounts.find(acc => acc.id === fromAccount)

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Transfer Funds</span>
          </CardTitle>
          <CardDescription>
            Transfer money between your accounts instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-account">From Account</Label>
                <Select value={fromAccount} onValueChange={setFromAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex flex-col">
                          <span>{account.accountNumber}</span>
                          <span className="text-sm text-muted-foreground">
                            Balance: ${account.balance.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFromAccount && (
                  <p className="text-sm text-muted-foreground">
                    Available: ${selectedFromAccount.balance.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-account">To Account</Label>
                <Select value={toAccount} onValueChange={setToAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter(account => account.id !== fromAccount)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex flex-col">
                            <span>{account.accountNumber}</span>
                            <span className="text-sm text-muted-foreground">
                              {account.accountType} account
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What's this transfer for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {fromAccount && toAccount && amount && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Transfer Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span>{accounts.find(acc => acc.id === fromAccount)?.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span>{accounts.find(acc => acc.id === toAccount)?.accountNumber}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Amount:</span>
                    <span>${parseFloat(amount || '0').toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading || !fromAccount || !toAccount || !amount}
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  Transfer ${parseFloat(amount || '0').toFixed(2)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}