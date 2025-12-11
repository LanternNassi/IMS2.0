"use client"

import { useState, useEffect } from "react"
import { History, DollarSign, Calendar, CreditCard, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/Utils/Request"

type PaymentHistoryItem = {
  id: string
  paidAmount: number
  debtType: string
  paymentMethod: string
  description: string
  addedAt: string
}

type PaymentHistoryData = {
  sale: {
    id: string
    saleDate: string
    totalAmount: number
    paidAmount: number
    remainingBalance: number
    isPaid: boolean
    customer: {
      id: string
      name: string
      phone?: string
    }
  }
  paymentHistory: PaymentHistoryItem[]
  summary: {
    totalPayments: number
    totalPaidViaTracker: number
    remainingBalance: number
  }
}

interface PaymentHistoryDialogProps {
  saleId: string
  customerName: string
  trigger?: React.ReactNode
}

export function PaymentHistoryDialog({ saleId, customerName, trigger }: PaymentHistoryDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PaymentHistoryData | null>(null)

  const fetchPaymentHistory = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get(`/SalesDebtsTracker/BySale/${saleId}`)
      setData(response.data)
    } catch (err: any) {
      console.error("Error fetching payment history:", err)
      setError(err.response?.data?.message || "Failed to load payment history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isDialogOpen) {
      fetchPaymentHistory()
    }
  }, [isDialogOpen, saleId])

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      CASH: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      MOBILE_MONEY: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      BANK_TRANSFER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      CREDIT: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    }
    return colors[method] || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="dark:bg-gray-900">
            <History className="h-4 w-4 mr-2" />
            Payment History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 bg-white max-w-4xl max-h-[90vh] overflow-y-auto" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Payment History</DialogTitle>
          <DialogDescription>
            Payment records for {customerName}&apos;s debt
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="dark:text-gray-400 text-gray-600">Loading payment history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <Button onClick={fetchPaymentHistory} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-6 mt-4">
            {/* Sale Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="dark:bg-gray-700/30 bg-gray-50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium dark:text-gray-400 text-gray-600 mb-1">Total Sale Amount</p>
                      <p className="text-xl font-bold dark:text-white text-gray-900">
                        {formatCurrency(data.sale.totalAmount)}
                      </p>
                      <p className="text-xs dark:text-gray-400 text-gray-500 mt-1">
                        Sale Date: {formatDate(data.sale.saleDate)}
                      </p>
                    </div>
                    <DollarSign className="h-5 w-5 dark:text-gray-400 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-emerald-900/20 bg-emerald-50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium dark:text-emerald-300 text-emerald-700 mb-1">Total Paid</p>
                      <p className="text-xl font-bold dark:text-emerald-400 text-emerald-600">
                        {formatCurrency(data.sale.paidAmount)}
                      </p>
                      <p className="text-xs dark:text-emerald-400 text-emerald-600 mt-1">
                        {data.summary.totalPayments} payment{data.summary.totalPayments !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <CreditCard className="h-5 w-5 dark:text-emerald-400 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`${data.sale.remainingBalance > 0 ? "dark:bg-red-900/20 bg-red-50" : "dark:bg-gray-700/30 bg-gray-50"}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs font-medium mb-1 ${data.sale.remainingBalance > 0 ? "dark:text-red-300 text-red-700" : "dark:text-gray-400 text-gray-600"}`}>
                        Remaining Balance
                      </p>
                      <p className={`text-xl font-bold ${data.sale.remainingBalance > 0 ? "dark:text-red-400 text-red-600" : "dark:text-gray-400 text-gray-600"}`}>
                        {formatCurrency(data.sale.remainingBalance)}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${data.sale.isPaid ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}
                      >
                        {data.sale.isPaid ? "Fully Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Info */}
            <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-2">Customer Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Name</p>
                  <p className="font-medium dark:text-white text-gray-900">{data.sale.customer.name}</p>
                </div>
                {data.sale.customer.phone && (
                  <div>
                    <p className="text-xs dark:text-gray-400 text-gray-500">Phone</p>
                    <p className="font-medium dark:text-white text-gray-900">{data.sale.customer.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History Table */}
            <div>
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Payment Transactions</h4>
              {data.paymentHistory && data.paymentHistory.length > 0 ? (
                <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                        <TableHead className="text-xs font-semibold">Date & Time</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount Paid</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Payment Method</TableHead>
                        <TableHead className="text-xs font-semibold">Description</TableHead>
                        <TableHead className="text-xs font-semibold text-center">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.paymentHistory
                        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
                        .map((payment) => (
                          <TableRow key={payment.id} className="dark:hover:bg-gray-700/30 hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                <span className="text-sm dark:text-gray-300 text-gray-600">
                                  {formatDate(payment.addedAt)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-bold text-emerald-500">
                                {formatCurrency(payment.paidAmount)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={getPaymentMethodColor(payment.paymentMethod)}>
                                {payment.paymentMethod.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                <span className="text-sm dark:text-gray-300 text-gray-600">
                                  {payment.description || "No description"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                {payment.debtType}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-lg border dark:border-gray-700 border-gray-200 dark:bg-gray-700/20 bg-gray-50">
                  <History className="h-12 w-12 mx-auto mb-3 dark:text-gray-500 text-gray-400 opacity-50" />
                  <p className="text-sm dark:text-gray-400 text-gray-600">No payment history available</p>
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50 border-t-2 dark:border-blue-500 border-blue-400">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">Total Tracked Payments</p>
                  <p className="text-lg font-bold dark:text-white text-gray-900">
                    {formatCurrency(data.summary.totalPaidViaTracker)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">Payment Progress</p>
                  <p className="text-lg font-bold dark:text-white text-gray-900">
                    {((data.sale.paidAmount / data.sale.totalAmount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${(data.sale.paidAmount / data.sale.totalAmount) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
              <Button onClick={() => setIsDialogOpen(false)} className="dark:bg-gray-700">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
