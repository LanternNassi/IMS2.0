"use client"

import { useState } from "react"
import { Package, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type SaleItem = {
  id: string
  productVariationId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  profitMargin: number
  productVariation?: {
    id: string
    name: string
    unitSize: number
    unitofMeasure: string
    retailPrice: number
    wholeSalePrice: number
  }
}

type DebtRecord = {
  id: string
  saleDate: string
  totalAmount: number
  discount: number
  finalAmount: number
  paidAmount: number
  outstandingAmount: number
  profit: number
  paymentMethod: string
  customer: {
    name: string
    address: string
    phone?: string
  }
  saleItems?: SaleItem[]
}

interface ViewSaleDetailsDialogProps {
  debt: DebtRecord
  onClose?: () => void
  trigger?: React.ReactNode
}

export function ViewSaleDetailsDialog({ debt, onClose, trigger }: ViewSaleDetailsDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleClose = () => {
    setIsDialogOpen(false)
    onClose?.()
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="dark:bg-gray-900">
            <Package className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 bg-white max-w-4xl max-h-[90vh] overflow-y-auto" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Sale Details</DialogTitle>
          <DialogDescription>
            Complete details for sale on {formatDate(debt.saleDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer Information */}
          <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Customer Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Name</p>
                <p className="font-medium dark:text-white text-gray-900">{debt.customer.name}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Address</p>
                <p className="font-medium dark:text-white text-gray-900">{debt.customer.address}</p>
              </div>
              {debt.customer.phone && (
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Phone</p>
                  <p className="font-medium dark:text-white text-gray-900">{debt.customer.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Sale Date</p>
                <p className="font-medium dark:text-white text-gray-900">{formatDate(debt.saleDate)}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div>
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Products Sold</h4>
            {debt.saleItems && debt.saleItems.length > 0 ? (
              <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                      <TableHead className="text-xs font-semibold">Product</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Unit Size</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Unit Price</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Quantity</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Profit</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debt.saleItems.map((item) => (
                      <TableRow key={item.id} className="dark:hover:bg-gray-700/30 hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium dark:text-white text-gray-900">
                              {item.productVariation?.name || "Unknown Product"}
                            </p>
                            {item.productVariation?.unitofMeasure && (
                              <p className="text-xs dark:text-gray-400 text-gray-500">
                                {item.productVariation.unitofMeasure}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm dark:text-gray-300 text-gray-600">
                          {item.productVariation?.unitSize || "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium dark:text-white text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-emerald-500">
                          {formatCurrency(item.profitMargin)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold dark:text-white text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center rounded-lg border dark:border-gray-700 border-gray-200 dark:bg-gray-700/20 bg-gray-50">
                <Package className="h-12 w-12 mx-auto mb-3 dark:text-gray-500 text-gray-400 opacity-50" />
                <p className="text-sm dark:text-gray-400 text-gray-600">No product details available</p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Sale Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Subtotal:</span>
                  <span className="font-medium dark:text-white text-gray-900">{formatCurrency(debt.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Discount:</span>
                  <span className="font-medium text-amber-500">{formatCurrency(debt.discount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t dark:border-gray-600 border-gray-300">
                  <span className="font-semibold dark:text-gray-200 text-gray-700">Final Amount:</span>
                  <span className="font-bold dark:text-white text-gray-900">{formatCurrency(debt.finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Total Profit:</span>
                  <span className="font-medium text-emerald-500">{formatCurrency(debt.profit)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Payment Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-emerald-500">{formatCurrency(debt.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Outstanding:</span>
                  <span className={`font-medium ${debt.outstandingAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {formatCurrency(debt.outstandingAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t dark:border-gray-600 border-gray-300">
                  <span className="font-semibold dark:text-gray-200 text-gray-700">Payment Method:</span>
                  <Badge variant="secondary">{debt.paymentMethod.replace("_", " ")}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      debt.outstandingAmount === 0
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : debt.paidAmount > 0
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                    }
                  >
                    {debt.outstandingAmount === 0 ? "Fully Paid" : debt.paidAmount > 0 ? "Partial" : "Unpaid"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t dark:border-gray-700">
            <Button onClick={handleClose} className="dark:bg-gray-700">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
