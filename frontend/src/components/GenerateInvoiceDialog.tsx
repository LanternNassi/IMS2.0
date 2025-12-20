"use client"

import React, { useState, useEffect } from "react"
import { FileText, Download, Printer, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/Utils/Request"
import { pdf } from '@react-pdf/renderer'
import { useReactToPrint } from 'react-to-print'
import { InvoicePdfDocument } from '../components/reports/pdf/InvoicePdfDocument'
import { InvoiceTemplate } from '../components/reports/pdf/InvoicePdf'
import type { InvoiceData } from '../components/reports/pdf/InvoicePdf'

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
  data: DebtRecord
  trigger?: React.ReactNode
}

export function GenerateInvoiceDialog({ data, trigger }: GenerateInvoiceDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [includeOutstanding, setIncludeOutstanding] = useState(true)
  const [includePaymentDetails, setIncludePaymentDetails] = useState(true)
  const [notes, setNotes] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)

  const printRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${data.id}`,
  })


  const handleGenerate = async (action: "download" | "print" | "email") => {
    setIsGenerating(true)

    try {
      if (action === "download") {
        const pdfDoc = (
          <InvoicePdfDocument
            data={invoiceData!}
            includeOutstanding={includeOutstanding}
            includePaymentDetails={includePaymentDetails}
            notes={notes}
          />
        )

        const blob = await pdf(pdfDoc).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${data.id}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (action === "print") {
        handlePrint()
      } else if (action === "email") {
        // For email, you would integrate with your email service
        alert(`Email functionality would send invoice to ${data.customer.email}`)
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert('Error generating invoice. Please try again.')
    } finally {
      setIsGenerating(false)
      setIsDialogOpen(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const getInvoiceData = async (): Promise<InvoiceData> => {
    const response = await api.get(`/Sales/Invoice/${data.id}`)
    return response.data as InvoiceData
  }

  useEffect(() => {
    if (isDialogOpen) {
      getInvoiceData().then((invoice) => setInvoiceData(invoice))
    }
  }, [isDialogOpen])

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
          <Button variant="outline" size="sm" className="dark:bg-primary-dark dark:text-primary-foreground">
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-background-dark bg-background max-w-2xl" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an invoice for {data.customer.name}&apos;s sale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Invoice Preview Info */}
          <div className="p-4 rounded-lg dark:bg-primary-dark/20 bg-primary/20 space-y-3">
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700">Invoice Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Customer</p>
                <p className="font-medium dark:text-white text-gray-900">{data.customer.name}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Date</p>
                <p className="font-medium dark:text-white text-gray-900">{formatDate(data.saleDate)}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Total Amount</p>
                <p className="font-medium dark:text-white text-gray-900">{formatCurrency(data.finalAmount)}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Amount Paid</p>
                <p className="font-medium text-emerald-500">{formatCurrency(data.paidAmount)}</p>
              </div>
              {includeOutstanding && (
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Outstanding</p>
                  <p className="font-medium text-red-500">{formatCurrency(data.outstandingAmount)}</p>
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
                className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
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
                className="data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
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
              className="dark:bg-primary-dark dark:border-outline-dark dark:text-primary-foreground resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-outline-dark">
            <Button
              variant="outline"
              className="dark:bg-primary-dark dark:text-primary-foreground"
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerate("email")}
              className="dark:bg-primary-dark dark:text-primary-foreground"
              disabled={isGenerating || !data.customer.email}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerate("print")}
              disabled={isGenerating}
              className="dark:bg-primary-dark dark:text-primary-foreground"
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

        {/* Hidden print component */}
        <div style={{ display: 'none' }}>
          {
            invoiceData == null ? null : (
              <div ref={printRef}>
                <InvoiceTemplate
                  data={invoiceData!}
                  showSignatures={true}
                  includeOutstanding={includeOutstanding}
                  includePaymentDetails={includePaymentDetails}
                  notes={notes}
                />
              </div>
            )
          }

        </div>
      </DialogContent>
    </Dialog>
  )
}
