"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Plus,
} from "lucide-react"
import api from "@/Utils/Request"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { useToast } from "@/hooks/use-toast"

type TaxRecord = {
  id: string
  type: string
  saleId: string
  amount: number
  dueDate: string
  isPaid: boolean
  paidDate: string | null
  paidUsingFinancialAccountId: string | null
  referenceNumber: string | null
  description: string
  penaltyAmount: number | null
  periodStart: string
  periodEnd: string
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
}

type TaxTypeBreakdown = {
  type: string
  count: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
}

type TaxMetadata = {
  totalTaxAmount: number
  totalPaidAmount: number
  totalUnpaidAmount: number
  totalPenalties: number
  totalRecords: number
  paidRecords: number
  unpaidRecords: number
  overdueRecords: number
  typeBreakdown: TaxTypeBreakdown[]
  overdueTaxes: TaxRecord[]
}

type PaginationInfo = {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

type ApiResponse = {
  pagination: PaginationInfo
  metadata?: TaxMetadata
  taxRecords: TaxRecord[]
}

const TAX_TYPES = [
  { value: "VAT", label: "VAT", color: "#3B82F6" },
  { value: "INCOME_TAX", label: "Income Tax", color: "#8B5CF6" },
  { value: "WITHHOLDING_TAX", label: "Withholding Tax", color: "#06B6D4" },
  { value: "PROPERTY_TAX", label: "Property Tax", color: "#F59E0B" },
  { value: "EXCISE_DUTY", label: "Excise Duty", color: "#EF4444" },
  { value: "OTHER", label: "Other", color: "#6B7280" },
]

// Tax types excluding VAT (for manual entry)
const NON_VAT_TAX_TYPES = TAX_TYPES.filter((type) => type.value !== "VAT")

const STATUS_COLORS = {
  paid: {
    bg: "dark:bg-emerald-500/20 bg-emerald-100",
    text: "dark:text-emerald-300 text-emerald-700",
    border: "dark:border-emerald-800 border-emerald-300",
  },
  unpaid: {
    bg: "dark:bg-red-500/20 bg-red-100",
    text: "dark:text-red-300 text-red-700",
    border: "dark:border-red-800 border-red-300",
  },
  overdue: {
    bg: "dark:bg-amber-500/20 bg-amber-100",
    text: "dark:text-amber-300 text-amber-700",
    border: "dark:border-amber-800 border-amber-300",
  },
}

export default function TaxesPage() {
  const { toast } = useToast()
  const [taxes, setTaxes] = useState<TaxRecord[]>([])
  const [metadata, setMetadata] = useState<TaxMetadata | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Add Tax Dialog State
  const [isAddTaxDialogOpen, setIsAddTaxDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taxFormData, setTaxFormData] = useState({
    type: "INCOME_TAX",
    amount: "",
    dueDate: "",
    description: "",
    periodStart: "",
    periodEnd: "",
  })

  // Fetch tax records from API
  const fetchTaxRecords = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append("includeMetadata", "true")
      params.append("page", String(page))
      params.append("pageSize", String(pageSize))

      if (typeFilter && typeFilter !== "all") {
        params.append("type", typeFilter)
      }

      if (statusFilter && statusFilter !== "all") {
        params.append("isPaid", statusFilter === "paid" ? "true" : "false")
      }

      if (startDate) {
        params.append("dueDateAfter", new Date(startDate).toISOString())
      }

      if (endDate) {
        params.append("dueDateBefore", new Date(endDate).toISOString())
      }

      if (minAmount) {
        params.append("minAmount", minAmount)
      }

      if (maxAmount) {
        params.append("maxAmount", maxAmount)
      }

      const response = await api.get<ApiResponse>(`/TaxRecords?${params.toString()}`)
      
      setTaxes(response.data.taxRecords || [])
      setMetadata(response.data.metadata || null)
      setPagination(response.data.pagination || pagination)
    } catch (err: any) {
      console.error("Error fetching tax records:", err)
      setError(err.response?.data?.message || err.message || "Failed to fetch tax records")
      setTaxes([])
      setMetadata(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTaxRecords()
  }, [page, pageSize, typeFilter, statusFilter, startDate, endDate, minAmount, maxAmount])

  // Handle Add Tax Form Submission
  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        id: crypto.randomUUID(),
        type: taxFormData.type,
        amount: parseFloat(taxFormData.amount),
        dueDate: new Date(taxFormData.dueDate).toISOString(),
        description: taxFormData.description || undefined,
        periodStart: taxFormData.periodStart ? new Date(taxFormData.periodStart).toISOString() : undefined,
        periodEnd: taxFormData.periodEnd ? new Date(taxFormData.periodEnd).toISOString() : undefined,
      }

      await api.post("/TaxRecords", payload)

      toast({
        title: "Success",
        description: "Tax record added successfully",
        className: "dark:bg-gray-800 dark:text-white",
      })

      // Reset form
      setTaxFormData({
        type: "INCOME_TAX",
        amount: "",
        dueDate: "",
        description: "",
        periodStart: "",
        periodEnd: "",
      })
      setIsAddTaxDialogOpen(false)

      // Refresh tax records
      await fetchTaxRecords()
    } catch (err: any) {
      console.error("Error adding tax record:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || "Failed to add tax record",
        variant: "destructive",
        className: "dark:bg-gray-800 dark:text-white",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter taxes by search query (client-side since API doesn't support search)
  const filteredTaxes = taxes.filter((tax) => {
    if (!searchQuery) return true
    return (
      tax.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tax.type.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Use metadata from API if available, otherwise calculate from filtered taxes
  const totalTax = metadata?.totalTaxAmount ?? filteredTaxes.reduce((sum, t) => sum + t.amount, 0)
  const totalPaid = metadata?.totalPaidAmount ?? filteredTaxes.filter((t) => t.isPaid).reduce((sum, t) => sum + t.amount, 0)
  const totalUnpaid = metadata?.totalUnpaidAmount ?? filteredTaxes.filter((t) => !t.isPaid).reduce((sum, t) => sum + t.amount, 0)
  const totalPenalties = metadata?.totalPenalties ?? filteredTaxes.reduce((sum, t) => sum + (t.penaltyAmount || 0), 0)
  const paidCount = metadata?.paidRecords ?? filteredTaxes.filter((t) => t.isPaid).length
  const unpaidCount = metadata?.unpaidRecords ?? filteredTaxes.filter((t) => !t.isPaid).length
  const overdueCount = metadata?.overdueRecords ?? filteredTaxes.filter((t) => !t.isPaid && new Date(t.dueDate) < new Date()).length

  // Chart data from metadata or calculated
  const typeChartData = metadata?.typeBreakdown
    ? metadata.typeBreakdown.map((tb) => {
        const taxType = TAX_TYPES.find((t) => t.value === tb.type)
        return {
          name: taxType?.label || tb.type,
          value: tb.count,
          amount: tb.totalAmount,
          fill: taxType?.color || "#6B7280",
        }
      })
    : TAX_TYPES.map((type) => ({
        name: type.label,
        value: filteredTaxes.filter((t) => t.type === type.value).length,
        amount: filteredTaxes.filter((t) => t.type === type.value).reduce((sum, t) => sum + t.amount, 0),
        fill: type.color,
      })).filter((item) => item.value > 0)

  const statusChartData = [
    { name: "Paid", value: paidCount, fill: "#10B981" },
    { name: "Unpaid", value: unpaidCount, fill: "#EF4444" },
  ].filter((item) => item.value > 0)

  const getTaxStatus = (tax: TaxRecord) => {
    if (tax.isPaid) return { label: "Paid", ...STATUS_COLORS.paid }
    if (new Date(tax.dueDate) < new Date()) return { label: "Overdue", ...STATUS_COLORS.overdue }
    return { label: "Unpaid", ...STATUS_COLORS.unpaid }
  }

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-2">Taxes Management</h1>
          <p className="dark:text-gray-400 text-gray-600">Monitor and manage tax obligations and payments</p>
        </div>
        <Dialog open={isAddTaxDialogOpen} onOpenChange={setIsAddTaxDialogOpen}>
          <DialogTrigger asChild>
            <Button className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Tax Record
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800 bg-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold dark:text-white">Add Tax Record</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Create a new tax record (VAT is automatically generated from sales)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTax} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="dark:text-gray-300">
                    Tax Type *
                  </Label>
                  <select
                    id="type"
                    value={taxFormData.type}
                    onChange={(e) => setTaxFormData({ ...taxFormData, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NON_VAT_TAX_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="dark:text-gray-300">
                    Amount (Shs) *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={taxFormData.amount}
                    onChange={(e) => setTaxFormData({ ...taxFormData, amount: e.target.value })}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="dark:text-gray-300">
                  Due Date *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taxFormData.dueDate}
                  onChange={(e) => setTaxFormData({ ...taxFormData, dueDate: e.target.value })}
                  required
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodStart" className="dark:text-gray-300">
                    Period Start
                  </Label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={taxFormData.periodStart}
                    onChange={(e) => setTaxFormData({ ...taxFormData, periodStart: e.target.value })}
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodEnd" className="dark:text-gray-300">
                    Period End
                  </Label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={taxFormData.periodEnd}
                    onChange={(e) => setTaxFormData({ ...taxFormData, periodEnd: e.target.value })}
                    className="dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="dark:text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter tax description..."
                  value={taxFormData.description}
                  onChange={(e) => setTaxFormData({ ...taxFormData, description: e.target.value })}
                  rows={3}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddTaxDialogOpen(false)}
                  className="dark:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="dark:bg-gray-900 dark:text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Tax Record"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="dark:bg-gray-800 bg-white">
          <CardContent className="pt-4 space-y-3">
            <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Due Date After
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1) // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 bg-white">
          <CardContent className="pt-4 space-y-3">
            <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Due Date Before
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1) // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 bg-white">
          <CardContent className="pt-4 space-y-3">
            <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Tax Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1) // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {TAX_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(1) // Reset to first page when filter changes
              }}
              className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 bg-white">
          <CardContent className="pt-4 space-y-3">
            <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              Search
            </label>
            <Input
              placeholder="Type or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
            />
          </CardContent>
        </Card>
      </div>

      {/* Amount Range Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="dark:bg-gray-800 bg-white">
          <CardContent className="pt-4 space-y-3">
            <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              Minimum Amount
            </label>
            <Input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value)
                setPage(1) // Reset to first page when filter changes
              }}
              className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
            />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 bg-white">
          <CardContent className="pt-4 space-y-3">
            <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              Maximum Amount
            </label>
            <Input
              type="number"
              placeholder="Unlimited"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value)
                setPage(1) // Reset to first page when filter changes
              }}
              className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
            />
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tax */}
        <Card className="dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium dark:text-blue-200 text-blue-700 uppercase tracking-wide mb-1">
                  Total Tax
                </p>
                <p className="text-2xl font-bold dark:text-white text-blue-900">{formatCurrency(totalTax)}</p>
                <p className="text-xs dark:text-blue-300 text-blue-600 mt-1">{pagination.totalCount} records</p>
              </div>
              <div className="p-2 rounded-lg dark:bg-blue-500/20 bg-blue-200">
                <DollarSign className="h-5 w-5 dark:text-blue-300 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="dark:bg-gradient-to-br dark:from-emerald-900/50 dark:to-emerald-800/30 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium dark:text-emerald-200 text-emerald-700 uppercase tracking-wide mb-1">
                  Total Paid
                </p>
                <p className="text-2xl font-bold dark:text-white text-emerald-900">{formatCurrency(totalPaid)}</p>
                <p className="text-xs dark:text-emerald-300 text-emerald-600 mt-1">{paidCount} paid taxes</p>
              </div>
              <div className="p-2 rounded-lg dark:bg-emerald-500/20 bg-emerald-200">
                <CheckCircle2 className="h-5 w-5 dark:text-emerald-300 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Unpaid */}
        <Card className="dark:bg-gradient-to-br dark:from-red-900/50 dark:to-red-800/30 bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:border-red-800">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium dark:text-red-200 text-red-700 uppercase tracking-wide mb-1">
                  Total Unpaid
                </p>
                <p className="text-2xl font-bold dark:text-white text-red-900">{formatCurrency(totalUnpaid)}</p>
                <p className="text-xs dark:text-red-300 text-red-600 mt-1">{overdueCount} overdue</p>
              </div>
              <div className="p-2 rounded-lg dark:bg-red-500/20 bg-red-200">
                <AlertTriangle className="h-5 w-5 dark:text-red-300 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Penalties */}
        <Card className="dark:bg-gradient-to-br dark:from-amber-900/50 dark:to-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium dark:text-amber-200 text-amber-700 uppercase tracking-wide mb-1">
                  Total Penalties
                </p>
                <p className="text-2xl font-bold dark:text-white text-amber-900">{formatCurrency(totalPenalties)}</p>
                <p className="text-xs dark:text-amber-300 text-amber-600 mt-1">
                  {filteredTaxes.filter((t) => t.penaltyAmount && t.penaltyAmount > 0).length} applied
                </p>
              </div>
              <div className="p-2 rounded-lg dark:bg-amber-500/20 bg-amber-200">
                <AlertCircle className="h-5 w-5 dark:text-amber-300 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Count */}
        <Card className="dark:bg-gradient-to-br dark:from-purple-900/50 dark:to-purple-800/30 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium dark:text-purple-200 text-purple-700 uppercase tracking-wide mb-1">
                  Overdue
                </p>
                <p className="text-2xl font-bold dark:text-white text-purple-900">{overdueCount}</p>
                <p className="text-xs dark:text-purple-300 text-purple-600 mt-1">Requires attention</p>
              </div>
              <div className="p-2 rounded-lg dark:bg-purple-500/20 bg-purple-200">
                <Clock className="h-5 w-5 dark:text-purple-300 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Type Distribution */}
        <Card className="dark:bg-gray-800 bg-white">
          <CardHeader>
            <CardTitle className="text-base dark:text-white text-gray-900">Tax Type Distribution</CardTitle>
            <CardDescription>Breakdown by tax type</CardDescription>
          </CardHeader>
          <CardContent>
            {typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center dark:text-gray-400 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card className="dark:bg-gray-800 bg-white">
          <CardHeader>
            <CardTitle className="text-base dark:text-white text-gray-900">Payment Status</CardTitle>
            <CardDescription>Paid vs Unpaid taxes</CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center dark:text-gray-400 text-gray-500">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="dark:bg-gray-800 bg-white border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Taxes Table */}
      <Card className="dark:bg-gray-800 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base dark:text-white text-gray-900">Tax Records</CardTitle>
              <CardDescription>
                Showing {filteredTaxes.length} of {pagination.totalCount} records
                {isLoading && <span className="ml-2">(Loading...)</span>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && taxes.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading tax records...</p>
              </div>
            </div>
          ) : filteredTaxes.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tax records found</p>
                <p className="text-xs mt-1">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                    <TableHead className="text-xs font-semibold w-8"></TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Description</TableHead>
                    <TableHead className="text-xs font-semibold">Period</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Penalty</TableHead>
                    <TableHead className="text-xs font-semibold">Due Date</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxes.map((tax) => {
                    const status = getTaxStatus(tax)
                    const isExpanded = expandedRow === tax.id
                    return (
                      <>
                        <TableRow
                          key={tax.id}
                          className={`dark:hover:bg-gray-700/50 hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? "dark:bg-gray-700/30 bg-gray-50" : ""}`}
                          onClick={() => setExpandedRow(isExpanded ? null : tax.id)}
                        >
                          <TableCell className="w-8">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {TAX_TYPES.find((t) => t.value === tax.type)?.label || tax.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-300 text-gray-600 max-w-xs truncate">
                            {tax.description}
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-300 text-gray-600">
                            {formatDate(tax.periodStart)} to {formatDate(tax.periodEnd)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-right dark:text-white text-gray-900">
                            {formatCurrency(tax.amount)}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-right text-amber-500">
                            {tax.penaltyAmount ? formatCurrency(tax.penaltyAmount) : "—"}
                          </TableCell>
                          <TableCell className="text-sm dark:text-gray-300 text-gray-600">
                            {formatDate(tax.dueDate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border}`}>
                              {status.label}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Tax Details */}
                                  <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                    <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                      Tax Details
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="dark:text-gray-400 text-gray-600">Sale ID:</span>
                                        <span className="dark:text-white text-gray-900 font-medium">SA-{tax.saleId.slice(0,8)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="dark:text-gray-400 text-gray-600">Tax Amount:</span>
                                        <span className="dark:text-white text-gray-900 font-medium">
                                          {formatCurrency(tax.amount)}
                                        </span>
                                      </div>
                                      {tax.penaltyAmount && (
                                        <div className="flex justify-between">
                                          <span className="dark:text-gray-400 text-gray-600">Penalty:</span>
                                          <span className="text-amber-500 font-medium">
                                            {formatCurrency(tax.penaltyAmount)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="dark:text-gray-400 text-gray-600">Total Due:</span>
                                        <span className="dark:text-white text-gray-900 font-medium">
                                          {formatCurrency(tax.amount + (tax.penaltyAmount || 0))}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Payment Details */}
                                  <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                    <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                      Payment Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="dark:text-gray-400 text-gray-600">Status:</span>
                                        <Badge
                                          variant="outline"
                                          className={`${getTaxStatus(tax).bg} ${getTaxStatus(tax).text}`}
                                        >
                                          {getTaxStatus(tax).label}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="dark:text-gray-400 text-gray-600">Due Date:</span>
                                        <span className="dark:text-white text-gray-900">{formatDate(tax.dueDate)}</span>
                                      </div>
                                      {tax.paidDate && (
                                        <div className="flex justify-between">
                                          <span className="dark:text-gray-400 text-gray-600">Paid Date:</span>
                                          <span className="dark:text-white text-gray-900">
                                            {formatDate(tax.paidDate)}
                                          </span>
                                        </div>
                                      )}
                                      {tax.referenceNumber && (
                                        <div className="flex justify-between">
                                          <span className="dark:text-gray-400 text-gray-600">Reference:</span>
                                          <span className="dark:text-white text-gray-900 font-mono text-xs">
                                            {tax.referenceNumber}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button className="dark:bg-gray-900 dark:text-gray-300" variant="outline" size="sm">
                                    Record Payment
                                  </Button>
                                  <Button className="dark:bg-gray-900 dark:text-gray-300" size="sm">View Details</Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {(pagination.totalPages > 1 || pagination.totalCount > 0) && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700 border-gray-200">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1) // Reset to first page when page size changes
                  }}
                  className="px-2 py-1 text-sm dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value={200}>200 per page</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={!pagination.hasPreviousPage || isLoading}
                  className="dark:bg-gray-800 dark:text-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={!pagination.hasNextPage || isLoading}
                  className="dark:bg-gray-800 dark:text-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
