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
import { Suspense } from "react"

// Types
export type CreditNoteItem = {
  id: string
  creditNoteId: string
  productVariationId?: string
  productName?: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxAmount?: number
  saleItemId?: string
}

export type CreditNote = {
  id: string
  creditNoteNumber: string
  creditNoteDate: string
  saleId?: string
  customerId: string
  processedById: string
  applicationMessage: string
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
  sale?: {
    id: string
    saleDate: string
  }
  creditNoteItems: CreditNoteItem[]
  createdAt: string
}

interface CreditNotesMetadata {
  totalAmount: number
  totalCount: number
  appliedCount: number
  pendingCount: number
  refundedCount: number
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
  ReturnedGoods: "Returned Goods",
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

function CreditNotesContent() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [metadata, setMetadata] = useState<CreditNotesMetadata | null>(null)
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    fetchCreditNotes()
  }, [pagination.currentPage])

  const fetchCreditNotes = async () => {
    setLoading(true)
    try {
      const response = await api.get("/CreditNotes", {
        params: {
          includeMetadata: true,
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
        },
      })

      setCreditNotes(response.data.creditNotes || [])
      setMetadata(response.data.metadata || null)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error("Error fetching credit notes:", error)
      setSnackbar({ open: true, message: "Failed to load credit notes" })
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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }))
  }

  const toggleExpanded = (creditNoteId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(creditNoteId)) {
      newExpanded.delete(creditNoteId)
    } else {
      newExpanded.add(creditNoteId)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-[95vw] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Credit Notes
              </h1>
              <p className="text-muted-foreground mt-2">Manage customer credit notes and refunds</p>
            </div>
            <Button
              variant="contained"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/CreditNotes/add")}
              sx={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                },
              }}
            >
              New Credit Note
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {metadata && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MuiCard className="dark:bg-gray-800 border-l-4 border-l-blue-500">
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
                  <DollarSign className="h-8 w-8 text-blue-500" />
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

            <MuiCard className="dark:bg-gray-800 border-l-4 border-l-purple-500">
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
                  <FileText className="h-8 w-8 text-purple-500" />
                </Stack>
              </CardContent>
            </MuiCard>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex gap-4">
          <TextField
            placeholder="Search credit notes..."
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

        {/* Credit Notes Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <CircularProgress />
            </div>
          ) : creditNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No credit notes</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new credit note.
              </p>
              <div className="mt-6">
                <Button variant="contained" startIcon={<Plus />} onClick={() => router.push("/CreditNotes/add")}>
                  New Credit Note
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 dark:bg-gray-800/50">
                    <TableHead className="font-semibold w-10"></TableHead>
                    <TableHead className="font-semibold">Credit Note #</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditNotes.map((creditNote) => (
                    <>
                      {/* Main Row */}
                      <TableRow key={creditNote.id} className="hover:bg-muted/30 dark:hover:bg-gray-700/30 transition-colors">
                        <TableCell className="w-10">
                          <button
                            onClick={() => toggleExpanded(creditNote.id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                expandedRows.has(creditNote.id) ? "rotate-180" : "",
                              )}
                            />
                          </button>
                        </TableCell>
                        <TableCell className="font-mono font-semibold">{creditNote.creditNoteNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{creditNote.customer?.name || "—"}</span>
                            {creditNote.customer?.phone && (
                              <span className="text-xs text-muted-foreground">{creditNote.customer.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(creditNote.creditNoteDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{reasonLabels[creditNote.reason] || creditNote.reason}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(statusColors[creditNote.status] || "")}>{creditNote.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(creditNote.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {creditNote.isApplied ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </TableCell>
                      </TableRow>

                      {expandedRows.has(creditNote.id) && (
                        <TableRow key={`${creditNote.id}-expanded`} className="bg-muted/20 dark:bg-gray-800/30">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-6 space-y-4">
                              {/* Items Table */}
                              <div>
                                <h4 className="font-semibold text-sm text-foreground mb-3">Items</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-3 font-semibold text-foreground">Product</th>
                                        <th className="text-left py-2 px-3 font-semibold text-foreground">
                                          Description
                                        </th>
                                        <th className="text-center py-2 px-3 font-semibold text-foreground">Qty</th>
                                        <th className="text-right py-2 px-3 font-semibold text-foreground">
                                          Unit Price
                                        </th>
                                        <th className="text-right py-2 px-3 font-semibold text-foreground">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {creditNote.creditNoteItems.map((item) => (
                                        <tr
                                          key={item.id}
                                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
                                        >
                                          <td className="py-3 px-3 text-foreground">{item.productName || "—"}</td>
                                          <td className="py-3 px-3 text-muted-foreground text-xs">
                                            {item.description || "—"}
                                          </td>
                                          <td className="py-3 px-3 text-center text-foreground">{item.quantity}</td>
                                          <td className="py-3 px-3 text-right text-foreground">
                                            {formatCurrency(item.unitPrice)}
                                          </td>
                                          <td className="py-3 px-3 text-right font-semibold text-foreground">
                                            {formatCurrency(item.totalPrice)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Totals Section */}
                              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-foreground">Subtotal:</span>
                                    <span className="font-semibold text-foreground">
                                      {formatCurrency(creditNote.subTotal)}
                                    </span>
                                  </div>
                                  {creditNote.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-foreground">Tax:</span>
                                      <span className="font-semibold text-foreground">
                                        {formatCurrency(creditNote.taxAmount)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-base border-t border-gray-300 dark:border-gray-600 pt-2">
                                    <span className="font-semibold text-foreground">Total:</span>
                                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                      {formatCurrency(creditNote.totalAmount)}
                                    </span>
                                  </div>
                                  {
                                    creditNote.applicationMessage ? (
                                      <div className="pt-4">
                                        <h1 className="dark:text-white text-black">* {creditNote.applicationMessage}</h1>
                                      </div>
                                    ) : (null)
                                  }
                                </div>
                              </div>
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

export default function CreditNotesPage() {
  return (
    <Suspense fallback={null}>
      <CreditNotesContent />
    </Suspense>
  )
}
