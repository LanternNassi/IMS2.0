"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileText, TrendingUp, DollarSign, Activity, Calendar, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BalanceSheet, type BalanceSheetData } from "@/components/Balance-Sheet"
import { ProfitLossStatement, type ProfitLossData } from "@/components/profile-loss-statement"
import { CashFlowStatement, type CashFlowData } from "@/components/cashflow-statement"
import { Badge } from "@/components/ui/badge"
import { PDFDownloadLink, pdf } from "@react-pdf/renderer"
import { BalanceSheetPdfDocument, CashFlowPdfDocument, ProfitLossPdfDocument } from "@/components/reports/pdf"
import api from "@/Utils/Request"
import { useToast } from "@/hooks/use-toast"

type ReportType = "balance-sheet" | "profit-loss" | "cashflow" | "trial-balance" | "ledger" | "invoice"

type Report = {
    id: string
    type: ReportType
    name: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
}

type FinancialAccount = {
    id: string
    accountName: string
    bankName?: string | null
    type: string
    accountCode?: string | null
}

const reportTypes: Report[] = [
    {
        id: "1",
        type: "balance-sheet",
        name: "Balance Sheet",
        description: "Statement of financial position showing assets, liabilities, and equity",
        icon: <FileText className="h-8 w-8" />,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        id: "2",
        type: "profit-loss",
        name: "Profit & Loss Statement",
        description: "Income statement showing revenues, expenses, and net profit/loss",
        icon: <TrendingUp className="h-8 w-8" />,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        id: "3",
        type: "cashflow",
        name: "Cash Flow Statement",
        description: "Statement showing cash inflows and outflows from operations, investing, and financing",
        icon: <DollarSign className="h-8 w-8" />,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
    },
    {
        id: "4",
        type: "trial-balance",
        name: "Trial Balance",
        description: "Summary of all ledger account balances to verify debits equal credits",
        icon: <Activity className="h-8 w-8" />,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
    },
    {
        id: "5",
        type: "ledger",
        name: "General Ledger",
        description: "Detailed record of all financial transactions organized by account",
        icon: <FileText className="h-8 w-8" />,
        color: "text-cyan-500",
        bgColor: "bg-cyan-500/10",
    }
]

export default function FinancialReportsPage() {
    const { toast } = useToast()
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [isOpeningPdf, setIsOpeningPdf] = useState(false)
    const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null)
    const [isBalanceSheetLoading, setIsBalanceSheetLoading] = useState(false)
    const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null)
    const [isProfitLossLoading, setIsProfitLossLoading] = useState(false)
    const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null)
    const [isCashFlowLoading, setIsCashFlowLoading] = useState(false)
    const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([])
    const [reportParams, setReportParams] = useState({
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        periodType: "monthly",
        companyName: "Inventory Management System",
        companyAddress: "Kampala, Uganda",
        cashAccountId: "",
        useDateRange: false,
        presetPeriod: "today" as "today" | "last-month" | "last-year" | "ytd",
    })

    useEffect(() => {
        fetchFinancialAccounts()
    }, [])

    useEffect(() => {
        if (!showPreview) return
        if (selectedReport !== "balance-sheet") return

        let cancelled = false

        const loadBalanceSheet = async () => {
            setIsBalanceSheetLoading(true)
            try {
                const response = await api.get("/BalanceSheet/today")
                if (cancelled) return
                setBalanceSheetData(response.data as BalanceSheetData)
            } catch (error: unknown) {
                if (cancelled) return
                console.error("Failed to fetch balance sheet:", error)
                setBalanceSheetData(null)
                toast({
                    title: "Error",
                    description: "Failed to load balance sheet.",
                    variant: "destructive",
                })
            } finally {
                if (!cancelled) setIsBalanceSheetLoading(false)
            }
        }

        // Reset and fetch fresh data whenever preview opens for balance sheet
        setBalanceSheetData(null)
        loadBalanceSheet()

        return () => {
            cancelled = true
        }
    }, [showPreview, selectedReport, toast])

    useEffect(() => {
        if (!showPreview) return
        if (selectedReport !== "profit-loss") return

        let cancelled = false

        const loadProfitLoss = async () => {
            setIsProfitLossLoading(true)
            try {
                let endpoint = "/IncomeStatement/today"
                if (reportParams.startDate && reportParams.endDate) {
                    const params = new URLSearchParams()
                    const startUtc = new Date(`${reportParams.startDate}T00:00:00Z`).toISOString()
                    const endUtc = new Date(`${reportParams.endDate}T23:59:59Z`).toISOString()
                    params.set("startUtc", startUtc)
                    params.set("endUtc", endUtc)
                    endpoint = `/IncomeStatement/range?${params.toString()}`
                }

                const response = await api.get(endpoint)
                if (cancelled) return
                setProfitLossData(response.data as ProfitLossData)
            } catch (error: unknown) {
                if (cancelled) return
                console.error("Failed to fetch income statement:", error)
                setProfitLossData(null)
                toast({
                    title: "Error",
                    description: "Failed to load profit & loss statement.",
                    variant: "destructive",
                })
            } finally {
                if (!cancelled) setIsProfitLossLoading(false)
            }
        }

        setProfitLossData(null)
        loadProfitLoss()

        return () => {
            cancelled = true
        }
    }, [reportParams.endDate, reportParams.startDate, selectedReport, showPreview, toast])

    const fetchFinancialAccounts = async () => {
        try {
            const response = await api.get("/FinancialAccounts?includeMetadata=false&page=1&pageSize=100")
            const accounts = (response.data.financialAccounts || []) as FinancialAccount[]
            setFinancialAccounts(accounts)
            // Auto-select first CASH account if available
            const cashAccount = accounts.find((acc) => acc.type === "CASH")
            if (cashAccount) {
                setReportParams(prev => ({ ...prev, cashAccountId: cashAccount.id }))
            }
        } catch (error: unknown) {
            console.error("Failed to fetch financial accounts:", error)
        }
    }

    const handleGenerateReport = (type: ReportType) => {
        setSelectedReport(type)
        setIsGenerating(true)
        if (type === "balance-sheet") {
            setBalanceSheetData(null)
        }
        if (type === "profit-loss") {
            setProfitLossData(null)
        }
    }

    const getCashFlowDates = () => {
        if (reportParams.useDateRange) {
            return { startDate: reportParams.startDate, endDate: reportParams.endDate }
        }

        const today = new Date()
        let startDate: string | undefined
        let endDate: string | undefined

        switch (reportParams.presetPeriod) {
            case "today":
                // No dates = today endpoint
                break
            case "last-month": {
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
                startDate = lastMonth.toISOString().split("T")[0]
                endDate = lastMonthEnd.toISOString().split("T")[0]
                break
            }
            case "last-year": {
                const lastYear = new Date(today.getFullYear() - 1, 0, 1)
                const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)
                startDate = lastYear.toISOString().split("T")[0]
                endDate = lastYearEnd.toISOString().split("T")[0]
                break
            }
            case "ytd": {
                const yearStart = new Date(today.getFullYear(), 0, 1)
                startDate = yearStart.toISOString().split("T")[0]
                endDate = today.toISOString().split("T")[0]
                break
            }
        }

        return { startDate, endDate }
    }

    const handlePreviewReport = async () => {
        if (selectedReport === "cashflow") {
            // Reset cash flow data when previewing to force fresh fetch
            setCashFlowData(null)
        }
        if (selectedReport === "profit-loss") {
            setProfitLossData(null)
        }
        setShowPreview(true)
    }

    const renderReportPreview = () => {
        switch (selectedReport) {
            case "balance-sheet":
                return (
                    <BalanceSheet
                        embedded
                        companyName={reportParams.companyName}
                        companyAddress={reportParams.companyAddress}
                    />
                )
            case "profit-loss":
                return (
                    <ProfitLossStatement
                        data={profitLossData ?? undefined}
                        embedded
                        companyName={reportParams.companyName}
                        companyAddress={reportParams.companyAddress}
                        startDate={reportParams.startDate}
                        endDate={reportParams.endDate}
                    />
                )
            case "cashflow": {
                const { startDate, endDate } = getCashFlowDates()
                return (
                    <CashFlowStatement
                        data={cashFlowData ?? undefined}
                        cashFinancialAccountId={reportParams.cashAccountId}
                        embedded
                        companyName={reportParams.companyName}
                        companyAddress={reportParams.companyAddress}
                        startDate={startDate}
                        endDate={endDate}
                        onDataLoaded={(d) => setCashFlowData(d)}
                        onLoadingChange={(loading) => setIsCashFlowLoading(loading)}
                        onError={(message) =>
                            toast({
                                title: "Error",
                                description: message,
                                variant: "destructive",
                            })
                        }
                    />
                )
            }
            default:
                return (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Report preview not available yet</p>
                    </div>
                )
        }
    }

    const pdfDocument = (() => {
        switch (selectedReport) {
            case "balance-sheet":
                if (!balanceSheetData) return null
                return (
                    <BalanceSheetPdfDocument
                        data={balanceSheetData}
                        companyName={reportParams.companyName}
                        companyAddress={reportParams.companyAddress}
                    />
                )
            case "profit-loss":
                if (!profitLossData) return null
                return <ProfitLossPdfDocument data={profitLossData} companyName={reportParams.companyName} companyAddress={reportParams.companyAddress} />
            case "cashflow":
                if (!cashFlowData) return null
                return (
                    <CashFlowPdfDocument
                        data={cashFlowData}
                        companyName={reportParams.companyName}
                        companyAddress={reportParams.companyAddress}
                        startDate={reportParams.startDate}
                        endDate={reportParams.endDate}
                    />
                )
            default:
                return null
        }
    })()

    const pdfFileName = (() => {
        const start = reportParams.startDate || "start"
        const end = reportParams.endDate || "end"
        switch (selectedReport) {
            case "balance-sheet":
                return `balance-sheet-${(balanceSheetData?.asOfUtc ?? new Date().toISOString()).split("T")[0]}.pdf`
            case "profit-loss":
                return `profit-loss-${(profitLossData?.periodUtcStart ?? new Date().toISOString()).split("T")[0]}-${(profitLossData?.periodUtcEnd ?? new Date().toISOString()).split("T")[0]
                    }.pdf`
            case "cashflow":
                return `cashflow-${start}-${end}.pdf`
            default:
                return `report-${Date.now()}.pdf`
        }
    })()

    const handleOpenPdf = async () => {
        if (!pdfDocument) return
        setIsOpeningPdf(true)
        try {
            const blob = await pdf(pdfDocument).toBlob()
            const url = window.URL.createObjectURL(blob)
            window.open(url, "_blank", "noopener,noreferrer")
            window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
        } finally {
            setIsOpeningPdf(false)
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground mt-1">Generate comprehensive business financial statements and reports</p>
                </div>
                <Button variant="outline" className="text-black dark:text-white dark:bg-gray-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    Reporting Period
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Reports</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportTypes.length}</div>
                        <p className="text-xs text-muted-foreground">Standard financial statements</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reporting Currency</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">UGX</div>
                        <p className="text-xs text-muted-foreground">Ugandan Shillings</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Generated</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Today</div>
                        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Types Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reportTypes.map((report) => (
                    <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardHeader>
                            <div
                                className={`w-16 h-16 rounded-lg ${report.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                            >
                                <div className={report.color}>{report.icon}</div>
                            </div>
                            <CardTitle className="flex items-center justify-between">
                                {report.name}
                                <Badge variant="secondary" className="text-xs">
                                    Standard
                                </Badge>
                            </CardTitle>
                            <CardDescription className="line-clamp-2">{report.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button
                                    variant={"outline"}
                                    className="flex-1 text-black dark:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                                    onClick={() => handleGenerateReport(report.type)}
                                    disabled={report.type === "trial-balance" || report.type === "ledger"}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Generate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="dark:bg-gray-800"
                                    disabled={report.type === "trial-balance" || report.type === "ledger"}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                            {(report.type === "trial-balance" || report.type === "ledger") && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">Coming soon</p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Report Configuration Dialog */}
            <Dialog open={isGenerating} onOpenChange={setIsGenerating}>
                <DialogContent className="max-w-2xl dark:bg-gray-900 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle>Configure Report - {reportTypes.find((r) => r.type === selectedReport)?.name}</DialogTitle>
                        <DialogDescription>Set the parameters for your financial report</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800 bg-gray-100 rounded-md p-1">
                                <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">General</TabsTrigger>
                                <TabsTrigger value="advanced" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Advanced</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        value={reportParams.companyName}
                                        onChange={(e) => setReportParams({ ...reportParams, companyName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyAddress">Company Address</Label>
                                    <Input
                                        id="companyAddress"
                                        value={reportParams.companyAddress}
                                        onChange={(e) => setReportParams({ ...reportParams, companyAddress: e.target.value })}
                                    />
                                </div>
                                {selectedReport === "cashflow" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="cashAccount">Cash / Bank Account *</Label>

                                        <Select
                                            value={reportParams.cashAccountId}
                                            onValueChange={(value) => setReportParams({ ...reportParams, cashAccountId: value })}

                                        >
                                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent className="dark:bg-gray-700">
                                                {financialAccounts
                                                    .filter((account) => account.type === "CASH" || account.type === "BANK")
                                                    .map((account) => (
                                                        <SelectItem key={account.id} value={account.id}>
                                                            {account.accountName}
                                                            {account.bankName ? ` - ${account.bankName}` : ""} ({account.type})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Required for cash flow statement</p>
                                    </div>
                                )}
                                {selectedReport === "cashflow" && (
                                    <div className="space-y-3">
                                        <Label>Date Range</Label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="useDateRange"
                                                checked={reportParams.useDateRange}
                                                onChange={(e) => setReportParams({ ...reportParams, useDateRange: e.target.checked })}
                                                className="h-4 w-4"
                                            />
                                            <label htmlFor="useDateRange" className="text-sm">
                                                Use custom date range
                                            </label>
                                        </div>
                                        {!reportParams.useDateRange && (
                                            <Select
                                                value={reportParams.presetPeriod}
                                                onValueChange={(value: "today" | "last-month" | "last-year" | "ytd") =>
                                                    setReportParams({ ...reportParams, presetPeriod: value })
                                                }
                                            >
                                                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700">
                                                    <SelectItem value="today">Today</SelectItem>
                                                    <SelectItem value="last-month">Last Month</SelectItem>
                                                    <SelectItem value="last-year">Last Year</SelectItem>
                                                    <SelectItem value="ytd">Year to Date</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                )}
                                {((selectedReport === "cashflow" && reportParams.useDateRange) ||
                                    (selectedReport !== "cashflow" && selectedReport !== "balance-sheet")) && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startDate">Start Date</Label>
                                                <Input
                                                    id="startDate"
                                                    type="date"
                                                    value={reportParams.startDate}
                                                    onChange={(e) => setReportParams({ ...reportParams, startDate: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endDate">End Date</Label>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    value={reportParams.endDate}
                                                    onChange={(e) => setReportParams({ ...reportParams, endDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                            </TabsContent>
                            <TabsContent value="advanced" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="periodType">Reporting Period</Label>
                                    <Select
                                        value={reportParams.periodType}
                                        onValueChange={(value) => setReportParams({ ...reportParams, periodType: value })}
                                    >
                                        <SelectTrigger id="periodType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select defaultValue="ugx">
                                        <SelectTrigger id="currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                                            <SelectItem value="ugx">UGX - Ugandan Shillings</SelectItem>
                                            <SelectItem value="usd">USD - US Dollars</SelectItem>
                                            <SelectItem value="eur">EUR - Euros</SelectItem>
                                            <SelectItem value="gbp">GBP - British Pounds</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="format">Export Format</Label>
                                    <Select defaultValue="pdf">
                                        <SelectTrigger id="format">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100] bg-white dark:bg-gray-800">
                                            <SelectItem value="pdf">PDF Document</SelectItem>
                                            <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                                            <SelectItem value="csv">CSV File</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button className="dark:text-white dark:bg-gray-700" variant="outline" onClick={() => setIsGenerating(false)}>
                            Cancel
                        </Button>
                        <Button variant="outline" className=" text-black dark:text-white dark:bg-gray-700" onClick={handlePreviewReport}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Report
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Report Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 overflow-hidden dark:bg-gray-900 dark:border-gray-700">
                    <div className="flex h-full min-h-0 flex-col">
                        <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                            <DialogHeader>
                                <DialogTitle className="dark:text-white">
                                    {reportTypes.find((r) => r.type === selectedReport)?.name} - Preview
                                </DialogTitle>
                                <DialogDescription className="dark:text-gray-400">
                                    Review your report before downloading or printing
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                {pdfDocument ? (
                                    <>
                                        <PDFDownloadLink document={pdfDocument} fileName={pdfFileName}>
                                            {({ loading }) => (
                                                <Button
                                                    variant="outline"
                                                    disabled={loading}
                                                    className="text-black dark:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {loading ? "Preparing PDF..." : "Download PDF"}
                                                </Button>
                                            )}
                                        </PDFDownloadLink>
                                        <Button
                                            variant="outline"
                                            onClick={handleOpenPdf}
                                            disabled={isOpeningPdf}
                                            className="text-black dark:text-white dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                                        >
                                            {isOpeningPdf ? "Opening..." : "Open / Print"}
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" disabled className="dark:bg-gray-800 dark:border-gray-700">
                                        {selectedReport === "cashflow" && isCashFlowLoading
                                            ? "Loading cash flow..."
                                            : selectedReport === "balance-sheet" && isBalanceSheetLoading
                                                ? "Loading balance sheet..."
                                                : selectedReport === "profit-loss" && isProfitLossLoading
                                                    ? "Loading profit & loss..."
                                                    : "Download (coming soon)"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">
                            {renderReportPreview()}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
