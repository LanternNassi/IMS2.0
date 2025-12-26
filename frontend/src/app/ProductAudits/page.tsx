"use client"

import { useState, useEffect } from "react"
import { Package, Filter, ChevronDown, ChevronUp, RotateCcw, Minus, Plus, User, Warehouse, Loader2 } from "lucide-react"
import api from "@/Utils/Request"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

type ReconciliationRecord = {
  id: string
  productVariationId: string
  productStorageId: string
  quantityBefore: number
  quantityAfter: number
  reason: string
  notes: string | null
  createdById: string
  createdAt: string
  reconciliationSaleId: string | null
  reconciliationPurchaseId: string | null
  reconciliationCapitalAccountId: string | null
  productVariationName: string
  storeName: string
  createdByName: string
}

type ReasonMetadata = {
  reason: string
  count: number
}

type ProductMetadata = {
  productVariationId: string
  productVariationName: string
  count: number
}

type ApiResponse = {
  data: ReconciliationRecord[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  metadata: {
    reasons: ReasonMetadata[]
    products: ProductMetadata[]
  }
}

const REASON_COLORS: Record<string, string> = {
  STOCK_LOSS: "#ef4444",
  STOCK_GAIN: "#10b981",
  DAMAGE: "#f59e0b",
  THEFT: "#dc2626",
  FOUND: "#10b981",
  CORRECTION: "#3b82f6",
  EXPIRY: "#f59e0b",
  SPOILAGE: "#ef4444",
  RETURN: "#8b5cf6",
  ADJUSTMENT: "#6366f1",
  OTHER: "#6b7280",
}

export default function ReconciliationPage() {
  const [filters, setFilters] = useState({
    reason: "",
    productVariationId: "",
    fromDate: "",
    toDate: "",
    page: 1,
    pageSize: 50,
  })

  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
    metadata: {
      reasons: [],
      products: [],
    },
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch audit trail data
  const fetchAuditTrail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.append("page", String(filters.page))
      params.append("pageSize", String(filters.pageSize))

      if (filters.productVariationId && filters.productVariationId !== "all") {
        params.append("productVariationId", filters.productVariationId)
      }

      if (filters.reason && filters.reason !== "all") {
        params.append("reason", filters.reason)
      }

      if (filters.fromDate) {
        // Convert date string to ISO format for backend
        const fromDate = new Date(filters.fromDate)
        params.append("fromDate", fromDate.toISOString())
      }

      if (filters.toDate) {
        // Convert date string to ISO format and set to end of day
        const toDate = new Date(filters.toDate)
        toDate.setHours(23, 59, 59, 999)
        params.append("toDate", toDate.toISOString())
      }

      const response = await api.get(`/ProductReconciliation/audit-trail?${params.toString()}`)
      
      // Response structure matches ApiResponse type exactly
      setData(response.data)
    } catch (err: any) {
      console.error("Error fetching audit trail:", err)
      setError(err.response?.data?.message || err.message || "Failed to fetch audit trail data")
      setData({
        data: [],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        metadata: {
          reasons: [],
          products: [],
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditTrail()
  }, [filters.page, filters.pageSize, filters.productVariationId, filters.reason, filters.fromDate, filters.toDate])

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : Number(value),
    }))
  }

  const handleReset = () => {
    setFilters({
      reason: "",
      productVariationId: "",
      fromDate: "",
      toDate: "",
      page: 1,
      pageSize: 50,
    })
  }

  const totalQuantityAdjustment = data.data.reduce(
    (acc, record) => acc + (record.quantityAfter - record.quantityBefore),
    0,
  )

  const reasonChartData = data.metadata.reasons.map((r) => ({
    name: r.reason,
    value: r.count,
    fill: REASON_COLORS[r.reason] || "#6366f1",
  }))

  const productChartData = data.metadata.products.slice(0, 5).map((p) => ({
    name: p.productVariationName,
    count: p.count,
  }))

  const positiveAdjustments = data.data.filter((r) => r.quantityAfter > r.quantityBefore).length
  const negativeAdjustments = data.data.filter((r) => r.quantityAfter < r.quantityBefore).length

  if (isLoading && data.data.length === 0) {
    return (
      <div className="min-h-screen dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading audit trail data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Products Reconciliation Audit Trail</h1>
          <p className="text-muted-foreground">Track and analyze all inventory adjustments and reconciliations</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reconciliations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{data.totalCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Records found</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-500" />
                Quantity Increased
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+{positiveAdjustments}</div>
              <p className="text-xs text-muted-foreground mt-1">Upward adjustments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-500" />
                Quantity Decreased
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">-{negativeAdjustments}</div>
              <p className="text-xs text-muted-foreground mt-1">Downward adjustments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Adjustment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalQuantityAdjustment >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalQuantityAdjustment >= 0 ? "+" : ""}
                {totalQuantityAdjustment}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total quantity change</p>
            </CardContent>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-500/50 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-500">
                <Package className="w-5 h-5" />
                <p className="font-medium">Error: {error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters Section */}
        <Card className="mb-8 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              {(filters.reason || filters.productVariationId || filters.fromDate || filters.toDate) && (
                <Button className="dark:bg-gray-800 dark:text-gray-300" variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Reason</label>
                <Select value={filters.reason || "all"} onValueChange={(value) => handleFilterChange("reason", value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All reasons" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All reasons</SelectItem>
                    {data.metadata.reasons.map((r) => (
                      <SelectItem key={r.reason} value={r.reason}>
                        {r.reason} ({r.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Product</label>
                <Select
                  value={filters.productVariationId || "all"}
                  onValueChange={(value) => handleFilterChange("productVariationId", value === "all" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All products</SelectItem>
                    {data.metadata.products.map((p) => (
                      <SelectItem key={p.productVariationId} value={p.productVariationId}>
                        {p.productVariationName} ({p.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Page Size</label>
                <Select
                  value={String(filters.pageSize)}
                  onValueChange={(value) => handleFilterChange("pageSize", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Reconciliation by Reason</CardTitle>
              <CardDescription>Breakdown of adjustments by reason</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} (${value})`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reasonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Top Reconciled Products</CardTitle>
              <CardDescription>Most frequently reconciled items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Trail Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Reconciliation Records</CardTitle>
            <CardDescription>
              Showing {data.data.length} of {data.totalCount} records
              {isLoading && <span className="ml-2">(Loading...)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && data.data.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading audit trail data...</p>
                </div>
              </div>
            ) : data.data.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reconciliation records found</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-muted/30">
                    <TableHead className="w-12" />
                    <TableHead>Product</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Before</TableHead>
                    <TableHead className="text-right">After</TableHead>
                    <TableHead className="text-right">Adjustment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((record) => {
                    const adjustment = record.quantityAfter - record.quantityBefore
                    const isExpanded = expandedRow === record.id

                    return (
                      <>
                        <TableRow
                          key={record.id}
                          className="border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setExpandedRow(isExpanded ? null : record.id)}
                        >
                          <TableCell>
                            <button className="hover:bg-muted p-1 rounded">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{record.productVariationName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Warehouse className="w-4 h-4" />
                              {record.storeName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-opacity-10"
                              style={{
                                backgroundColor: REASON_COLORS[record.reason] + "20",
                                borderColor: REASON_COLORS[record.reason],
                                color: REASON_COLORS[record.reason],
                              }}
                            >
                              {record.reason}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {record.quantityBefore}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-foreground">
                            {record.quantityAfter}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`font-mono font-bold flex items-center justify-end gap-1 ${
                                adjustment > 0
                                  ? "text-green-500"
                                  : adjustment < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {adjustment > 0 ? (
                                <Plus className="w-4 h-4" />
                              ) : adjustment < 0 ? (
                                <Minus className="w-4 h-4" />
                              ) : null}
                              {adjustment > 0 ? "+" : ""}
                              {adjustment}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{record.createdByName}</span>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <TableRow key={`${record.id}-expanded`} className="border-border/50 bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={9}>
                              <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Product Variation ID</p>
                                    <p className="font-mono text-sm text-foreground">VAR-{record.productVariationId.slice(0,8)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Storage ID</p>
                                    <p className="font-mono text-sm text-foreground">STR-{record.productStorageId.slice(0,8)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Adjustment Time</p>
                                    <p className="text-sm text-foreground">
                                      {new Date(record.createdAt).toLocaleString()}
                                    </p>
                                  </div>

                                  {record.notes && (
                                    <div className="md:col-span-3 ">
                                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                                      <p className="text-sm text-foreground dark:bg-gray-800 dark:text-gray-300 bg-background p-3 rounded border border-border/50">
                                        {record.notes}
                                      </p>
                                    </div>
                                  )}

                                  {(record.reconciliationSaleId ||
                                    record.reconciliationPurchaseId ||
                                    record.reconciliationCapitalAccountId) && (
                                    <div className="md:col-span-3 space-y-2">
                                      <p className="text-sm font-medium text-foreground">Related Transactions</p>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {record.reconciliationSaleId && (
                                          <div className="text-xs p-2 bg-blue-500/10 border border-blue-500/20 rounded text-foreground">
                                            <p className="text-muted-foreground">Sale Transaction</p>
                                            <p className="font-mono">SA-{record.reconciliationSaleId.slice(0,8)}</p>
                                          </div>
                                        )}
                                        {record.reconciliationPurchaseId && (
                                          <div className="text-xs p-2 bg-green-500/10 border border-green-500/20 rounded text-foreground">
                                            <p className="text-muted-foreground">Purchase Transaction</p>
                                            <p className="font-mono">PU-{record.reconciliationPurchaseId.slice(0,8)}</p>
                                          </div>
                                        )}
                                        {record.reconciliationCapitalAccountId && (
                                          <div className="text-xs p-2 bg-amber-500/10 border border-amber-500/20 rounded text-foreground">
                                            <p className="text-muted-foreground">Capital Account</p>
                                            <p className="font-mono">CA-{record.reconciliationCapitalAccountId.slice(0,8)}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
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
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Page {filters.page} of {data.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="dark:bg-gray-800 dark:text-gray-300"
                  size="sm"
                  onClick={() => handleFilterChange("page", Math.max(1, filters.page - 1))}
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  className="dark:bg-gray-800 dark:text-gray-300"
                  size="sm"
                  onClick={() => handleFilterChange("page", Math.min(data.totalPages, filters.page + 1))}
                  disabled={filters.page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
