"use client"

import { useState, useEffect } from "react"
import { Plus, FileText, DollarSign, CheckCircle, Clock, ChevronDown } from "lucide-react"
import {
  Button,
  TextField,
  InputAdornment,
  Typography,
  Stack,
  Card as MuiCard,
  CardContent,
  Snackbar,
  CircularProgress,
} from "@mui/material"
import { Search, FilterList } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import api from "@/Utils/Request"
import PaginationControls from "@/components/PaginationControls"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Types
export type DebitNoteItem = {
  id: string
  debitNoteId: string
  productVariationId?: string
  productName?: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxAmount?: number
  purchaseItemId?: string
  saleItemId?: string
}

export type DebitNote = {
  id: string
  debitNoteNumber: string
  debitNoteDate: string
  purchaseId?: string
  saleId?: string
  supplierId?: string
  customerId: string
  processedById: string
  totalAmount: number
  taxAmount: number
  subTotal: number
  reason: string
  description?: string
  notes?: string
  status: string
  isApplied: boolean
  linkedFinancialAccountId?: string
  customer?: {
    id: string
    name: string
    phone?: string
  }
  purchase?: {
    id: string
    purchaseDate: string
  }
  sale?: {
    id: string
    saleDate: string
  }
  debitNoteItems: DebitNoteItem[]
  createdAt: string
}

interface DebitNotesMetadata {
  totalAmount: number
  totalCount: number
  appliedCount: number
  pendingCount: number
  cancelledCount: number
  byReason: Array<{
    reason: string
    count: number
    totalAmount: number
  }>
  byStatus: Array<{
    status: string
    count: number
    totalAmount: number
  }>
}

interface Pagination {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

const reasonLabels: Record<string, string> = {
  ShortDelivery: "Short Delivery",
  Overcharge: "Overcharge",
  Discount: "Discount",
  DamagedGoods: "Damaged Goods",
  WrongItem: "Wrong Item",
  Cancellation: "Cancellation",
  Warranty: "Warranty",
  Other: "Other",
}

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Applied: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Refunded: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

export default function DebitNotesPage() {
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([])
  const [metadata, setMetadata] = useState<DebitNotesMetadata | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const router = useRouter()

  useEffect(() => {
    fetchDebitNotes()
  }, [pagination.currentPage])

  const fetchDebitNotes = async () => {
    setLoading(true)
    try {
      const response = await api.get("/DebitNotes", {
        params: {
          includeMetadata: true,
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
        },
      })

      setDebitNotes(response.data.debitNotes || [])
      setMetadata(response.data.metadata || null)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Error fetching debit notes:", error)
      setSnackbar({ open: true, message: "Failed to load debit notes" })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-[95vw] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                Debit Notes
              </h1>
              <p className="text-muted-foreground mt-2">Manage supplier debit notes and charges</p>
            </div>
            <Button
              variant="contained"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/DebitNotes/add")}
              sx={{
                background: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #c2410c 0%, #b91c1c 100%)",
                },
              }}
            >
              New Debit Note
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {metadata && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MuiCard className="dark:bg-gray-800 border-l-4 border-l-orange-500">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <div>
                    <Typography variant="body2" className="text-muted-foreground">
                      Total Amount
                    </Typography>
                    <Typography variant="h5" className="font-bold dark:text-white">
                      {formatCurrency(metadata.totalAmount)}
                    </Typography>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-500" />
                </Stack>
              </CardContent>
            </MuiCard>

            <MuiCard className="dark:bg-gray-800 border-l-4 border-l-emerald-500">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <div>
                    <Typography variant="body2" className="text-muted-foreground">
                      Applied Notes
                    </Typography>
                    <Typography variant="h5" className="font-bold dark:text-white">
                      {metadata.appliedCount}
                    </Typography>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </Stack>
              </CardContent>
            </MuiCard>

            <MuiCard className="dark:bg-gray-800 border-l-4 border-l-amber-500">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <div>
                    <Typography variant="body2" className="text-muted-foreground">
                      Pending Notes
                    </Typography>
                    <Typography variant="h5" className="font-bold dark:text-white">
                      {metadata.pendingCount}
                    </Typography>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </Stack>
              </CardContent>
            </MuiCard>

            <MuiCard className="dark:bg-gray-800 border-l-4 border-l-red-500">
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <div>
                    <Typography variant="body2" className="text-muted-foreground">
                      Total Notes
                    </Typography>
                    <Typography variant="h5" className="font-bold dark:text-white">
                      {metadata.totalCount}
                    </Typography>
                  </div>
                  <FileText className="h-8 w-8 text-red-500" />
                </Stack>
              </CardContent>
            </MuiCard>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex gap-4">
          <TextField
            placeholder="Search debit notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            className="flex-1"
          />
          <Button variant="outlined" startIcon={<FilterList />}>
            Filters
          </Button>
        </div>

        {/* Debit Notes Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <CircularProgress />
            </div>
          ) : debitNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No debit notes</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new debit note.</p>
              <div className="mt-6">
                <Button variant="contained" startIcon={<Plus />} onClick={() => router.push("/DebitNotes/add")}>
                  New Debit Note
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-gray-800/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="font-semibold">Debit Note #</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debitNotes.map((debitNote) => (
                    <>
                      <TableRow
                        key={debitNote.id}
                        className="hover:bg-muted/30 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                      >
                        <TableCell>
                          <button
                            onClick={() => toggleRowExpansion(debitNote.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 transition-transform",
                                expandedRows.has(debitNote.id) && "rotate-180",
                              )}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">{debitNote.debitNoteNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{debitNote.customer?.name || "—"}</span>
                            {debitNote.customer?.phone && (
                              <span className="text-xs text-muted-foreground">{debitNote.customer.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(debitNote.debitNoteDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{reasonLabels[debitNote.reason] || debitNote.reason}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(statusColors[debitNote.status] || "")}>{debitNote.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(debitNote.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {debitNote.isApplied ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(debitNote.id) && (
                        <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                          <TableCell colSpan={8} className="py-6">
                            <div className="space-y-4 pl-4">
                              {/* Items Table */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Items</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200 dark:border-gray-600">
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                          Product
                                        </th>
                                        <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                          Qty
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                          Unit Price
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {debitNote.debitNoteItems.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                                        >
                                          <td className="py-2 px-3">
                                            <div className="flex flex-col">
                                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {item.productName}
                                              </span>
                                              {item.description && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                  {item.description}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="text-center py-2 px-3 text-gray-700 dark:text-gray-300">
                                            {item.quantity}
                                          </td>
                                          <td className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">
                                            {formatCurrency(item.unitPrice)}
                                          </td>
                                          <td className="text-right py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(item.totalPrice)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Totals Summary */}
                              <div className="flex justify-end">
                                <div className="w-full md:w-64 space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4">
                                  <div className="flex justify-between">
                                    <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {formatCurrency(debitNote.subTotal)}
                                    </span>
                                  </div>
                                  {debitNote.taxAmount > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-700 dark:text-gray-300">Tax:</span>
                                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(debitNote.taxAmount)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                    <span className="font-semibold text-orange-900 dark:text-orange-100">Total:</span>
                                    <span className="font-bold text-orange-900 dark:text-orange-100 text-lg">
                                      {formatCurrency(debitNote.totalAmount)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Notes Section */}
                              {debitNote.notes && debitNote.notes !== "N/A" && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Notes</h4>
                                  <p className="text-sm text-blue-800 dark:text-blue-200">{debitNote.notes}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <PaginationControls
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  pageSize={pagination.pageSize}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                  hasNextPage={pagination.hasNextPage}
                  hasPreviousPage={pagination.hasPreviousPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </div>
  )
}
