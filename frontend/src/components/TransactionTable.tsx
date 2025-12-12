"use client"

import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Eye, Pencil, Trash2, Receipt, Package, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AllocateToStorageDialog } from "./AllocateToStorageDialog"

// Types
export interface TransactionItem {
  id: string
  productVariationId?: string
  productGenericId?: string | null
  quantity: number
  costPrice?: number
  totalPrice: number
  isAllocated: boolean
  productVariation?: {
    id: string
    name: string
    unitofMeasure: string
    wholeSalePrice?: number
    retailPrice?: number
  }
}

export interface Transaction {
  id: string
  purchaseNumber?: string
  purchaseDate?: string
  saleDate?: string
  supplierId?: string
  customerId?: string
  processedBy: string
  totalAmount: number
  paidAmount: number
  tax?: number
  grandTotal: number
  notes?: string
  isPaid: boolean
  supplier?: {
    id: string
    companyName: string
    phoneNumber: string
    emailAddress: string
  }
  customer?: {
    id: string
    name: string
    phone: string
    email: string
  }
  processedUser?: any
  purchaseItems?: TransactionItem[]
  saleItems?: TransactionItem[]
}

export interface TransactionTableProps {
  transactions: Transaction[]
  type: "purchase" | "sale"
  onView?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  onAllocate?: (transaction: Transaction) => void
}



const formatCurrencyFull = (amount: number) => {
  return `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const TransactionRow: React.FC<{
  transaction: Transaction
  type: "purchase" | "sale"
  onView?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  onAllocate?: (transaction: Transaction) => void
}> = ({ transaction, type, onView, onEdit, onDelete, onAllocate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = type === "purchase" ? transaction.purchaseItems : transaction.saleItems
  const partnerName = type === "purchase" ? transaction.supplier?.companyName : transaction.customer?.name
  const partnerContact = type === "purchase" ? transaction.supplier?.phoneNumber : transaction.customer?.phone
  const transactionDate = type === "purchase" ? transaction.purchaseDate : transaction.saleDate
  const transactionNumber = type === "purchase" ? transaction.purchaseNumber : transaction.id?.substring(0, 8)
  
  // Check if all items are allocated
  const isAllocated = items?.length ? items.every(item => item.isAllocated) : false

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
        <TableCell className="w-16 pl-4 py-3">
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

        {/* Transaction Info */}
        <TableCell className="py-3 w-48">
          <div className="flex flex-col gap-1">
            <span className="font-mono font-semibold text-foreground">{`PA-${transactionNumber?.slice(0, 5)}`}</span>
            <span className="text-xs text-muted-foreground">
              {transactionDate && format(new Date(transactionDate), "MMM dd, yyyy • HH:mm")}
            </span>
          </div>
        </TableCell>

        {/* Partner Info */}
        <TableCell className="py-3 w-48">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{partnerName || "—"}</span>
            {partnerContact && <span className="text-xs text-muted-foreground">{partnerContact}</span>}
          </div>
        </TableCell>

        {/* Items Count */}
        <TableCell className="py-3 w-32">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{items?.length || 0}</span>
          </div>
        </TableCell>

        {/* Allocation Status - Only for Purchases */}
        {type === "purchase" && (
          <TableCell className="py-3 w-32">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onAllocate && !isAllocated) {
                        onAllocate(transaction)
                      }
                    }}
                    disabled={isAllocated}
                    className={cn(
                      "h-8 gap-2",
                      isAllocated
                        ? "text-emerald-600 cursor-default"
                        : "text-amber-600 hover:text-amber-700"
                    )}
                  >
                    {isAllocated ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Allocated</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Allocate</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isAllocated
                    ? "Products allocated to storages"
                    : "Click to allocate products to storages"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>
        )}

        {/* Financial Summary */}
        <TableCell className="py-3 w-40">
          <div className="flex flex-col gap-1 text-right">
            <span className="font-medium">{formatCurrencyFull(transaction.totalAmount)}</span>
          </div>
        </TableCell>

        <TableCell className="py-3 w-40">
          <div className="flex flex-col gap-1 text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      "font-medium cursor-help",
                      transaction.paidAmount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    )}
                  >
                    {formatCurrencyFull(transaction.paidAmount)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{formatCurrencyFull(transaction.paidAmount)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>

        <TableCell className="py-3 w-40">
          <div className="flex flex-col gap-1 text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-bold text-foreground cursor-help">{formatCurrencyFull(transaction.grandTotal)}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{formatCurrencyFull(transaction.grandTotal)}</p>
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
                        onView(transaction)
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Details</TooltipContent>
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
                        onEdit(transaction)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
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
                        onDelete(transaction.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </TableCell>
      </TableRow>

      {/* Expanded Content */}
      {isExpanded && (
        <TableRow className="bg-muted/20 dark:bg-gray-900/50">
          <TableCell colSpan={type === "purchase" ? 9 : 8} className="p-0">
            <div className="px-6 py-5 space-y-4">
              {/* Items Header */}
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  {type === "purchase" ? "Purchase" : "Sale"} Items
                </h4>
              </div>

              {/* Items Grid */}
              <div className="rounded-xl border border-border/50 dark:border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 dark:bg-gray-800/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground py-3 pl-4">Product</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-center">Unit</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right">Unit Price</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right">Qty</TableHead>
                      <TableHead className="font-semibold text-foreground py-3 text-right pr-4">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items?.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "hover:bg-muted/30 dark:hover:bg-gray-800/30",
                          index !== (items?.length || 0) - 1 && "border-b border-border/30 dark:border-gray-700/30",
                        )}
                      >
                        <TableCell className="py-3 pl-4">
                          <span className="font-medium text-foreground">{item.productVariation?.name || "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Badge variant="outline" className="rounded-md font-normal">
                            {item.productVariation?.unitofMeasure || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">{formatCurrencyFull(item.costPrice || 0)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{formatCurrencyFull(item.costPrice || 0)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="inline-flex items-center justify-center h-7 min-w-[2rem] px-2 rounded-md bg-primary/10 dark:bg-primary/20 font-semibold text-primary text-sm">
                            {item.quantity.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right pr-4 font-semibold text-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">{formatCurrencyFull(item.totalPrice)}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{formatCurrencyFull(item.totalPrice)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Notes Section */}
              {transaction.notes && (
                <div className="pt-2 border-t border-border/30 dark:border-gray-700/30">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</span>
                  <p className="mt-1 text-sm text-foreground">{transaction.notes}</p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, type, onView, onEdit, onDelete, onAllocate }) => {
  const [allocationDialog, setAllocationDialog] = useState<{ open: boolean; transaction: Transaction | null }>({
    open: false,
    transaction: null,
  })

  const handleAllocate = (transaction: Transaction) => {
    setAllocationDialog({ open: true, transaction })
  }

  const handleAllocationComplete = () => {
    if (onAllocate && allocationDialog.transaction) {
      onAllocate(allocationDialog.transaction)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border dark:border-gray-700 overflow-hidden bg-card dark:bg-gray-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 dark:bg-gray-800 hover:bg-muted/50 border-b border-border dark:border-gray-700">
            <TableHead className="w-16 pl-4" />
            <TableHead className="font-semibold text-foreground py-4 w-48">
              {type === "purchase" ? "Purchase #" : "Sale #"}
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 w-48">
              {type === "purchase" ? "Supplier" : "Customer"}
            </TableHead>
            <TableHead className="font-semibold text-foreground py-4 w-32">Items</TableHead>
            {type === "purchase" && (
              <TableHead className="font-semibold text-foreground py-4 w-32">Allocation</TableHead>
            )}
            <TableHead className="font-semibold text-foreground py-4 text-right w-40">Subtotal</TableHead>
            <TableHead className="font-semibold text-foreground py-4 text-right w-40">Paid</TableHead>
            <TableHead className="font-semibold text-foreground py-4 text-right w-40">Total</TableHead>
            <TableHead className="font-semibold text-foreground py-4 pr-4 text-right w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={type === "purchase" ? 9 : 8} className="h-64">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted dark:bg-gray-800">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">
                      No {type === "purchase" ? "purchases" : "sales"} found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {type === "purchase"
                        ? "Start by adding your first purchase to track inventory"
                        : "Start by recording your first sale to track revenue"}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                type={type}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onAllocate={type === "purchase" ? handleAllocate : undefined}
              />
            ))
          )}
        </TableBody>
      </Table>
      </div>

      {/* Allocation Dialog */}
      {type === "purchase" && allocationDialog.transaction && (
        <AllocateToStorageDialog
          open={allocationDialog.open}
          onClose={() => setAllocationDialog({ open: false, transaction: null })}
          purchaseId={allocationDialog.transaction.id}
          items={allocationDialog.transaction.purchaseItems || []}
          onAllocationComplete={handleAllocationComplete}
        />
      )}
    </>
  )
}