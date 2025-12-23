"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, Building2, Receipt, User, Calendar } from "lucide-react"

export type InvoiceData = {
  sale: {
    id: string
    saleDate: string
    totalAmount: number
    paidAmount: number
    outstandingAmount: number
    finalAmount: number
    changeAmount: number
    paymentMethod: string
    isPaid: boolean
    isCompleted: boolean
    isTaken: boolean
    isRefunded: boolean
  }
  customer: {
    id: string
    name: string
    customerType: string
    address: string
    phone: string
    email: string
    accountNumber: string
  }
  processedBy: {
    id: string
    username: string
    email: string
    gender: string
    telephone: string
    role: string
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      id: string
      productName: string
    }
    variation?: {
      id: string
      name: string
      unitSize: number
      unitofMeasure: string
    }
    generic?: {
      id: string
      batchNumber: string
      expiryDate: string
    }
  }>
  payments: Array<{
    id: string
    paidAmount: number
    debtType: string
    paymentMethod: string
    linkedFinancialAccountId: string | null
    description: string
    addedAt: string
  }>
}

interface InvoiceTemplateProps {
  data: InvoiceData
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyTaxId?: string
  showSignatures?: boolean
  includeOutstanding?: boolean
  includePaymentDetails?: boolean
  notes?: string
}

export function InvoiceTemplate({
  data,
  companyName = "Inventory Management System",
  companyAddress = "Kampala, Uganda",
  companyPhone = "+256 700 000 000",
  companyEmail = "info@company.com",
  companyTaxId = "TIN: 1234567890",
  showSignatures = true,
  includeOutstanding = true,
  includePaymentDetails = true,
}: InvoiceTemplateProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const handleDownload = () => {
    const invoiceText = `
INVOICE
${companyName}
${companyAddress}
${companyPhone} | ${companyEmail}
${companyTaxId}

Invoice Number: SA-${data.sale.id.slice(0, 8)}
Invoice Date: ${formatDate(data.sale.saleDate)}

BILL TO:
${data.customer.name}
${data.customer.address}
Phone: ${data.customer.phone}
Email: ${data.customer.email}
Account #: ${data.customer.accountNumber}

ITEMS:
${data.items
  .map(
    (item, index) => `
${index + 1}. ${item.product.productName}
   Quantity: ${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}
`,
  )
  .join("")}

PAYMENT SUMMARY:
Subtotal:              ${formatCurrency(data.sale.totalAmount)}
Total Amount:          ${formatCurrency(data.sale.finalAmount)}
Amount Paid:           ${formatCurrency(data.sale.paidAmount)}
Outstanding Balance:   ${formatCurrency(data.sale.outstandingAmount)}

Payment Method: ${data.sale.paymentMethod}
Status: ${data.sale.isPaid ? "PAID" : data.sale.paidAmount > 0 ? "PARTIALLY PAID" : "UNPAID"}

${
  data.payments.length > 0
    ? `
PAYMENT HISTORY:
${data.payments
  .map(
    (payment, index) => `
${index + 1}. ${formatDateTime(payment.addedAt)}
   Amount: ${formatCurrency(payment.paidAmount)}
   Method: ${payment.paymentMethod.replaceAll("_", " ")}
`,
  )
  .join("")}`
    : ""
}

Processed By: ${data.processedBy.username}
Date: ${formatDate(data.sale.saleDate)}

Thank you for your business!
    `

    const blob = new Blob([invoiceText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `invoice-${data.sale.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = () => {
    if (data.sale.isPaid) return "bg-green-500"
    if (data.sale.paidAmount > 0) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusText = () => {
    if (data.sale.isPaid) return "PAID"
    if (data.sale.paidAmount > 0) return "PARTIALLY PAID"
    return "UNPAID"
  }

  return (
    <>
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
          <Printer className="mr-2 h-4 w-4" />
          Print Invoice
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          {/* Header Section */}
          <CardHeader className="space-y-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  <CardTitle className="text-2xl">{companyName}</CardTitle>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{companyAddress}</p>
                  <p>
                    {companyPhone} | {companyEmail}
                  </p>
                  <p>{companyTaxId}</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2 justify-end">
                  <Receipt className="h-5 w-5" />
                  <h2 className="text-2xl font-bold">INVOICE</h2>
                </div>
                <Badge className={`${getStatusColor()} text-white`}>{getStatusText()}</Badge>
              </div>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  BILL TO
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{data.customer.name}</p>
                  <p className="text-muted-foreground">{data.customer.address}</p>
                  <p className="text-muted-foreground">Phone: {data.customer.phone}</p>
                  <p className="text-muted-foreground">Email: {data.customer.email}</p>
                  <p className="text-muted-foreground">Account #: {data.customer.accountNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-end items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-semibold">Invoice Date:</span>
                  </div>
                  <p className="text-muted-foreground">{formatDate(data.sale.saleDate)}</p>
                  <p className="font-semibold mt-3">Invoice Number:</p>
                  <p className="text-muted-foreground font-mono text-xs">SA-{data.sale.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Items Table */}
            <div>
              <h3 className="font-bold text-lg mb-3 bg-secondary/50 p-2 rounded">ITEMS</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-semibold">#</th>
                      <th className="text-left p-3 text-sm font-semibold">Description</th>
                      <th className="text-center p-3 text-sm font-semibold">Quantity</th>
                      <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                      <th className="text-right p-3 text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/20">
                        <td className="p-3 text-sm">{index + 1}</td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.product.productName}</p>
                            {/* {item.variation && (
                              <p className="text-xs text-muted-foreground">
                                {item.variation.name} ({item.variation.unitSize} {item.variation.unitofMeasure})
                              </p>
                            )}
                            {item.generic && (
                              <p className="text-xs text-muted-foreground">
                                Batch: {item.generic.batchNumber} | Expiry: {formatDate(item.generic.expiryDate)}
                              </p>
                            )} */}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-3 text-right font-mono font-medium">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-sm mb-3">PAYMENT DETAILS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <Badge variant="outline">{data.sale.paymentMethod}</Badge>
                  </div>
                  {data.sale.isRefunded && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="destructive">REFUNDED</Badge>
                    </div>
                  )}
                  {data.sale.isTaken && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery:</span>
                      <Badge variant="secondary">TAKEN</Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatCurrency(data.sale.totalAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span className="font-mono text-lg">{formatCurrency(data.sale.finalAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCurrency(data.sale.paidAmount)}</span>
                  </div>
                  {includeOutstanding && (
                    <div className="flex justify-between text-sm font-semibold">
                      <span className={data.sale.outstandingAmount > 0 ? "text-red-600 dark:text-red-400" : ""}>
                        Outstanding Balance:
                      </span>
                      <span
                        className={`font-mono ${data.sale.outstandingAmount > 0 ? "text-red-600 dark:text-red-400" : ""}`}
                      >
                        {formatCurrency(data.sale.outstandingAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History */}
            {includePaymentDetails && data.payments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-bold text-lg mb-3 bg-secondary/50 p-2 rounded">PAYMENT HISTORY</h3>
                  <div className="space-y-2">
                    {data.payments.map((payment, index) => (
                      <div key={payment.id} className="flex justify-between items-start p-3 bg-muted/20 rounded border">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Payment #{index + 1}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(payment.addedAt)}</p>
                          {/* <p className="text-xs text-muted-foreground">{payment.description}</p> */}
                          <Badge variant="outline" className="text-xs">
                            {payment.paymentMethod.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(payment.paidAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Footer Info */}
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Processed By:</span>
                <span className="font-medium">
                  {data.processedBy.username} ({data.processedBy.role})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date Processed:</span>
                <span className="font-medium">{formatDateTime(data.sale.saleDate)}</span>
              </div>
            </div>

            {/* Signatures Section */}
            {showSignatures && (
              <>
                <Separator />
                <div className="grid md:grid-cols-2 gap-8 pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Customer Signature:</p>
                    <div className="border-b-2 border-dashed h-16"></div>
                    <p className="text-xs text-muted-foreground">Date: _________________</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Authorized By:</p>
                    <div className="border-b-2 border-dashed h-16"></div>
                    <p className="text-xs text-muted-foreground">Date: _________________</p>
                  </div>
                </div>
              </>
            )}

            {/* Terms and Conditions */}
            <div className="bg-muted/20 p-4 rounded-lg mt-6">
              <p className="text-xs text-muted-foreground text-center">
                Thank you for your business! For any queries regarding this invoice, please contact us at {companyEmail}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Terms: Payment is due within 30 days. Late payments may incur additional charges.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
