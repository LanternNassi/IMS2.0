"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  Search,
  Filter,
  DollarSign,
  Receipt,
  AlertTriangle,
  Users,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Package,
  Clock,
  Wallet,
} from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Autocomplete, TextField, CircularProgress, Snackbar } from "@mui/material"
import { RecordPurchasePaymentDialog } from "@/components/RecordPurchasePaymentDialog"
import { PurchasePaymentHistoryDialog } from "@/components/PurchasePaymentHistoryDialog"
import { ViewPurchaseDetailsDialog } from "@/components/ViewPurchaseDetailsDialog"
import api from "@/Utils/Request"
import { ProductVariation } from "@/types/productTypes"
import { ExcelImportDialog, ColumnMapping } from "@/components/ExcelImportDialog"
import { Upload } from "lucide-react"

// Types based on the API payload
interface Supplier {
  id: string
  companyName: string
  contactPerson: string
  emailAddress: string
  phoneNumber: string
  address: string
  tin: string
  moreInfo: string
  status: string
}

interface PurchaseItem {
  id: string
  purchaseId: string
  productVariationId: string
  productVariation: ProductVariation
  productGenericId: string | null
  quantity: number
  costPrice: number
  totalPrice: number
  isAllocated: boolean
}

interface Payable {
  id: string
  purchaseNumber: string
  purchaseDate: string
  supplierId: string
  processedBy: string
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  tax: number
  grandTotal: number
  notes: string
  isPaid: boolean
  wasPartialPayment: boolean
  linkedFinancialAccountId: string | null
  supplier: Supplier
  purchaseItems: PurchaseItem[]
}

interface TopSupplier {
  supplierId: string
  supplierName: string
  contactName: string
  supplierPhone: string
  totalPurchases: number
  totalDebt: number
  totalPaid: number
  outstandingAmount: number
  oldestDebtDate: string
  mostRecentDebtDate: string
  averageDebtPerPurchase: number
}

interface Metadata {
  summary: {
    totalOutstandingAmount: number
    totalDebtValue: number
    totalPaidAmount: number
    paymentRate: number
    totalPayablePurchases: number
    uniqueSuppliers: number
    averageOutstandingPerPurchase: number
    averageDaysOutstanding: number
  }
  topSuppliers: TopSupplier[]
  ageAnalysis: {
    current_0_30Days: number
    days_31_60: number
    days_61_90: number
    days_91_180: number
    over_180Days: number
  }
  timeSeries: Array<{
    date: string
    purchasesCount: number
    totalDebt: number
    totalPaid: number
    outstandingAmount: number
    averageOutstanding: number
  }>
  riskCategories: {
    highRisk_Over90Days: any[]
    mediumRisk_31_90Days: number
    lowRisk_0_30Days: number
  }
}

interface Pagination {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export default function PayablesAnalysis() {
  const [payables, setPayables] = useState<Payable[]>([])
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [startDate, setStartDate] = useState(new Date(2023, 1, 1))
  const [endDate, setEndDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([])
  const [supplierLoading, setSupplierLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "unpaid">("all")
  const [minOutstanding, setMinOutstanding] = useState<string>("")
  const [maxOutstanding, setMaxOutstanding] = useState<string>("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  // Fetch suppliers for autocomplete
  const fetchSuppliers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSupplierOptions([])
      return
    }

    setSupplierLoading(true)
    try {
      const response = await api.get(`/Suppliers?keywords=${encodeURIComponent(searchTerm)}&page=1&pageSize=4`)
      setSupplierOptions(response.data.suppliers || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      setSupplierOptions([])
    } finally {
      setSupplierLoading(false)
    }
  }

  // Fetch payables data from API
  const fetchPayables = async (page = 1, pageSize = 50, supplierId?: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      if (supplierId) {
        params.append("supplierId", supplierId)
      }

      if (minOutstanding && !isNaN(Number(minOutstanding))) {
        params.append("minOutstanding", minOutstanding)
      }
      if (maxOutstanding && !isNaN(Number(maxOutstanding))) {
        params.append("maxOutstanding", maxOutstanding)
      }

      const response = await api.get(`/Purchases/Payables?${params}`)
      setPayables(response.data.payables || [])
      setMetadata(response.data.metadata || null)
      setPagination(
        response.data.pagination || {
          currentPage: 1,
          pageSize: 50,
          totalCount: 0,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      )
    } catch (error: any) {
      console.error("Error fetching payables:", error)
      setSnackbar({ open: true, message: "Failed to load payables data" })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchPayables(1, 50, selectedSupplier?.id)
  }, [startDate, endDate, selectedSupplier])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (minOutstanding || maxOutstanding) {
        fetchPayables(1, 50, selectedSupplier?.id)
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [minOutstanding, maxOutstanding])

  const filteredPayables = payables.filter((payable) => {
    const payableDate = new Date(payable.purchaseDate)
    const matchesDate = payableDate >= startDate && payableDate <= endDate

    const matchesSupplier = selectedSupplier ? payable.supplier.id === selectedSupplier.id : true

    let matchesStatus = true
    if (statusFilter === "paid") matchesStatus = payable.isPaid
    else if (statusFilter === "partial") matchesStatus = !payable.isPaid && payable.paidAmount > 0
    else if (statusFilter === "unpaid") matchesStatus = !payable.isPaid && payable.paidAmount === 0

    return matchesDate && matchesSupplier && matchesStatus
  })

  // Calculations
  const totalPurchases = metadata?.summary.totalDebtValue || filteredPayables.reduce((sum, p) => sum + p.grandTotal, 0)
  const totalPaid = metadata?.summary.totalPaidAmount || filteredPayables.reduce((sum, p) => sum + p.paidAmount, 0)
  const totalOutstanding =
    metadata?.summary.totalOutstandingAmount || filteredPayables.reduce((sum, p) => sum + p.outstandingAmount, 0)
  const paymentRate = metadata?.summary.paymentRate || (totalPurchases > 0 ? (totalPaid / totalPurchases) * 100 : 0)
  const uniqueSuppliers = metadata?.summary.uniqueSuppliers || new Set(filteredPayables.map((p) => p.supplierId)).size
  const paidCount = filteredPayables.filter((p) => p.isPaid).length
  const partialCount = filteredPayables.filter((p) => !p.isPaid && p.paidAmount > 0).length
  const unpaidCount = filteredPayables.filter((p) => !p.isPaid && p.paidAmount === 0).length

  const formatCurrency = (amount: number) => `Shs ${amount.toLocaleString()}`
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  const getPaymentStatus = (payable: Payable) => {
    if (payable.isPaid) {
      return {
        label: "Paid",
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
      }
    } else if (payable.paidAmount > 0) {
      return {
        label: "Partial",
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
      }
    }
    return {
      label: "Unpaid",
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/20",
    }
  }

  // Chart data
  const statusChartData = [
    { name: "Paid", value: paidCount, fill: "#10b981" },
    { name: "Partial", value: partialCount, fill: "#f59e0b" },
    { name: "Unpaid", value: unpaidCount, fill: "#ef4444" },
  ].filter((item) => item.value > 0)

  const ageAnalysisData = metadata?.ageAnalysis
    ? [
        { name: "0-30 Days", amount: metadata.ageAnalysis.current_0_30Days, fill: "#10b981" },
        { name: "31-60 Days", amount: metadata.ageAnalysis.days_31_60, fill: "#3b82f6" },
        { name: "61-90 Days", amount: metadata.ageAnalysis.days_61_90, fill: "#f59e0b" },
        { name: "91-180 Days", amount: metadata.ageAnalysis.days_91_180, fill: "#ef4444" },
        { name: "180+ Days", amount: metadata.ageAnalysis.over_180Days, fill: "#7c3aed" },
      ].filter((item) => item.amount > 0)
    : []

  const topSuppliers = metadata?.topSuppliers.slice(0, 5) || []

  const handlePageChange = (newPage: number) => {
    fetchPayables(newPage, pagination.pageSize, selectedSupplier?.id)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    fetchPayables(1, newPageSize, selectedSupplier?.id)
  }

  // Import handler
  const handleImportPayables = async (data: any[]) => {
    if (!data || data.length === 0) {
      setSnackbar({ open: true, message: "No data to import" })
      return
    }

    setIsImportDialogOpen(false)
    setIsLoading(true)
    setSnackbar({ open: true, message: `Processing ${data.length} payable record(s)...` })

    try {
      // Transform Excel data to API format
      const payablesToImport = data.map((row) => {
        // Parse date - handle multiple formats
        let purchaseDate = new Date()
        if (row.purchaseDate) {
          const parsed = new Date(row.purchaseDate)
          if (!isNaN(parsed.getTime())) {
            purchaseDate = parsed
          }
        }

        // Calculate amounts
        const grandTotal = parseFloat(row.grandTotal) || 0
        const totalAmount = row.totalAmount ? parseFloat(row.totalAmount) : grandTotal
        const tax = row.tax ? parseFloat(row.tax) : 0
        const paidAmount = parseFloat(row.paidAmount) || 0
        const outstandingAmount = row.outstandingAmount
          ? parseFloat(row.outstandingAmount)
          : Math.max(0, grandTotal - paidAmount)

        return {
          supplierName: row.supplierName?.trim() || "",
          purchaseDate: purchaseDate.toISOString(),
          grandTotal: grandTotal,
          totalAmount: totalAmount,
          tax: tax,
          paidAmount: paidAmount,
          outstandingAmount: outstandingAmount,
          purchaseNumber: row.purchaseNumber?.trim() || null,
          contactPerson: row.contactPerson?.trim() || null,
          emailAddress: row.emailAddress?.trim() || null,
          phoneNumber: row.phoneNumber?.trim() || null,
          address: row.address?.trim() || null,
          tin: row.tin?.trim() || null,
          moreInfo: row.moreInfo?.trim() || null,
          notes: row.notes?.trim() || "Imported from external system",
        }
      }).filter((payable) => payable.supplierName && payable.grandTotal > 0)

      if (payablesToImport.length === 0) {
        setSnackbar({ open: true, message: "No valid payable records to import" })
        setIsLoading(false)
        return
      }

      // Send to API
      const response = await api.post("/Purchases/ImportSupplierDebts", payablesToImport)

      const successCount = response.data.successCount || 0
      const failureCount = response.data.failureCount || 0

      setSnackbar({
        open: true,
        message: `Import completed: ${successCount} successful, ${failureCount} failed`,
      })

      // Refresh payables data
      await fetchPayables(1, pagination.pageSize, selectedSupplier?.id)
    } catch (error: any) {
      console.error("Error importing payables:", error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to import payables. Please check your data format.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Column mappings for Excel import
  const payableImportColumnMappings: ColumnMapping[] = [
    {
      field: "supplierName",
      possibleNames: ["suppliername", "supplier name", "supplier_name", "companyname", "company name"],
      required: true,
    },
    {
      field: "purchaseDate",
      possibleNames: ["purchasedate", "purchase date", "purchase_date", "date", "transaction date"],
      required: true,
      transform: (value: any) => {
        // Try to parse date
        if (value instanceof Date) return value
        const parsed = new Date(value)
        return isNaN(parsed.getTime()) ? new Date() : parsed
      },
    },
    {
      field: "grandTotal",
      possibleNames: ["grandtotal", "grand total", "grand_total", "total", "amount", "invoice amount"],
      required: true,
      transform: (value: any) => parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0,
    },
    {
      field: "totalAmount",
      possibleNames: ["totalamount", "total amount", "total_amount", "subtotal"],
      transform: (value: any) => (value ? parseFloat(String(value).replace(/[^0-9.-]/g, "")) : null),
    },
    {
      field: "tax",
      possibleNames: ["tax", "vat", "tax amount", "tax_amount"],
      transform: (value: any) => (value ? parseFloat(String(value).replace(/[^0-9.-]/g, "")) : 0),
    },
    {
      field: "paidAmount",
      possibleNames: ["paidamount", "paid amount", "paid_amount", "amount paid"],
      required: true,
      transform: (value: any) => parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0,
    },
    {
      field: "outstandingAmount",
      possibleNames: ["outstandingamount", "outstanding amount", "outstanding_amount", "balance", "debt"],
      required: true,
      transform: (value: any) => parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0,
    },
    {
      field: "purchaseNumber",
      possibleNames: ["purchasenumber", "purchase number", "purchase_number", "invoice number", "invoice"],
    },
    {
      field: "contactPerson",
      possibleNames: ["contactperson", "contact person", "contact_person", "contact"],
    },
    {
      field: "emailAddress",
      possibleNames: ["emailaddress", "email address", "email_address", "email", "e-mail"],
    },
    {
      field: "phoneNumber",
      possibleNames: ["phonenumber", "phone number", "phone_number", "phone", "mobile"],
    },
    {
      field: "address",
      possibleNames: ["address", "supplier address", "location"],
    },
    {
      field: "tin",
      possibleNames: ["tin", "tax id", "tax_id", "tax identification number"],
    },
    {
      field: "moreInfo",
      possibleNames: ["moreinfo", "more info", "more_info", "info", "description"],
    },
    {
      field: "notes",
      possibleNames: ["notes", "note", "description", "remarks", "comments"],
    },
  ]

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-2">Payables Analysis</h1>
          <p className="dark:text-gray-400 text-gray-600">Monitor and analyze supplier debts and payment obligations</p>
        </div>
        <Button onClick={() => setIsImportDialogOpen(true)} className="gap-2 dark:bg-gray-700 dark:text-white">
          <Upload className="h-4 w-4" />
          Import Payables
        </Button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="dark:text-gray-400 text-gray-600">Loading payables data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Date Range and Search Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="pt-4 space-y-3">
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate.toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="pt-4 space-y-3">
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate.toISOString().split("T")[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="pt-4 space-y-3">
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  Search Supplier
                </label>
                <Autocomplete
                  size="small"
                  options={supplierOptions}
                  getOptionLabel={(option) => option.companyName || ""}
                  getOptionKey={(option) => option.id}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  value={selectedSupplier}
                  inputValue={searchQuery}
                  onInputChange={(_, newInputValue, reason) => {
                    if (reason === "input") {
                      setSearchQuery(newInputValue)
                      fetchSuppliers(newInputValue)
                    } else if (reason === "reset") {
                      setSearchQuery(selectedSupplier?.companyName || "")
                    } else if (reason === "clear") {
                      setSearchQuery("")
                      setSelectedSupplier(null)
                      setSupplierOptions([])
                    }
                  }}
                  onChange={(_, newValue) => {
                    setSelectedSupplier(newValue)
                    setSearchQuery(newValue?.companyName || "")
                  }}
                  loading={supplierLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Name or address..."
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {supplierLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "var(--input-bg)",
                          "& fieldset": {
                            borderColor: "var(--input-border)",
                          },
                          "&:hover fieldset": {
                            borderColor: "var(--input-border-hover)",
                          },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{option.companyName}</span>
                        {option.address && <span className="text-xs text-gray-500">{option.address}</span>}
                      </div>
                    </li>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="pt-4 space-y-3">
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Payment Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partial Payment</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="pt-4 space-y-3">
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  Min Outstanding
                </label>
                <Input
                  type="number"
                  placeholder="Min amount..."
                  value={minOutstanding}
                  onChange={(e) => setMinOutstanding(e.target.value)}
                  className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
                />
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 bg-white">
              <CardContent className="pt-4 space-y-3">
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5" />
                  Max Outstanding
                </label>
                <Input
                  type="number"
                  placeholder="Max amount..."
                  value={maxOutstanding}
                  onChange={(e) => setMaxOutstanding(e.target.value)}
                  className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
                />
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Purchases */}
            <Card className="dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium dark:text-blue-200 text-blue-700 uppercase tracking-wide mb-1">
                      Total Purchases
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-blue-900">{formatCurrency(totalPurchases)}</p>
                    <p className="text-xs dark:text-blue-300 text-blue-600 mt-1">
                      {filteredPayables.length} transactions
                    </p>
                  </div>
                  <div className="p-2 rounded-lg dark:bg-blue-500/20 bg-blue-200">
                    <Receipt className="h-5 w-5 dark:text-blue-300 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Paid to Suppliers */}
            <Card className="dark:bg-gradient-to-br dark:from-emerald-900/50 dark:to-emerald-800/30 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium dark:text-emerald-200 text-emerald-700 uppercase tracking-wide mb-1">
                      Total Paid
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-emerald-900">{formatCurrency(totalPaid)}</p>
                    <p className="text-xs dark:text-emerald-300 text-emerald-600 mt-1">
                      {paymentRate.toFixed(1)}% payment rate
                    </p>
                  </div>
                  <div className="p-2 rounded-lg dark:bg-emerald-500/20 bg-emerald-200">
                    <Wallet className="h-5 w-5 dark:text-emerald-300 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding to Pay */}
            <Card className="dark:bg-gradient-to-br dark:from-red-900/50 dark:to-red-800/30 bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:border-red-800">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium dark:text-red-200 text-red-700 uppercase tracking-wide mb-1">
                      Outstanding
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-red-900">
                      {formatCurrency(totalOutstanding)}
                    </p>
                    <p className="text-xs dark:text-red-300 text-red-600 mt-1">
                      {partialCount + unpaidCount} pending payments
                    </p>
                  </div>
                  <div className="p-2 rounded-lg dark:bg-red-500/20 bg-red-200">
                    <AlertTriangle className="h-5 w-5 dark:text-red-300 text-red-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unique Suppliers */}
            <Card className="dark:bg-gradient-to-br dark:from-purple-900/50 dark:to-purple-800/30 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium dark:text-purple-200 text-purple-700 uppercase tracking-wide mb-1">
                      Unique Suppliers
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-purple-900">{uniqueSuppliers}</p>
                    <p className="text-xs dark:text-purple-300 text-purple-600 mt-1">
                      Avg: {formatCurrency(uniqueSuppliers > 0 ? totalPurchases / uniqueSuppliers : 0)}/supplier
                    </p>
                  </div>
                  <div className="p-2 rounded-lg dark:bg-purple-500/20 bg-purple-200">
                    <Users className="h-5 w-5 dark:text-purple-300 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Days Outstanding */}
            <Card className="dark:bg-gradient-to-br dark:from-amber-900/50 dark:to-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:border-amber-800">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium dark:text-amber-200 text-amber-700 uppercase tracking-wide mb-1">
                      Avg Days
                    </p>
                    <p className="text-2xl font-bold dark:text-white text-amber-900">
                      {metadata?.summary.averageDaysOutstanding || 0}
                    </p>
                    <p className="text-xs dark:text-amber-300 text-amber-600 mt-1">days outstanding</p>
                  </div>
                  <div className="p-2 rounded-lg dark:bg-amber-500/20 bg-amber-200">
                    <Clock className="h-5 w-5 dark:text-amber-300 text-amber-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Payment Status Chart */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Payment Status</CardTitle>
                <CardDescription>Distribution by payment completion</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} purchases`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center dark:text-gray-400 text-gray-600">
                    No data available
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-2">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs dark:text-gray-400 text-gray-600">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Age Analysis Chart */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Aging Analysis</CardTitle>
                <CardDescription>Outstanding amounts by age</CardDescription>
              </CardHeader>
              <CardContent>
                {ageAnalysisData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ageAnalysisData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="name" width={80} stroke="#9CA3AF" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                        {ageAnalysisData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center dark:text-gray-400 text-gray-600">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Suppliers by Outstanding */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">
                      Top Suppliers
                    </CardTitle>
                    <CardDescription>Highest outstanding amounts</CardDescription>
                  </div>
                  <Users className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent>
                {topSuppliers.length > 0 ? (
                  <div className="space-y-3">
                    {topSuppliers.map((supplier, index) => (
                      <div
                        key={supplier.supplierId}
                        className="flex items-center justify-between p-3 rounded-lg dark:bg-gray-700/50 bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? "bg-red-500/20 text-red-400"
                                : index === 1
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-gray-500/20 dark:text-gray-400 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium dark:text-white text-gray-900">{supplier.supplierName}</p>
                            <p className="text-xs dark:text-gray-400 text-gray-500">
                              {supplier.totalPurchases} purchases
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-500">{formatCurrency(supplier.outstandingAmount)}</p>
                          <p className="text-xs dark:text-gray-400 text-gray-500">outstanding</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-52 flex items-center justify-center dark:text-gray-400 text-gray-600">
                    <div className="text-center">
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                      <p className="text-sm">No outstanding payments</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Progress */}
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Payment Progress</CardTitle>
              <CardDescription>Overall payment completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm dark:text-gray-400 text-gray-600">Payment Rate</span>
                  <span className="text-lg font-bold dark:text-white text-gray-900">{paymentRate.toFixed(1)}%</span>
                </div>
                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${paymentRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="dark:text-gray-400 text-gray-500">Paid: {formatCurrency(totalPaid)}</span>
                  <span className="dark:text-gray-400 text-gray-500">Total: {formatCurrency(totalPurchases)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payables Table */}
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base dark:text-white text-gray-900">Payables Records</CardTitle>
                  <CardDescription>{filteredPayables.length} records found</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                      <TableHead className="text-xs font-semibold w-8"></TableHead>
                      <TableHead className="text-xs font-semibold">Supplier</TableHead>
                      <TableHead className="text-xs font-semibold">Purchase Date</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Total Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Outstanding</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Items</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayables.length > 0 ? (
                      filteredPayables.map((payable) => {
                        const status = getPaymentStatus(payable)
                        const isExpanded = expandedRow === payable.id
                        return (
                          <>
                            <TableRow
                              key={payable.id}
                              className={`dark:hover:bg-gray-700/50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                isExpanded ? "dark:bg-gray-700/30 bg-gray-50" : ""
                              }`}
                              onClick={() => setExpandedRow(isExpanded ? null : payable.id)}
                            >
                              <TableCell className="w-8">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium dark:text-white text-gray-900">
                                    {payable.supplier.companyName}
                                  </p>
                                  <p className="text-xs dark:text-gray-400 text-gray-500">{payable.supplier.address}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm dark:text-gray-300 text-gray-600">
                                {formatDate(payable.purchaseDate)}
                              </TableCell>
                              <TableCell className="text-sm font-medium text-right dark:text-white text-gray-900">
                                {formatCurrency(payable.grandTotal)}
                              </TableCell>
                              <TableCell className="text-sm font-medium text-right text-emerald-500">
                                {formatCurrency(payable.paidAmount)}
                              </TableCell>
                              <TableCell
                                className={`text-sm font-bold text-right ${
                                  payable.outstandingAmount > 0 ? "text-red-500" : "text-emerald-500"
                                }`}
                              >
                                {formatCurrency(payable.outstandingAmount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border}`}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="text-xs">
                                  {payable.purchaseItems.length} items
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Row Details */}
                            {isExpanded && (
                              <TableRow className="dark:bg-gray-800/50 bg-gray-25">
                                <TableCell colSpan={9} className="p-0">
                                  <div className="p-4 space-y-4 border-t dark:border-gray-700 border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {/* Supplier Info */}
                                      <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                        <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                          Supplier Information
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 dark:text-gray-400 text-gray-500" />
                                            <span className="text-sm dark:text-gray-300 text-gray-600">
                                              {payable.supplier.companyName}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 dark:text-gray-400 text-gray-500" />
                                            <span className="text-sm dark:text-gray-300 text-gray-600">
                                              {payable.supplier.address}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 dark:text-gray-400 text-gray-500" />
                                            <span className="text-sm dark:text-gray-300 text-gray-600">
                                              {payable.supplier.phoneNumber}
                                            </span>
                                          </div>
                                          {payable.supplier.emailAddress && (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs dark:text-gray-400 text-gray-500">Email:</span>
                                              <span className="text-xs dark:text-gray-300 text-gray-600">
                                                {payable.supplier.emailAddress}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Financial Summary */}
                                      <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                        <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                          Financial Summary
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-xs dark:text-gray-400 text-gray-500">Total Amount</p>
                                            <p className="text-sm font-medium dark:text-white text-gray-900">
                                              {formatCurrency(payable.totalAmount)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs dark:text-gray-400 text-gray-500">Tax</p>
                                            <p className="text-sm font-medium dark:text-white text-gray-900">
                                              {formatCurrency(payable.tax)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs dark:text-gray-400 text-gray-500">Grand Total</p>
                                            <p className="text-sm font-medium dark:text-white text-gray-900">
                                              {formatCurrency(payable.grandTotal)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs dark:text-gray-400 text-gray-500">Paid Amount</p>
                                            <p className="text-sm font-medium text-emerald-500">
                                              {formatCurrency(payable.paidAmount)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Transaction Status */}
                                      <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                        <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                          Transaction Status
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="flex items-center gap-2">
                                            {payable.isPaid ? (
                                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                              <Clock className="h-4 w-4 text-amber-500" />
                                            )}
                                            <span className="text-xs dark:text-gray-300 text-gray-600">
                                              {payable.isPaid ? "Paid" : "Pending Payment"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {payable.wasPartialPayment ? (
                                              <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                            ) : (
                                              <Clock className="h-4 w-4 text-gray-500" />
                                            )}
                                            <span className="text-xs dark:text-gray-300 text-gray-600">
                                              {payable.wasPartialPayment ? "Partial Payment" : "No Partial"}
                                            </span>
                                          </div>
                                          <div className="col-span-2 flex items-center gap-2">
                                            <Receipt className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                            <span className="text-xs dark:text-gray-300 text-gray-600">
                                              {payable.purchaseItems.length} items purchased
                                            </span>
                                          </div>
                                        </div>
                                        {payable.notes && (
                                          <div className="mt-2 pt-2 border-t dark:border-gray-600 border-gray-300">
                                            <p className="text-xs dark:text-gray-400 text-gray-500 mb-1">Notes:</p>
                                            <p className="text-xs dark:text-gray-300 text-gray-600">
                                              {payable.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-2 pt-2">
                                      {!payable.isPaid && (
                                        <RecordPurchasePaymentDialog 
                                          payable={{
                                            ...payable,
                                            outstandingAmount: payable.outstandingAmount,
                                          }} 
                                          onPaymentRecorded={(paymentData) => {
                                            // Refresh the data after payment is recorded
                                            fetchPayables(pagination.currentPage, pagination.pageSize, selectedSupplier?.id)
                                          }} 
                                        />
                                      )}
                                      <PurchasePaymentHistoryDialog 
                                        purchaseId={payable.id} 
                                        supplierName={payable.supplier.companyName} 
                                      />
                                      {!payable.isPaid && (
                                        <Button size="sm" variant="outline" className="dark:bg-gray-900">
                                          Send Reminder
                                        </Button>
                                      )}
                                      <ViewPurchaseDetailsDialog payable={payable} />
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center dark:text-gray-400 text-gray-600">
                            <CheckCircle2 className="h-12 w-12 mb-3 text-emerald-500" />
                            <p className="text-sm font-medium">No payables found</p>
                            <p className="text-xs mt-1">All purchases have been paid or no data matches your filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs dark:text-gray-400 text-gray-600">
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{" "}
                    {pagination.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                    >
                      Previous
                    </Button>
                    <span className="text-xs dark:text-gray-400 text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 2,
          },
        }}
      />

      {/* Import Dialog */}
      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        title="Import Supplier Payables"
        description="Import suppliers with existing balances/debts from an Excel file. The system will create or match suppliers and create purchase records for the debts."
        columnMappings={payableImportColumnMappings}
        onImport={handleImportPayables}
        importButtonText="Import Payables"
        renderPreviewRow={(row, index) => (
          <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
            <td className="px-4 py-3 text-sm">{row.supplierName || ""}</td>
            <td className="px-4 py-3 text-sm">
              {row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : ""}
            </td>
            <td className="px-4 py-3 text-sm text-right">
              {typeof row.grandTotal === "number"
                ? row.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : row.grandTotal || ""}
            </td>
            <td className="px-4 py-3 text-sm text-right">
              {typeof row.paidAmount === "number"
                ? row.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : row.paidAmount || ""}
            </td>
            <td className="px-4 py-3 text-sm text-right">
              {typeof row.outstandingAmount === "number"
                ? row.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : row.outstandingAmount || ""}
            </td>
          </tr>
        )}
      />
    </div>
  )
}
