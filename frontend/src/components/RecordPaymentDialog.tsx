"use client"

import { useState, useEffect } from "react"
import { DollarSign, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/Utils/Request"

type DebtRecord = {
  id: string
  customerId: string
  outstandingAmount: number
  finalAmount: number
  paidAmount: number
  totalAmount: number
  discount: number
  customer: {
    name: string
  }
}

interface RecordPaymentDialogProps {
  debt: DebtRecord
  onPaymentRecorded: (paymentData: any) => void
  trigger?: React.ReactNode
}

export function RecordPaymentDialog({ debt, onPaymentRecorded, trigger }: RecordPaymentDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [financialAccounts, setFinancialAccounts] = useState<Array<{
    id: string;
    accountName: string;
    bankName: string;
    type: string;
  }>>([])
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "CASH",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
    linkedFinancialAccountId: "",
  })

  // Fetch financial accounts on component mount
  useEffect(() => {
    const fetchFinancialAccounts = async () => {
      try {
        const response = await api.get('/FinancialAccounts?includeMetadata=false&page=1&pageSize=100')
        setFinancialAccounts(response.data.financialAccounts || [])
      } catch (error) {
        console.error('Error fetching financial accounts:', error)
      }
    }
    fetchFinancialAccounts()
  }, [])

  const CheckIfBusinessDayisOpen = async (): Promise<boolean> => {
    const response = await api.get('/CashReconciliations/is-today-open')
    return response.data.isOpen as boolean
  }

  const validateAmount = (value: string) => {
    const amount = parseFloat(value)
    if (isNaN(amount) || amount <= 0) {
      return "Please enter a valid amount"
    }
    if (amount > debt.outstandingAmount) {
      return `Amount cannot exceed outstanding balance of Shs ${debt.outstandingAmount.toLocaleString()}`
    }
    return null
  }

  const handleAmountChange = (value: string) => {
    setFormData({ ...formData, amount: value })
    const validationError = validateAmount(value)
    setError(validationError)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isOpen = await CheckIfBusinessDayisOpen()
    if (!isOpen) {
      setError("Cannot record payment. Business day is not open.")
      return
    }

    const validationError = validateAmount(formData.amount)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const paymentData = {
        saleId: debt.id,
        paidAmount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        description: formData.notes || `Payment for ${debt.customer.name}'s debt`,
        debtType: "Receivable",
        linkedFinancialAccountId: formData.linkedFinancialAccountId || null,
      }

      // Call the API to record payment
      await api.post('/SalesDebtsTracker', paymentData)

      console.log("Payment recorded successfully:", paymentData)

      onPaymentRecorded(paymentData)

      // Reset form and close dialog
      setFormData({
        amount: "",
        paymentMethod: "CASH",
        notes: "",
        paymentDate: new Date().toISOString().split("T")[0],
        linkedFinancialAccountId: "",
      })
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("Error recording payment:", err)
      
      // Extract error message from response
      let errorMessage = "Failed to record payment. Please try again."
      
      if (err.response?.data) {
        const responseData = err.response.data
        
        // Handle different response formats
        if (typeof responseData === 'string') {
          // Direct string response (e.g., BadRequest("message"))
          errorMessage = responseData
        } else if (responseData.message) {
          // Standard error object with message field
          errorMessage = responseData.message
        } else if (responseData.error) {
          // Alternative error field
          errorMessage = responseData.error
        } else if (responseData.title) {
          // ProblemDetails format
          errorMessage = responseData.title
        } else if (responseData.detail) {
          // ProblemDetails detail field
          errorMessage = responseData.detail
        } else if (Array.isArray(responseData) && responseData.length > 0) {
          // Array of errors (validation errors)
          errorMessage = responseData.map((e: any) => e.message || e).join(', ')
        }
      } else if (err.message) {
        // Network or other error
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      amount: "",
      paymentMethod: "CASH",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
      linkedFinancialAccountId: "",
    })
    setError(null)
  }

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const remainingAfterPayment = formData.amount
    ? debt.outstandingAmount - parseFloat(formData.amount)
    : debt.outstandingAmount

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open)
      if (!open) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="dark:bg-gray-900">
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 bg-white max-w-lg" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {debt.customer.name}&apos;s debt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Debt Summary */}
          <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-400 text-gray-600">Total Debt:</span>
              <span className="font-semibold dark:text-white text-gray-900">{formatCurrency(debt.totalAmount - debt.discount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-400 text-gray-600">Already Paid:</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(debt.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t dark:border-gray-600 border-gray-300 pt-2">
              <span className="dark:text-gray-400 text-gray-600">Outstanding:</span>
              <span className="font-bold text-red-500">{formatCurrency(debt.outstandingAmount)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (Shs) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 dark:text-gray-400 text-gray-500" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                required
                className={`pl-10 dark:bg-gray-700 dark:border-gray-600 ${error ? "border-red-500" : ""}`}
              />
            </div>
            {formData.amount && !error && (
              <p className="text-xs dark:text-gray-400 text-gray-600">
                Remaining after payment: <span className="font-semibold">{formatCurrency(remainingAfterPayment)}</span>
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
              className="dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700">
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="BANK">Bank</SelectItem>
                <SelectItem value="SAVINGS">Savings</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Financial Account */}
          <div className="space-y-2">
            <Label htmlFor="financialAccount">Financial Account (Optional)</Label>
            <Select
              value={formData.linkedFinancialAccountId || undefined}
              onValueChange={(value) => {
                setFormData({ ...formData, linkedFinancialAccountId: value })
                // Auto-set payment method based on account type
                const selectedAccount = financialAccounts.find(acc => acc.id === value)
                if (selectedAccount) {
                  setFormData(prev => ({ ...prev, paymentMethod: selectedAccount.type, linkedFinancialAccountId: value }))
                }
              }}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Select financial account (optional)" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700">
                {financialAccounts
                  .filter(account => account.type !== 'CREDIT')
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - {account.bankName} ({account.type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this payment..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="dark:bg-gray-700 dark:border-gray-600 resize-none"
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              className="dark:bg-gray-700"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting || !!error}
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
