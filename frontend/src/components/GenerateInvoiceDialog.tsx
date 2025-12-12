"use client"

import { useState } from "react"
import { FileText, Download, Printer, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

type Customer = {
  id: string
  name: string
  customerType: string
  address: string
  phone?: string
  email?: string
}

type DebtRecord = {
  id: string
  customerId: string
  saleDate: string
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  discount: number
  finalAmount: number
  profit: number
  paymentMethod: string
  customer: Customer
}

interface GenerateInvoiceDialogProps {
  debt: DebtRecord
  trigger?: React.ReactNode
}

export function GenerateInvoiceDialog({ debt, trigger }: GenerateInvoiceDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [includeOutstanding, setIncludeOutstanding] = useState(true)
  const [includePaymentDetails, setIncludePaymentDetails] = useState(true)
  const [notes, setNotes] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async (action: "download" | "print" | "email") => {
    setIsGenerating(true)
    
    // Simulate invoice generation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const invoiceData = {
      debtId: debt.id,
      customer: debt.customer,
      saleDate: debt.saleDate,
      totalAmount: debt.totalAmount,
      discount: debt.discount,
      finalAmount: debt.finalAmount,
      paidAmount: debt.paidAmount,
      outstandingAmount: debt.outstandingAmount,
      paymentMethod: debt.paymentMethod,
      includeOutstanding,
      includePaymentDetails,
      notes,
      generatedAt: new Date().toISOString(),
    }

    console.log(`${action} invoice:`, invoiceData)
    
    // Here you would call your API to generate the invoice
    // await api.post('/Invoices/Generate', invoiceData)
    
    setIsGenerating(false)
    setIsDialogOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="dark:bg-gray-900">
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 bg-white max-w-2xl" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice for {debt.customer.name}&apos;s debt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invoice Preview Info */}
          <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50 space-y-3">
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700">Invoice Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Customer</p>
                <p className="font-medium dark:text-white text-gray-900">{debt.customer.name}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Date</p>
                <p className="font-medium dark:text-white text-gray-900">{formatDate(debt.saleDate)}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Total Amount</p>
                <p className="font-medium dark:text-white text-gray-900">{formatCurrency(debt.finalAmount)}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Amount Paid</p>
                <p className="font-medium text-emerald-500">{formatCurrency(debt.paidAmount)}</p>
              </div>
              {includeOutstanding && (
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Outstanding</p>
                  <p className="font-medium text-red-500">{formatCurrency(debt.outstandingAmount)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700">Invoice Options</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="outstanding"
                checked={includeOutstanding}
                onCheckedChange={(checked) => setIncludeOutstanding(checked as boolean)}
              />
              <Label htmlFor="outstanding" className="text-sm cursor-pointer">
                Include outstanding balance
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="payment-details"
                checked={includePaymentDetails}
                onCheckedChange={(checked) => setIncludePaymentDetails(checked as boolean)}
              />
              <Label htmlFor="payment-details" className="text-sm cursor-pointer">
                Include payment details and history
              </Label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes for the invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="dark:bg-gray-700 dark:border-gray-600 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              className="dark:bg-gray-700"
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerate("email")}
              disabled={isGenerating || !debt.customer.email}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerate("print")}
              disabled={isGenerating}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={() => handleGenerate("download")}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
