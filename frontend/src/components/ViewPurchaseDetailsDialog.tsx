"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProductVariation } from "@/types/productTypes"

type PurchaseItem = {
  id: string
  productVariationId: string
  productVariation: ProductVariation
  quantity: number
  costPrice: number
  totalPrice: number
  isAllocated: boolean
}

type PayableRecord = {
  id: string
  purchaseDate: string
  purchaseNumber: string
  totalAmount: number
  tax: number
  grandTotal: number
  paidAmount: number
  outstandingAmount: number
  notes: string
  supplier: {
    companyName: string
    address: string
    phoneNumber?: string
    emailAddress?: string
    contactPerson?: string
  }
  purchaseItems: PurchaseItem[]
}

interface ViewPurchaseDetailsDialogProps {
  payable: PayableRecord
  onClose?: () => void
  trigger?: React.ReactNode
}

export function ViewPurchaseDetailsDialog({ payable, onClose, trigger }: ViewPurchaseDetailsDialogProps) {
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
          <Button size="sm" variant="outline" className="dark:bg-gray-900">
            <Package className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 bg-white max-w-4xl max-h-[90vh] overflow-y-auto" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Purchase Details</DialogTitle>
          <DialogDescription>
            Complete details for purchase on {formatDate(payable.purchaseDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Supplier Information */}
          <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Supplier Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Company Name</p>
                <p className="font-medium dark:text-white text-gray-900">{payable.supplier.companyName}</p>
              </div>
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Address</p>
                <p className="font-medium dark:text-white text-gray-900">{payable.supplier.address}</p>
              </div>
              {payable.supplier.phoneNumber && (
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Phone</p>
                  <p className="font-medium dark:text-white text-gray-900">{payable.supplier.phoneNumber}</p>
                </div>
              )}
              {payable.supplier.emailAddress && (
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Email</p>
                  <p className="font-medium dark:text-white text-gray-900">{payable.supplier.emailAddress}</p>
                </div>
              )}
              {payable.supplier.contactPerson && (
                <div>
                  <p className="text-xs dark:text-gray-400 text-gray-500">Contact Person</p>
                  <p className="font-medium dark:text-white text-gray-900">{payable.supplier.contactPerson}</p>
                </div>
              )}
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-500">Purchase Date</p>
                <p className="font-medium dark:text-white text-gray-900">{formatDate(payable.purchaseDate)}</p>
              </div>
            </div>
          </div>

          {/* Purchase Items Table */}
          <div>
            <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Purchase Items</h4>
            {payable.purchaseItems && payable.purchaseItems.length > 0 ? (
              <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                      <TableHead className="text-xs font-semibold">Item #</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Cost Price</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Quantity</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Total Cost</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payable.purchaseItems.map((item, index) => (
                      <TableRow key={item.id} className="dark:hover:bg-gray-700/30 hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium dark:text-white text-gray-900">
                              {item.productVariation.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium dark:text-white text-gray-900">
                          {formatCurrency(item.costPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {item.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold dark:text-white text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              item.isAllocated
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }
                          >
                            {item.isAllocated ? "Allocated" : "Pending"}
                          </Badge>
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
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Purchase Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Subtotal:</span>
                  <span className="font-medium dark:text-white text-gray-900">{formatCurrency(payable.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Tax:</span>
                  <span className="font-medium text-amber-500">{formatCurrency(payable.tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t dark:border-gray-600 border-gray-300">
                  <span className="font-semibold dark:text-gray-200 text-gray-700">Grand Total:</span>
                  <span className="font-bold dark:text-white text-gray-900">{formatCurrency(payable.grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Items Count:</span>
                  <Badge variant="secondary">{payable.purchaseItems.length} items</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-3">Payment Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-emerald-500">{formatCurrency(payable.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Outstanding:</span>
                  <span className={`font-medium ${payable.outstandingAmount > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {formatCurrency(payable.outstandingAmount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t dark:border-gray-600 border-gray-300">
                  <span className="font-semibold dark:text-gray-200 text-gray-700">Purchase #:</span>
                  <span className="text-xs dark:text-gray-400 text-gray-500 font-mono">
                    {payable.purchaseNumber.slice(0, 13)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-400 text-gray-600">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      payable.outstandingAmount === 0
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : payable.paidAmount > 0
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                    }
                  >
                    {payable.outstandingAmount === 0 ? "Fully Paid" : payable.paidAmount > 0 ? "Partial" : "Unpaid"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {payable.notes && (
            <div className="p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
              <h4 className="text-sm font-semibold dark:text-gray-200 text-gray-700 mb-2">Notes</h4>
              <p className="text-sm dark:text-gray-300 text-gray-600">{payable.notes}</p>
            </div>
          )}

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
