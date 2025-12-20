"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Building2, Download, Printer } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PDFDownloadLink, pdf } from "@react-pdf/renderer"
import { ProfitLossPdfDocument } from "@/components/reports/pdf"
import api from "@/Utils/Request"

export type ProfitLossData = {
  periodUtcStart: string
  periodUtcEnd: string
  asOfUtc: string
  reportingCurrency: string
  salesRevenue: number
  salesRefunds: number
  netSalesRevenue: number
  grossProfit: number
  costOfGoodsSoldEstimated: number
  operatingExpensesTotal: number
  operatingExpensesByCategory: Array<{
    categoryId: string
    categoryName: string
    amount: number
  }>
  netIncomeEstimated: number
  assumptions?: {
    revenueRecognitionNote?: string
    cogsNote?: string
    expensesNote?: string
  }
}

export const mockProfitLossData: ProfitLossData = {
  periodUtcStart: "2025-12-17T00:00:00Z",
  periodUtcEnd: "2025-12-18T00:00:00Z",
  asOfUtc: "2025-12-17T13:27:57.2948465Z",
  reportingCurrency: "UGX",
  salesRevenue: 211000,
  salesRefunds: 0,
  netSalesRevenue: 211000,
  grossProfit: 35000,
  costOfGoodsSoldEstimated: 176000,
  operatingExpensesTotal: 20000,
  operatingExpensesByCategory: [
    {
      categoryId: "25f3b9b2-446a-4d4f-bbc0-7d8290fa9e82",
      categoryName: "Water",
      amount: 20000,
    },
  ],
  netIncomeEstimated: 15000,
  assumptions: {
    revenueRecognitionNote: "Revenue is based on completed, non-refunded sales within the period (SaleDate).",
    cogsNote:
      "COGS is estimated as NetSalesRevenue - Sum(Sale.Profit) because explicit COGS ledger entries are not stored.",
    expensesNote: "Operating expenses are based on Expenditures within the period (AddedAt).",
  },
}

interface ProfitLossStatementProps {
  data?: ProfitLossData
  companyName?: string
  companyAddress?: string
  startDate?: string
  endDate?: string
  embedded?: boolean
}

export function ProfitLossStatement({
  data,
  companyName = "Inventory Management System",
  companyAddress = "Kampala, Uganda",
  startDate,
  endDate,
  embedded = false,
}: ProfitLossStatementProps) {
  const [fetchedData, setFetchedData] = useState<ProfitLossData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (data) return
      setIsLoading(true)
      setLoadError(null)
      try {
        let endpoint = "/IncomeStatement/today"
        if (startDate && endDate) {
          const params = new URLSearchParams()
          const startUtc = new Date(`${startDate}T00:00:00Z`).toISOString()
          const endUtc = new Date(`${endDate}T23:59:59Z`).toISOString()
          params.set("startUtc", startUtc)
          params.set("endUtc", endUtc)
          endpoint = `/IncomeStatement/range?${params.toString()}`
        }

        const response = await api.get(endpoint)
        if (cancelled) return
        setFetchedData(response.data as ProfitLossData)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to fetch income statement:", error)
        setLoadError("Failed to load income statement.")
        setFetchedData(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [data, endDate, startDate])

  const effectiveData = useMemo(() => {
    return data ?? fetchedData
  }, [data, fetchedData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: effectiveData?.reportingCurrency ?? "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const periodStartLabel = effectiveData?.periodUtcStart
    ? formatDate(effectiveData.periodUtcStart)
    : startDate || "N/A"
  const periodEndLabel = effectiveData?.periodUtcEnd ? formatDate(effectiveData.periodUtcEnd) : endDate || "N/A"

  const pdfFileName = `profit-loss-${(effectiveData?.periodUtcStart || startDate || "start").split("T")[0].replaceAll(
    "/",
    "-",
  )}-${(effectiveData?.periodUtcEnd || endDate || "end").split("T")[0].replaceAll("/", "-")}.pdf`

  const handleOpenPdf = async () => {
    // If the component is in "live" mode (no data prop), fetch fresh data for the PDF.
    let pdfData = effectiveData
    if (!data) {
      try {
        let endpoint = "/IncomeStatement/today"
        if (startDate && endDate) {
          const params = new URLSearchParams()
          const startUtc = new Date(`${startDate}T00:00:00Z`).toISOString()
          const endUtc = new Date(`${endDate}T23:59:59Z`).toISOString()
          params.set("startUtc", startUtc)
          params.set("endUtc", endUtc)
          endpoint = `/IncomeStatement/range?${params.toString()}`
        }

        const response = await api.get(endpoint)
        pdfData = response.data as ProfitLossData
        setFetchedData(pdfData)
        setLoadError(null)
      } catch (error) {
        console.error("Failed to fetch income statement for PDF:", error)
        setLoadError("Failed to load income statement for PDF.")
        return
      }
    }

    if (!pdfData) return
    const blob = await pdf(
      <ProfitLossPdfDocument data={pdfData} companyName={companyName} companyAddress={companyAddress} />,
    ).toBlob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, "_blank", "noopener,noreferrer")
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
  }

  const Row = ({
    label,
    amount,
    level = 0,
    bold = false,
  }: { label: string; amount: number; level?: number; bold?: boolean }) => (
    <div className={`flex justify-between py-2 ${level > 0 ? "pl-6" : ""} ${bold ? "font-bold" : ""} dark:text-gray-200`}>
      <span>{label}</span>
      <span className={`font-mono ${amount < 0 ? "text-red-500 dark:text-red-400" : ""}`}>{formatCurrency(amount)}</span>
    </div>
  )

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!embedded && effectiveData && (
        <div className="flex justify-end gap-2 mb-4">
          <PDFDownloadLink
            document={
              <ProfitLossPdfDocument
                data={effectiveData}
                companyName={companyName}
                companyAddress={companyAddress}
              />
            }
            fileName={pdfFileName}
          >
            {({ loading }) => (
              <Button
                variant="outline"
                disabled={loading || isLoading}
                className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {loading || isLoading ? "Preparing PDF..." : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
          <Button
            variant="outline"
            onClick={handleOpenPdf}
            disabled={isLoading}
            className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Printer className="mr-2 h-4 w-4" />
            Open / Print
          </Button>
        </div>
      )}

      {loadError && (
        <Alert variant="destructive" className="no-print">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {!effectiveData && !loadError && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-b dark:border-gray-700">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 dark:text-green-400" />
              <CardTitle className="text-2xl dark:text-white">{companyName}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">{companyAddress}</p>
            <h2 className="text-xl font-bold dark:text-white">PROFIT & LOSS STATEMENT</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-400">{isLoading ? "Loading..." : "No data"}</p>
          </CardHeader>
        </Card>
      )}

      {effectiveData && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-b dark:border-gray-700">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 dark:text-green-400" />
              <CardTitle className="text-2xl dark:text-white">{companyName}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">{companyAddress}</p>
            <h2 className="text-xl font-bold dark:text-white">PROFIT & LOSS STATEMENT</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              For the Period: {periodStartLabel} to {periodEndLabel}
            </p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Currency: {effectiveData.reportingCurrency} • As of {formatDate(effectiveData.asOfUtc)}
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {/* Revenue Section */}
            <div>
              <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">REVENUE</h3>
              <Row label="Sales Revenue" amount={effectiveData.salesRevenue} level={1} />
              <Row label="Sales Refunds" amount={effectiveData.salesRefunds} level={1} />
              <Separator className="dark:bg-gray-700" />
              <Row label="Net Sales Revenue" amount={effectiveData.netSalesRevenue} bold />
            </div>

            <Separator className="my-4" />

            {/* Cost of Goods Sold */}
            <div>
              <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">COST OF GOODS SOLD</h3>
              <Separator className="dark:bg-gray-700" />
              <Row label="COGS (Estimated)" amount={effectiveData.costOfGoodsSoldEstimated} bold />
            </div>

            <Separator className="my-4" />

            {/* Gross Profit */}
            <div className="bg-green-500/10 dark:bg-green-500/20 p-3 rounded-lg">
              <Row label="GROSS PROFIT" amount={effectiveData.grossProfit} bold />
              <p className="text-xs text-muted-foreground dark:text-gray-400 text-right">
                Margin: {effectiveData.netSalesRevenue ? ((effectiveData.grossProfit / effectiveData.netSalesRevenue) * 100).toFixed(1) : "0.0"}%
              </p>
            </div>

            <Separator className="my-4 dark:bg-gray-700" />

            {/* Operating Expenses */}
            <div>
              <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">OPERATING EXPENSES</h3>
              {effectiveData.operatingExpensesByCategory.map((expense) => (
                <Row key={expense.categoryId} label={expense.categoryName} amount={expense.amount} level={1} />
              ))}
              <Separator className="dark:bg-gray-700" />
              <Row label="Total Operating Expenses" amount={effectiveData.operatingExpensesTotal} bold />
            </div>

            {/* Net Income */}
            <div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 p-4 rounded-lg">
                <Row label="NET INCOME (Estimated)" amount={effectiveData.netIncomeEstimated} bold />
                <p className="text-xs text-muted-foreground dark:text-gray-400 text-right mt-1">
                  Net Profit Margin: {effectiveData.netSalesRevenue
                    ? ((effectiveData.netIncomeEstimated / effectiveData.netSalesRevenue) * 100).toFixed(1)
                    : "0.0"}%
                </p>
              </div>
            </div>

            {/* Assumptions & Notes */}
            {effectiveData.assumptions && (
              <div className="mt-6">
                <div className="bg-muted dark:bg-gray-700 px-4 py-2 rounded-t-lg">
                  <h3 className="text-sm font-bold dark:text-white">NOTES & ASSUMPTIONS</h3>
                </div>
                <div className="border border-t-0 dark:border-gray-700 rounded-b-lg p-4 space-y-2 text-xs text-muted-foreground dark:text-gray-400">
                  {effectiveData.assumptions.revenueRecognitionNote && (
                    <p>
                      <span className="font-semibold">Revenue:</span> {effectiveData.assumptions.revenueRecognitionNote}
                    </p>
                  )}
                  {effectiveData.assumptions.cogsNote && (
                    <p>
                      <span className="font-semibold">COGS:</span> {effectiveData.assumptions.cogsNote}
                    </p>
                  )}
                  {effectiveData.assumptions.expensesNote && (
                    <p>
                      <span className="font-semibold">Expenses:</span> {effectiveData.assumptions.expensesNote}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
