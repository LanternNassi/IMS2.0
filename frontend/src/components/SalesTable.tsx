"use client"

import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Eye, Pencil, Trash2, Receipt, Package, CheckCircle, XCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Types matching the API response
export interface SaleItem {
  id: string
  saleId: string
  productVariationId: string
  productStorageId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  profitMargin: number
  productVariation?: {
    id: string
    name: string
    unitofMeasure: string
    retailPrice?: number
    wholeSalePrice?: number
  }
}

export interface Sale {
  id: string
  customerId: string
  processedById: string
  saleDate: string
  totalAmount: number
  paidAmount: number
  changeAmount: number
  outstandingAmount: number
  discount: number
  finalAmount: number
  profit: number
  isPaid: boolean
  isRefunded: boolean
  isTaken: boolean
  paymentMethod: string
  isCompleted: boolean
  customer?: {
    id: string
    name: string
    phone: string
    email: string
    address: string
  }
  processedBy?: {
    id: string
    username: string
    email: string
  }
  saleItems?: SaleItem[]
}

export interface SalesTableProps {
  sales: Sale[]
  onView?: (sale: Sale) => void
  onEdit?: (sale: Sale) => void
  onDelete?: (id: string) => void
  onRefund?: (id: string) => void
}

const formatCurrencyFull = (amount: number) => {
  return `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const getPaymentMethodLabel = (method: string) => {
  const labels: { [key: string]: string } = {
    CASH: "Cash",
    CARD: "Card",
    MOBILE_MONEY: "Mobile Money",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque",
    OTHER: "Other",
  }
  return labels[method] || method
}

const SaleRow: React.FC<{
  sale: Sale
  onView?: (sale: Sale) => void
  onEdit?: (sale: Sale) => void
  onDelete?: (id: string) => void
  onRefund?: (id: string) => void
}> = ({ sale, onView, onEdit, onDelete, onRefund }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = sale.saleItems || []

  return (
    <>
      <TableRow
        className={cn(
          "group transition-colors cursor-pointer",
          "hover:bg-muted/50 dark:hover:bg-gray-800/50",
          isExpanded && "bg-muted/30 dark:bg-gray-800/30",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand Toggle */}
        <TableCell className="w-16 pl-4 border-r border-border/30 dark:border-gray-700/30 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </TableCell>

        {/* Sale Info */}
        <TableCell className="py-3 w-48 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex flex-col gap-1">
            <span className="font-mono font-semibold text-foreground">{`SA-${sale.id?.slice(0, 8)}`}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(sale.saleDate), "MMM dd, yyyy • HH:mm")}
            </span>
          </div>
        </TableCell>

        {/* Customer Info */}
        <TableCell className="py-3 w-48 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{sale.customer?.name || "—"}</span>
            {sale.customer?.phone && <span className="text-xs text-muted-foreground">{sale.customer.phone}</span>}
          </div>
        </TableCell>

        {/* Items Count */}
        <TableCell className="py-3 w-32 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{items.length}</span>
          </div>
        </TableCell>

        {/* Payment Method */}
        <TableCell className="py-3 w-40 border-r border-border/30 dark:border-gray-700/30">
          <Badge variant="outline" className="rounded-md font-normal">
            {getPaymentMethodLabel(sale.paymentMethod)}
          </Badge>
        </TableCell>

        {/* Status */}
        <TableCell className="py-3 w-32 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex flex-col gap-1">
            {sale.isPaid ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                Paid
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100">
                Pending
              </Badge>
            )}
          </div>
        </TableCell>

        {/* Financial Summary */}
        <TableCell className="py-3 w-40 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex flex-col gap-1 text-right">
            <span className="font-medium">{formatCurrencyFull(sale.totalAmount)}</span>
          </div>
        </TableCell>

        <TableCell className="py-3 w-40 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex flex-col gap-1 text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 cursor-help">
                    {formatCurrencyFull(sale.profit)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">Profit: {formatCurrencyFull(sale.profit)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>

        <TableCell className="py-3 w-40 border-r border-border/30 dark:border-gray-700/30">
          <div className="flex flex-col gap-1 text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-bold text-foreground cursor-help">{formatCurrencyFull(sale.finalAmount)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{formatCurrencyFull(sale.finalAmount)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>

        {/* Actions */}
        <TableCell className="py-3 pr-4 w-32">
          <TooltipProvider>
            <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onView && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(sale)
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-black">View Details</TooltipContent>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(sale)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-black">Edit</TooltipContent>
                </Tooltip>
              )}
              {onRefund && !sale.isRefunded && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/30 dark:hover:text-purple-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRefund(sale.id)
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-black">Refund Sale</TooltipContent>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(sale.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-black">Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </TableCell>
      </TableRow>

      {/* Expanded Content */}
      {isExpanded && (
        <TableRow className="bg-muted/20 dark:bg-gray-900/50">
          <TableCell colSpan={10} className="p-0">
            <div className="px-6 py-5 space-y-4">
              {/* Items Header */}
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h4 className="text-sm font-semibold text-foreground">Sale Items</h4>
              </div>

              {/* Items Grid */}
              <div className="rounded-xl border border-border/50 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground py-3 pl-4 border-r border-border/30 dark:border-gray-700/30">Product</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-center border-r border-border/30 dark:border-gray-700/30">Unit</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right border-r border-border/30 dark:border-gray-700/30">Unit Price</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right border-r border-border/30 dark:border-gray-700/30">Qty</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right border-r border-border/30 dark:border-gray-700/30">Profit</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right pr-4">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "hover:bg-muted/30 dark:hover:bg-gray-800/30",
                          index !== items.length - 1 && "border-b border-border/30 dark:border-gray-700/30",
                        )}
                      >
                        <TableCell className="py-3 pl-4 border-r border-border/30 dark:border-gray-700/30">
                          <span className="font-medium text-foreground">{item.productVariation?.name || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 text-center border-r border-border/30 dark:border-gray-700/30">
                          <Badge variant="outline" className="rounded-md font-normal">
                            {item.productVariation?.unitofMeasure || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right text-muted-foreground border-r border-border/30 dark:border-gray-700/30">
                          {formatCurrencyFull(item.unitPrice)}
                        </TableCell>
                        <TableCell className="py-3 text-right border-r border-border/30 dark:border-gray-700/30">
                          <span className="inline-flex items-center justify-center h-7 min-w-[2rem] px-2 rounded-md bg-primary/10 dark:bg-primary/20 font-semibold text-primary text-sm">
                            {item.quantity.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right text-emerald-600 dark:text-emerald-400 border-r border-border/30 dark:border-gray-700/30">
                          {item.profitMargin}
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4 font-semibold text-foreground">
                          {formatCurrencyFull(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Sale Summary */}
              <div className="pt-2 border-t border-border/30 dark:border-gray-700/30 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrencyFull(sale.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium">{formatCurrencyFull(sale.discount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Final Amount:</span>
                    <span className="font-bold">{formatCurrencyFull(sale.finalAmount)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid Amount:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyFull(sale.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change:</span>
                    <span className="font-medium">{formatCurrencyFull(sale.changeAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Outstanding:</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {formatCurrencyFull(sale.outstandingAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onView, onEdit, onDelete, onRefund }) => {
  return (
    <div className="rounded-xl border border-border dark:border-gray-700 overflow-hidden bg-card dark:bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 dark:bg-gray-800 hover:bg-muted/50 border-b border-border dark:border-gray-700">
            <TableHead className="w-16 pl-4 border-r border-border/30 dark:border-gray-700/30" />
            <TableHead className="font-semibold text-foreground py-4 w-48 border-r border-border/30 dark:border-gray-700/30">Sale #</TableHead>
            <TableHead className="font-semibold text-foreground py-4 w-48 border-r border-border/30 dark:border-gray-700/30">Customer</TableHead>
            <TableHead className="font-semibold text-foreground py-4 w-32 border-r border-border/30 dark:border-gray-700/30">Items</TableHead>
            <TableHead className="font-semibold text-foreground py-4 w-40 border-r border-border/30 dark:border-gray-700/30">Payment</TableHead>
            <TableHead className="font-semibold text-foreground py-4 w-32 border-r border-border/30 dark:border-gray-700/30">Status</TableHead>
            <TableHead className="font-semibold text-foreground py-4 text-right w-40 border-r border-border/30 dark:border-gray-700/30">Subtotal</TableHead>
            <TableHead className="font-semibold text-foreground py-4 text-right w-40 border-r border-border/30 dark:border-gray-700/30">Profit</TableHead>
            <TableHead className="font-semibold text-foreground py-4 text-right w-40 border-r border-border/30 dark:border-gray-700/30">Paid Amount</TableHead>
            <TableHead className="font-semibold text-foreground py-4 pr-4 text-right w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-64">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-gray-800">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">No sales found</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Start by recording your first sale to track revenue
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <SaleRow key={sale.id} sale={sale} onView={onView} onEdit={onEdit} onDelete={onDelete} onRefund={onRefund} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
