"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, Building2 } from "lucide-react"
import { PDFDownloadLink, pdf } from "@react-pdf/renderer"
import { CashFlowPdfDocument } from "@/components/reports/pdf"
import api from "@/Utils/Request"
import type { AxiosError } from "axios"

export type CashFlowData = {
  dayUtcStart: string
  dayUtcEnd: string
  asOfUtc: string
  openingCashBalance: number
  closingCashBalance: number
  totalInflows: number
  totalOutflows: number
  netCashFlow: number
  netNotes: number
  breakdown: {
    salesCollections: number
    transfersIn: number
    capitalContributions: number
    purchasePayments: number
    expenditures: number
    fixedAssetPurchases: number
    capitalWithdrawals: number
    transfersOut: number
    creditNotes: number
    debitNotes: number
    unlinkedSalesCollections: number
    unlinkedPurchasePayments: number
    unlinkedExpenditures: number
    unlinkedFixedAssetPurchases: number
    unlinkedCapitalContributions: number
    unlinkedCapitalWithdrawals: number
  }
  cashAccounts: Array<{
    id: string
    accountName: string
    type: string
    balance: number
  }>
}

export const mockCashFlowData: CashFlowData = {
  dayUtcStart: "2025-12-16T00:00:00Z",
  dayUtcEnd: "2025-12-17T00:00:00Z",
  asOfUtc: "2025-12-16T12:13:59.6635736Z",
  openingCashBalance: 9470000,
  closingCashBalance: 9640000,
  totalInflows: 180000,
  totalOutflows: 10000,
  netCashFlow: 170000,
  netNotes: -20000,
  breakdown: {
    salesCollections: 80000,
    transfersIn: 100000,
    capitalContributions: 0,
    purchasePayments: 0,
    expenditures: 10000,
    fixedAssetPurchases: 0,
    capitalWithdrawals: 0,
    transfersOut: 0,
    creditNotes: 20000,
    debitNotes: 0,
    unlinkedSalesCollections: 0,
    unlinkedPurchasePayments: 0,
    unlinkedExpenditures: 0,
    unlinkedFixedAssetPurchases: 0,
    unlinkedCapitalContributions: 0,
    unlinkedCapitalWithdrawals: 0,
  },
  cashAccounts: [
    {
      id: "cb9faebd-7e57-4db8-978a-8323efba8430",
      accountName: "CASH",
      type: "CASH",
      balance: 9640000,
    },
  ],
}

interface CashFlowStatementProps {
  data?: CashFlowData
  cashFinancialAccountId?: string
  companyName?: string
  companyAddress?: string
  startDate?: string
  endDate?: string
  embedded?: boolean
  onDataLoaded?: (data: CashFlowData) => void
  onLoadingChange?: (isLoading: boolean) => void
  onError?: (message: string) => void
}

export function CashFlowStatement({
  data,
  cashFinancialAccountId,
  companyName = "Inventory Management System",
  companyAddress = "Kampala, Uganda",
  startDate,
  endDate,
  embedded = false,
  onDataLoaded,
  onLoadingChange,
  onError,
}: CashFlowStatementProps) {
  const [fetchedData, setFetchedData] = useState<CashFlowData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const effectiveData = useMemo(() => {
    if (data) return data
    if (fetchedData) return fetchedData
    if (!cashFinancialAccountId) return mockCashFlowData
    return null
  }, [cashFinancialAccountId, data, fetchedData])

  const canRenderData = Boolean(effectiveData)

  useEffect(() => {
    if (data) return
    if (!cashFinancialAccountId) return

    let cancelled = false

    const fetchCashFlow = async () => {
      setIsLoading(true)
      onLoadingChange?.(true)
      setLoadError(null)

      try {
        const params = new URLSearchParams({
          financialAccountId: cashFinancialAccountId,
        })

        let endpoint = "/CashFlow/company/today"
        if (startDate && endDate) {
          const startUtc = new Date(`${startDate}T00:00:00Z`).toISOString()
          const endUtc = new Date(`${endDate}T23:59:59Z`).toISOString()
          params.set("startUtc", startUtc)
          params.set("endUtc", endUtc)
          endpoint = "/CashFlow/company/range"
        }

        const response = await api.get<CashFlowData>(`${endpoint}?${params.toString()}`)
        if (cancelled) return

        setFetchedData(response.data)
        onDataLoaded?.(response.data)
      } catch (err: unknown) {
        if (cancelled) return
        const axiosErr = err as AxiosError<{ message?: string }>
        const message = axiosErr.response?.data?.message ?? "Failed to load cash flow statement"
        setLoadError(message)
        onError?.(message)
      } finally {
        if (cancelled) return
        setIsLoading(false)
        onLoadingChange?.(false)
      }
    }

    fetchCashFlow()

    return () => {
      cancelled = true
    }
  }, [cashFinancialAccountId, data, endDate, onDataLoaded, onError, onLoadingChange, startDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }
  const pdfFileName = `cashflow-${(startDate || "").replaceAll("/", "-") || "start"}-${
    (endDate || "").replaceAll("/", "-") || "end"
  }.pdf`

  const handleOpenPdf = async () => {
    if (!effectiveData) return
    const blob = await pdf(
      <CashFlowPdfDocument
        data={effectiveData}
        companyName={companyName}
        companyAddress={companyAddress}
        startDate={startDate}
        endDate={endDate}
      />,
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
      <span className={`font-mono ${amount < 0 ? "text-red-500 dark:text-red-400" : ""}`}>
        {amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)}
      </span>
    </div>
  )

  return (
    <div className={embedded ? "space-y-4" : "space-y-6"}>
      {!data && cashFinancialAccountId && (isLoading || loadError) && (
        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading cash flow statement…</p>}
          {loadError && <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>}
        </div>
      )}

      {!embedded && (
        <div className="flex justify-end gap-2 mb-4">
          {effectiveData ? (
            <PDFDownloadLink
              document={
                <CashFlowPdfDocument
                  data={effectiveData}
                  companyName={companyName}
                  companyAddress={companyAddress}
                  startDate={startDate}
                  endDate={endDate}
                />
              }
              fileName={pdfFileName}
            >
              {({ loading }) => (
                <Button
                  variant="outline"
                  disabled={loading}
                  className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading ? "Preparing PDF..." : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          ) : (
            <Button variant="outline" disabled className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
              <Download className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : "Download PDF"}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleOpenPdf}
            disabled={!effectiveData || (isLoading && !data)}
            className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
          >
            <Printer className="mr-2 h-4 w-4" />
            Open / Print
          </Button>
        </div>
      )}

      {!canRenderData && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border-b dark:border-gray-700">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 dark:text-purple-400" />
              <CardTitle className="text-2xl dark:text-white">{companyName}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">{companyAddress}</p>
            <h2 className="text-xl font-bold dark:text-white">CASH FLOW STATEMENT</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              For the Period: {startDate || "N/A"} to {endDate || "N/A"}
            </p>
          </CardHeader>
          <CardContent className="py-8 text-center text-sm text-muted-foreground dark:text-gray-300">
            {cashFinancialAccountId ? "Loading cash flow statement…" : "Select an account to load cash flow."}
          </CardContent>
        </Card>
      )}

      {canRenderData && (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 border-b dark:border-gray-700">
            <div className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 dark:text-purple-400" />
              <CardTitle className="text-2xl dark:text-white">{companyName}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">{companyAddress}</p>
            <h2 className="text-xl font-bold dark:text-white">CASH FLOW STATEMENT</h2>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              For the Period: {startDate || "N/A"} to {endDate || "N/A"}
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            {/* Operating Activities */}
            <div>
              <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">
                CASH FLOWS FROM OPERATING ACTIVITIES
              </h3>
              <p className="text-sm font-semibold mt-3 ml-6 dark:text-gray-200">* Cash Inflows:</p>
              <Row label="Sales Collections" amount={effectiveData!.breakdown.salesCollections} level={2} />
              {effectiveData!.breakdown.unlinkedSalesCollections > 0 && (
                <Row label="Unlinked Sales Collections" amount={effectiveData!.breakdown.unlinkedSalesCollections} level={2} />
              )}
              <Row label="Transfers In" amount={effectiveData!.breakdown.transfersIn} level={2} />
              <Row label="Debit Notes" amount={effectiveData!.breakdown.debitNotes} level={2}/>

              <p className="text-sm font-semibold mt-3 ml-6 dark:text-gray-200">* Cash Outflows:</p>
              <Row label="Purchase Payments" amount={-effectiveData!.breakdown.purchasePayments} level={2} />
              {effectiveData!.breakdown.unlinkedPurchasePayments > 0 && (
                <Row label="Unlinked Purchase Payments" amount={-effectiveData!.breakdown.unlinkedPurchasePayments} level={2} />
              )}
              <Row label="Operating Expenditures" amount={-effectiveData!.breakdown.expenditures} level={2} />
              {effectiveData!.breakdown.unlinkedExpenditures > 0 && (
                <Row label="Unlinked Expenditures" amount={-effectiveData!.breakdown.unlinkedExpenditures} level={2} />
              )}
              <Row label="Transfers Out" amount={-effectiveData!.breakdown.transfersOut} level={2} />

              <Row label="Credit Notes" amount={-effectiveData!.breakdown.creditNotes} level={2} />


              <Separator className="my-2 dark:bg-gray-700" />
              <div className="bg-green-500/10 dark:bg-green-500/20 p-3 rounded-lg mt-2">
                <Row
                  label="Net Cash from Operating Activities"
                  amount={
                    effectiveData!.breakdown.salesCollections +
                    effectiveData!.breakdown.unlinkedSalesCollections +
                    effectiveData!.breakdown.debitNotes +
                    effectiveData!.breakdown.transfersIn -
                    effectiveData!.breakdown.purchasePayments -
                    effectiveData!.breakdown.unlinkedPurchasePayments -
                    effectiveData!.breakdown.expenditures -
                    effectiveData!.breakdown.unlinkedExpenditures -
                    effectiveData!.breakdown.transfersOut -
                    effectiveData!.breakdown.creditNotes
                  }
                  bold
                />
              </div>
            </div>

            <Separator className="my-4 dark:bg-gray-700" />

            {/* Investing Activities */}
            <div>
              <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">
                CASH FLOWS FROM INVESTING ACTIVITIES
              </h3>
              <Row label="Purchase of Fixed Assets" amount={-effectiveData!.breakdown.fixedAssetPurchases} level={1} />
              {effectiveData!.breakdown.unlinkedFixedAssetPurchases > 0 && (
                <Row label="Unlinked Fixed Asset Purchases" amount={-effectiveData!.breakdown.unlinkedFixedAssetPurchases} level={1} />
              )}
              <Separator className="my-2 dark:bg-gray-700" />
              <div className="bg-blue-500/10 dark:bg-blue-500/20 p-3 rounded-lg mt-2">
                <Row
                  label="Net Cash from Investing Activities"
                  amount={-effectiveData!.breakdown.fixedAssetPurchases - effectiveData!.breakdown.unlinkedFixedAssetPurchases}
                  bold
                />
              </div>
            </div>

            <Separator className="my-4 dark:bg-gray-700" />

            {/* Financing Activities */}
            <div>
              <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">
                CASH FLOWS FROM FINANCING ACTIVITIES
              </h3>
              <Row label="Capital Contributions" amount={effectiveData!.breakdown.capitalContributions} level={1} />
              {effectiveData!.breakdown.unlinkedCapitalContributions > 0 && (
                <Row label="Unlinked Capital Contributions" amount={effectiveData!.breakdown.unlinkedCapitalContributions} level={1} />
              )}
              <Row label="Capital Withdrawals" amount={-effectiveData!.breakdown.capitalWithdrawals} level={1} />
              {effectiveData!.breakdown.unlinkedCapitalWithdrawals > 0 && (
                <Row label="Unlinked Capital Withdrawals" amount={-effectiveData!.breakdown.unlinkedCapitalWithdrawals} level={1} />
              )}
              <Separator className="my-2 dark:bg-gray-700" />
              <div className="bg-purple-500/10 dark:bg-purple-500/20 p-3 rounded-lg mt-2">
                <Row
                  label="Net Cash from Financing Activities"
                  amount={
                    effectiveData!.breakdown.capitalContributions +
                    effectiveData!.breakdown.unlinkedCapitalContributions -
                    effectiveData!.breakdown.capitalWithdrawals -
                    effectiveData!.breakdown.unlinkedCapitalWithdrawals
                  }
                  bold
                />
              </div>
            </div>

            <Separator className="my-4 dark:bg-gray-700" />

            {/* Net Cash Flow Summary */}
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 p-3 rounded-lg">
                <Row label="NET INCREASE/(DECREASE) IN CASH" amount={effectiveData!.netCashFlow} bold />
              </div>
              <Row label="Cash at Beginning of Period" amount={effectiveData!.openingCashBalance} bold />
              <Separator className="my-2 dark:bg-gray-700" />
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-500/30 dark:to-emerald-500/30 p-4 rounded-lg">
                <Row label="CASH AT END OF PERIOD" amount={effectiveData!.closingCashBalance} bold />
              </div>
            </div>

            {/* Cash Accounts Summary */}
            {effectiveData!.cashAccounts && effectiveData!.cashAccounts.length > 0 && (
              <>
                <Separator className="my-4 dark:bg-gray-700" />
                <div>
                  <h3 className="font-bold text-lg mb-2 bg-secondary/50 dark:bg-gray-700 p-2 rounded dark:text-white">
                    CASH ACCOUNTS
                  </h3>
                  {effectiveData!.cashAccounts.map((account) => (
                    <Row key={account.id} label={account.accountName} amount={account.balance} level={1} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
      </Card>
      )}
    </div>
  )
}
