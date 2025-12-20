"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Printer, AlertCircle, Building2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PDFDownloadLink, pdf } from "@react-pdf/renderer"
import { BalanceSheetPdfDocument } from "@/components/reports/pdf"
import api from "@/Utils/Request"

export type BalanceSheetData = {
  asOfUtc: string
  reportingCurrency: string
  assets: {
    cashAndBankTotal: number
    cashAccounts: Array<{
      id: string
      accountName: string
      type: string
      balance: number
      isActive: boolean
    }>
    accountsReceivableTotal: number
    inventoryTotalQuantity: number
    inventoryValue: number
    fixedAssetsNet: number
  }
  liabilities: {
    accountsPayableTotal: number
    taxesPayableTotal: number
  }
  equity: {
    ownerContributions: number
    ownerDrawings: number
    ownerCapitalNet: number
    retainedEarningsEstimated: number
    profitToDate: number
    expensesToDate: number
  }
  assetsTotal: number
  liabilitiesTotal: number
  equityTotal: number
  accountingDifference: number
  assumptions?: {
    cashBasisNote?: string
    inventoryValuationNote?: string
    receivablesNote?: string
    payablesNote?: string
    retainedEarningsNote?: string
  }
}


interface BalanceSheetProps {
  data?: BalanceSheetData
  companyName?: string
  companyAddress?: string
  embedded?: boolean
}

export function BalanceSheet({
  data,
  companyName = "Inventory Management System",
  companyAddress = "Kampala, Uganda",
  embedded = false,
}: BalanceSheetProps) {
  const [fetchedData, setFetchedData] = useState<BalanceSheetData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (data) return
      setIsLoading(true)
      setLoadError(null)
      try {
        const response = await api.get("/BalanceSheet/today")
        if (cancelled) return
        setFetchedData(response.data as BalanceSheetData)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to fetch balance sheet:", error)
        setLoadError("Failed to load balance sheet.")
        setFetchedData(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [data])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const pdfFileName = `balance-sheet-${(effectiveData?.asOfUtc || "").split("T")[0] || "report"}.pdf`

  const handleOpenPdf = async () => {
    // If the component is in "live" mode (no data prop), fetch fresh data for the PDF.
    let pdfData = effectiveData
    if (!data) {
      try {
        const response = await api.get("/BalanceSheet/today")
        pdfData = response.data as BalanceSheetData
        setFetchedData(pdfData)
        setLoadError(null)
      } catch (error) {
        console.error("Failed to fetch balance sheet for PDF:", error)
        setLoadError("Failed to load balance sheet for PDF.")
        return
      }
    }

    if (!pdfData) return
    const blob = await pdf(
      <BalanceSheetPdfDocument data={pdfData} companyName={companyName} companyAddress={companyAddress} />,
    ).toBlob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, "_blank", "noopener,noreferrer")
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
  }

  return (
    <>
      <div className={embedded ? "space-y-4" : "container mx-auto py-6 space-y-4"}>
        {!embedded && effectiveData && (
          <div className="flex justify-end gap-2">
            <PDFDownloadLink
              document={
                <BalanceSheetPdfDocument
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
              className="text-black dark:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
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
          <Card className="dark:bg-gray-800 bg-white dark:border-gray-700">
            <CardHeader className="text-center space-y-2 pb-6">
              <div className="flex justify-center mb-2">
                <Building2 className="h-12 w-12 text-primary dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl font-bold dark:text-white">BALANCE SHEET</CardTitle>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                {isLoading ? "Loading..." : "No data"}
              </p>
            </CardHeader>
          </Card>
        )}

        {effectiveData?.accountingDifference !== 0 && effectiveData && (
          <Alert variant="destructive" className="no-print">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Accounting Difference Detected</AlertTitle>
            <AlertDescription>
              There is an accounting difference of {formatCurrency(effectiveData.accountingDifference)}. Assets do not equal
              Liabilities + Equity. Please review your accounts.
            </AlertDescription>
          </Alert>
        )}

        {/* Printable balance sheet */}
        {effectiveData && (
          <Card className="dark:bg-gray-800 bg-white dark:border-gray-700">
          <CardHeader className="text-center space-y-2 pb-6">
            <div className="flex justify-center mb-2">
              <Building2 className="h-12 w-12 text-primary dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold dark:text-white">{companyName}</CardTitle>
            <p className="text-sm text-muted-foreground dark:text-gray-400">{companyAddress}</p>
            <h2 className="text-2xl font-semibold mt-4 dark:text-white">BALANCE SHEET</h2>
            <p className="text-sm font-medium dark:text-gray-200">As at {formatDate(effectiveData.asOfUtc)}</p>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Currency: {effectiveData.reportingCurrency}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ASSETS SECTION */}
            <div>
              <div className="bg-primary text-primary-foreground dark:bg-blue-600 px-4 py-2 rounded-t-lg">
                <h3 className="text-lg font-bold dark:text-white">ASSETS</h3>
              </div>

              <div className="border border-t-0 dark:border-gray-700 rounded-b-lg p-4 space-y-3">
                {/* Current Assets */}
                <div className="bg-muted dark:bg-gray-700 px-3 py-1.5 rounded">
                  <h4 className="font-semibold dark:text-white">Current Assets</h4>
                </div>
                <div className="pl-6 space-y-2">
                  {/* Cash and Bank Accounts */}
                  <div className="space-y-1">
                    <span className="text-sm font-medium dark:text-gray-200">Cash and Bank:</span>
                    <div className="pl-4 space-y-1">
                      {effectiveData.assets.cashAccounts.map((account) => (
                        <div key={account.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground dark:text-gray-400">
                            {account.accountName} <span className="text-xs">({account.type.replace("_", " ")})</span>
                          </span>
                          <span className={`font-mono ${account.balance < 0 ? "text-red-500 dark:text-red-400" : ""}`}>
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-1 border-t dark:border-gray-700 dark:text-gray-100">
                        <span className="text-sm font-medium">Total Cash and Bank</span>
                        <span className="font-mono text-sm font-medium">
                          {formatCurrency(effectiveData.assets.cashAndBankTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm">Accounts Receivable</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.assets.accountsReceivableTotal)}</span>
                  </div>

                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm">
                      Inventory{" "}
                      <span className="text-xs text-muted-foreground dark:text-gray-400">
                        ({effectiveData.assets.inventoryTotalQuantity} units)
                      </span>
                    </span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.assets.inventoryValue)}</span>
                  </div>

                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between font-semibold dark:text-gray-100">
                    <span className="text-sm">Total Current Assets</span>
                    <span className="font-mono text-sm">
                      {formatCurrency(
                        effectiveData.assets.cashAndBankTotal +
                          effectiveData.assets.accountsReceivableTotal +
                          effectiveData.assets.inventoryValue,
                      )}
                    </span>
                  </div>
                </div>

                {/* Non-Current Assets */}
                <div className="bg-muted dark:bg-gray-700 px-3 py-1.5 rounded mt-4">
                  <h4 className="font-semibold dark:text-white">Non-Current Assets</h4>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm">Fixed Assets (Net)</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.assets.fixedAssetsNet)}</span>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between font-semibold dark:text-gray-100">
                    <span className="text-sm">Total Non-Current Assets</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.assets.fixedAssetsNet)}</span>
                  </div>
                </div>

                <Separator className="my-4 dark:bg-gray-700" />
                <div className="flex justify-between font-bold text-lg bg-muted dark:bg-gray-700 px-3 py-2 rounded dark:text-white">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono">{formatCurrency(effectiveData.assetsTotal)}</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY SECTION */}
            <div>
              <div className="bg-primary text-primary-foreground dark:bg-blue-600 px-4 py-2 rounded-t-lg">
                <h3 className="text-lg font-bold dark:text-white">LIABILITIES & EQUITY</h3>
              </div>

              <div className="border border-t-0 dark:border-gray-700 rounded-b-lg p-4 space-y-3">
                {/* Current Liabilities */}
                <div className="bg-muted dark:bg-gray-700 px-3 py-1.5 rounded">
                  <h4 className="font-semibold dark:text-white">Current Liabilities</h4>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm">Accounts Payable</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.liabilities.accountsPayableTotal)}</span>
                  </div>
                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm">Taxes Payable</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.liabilities.taxesPayableTotal)}</span>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between font-semibold dark:text-gray-100">
                    <span className="text-sm">Total Current Liabilities</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.liabilitiesTotal)}</span>
                  </div>
                </div>

                <Separator className="my-3 dark:bg-gray-700" />
                <div className="flex justify-between font-semibold bg-muted dark:bg-gray-700 px-3 py-2 rounded dark:text-white">
                  <span>Total Liabilities</span>
                  <span className="font-mono">{formatCurrency(effectiveData.liabilitiesTotal)}</span>
                </div>

                {/* Equity */}
                <div className="bg-muted dark:bg-gray-700 px-3 py-1.5 rounded mt-4">
                  <h4 className="font-semibold dark:text-white">Equity</h4>
                </div>
                <div className="pl-6 space-y-2">
                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm">Owner Contributions</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.equity.ownerContributions)}</span>
                  </div>
                  <div className="flex justify-between dark:text-gray-200">
                    <span className="text-sm italic">Less: Owner Drawings</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.equity.ownerDrawings)}</span>
                  </div>
                  <div className="flex justify-between border-t dark:border-gray-700 pt-1 dark:text-gray-100">
                    <span className="text-sm font-medium">Owner Capital (Net)</span>
                    <span className="font-mono text-sm font-medium">{formatCurrency(effectiveData.equity.ownerCapitalNet)}</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between dark:text-gray-200">
                      <span className="text-sm">Retained Earnings (Estimated)</span>
                      <span
                        className={`font-mono text-sm ${
                          effectiveData.equity.retainedEarningsEstimated < 0 ? "text-red-500 dark:text-red-400" : ""
                        }`}
                      >
                        {formatCurrency(effectiveData.equity.retainedEarningsEstimated)}
                      </span>
                    </div>
                    <div className="pl-4 space-y-1 mt-1 text-xs text-muted-foreground dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Profit to Date</span>
                        <span className="font-mono">{formatCurrency(effectiveData.equity.profitToDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Less: Expenses to Date</span>
                        <span className="font-mono">{formatCurrency(effectiveData.equity.expensesToDate)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between font-semibold dark:text-gray-100">
                    <span className="text-sm">Total Equity</span>
                    <span className="font-mono text-sm">{formatCurrency(effectiveData.equityTotal)}</span>
                  </div>
                </div>

                <Separator className="my-4 dark:bg-gray-700" />
                <div className="flex justify-between font-bold text-lg bg-muted dark:bg-gray-700 px-3 py-2 rounded dark:text-white">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono">{formatCurrency(effectiveData.liabilitiesTotal + effectiveData.equityTotal)}</span>
                </div>

                {/* Show accounting difference if exists */}
                {effectiveData.accountingDifference !== 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="flex justify-between font-semibold text-red-700 dark:text-red-400">
                      <span className="text-sm">Accounting Difference</span>
                      <span className="font-mono text-sm">{formatCurrency(effectiveData.accountingDifference)}</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      Assets do not equal Liabilities + Equity
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Assumptions & Notes */}
            {effectiveData.assumptions && (
              <div className="mt-6">
                <div className="bg-muted dark:bg-gray-700 px-4 py-2 rounded-t-lg">
                  <h3 className="text-sm font-bold dark:text-white">NOTES & ASSUMPTIONS</h3>
                </div>
                <div className="border border-t-0 dark:border-gray-700 rounded-b-lg p-4 space-y-2 text-xs text-muted-foreground dark:text-gray-400">
                  {effectiveData.assumptions.cashBasisNote && (
                    <p>
                      <span className="font-semibold">Cash & Bank:</span> {effectiveData.assumptions.cashBasisNote}
                    </p>
                  )}
                  {effectiveData.assumptions.inventoryValuationNote && (
                    <p>
                      <span className="font-semibold">Inventory:</span> {effectiveData.assumptions.inventoryValuationNote}
                    </p>
                  )}
                  {effectiveData.assumptions.receivablesNote && (
                    <p>
                      <span className="font-semibold">Receivables:</span> {effectiveData.assumptions.receivablesNote}
                    </p>
                  )}
                  {effectiveData.assumptions.payablesNote && (
                    <p>
                      <span className="font-semibold">Payables:</span> {effectiveData.assumptions.payablesNote}
                    </p>
                  )}
                  {effectiveData.assumptions.retainedEarningsNote && (
                    <p>
                      <span className="font-semibold">Retained Earnings:</span> {effectiveData.assumptions.retainedEarningsNote}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </>
  )
}
