"use client"

import { useState, useEffect } from "react"
import {
    Calendar,
    TrendingUp,
    TrendingDown,
    Users,
    AlertTriangle,
    CheckCircle2,
    Clock,
    DollarSign,
    CreditCard,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Phone,
    MapPin,
    Receipt,
    Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import api from "@/Utils/Request"
import { Snackbar, Autocomplete, TextField, CircularProgress } from "@mui/material"
import { GenerateInvoiceDialog } from "@/components/GenerateInvoiceDialog"
import { RecordPaymentDialog } from "@/components/RecordPaymentDialog"
import { ViewSaleDetailsDialog } from "@/components/ViewSaleDetailsDialog"
import { PaymentHistoryDialog } from "@/components/PaymentHistoryDialog"
import PaginationControls from "@/components/PaginationControls"

type Customer = {
    id: string
    name: string
    customerType: string
    address: string
    phone?: string
    email?: string
}

type DebtRecord = {
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
    customer: Customer
}

type DebtorMetadata = {
    summary: {
        totalOutstandingAmount: number
        totalDebtValue: number
        totalPaidAmount: number
        paymentRate: number
        totalDebtorSales: number
        uniqueDebtors: number
        averageOutstandingPerSale: number
        averageDaysOutstanding: number
    }
    topDebtors: Array<{
        customerId: string
        customerName: string
        customerPhone: string
        customerAddress: string
        totalSales: number
        totalDebt: number
        totalPaid: number
        outstandingAmount: number
        oldestDebtDate: string
        mostRecentDebtDate: string
        averageDebtPerSale: number
    }>
    ageAnalysis: {
        current_0_30Days: number
        days_31_60: number
        days_61_90: number
        days_91_180: number
        over_180Days: number
    }
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

const PAYMENT_METHODS = [
    { label: "Cash", value: "CASH", color: "#10B981" },
    { label: "Mobile Money", value: "MOBILE_MONEY", color: "#F59E0B" },
    { label: "Bank Transfer", value: "BANK_TRANSFER", color: "#3B82F6" },
    { label: "Credit", value: "CREDIT", color: "#8B5CF6" },
]

const STATUS_COLORS = {
    paid: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    partial: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    unpaid: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
}

export default function DebtsAnalysis() {
    const [debts, setDebts] = useState<DebtRecord[]>([])
    const [metadata, setMetadata] = useState<DebtorMetadata | null>(null)
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
    })
    const [startDate, setStartDate] = useState(new Date(2025, 11, 1))
    const [endDate, setEndDate] = useState(new Date(2025, 11, 31))
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerOptions, setCustomerOptions] = useState<Customer[]>([])
    const [customerLoading, setCustomerLoading] = useState(false)
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "partial" | "unpaid">("all")
    const [minOutstanding, setMinOutstanding] = useState<string>("")
    const [maxOutstanding, setMaxOutstanding] = useState<string>("")
    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })

    // Fetch customers for autocomplete
    const fetchCustomers = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) {
            setCustomerOptions([])
            return
        }

        setCustomerLoading(true)
        try {
            const response = await api.get(`/Customers?keywords=${encodeURIComponent(searchTerm)}&page=1&pageSize=4`)
            setCustomerOptions(response.data.customers || [])
        } catch (error) {
            console.error("Error fetching customers:", error)
            setCustomerOptions([])
        } finally {
            setCustomerLoading(false)
        }
    }

    // Fetch debtors data from API
    const fetchDebtors = async (page: number = 1, pageSize: number = 50, customerId?: string) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                page: page.toString(),
                pageSize: pageSize.toString(),
            })

            // Only add customerId if provided
            if (customerId) {
                params.append('customerId', customerId)
            }

            // Add outstanding amount filters if provided
            if (minOutstanding && !isNaN(Number(minOutstanding))) {
                params.append('minOutstanding', minOutstanding)
            }
            if (maxOutstanding && !isNaN(Number(maxOutstanding))) {
                params.append('maxOutstanding', maxOutstanding)
            }

            const response = await api.get(`/Sales/Receivables?${params}`)
            setDebts(response.data.debtors || [])
            setMetadata(response.data.metadata || null)
            setPagination(response.data.pagination || {
                currentPage: 1,
                pageSize: 50,
                totalCount: 0,
                totalPages: 1,
                hasPreviousPage: false,
                hasNextPage: false,
            })
        } catch (error: any) {
            console.error("Error fetching debtors:", error)
            setSnackbar({ open: true, message: "Failed to load debts data" })
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch data on mount and when date range or customer changes
    useEffect(() => {
        fetchDebtors(1, 50, selectedCustomer?.id)
    }, [startDate, endDate, selectedCustomer])

    // Debounce outstanding amount filters to avoid refetching on every keystroke
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (minOutstanding || maxOutstanding) {
                fetchDebtors(1, 50, selectedCustomer?.id)
            }
        }, 800) // Wait 800ms after user stops typing

        return () => clearTimeout(timeoutId)
    }, [minOutstanding, maxOutstanding])

    const filteredDebts = debts.filter((debt) => {
        const debtDate = new Date(debt.saleDate)
        const matchesDate = debtDate >= startDate && debtDate <= endDate

        // Filter by selected customer if one is selected
        const matchesCustomer = selectedCustomer
            ? debt.customer.id === selectedCustomer.id
            : true

        let matchesStatus = true
        if (statusFilter === "paid") matchesStatus = debt.isPaid
        else if (statusFilter === "partial") matchesStatus = !debt.isPaid && debt.paidAmount > 0
        else if (statusFilter === "unpaid") matchesStatus = !debt.isPaid && debt.paidAmount === 0

        return matchesDate && matchesCustomer && matchesStatus
    })

    // Handler for payment recording
    const handlePaymentRecorded = (paymentData: any) => {
        setSnackbar({
            open: true,
            message: `Payment of Shs ${paymentData.paidAmount.toLocaleString()} recorded successfully`,
        })
        fetchDebtors(pagination.currentPage, pagination.pageSize, selectedCustomer?.id) // Refresh debt data
    }

    const handlePageChange = (newPage: number) => {
        fetchDebtors(newPage, pagination.pageSize, selectedCustomer?.id)
    }

    const handlePageSizeChange = (newPageSize: number) => {
        fetchDebtors(1, newPageSize, selectedCustomer?.id)
    }

    // Calculate metrics from metadata or fallback to filtered debts
    const totalSales = metadata?.summary.totalDebtValue || filteredDebts.reduce((sum, d) => sum + d.finalAmount, 0)
    const totalPaid = metadata?.summary.totalPaidAmount || filteredDebts.reduce((sum, d) => sum + d.paidAmount, 0)
    const totalOutstanding = metadata?.summary.totalOutstandingAmount || filteredDebts.reduce((sum, d) => sum + d.outstandingAmount, 0)
    const totalProfit = filteredDebts.reduce((sum, d) => sum + d.profit, 0)
    const totalDiscounts = filteredDebts.reduce((sum, d) => sum + d.discount, 0)

    const paidCount = filteredDebts.filter((d) => d.isPaid).length
    const partialCount = filteredDebts.filter((d) => !d.isPaid && d.paidAmount > 0).length
    const unpaidCount = filteredDebts.filter((d) => !d.isPaid && d.paidAmount === 0).length

    const collectionRate = metadata?.summary.paymentRate || (totalSales > 0 ? (totalPaid / totalSales) * 100 : 0)

    // Chart data
    const statusChartData = [
        { name: "Fully Paid", value: paidCount, fill: "#10B981" },
        { name: "Partial", value: partialCount, fill: "#F59E0B" },
        { name: "Unpaid", value: unpaidCount, fill: "#EF4444" },
    ].filter((item) => item.value > 0)

    const paymentMethodData = PAYMENT_METHODS.map((method) => ({
        name: method.label,
        amount: filteredDebts.filter((d) => d.paymentMethod === method.value).reduce((sum, d) => sum + d.paidAmount, 0),
        fill: method.color,
    })).filter((item) => item.amount > 0)

    // Top debtors from metadata or calculated from debts
    const topDebtors = metadata?.topDebtors.slice(0, 5).map(debtor => ({
        id: debtor.customerId,
        customer: {
            name: debtor.customerName,
            address: debtor.customerAddress,
            phone: debtor.customerPhone,
        },
        outstandingAmount: debtor.outstandingAmount,
    })) || [...filteredDebts]
        .filter((d) => d.outstandingAmount > 0)
        .sort((a, b) => b.outstandingAmount - a.outstandingAmount)
        .slice(0, 5)

    const getPaymentStatus = (debt: DebtRecord) => {
        if (debt.isPaid) return { label: "Paid", ...STATUS_COLORS.paid }
        if (debt.paidAmount > 0) return { label: "Partial", ...STATUS_COLORS.partial }
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
            <div>
                <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-2">Receivables Analysis</h1>
                <p className="dark:text-gray-400 text-gray-600">Monitor and analyze customer debts and payment status</p>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="dark:text-gray-400 text-gray-600">Loading debts data...</p>
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
                                    Search Customer
                                </label>
                                <Autocomplete
                                    size="small"
                                    options={customerOptions}
                                    getOptionLabel={(option) => option.name || ""}
                                    getOptionKey={(option) => option.id}
                                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                                    value={selectedCustomer}
                                    inputValue={searchQuery}
                                    onInputChange={(_, newInputValue, reason) => {
                                        if (reason === "input") {
                                            setSearchQuery(newInputValue)
                                            fetchCustomers(newInputValue)
                                        } else if (reason === "reset") {
                                            setSearchQuery(selectedCustomer?.name || "")
                                        } else if (reason === "clear") {
                                            setSearchQuery("")
                                            setSelectedCustomer(null)
                                            setCustomerOptions([])
                                        }
                                    }}
                                    onChange={(_, newValue) => {
                                        setSelectedCustomer(newValue)
                                        setSearchQuery(newValue?.name || "")
                                    }}
                                    loading={customerLoading}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Name or address..."
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {customerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: 'var(--input-bg)',
                                                    '& fieldset': {
                                                        borderColor: 'var(--input-border)',
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'var(--input-border-hover)',
                                                    },
                                                },
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            <div className="flex flex-col py-1">
                                                <span className="font-medium">{option.name}</span>
                                                {option.address && (
                                                    <span className="text-xs text-gray-500">{option.address}</span>
                                                )}
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
                        {/* Total Sales */}
                        <Card className="dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:border-blue-800">
                            <CardContent className="pt-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium dark:text-blue-200 text-blue-700 uppercase tracking-wide mb-1">
                                            Total Sales
                                        </p>
                                        <p className="text-2xl font-bold dark:text-white text-blue-900">{formatCurrency(totalSales)}</p>
                                        <p className="text-xs dark:text-blue-300 text-blue-600 mt-1">{filteredDebts.length} transactions</p>
                                    </div>
                                    <div className="p-2 rounded-lg dark:bg-blue-500/20 bg-blue-200">
                                        <Receipt className="h-5 w-5 dark:text-blue-300 text-blue-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Collected */}
                        <Card className="dark:bg-gradient-to-br dark:from-emerald-900/50 dark:to-emerald-800/30 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:border-emerald-800">
                            <CardContent className="pt-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium dark:text-emerald-200 text-emerald-700 uppercase tracking-wide mb-1">
                                            Total Collected
                                        </p>
                                        <p className="text-2xl font-bold dark:text-white text-emerald-900">{formatCurrency(totalPaid)}</p>
                                        <p className="text-xs dark:text-emerald-300 text-emerald-600 mt-1">
                                            {collectionRate.toFixed(1)}% collection rate
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg dark:bg-emerald-500/20 bg-emerald-200">
                                        <TrendingUp className="h-5 w-5 dark:text-emerald-300 text-emerald-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Outstanding Amount */}
                        <Card className="dark:bg-gradient-to-br dark:from-red-900/50 dark:to-red-800/30 bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:border-red-800">
                            <CardContent className="pt-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium dark:text-red-200 text-red-700 uppercase tracking-wide mb-1">
                                            Outstanding
                                        </p>
                                        <p className="text-2xl font-bold dark:text-white text-red-900">{formatCurrency(totalOutstanding)}</p>
                                        <p className="text-xs dark:text-red-300 text-red-600 mt-1">
                                            {partialCount + unpaidCount} pending debts
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg dark:bg-red-500/20 bg-red-200">
                                        <AlertTriangle className="h-5 w-5 dark:text-red-300 text-red-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Total Profit */}
                        <Card className="dark:bg-gradient-to-br dark:from-purple-900/50 dark:to-purple-800/30 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:border-purple-800">
                            <CardContent className="pt-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium dark:text-purple-200 text-purple-700 uppercase tracking-wide mb-1">
                                            Total Profit
                                        </p>
                                        <p className="text-2xl font-bold dark:text-white text-purple-900">{formatCurrency(totalProfit)}</p>
                                        <p className="text-xs dark:text-purple-300 text-purple-600 mt-1">
                                            {((totalProfit / totalSales) * 100 || 0).toFixed(1)}% margin
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg dark:bg-purple-500/20 bg-purple-200">
                                        <DollarSign className="h-5 w-5 dark:text-purple-300 text-purple-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Discounts Given */}
                        <Card className="dark:bg-gradient-to-br dark:from-amber-900/50 dark:to-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:border-amber-800">
                            <CardContent className="pt-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-medium dark:text-amber-200 text-amber-700 uppercase tracking-wide mb-1">
                                            Discounts Given
                                        </p>
                                        <p className="text-2xl font-bold dark:text-white text-amber-900">{formatCurrency(totalDiscounts)}</p>
                                        <p className="text-xs dark:text-amber-300 text-amber-600 mt-1">
                                            {filteredDebts.filter((d) => d.discount > 0).length} discounted sales
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg dark:bg-amber-500/20 bg-amber-200">
                                        <TrendingDown className="h-5 w-5 dark:text-amber-300 text-amber-700" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts and Top Debtors Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                            <Tooltip formatter={(value) => `${value} transactions`} />
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

                        {/* Payment Methods Chart */}
                        <Card className="dark:bg-gray-800 bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">
                                    Collection by Payment Method
                                </CardTitle>
                                <CardDescription>Amount collected per method</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {paymentMethodData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={paymentMethodData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                                            <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                                            <YAxis type="category" dataKey="name" width={80} stroke="#9CA3AF" />
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                                {paymentMethodData.map((entry, index) => (
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

                        {/* Top Debtors */}
                        <Card className="dark:bg-gray-800 bg-white">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Top Debtors</CardTitle>
                                        <CardDescription>Customers with highest outstanding</CardDescription>
                                    </div>
                                    <Users className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {topDebtors.length > 0 ? (
                                    <div className="space-y-3">
                                        {topDebtors.map((debt, index) => (
                                            <div
                                                key={debt.id}
                                                className="flex items-center justify-between p-3 rounded-lg dark:bg-gray-700/50 bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index === 0
                                                            ? "bg-red-500/20 text-red-400"
                                                            : index === 1
                                                                ? "bg-amber-500/20 text-amber-400"
                                                                : "bg-gray-500/20 dark:text-gray-400 text-gray-600"
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium dark:text-white text-gray-900">{debt.customer.name}</p>
                                                        <p className="text-xs dark:text-gray-400 text-gray-500">{debt.customer.address}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-red-500">{formatCurrency(debt.outstandingAmount)}</p>
                                                    <p className="text-xs dark:text-gray-400 text-gray-500">outstanding</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-52 flex items-center justify-center dark:text-gray-400 text-gray-600">
                                        <div className="text-center">
                                            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
                                            <p className="text-sm">No outstanding debts</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Collection Rate Progress */}
                    <Card className="dark:bg-gray-800 bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Collection Progress</CardTitle>
                            <CardDescription>Overall debt collection performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm dark:text-gray-400 text-gray-600">Collection Rate</span>
                                    <span className="text-lg font-bold dark:text-white text-gray-900">{collectionRate.toFixed(1)}%</span>
                                </div>
                                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${collectionRate}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="dark:text-gray-400 text-gray-500">Collected: {formatCurrency(totalPaid)}</span>
                                    <span className="dark:text-gray-400 text-gray-500">Target: {formatCurrency(totalSales)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Debts Table */}
                    <Card className="dark:bg-gray-800 bg-white">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base dark:text-white text-gray-900">Debt Records</CardTitle>
                                    <CardDescription>{filteredDebts.length} records found</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                                            <TableHead className="text-xs font-semibold w-8"></TableHead>
                                            <TableHead className="text-xs font-semibold">Customer</TableHead>
                                            <TableHead className="text-xs font-semibold">Date</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Total Amount</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Paid</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Outstanding</TableHead>
                                            <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                                            <TableHead className="text-xs font-semibold text-center">Payment Method</TableHead>
                                            <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDebts.length > 0 ? (
                                            filteredDebts.map((debt) => {
                                                const status = getPaymentStatus(debt)
                                                const isExpanded = expandedRow === debt.id
                                                return (
                                                    <>
                                                        <TableRow
                                                            key={debt.id}
                                                            className={`dark:hover:bg-gray-700/50 hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? "dark:bg-gray-700/30 bg-gray-50" : ""}`}
                                                            onClick={() => setExpandedRow(isExpanded ? null : debt.id)}
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
                                                                    <p className="text-sm font-medium dark:text-white text-gray-900">{debt.customer.name}</p>
                                                                    <p className="text-xs dark:text-gray-400 text-gray-500">{debt.customer.address}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm dark:text-gray-300 text-gray-600">
                                                                {formatDate(debt.saleDate)}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium text-right dark:text-white text-gray-900">
                                                                {formatCurrency(debt.finalAmount)}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium text-right text-emerald-500">
                                                                {formatCurrency(debt.paidAmount)}
                                                            </TableCell>
                                                            <TableCell
                                                                className={`text-sm font-bold text-right ${(debt.finalAmount - debt.paidAmount) > 0 ? "text-red-500" : "text-emerald-500"}`}
                                                            >
                                                                {formatCurrency(debt.finalAmount - debt.paidAmount)}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border}`}>
                                                                    {status.label}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {debt.paymentMethod.replace("_", " ")}
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
                                                                            {/* Customer Info */}
                                                                            <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                                                                <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                                                                    Customer Information
                                                                                </h4>
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Users className="h-3.5 w-3.5 dark:text-gray-400 text-gray-500" />
                                                                                        <span className="text-sm dark:text-gray-300 text-gray-600">
                                                                                            {debt.customer.name}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <MapPin className="h-3.5 w-3.5 dark:text-gray-400 text-gray-500" />
                                                                                        <span className="text-sm dark:text-gray-300 text-gray-600">
                                                                                            {debt.customer.address}
                                                                                        </span>
                                                                                    </div>
                                                                                    {debt.customer.phone && (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Phone className="h-3.5 w-3.5 dark:text-gray-400 text-gray-500" />
                                                                                            <span className="text-sm dark:text-gray-300 text-gray-600">
                                                                                                {debt.customer.phone}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                    <Badge variant="outline" className="text-xs mt-1">
                                                                                        {debt.customer.customerType}
                                                                                    </Badge>
                                                                                </div>
                                                                            </div>

                                                                            {/* Financial Summary */}
                                                                            <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                                                                <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                                                                    Financial Summary
                                                                                </h4>
                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div>
                                                                                        <p className="text-xs dark:text-gray-400 text-gray-500">Original Amount</p>
                                                                                        <p className="text-sm font-medium dark:text-white text-gray-900">
                                                                                            {formatCurrency(debt.totalAmount)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs dark:text-gray-400 text-gray-500">Discount</p>
                                                                                        <p className="text-sm font-medium text-amber-500">
                                                                                            {formatCurrency(debt.discount)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs dark:text-gray-400 text-gray-500">Final Amount</p>
                                                                                        <p className="text-sm font-medium dark:text-white text-gray-900">
                                                                                            {formatCurrency(debt.finalAmount)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs dark:text-gray-400 text-gray-500">Profit</p>
                                                                                        <p className="text-sm font-medium text-emerald-500">
                                                                                            {formatCurrency(debt.profit)}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Status Flags */}
                                                                            <div className="space-y-3 p-4 rounded-lg dark:bg-gray-700/30 bg-gray-50">
                                                                                <h4 className="text-xs font-semibold dark:text-gray-300 text-gray-700 uppercase tracking-wide">
                                                                                    Transaction Status
                                                                                </h4>
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {debt.isPaid ? (
                                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                                        ) : (
                                                                                            <Clock className="h-4 w-4 text-amber-500" />
                                                                                        )}
                                                                                        <span className="text-xs dark:text-gray-300 text-gray-600">
                                                                                            {debt.isPaid ? "Paid" : "Pending Payment"}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {debt.isTaken ? (
                                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                                        ) : (
                                                                                            <Clock className="h-4 w-4 text-amber-500" />
                                                                                        )}
                                                                                        <span className="text-xs dark:text-gray-300 text-gray-600">
                                                                                            {debt.isTaken ? "Collected" : "Awaiting Collection"}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {debt.isCompleted ? (
                                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                                        ) : (
                                                                                            <Clock className="h-4 w-4 text-amber-500" />
                                                                                        )}
                                                                                        <span className="text-xs dark:text-gray-300 text-gray-600">
                                                                                            {debt.isCompleted ? "Completed" : "In Progress"}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <CreditCard className="h-4 w-4 dark:text-gray-400 text-gray-500" />
                                                                                        <span className="text-xs dark:text-gray-300 text-gray-600">
                                                                                            {debt.paymentMethod.replace("_", " ")}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Actions */}
                                                                        <div className="flex justify-end gap-2 pt-2">
                                                                            {
                                                                                debt.isPaid ? null : (
                                                                                    <RecordPaymentDialog debt={{
                                                                                        ...debt,
                                                                                        outstandingAmount: (debt.finalAmount - debt.paidAmount),
                                                                                    }} onPaymentRecorded={handlePaymentRecorded} />
                                                                                )
                                                                            }

                                                                            <PaymentHistoryDialog saleId={debt.id} customerName={debt.customer.name} />
                                                                            {
                                                                                debt.isPaid ? null : (
                                                                                    <Button className="dark:bg-gray-900" variant="outline" size="sm">
                                                                                        Send Reminder
                                                                                    </Button>
                                                                                )
                                                                            }

                                                                            <ViewSaleDetailsDialog debt={debt} />
                                                                            <GenerateInvoiceDialog debt={debt} />
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
                                                <TableCell colSpan={9} className="h-32 text-center">
                                                    <div className="dark:text-gray-400 text-gray-500">
                                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                        <p>No debt records found</p>
                                                        <p className="text-xs mt-1">Try adjusting your filters</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagination Controls */}
                    {!isLoading && (
                        <PaginationControls
                            currentPage={pagination.currentPage}
                            pageSize={pagination.pageSize}
                            totalCount={pagination.totalCount}
                            totalPages={pagination.totalPages}
                            hasPreviousPage={pagination.hasPreviousPage}
                            hasNextPage={pagination.hasNextPage}
                            onPageChange={handlePageChange}
                            itemName="debt records"
                        />
                    )}
                </>
            )}

            {/* Snackbar for feedback */}
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
        </div>
    )
}