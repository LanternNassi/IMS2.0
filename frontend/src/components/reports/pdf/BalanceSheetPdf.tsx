"use client"

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { BalanceSheetData } from "@/components/Balance-Sheet"

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    marginBottom: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#374151",
  },
  sectionTitle: {
    marginTop: 14,
    padding: 8,
    backgroundColor: "#111827",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
  },
  box: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
  },
  subheading: {
    backgroundColor: "#f3f4f6",
    padding: 6,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: {
    color: "#111827",
  },
  muted: {
    color: "#6b7280",
  },
  mono: {
    fontFamily: "Courier",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontWeight: 700,
  },
  bigTotal: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f3f4f6",
    fontWeight: 700,
    fontSize: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noteTitle: {
    marginTop: 14,
    padding: 8,
    backgroundColor: "#f3f4f6",
    fontWeight: 700,
  },
  note: {
    fontSize: 9,
    color: "#374151",
    marginTop: 4,
  },
})

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" })
}

export function BalanceSheetPdfDocument({
  data,
  companyName,
  companyAddress,
}: {
  data: BalanceSheetData
  companyName: string
  companyAddress: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>{companyAddress}</Text>
          <Text style={{ ...styles.title, fontSize: 14, marginTop: 8 }}>BALANCE SHEET</Text>
          <Text style={styles.subtitle}>As at {formatDate(data.asOfUtc)}</Text>
          <Text style={styles.subtitle}>Currency: {data.reportingCurrency}</Text>
        </View>

        <Text style={styles.sectionTitle}>ASSETS</Text>
        <View style={styles.box}>
          <Text style={styles.subheading}>Current Assets</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Cash and Bank</Text>
            <Text style={styles.mono}>{formatCurrency(data.assets.cashAndBankTotal, data.reportingCurrency)}</Text>
          </View>
          {data.assets.cashAccounts.map((account) => (
            <View key={account.id} style={styles.row}>
              <Text style={styles.muted}>
                {account.accountName} ({account.type.replaceAll("_", " ")})
              </Text>
              <Text style={{ ...styles.mono, color: account.balance < 0 ? "#b91c1c" : "#111827" }}>
                {formatCurrency(account.balance, data.reportingCurrency)}
              </Text>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.label}>Accounts Receivable</Text>
            <Text style={styles.mono}>{formatCurrency(data.assets.accountsReceivableTotal, data.reportingCurrency)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Inventory ({data.assets.inventoryTotalQuantity} units)</Text>
            <Text style={styles.mono}>{formatCurrency(data.assets.inventoryValue, data.reportingCurrency)}</Text>
          </View>

          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text>Total Current Assets</Text>
            <Text style={styles.mono}>
              {formatCurrency(
                data.assets.cashAndBankTotal +
                  data.assets.accountsReceivableTotal +
                  data.assets.inventoryValue,
                data.reportingCurrency,
              )}
            </Text>
          </View>

          <Text style={styles.subheading}>Non-Current Assets</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Fixed Assets (Net)</Text>
            <Text style={styles.mono}>{formatCurrency(data.assets.fixedAssetsNet, data.reportingCurrency)}</Text>
          </View>

          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text>Total Non-Current Assets</Text>
            <Text style={styles.mono}>{formatCurrency(data.assets.fixedAssetsNet, data.reportingCurrency)}</Text>
          </View>

          <View style={styles.bigTotal}>
            <Text>TOTAL ASSETS</Text>
            <Text style={styles.mono}>{formatCurrency(data.assetsTotal, data.reportingCurrency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>LIABILITIES & EQUITY</Text>
        <View style={styles.box}>
          <Text style={styles.subheading}>Current Liabilities</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Accounts Payable</Text>
            <Text style={styles.mono}>{formatCurrency(data.liabilities.accountsPayableTotal, data.reportingCurrency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Taxes Payable</Text>
            <Text style={styles.mono}>{formatCurrency(data.liabilities.taxesPayableTotal, data.reportingCurrency)}</Text>
          </View>
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text>Total Liabilities</Text>
            <Text style={styles.mono}>{formatCurrency(data.liabilitiesTotal, data.reportingCurrency)}</Text>
          </View>

          <Text style={styles.subheading}>Equity</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Owner Contributions</Text>
            <Text style={styles.mono}>{formatCurrency(data.equity.ownerContributions, data.reportingCurrency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Owner Drawings</Text>
            <Text style={styles.mono}>{formatCurrency(data.equity.ownerDrawings, data.reportingCurrency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Owner Capital (Net)</Text>
            <Text style={styles.mono}>{formatCurrency(data.equity.ownerCapitalNet, data.reportingCurrency)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Retained Earnings (Estimated)</Text>
            <Text style={{ ...styles.mono, color: data.equity.retainedEarningsEstimated < 0 ? "#b91c1c" : "#111827" }}>
              {formatCurrency(data.equity.retainedEarningsEstimated, data.reportingCurrency)}
            </Text>
          </View>
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text>Total Equity</Text>
            <Text style={styles.mono}>{formatCurrency(data.equityTotal, data.reportingCurrency)}</Text>
          </View>

          <View style={styles.bigTotal}>
            <Text>TOTAL LIABILITIES & EQUITY</Text>
            <Text style={styles.mono}>
              {formatCurrency(data.liabilitiesTotal + data.equityTotal, data.reportingCurrency)}
            </Text>
          </View>

          {data.accountingDifference !== 0 && (
            <View style={{ marginTop: 10, padding: 8, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
              <Text style={{ fontWeight: 700, color: "#b91c1c" }}>Accounting Difference</Text>
              <Text style={{ ...styles.mono, color: "#b91c1c" }}>{formatCurrency(data.accountingDifference, data.reportingCurrency)}</Text>
            </View>
          )}
        </View>

        {data.assumptions && (
          <View>
            <Text style={styles.noteTitle}>NOTES & ASSUMPTIONS</Text>
            {data.assumptions.cashBasisNote ? <Text style={styles.note}>Cash & Bank: {data.assumptions.cashBasisNote}</Text> : null}
            {data.assumptions.inventoryValuationNote ? (
              <Text style={styles.note}>Inventory: {data.assumptions.inventoryValuationNote}</Text>
            ) : null}
            {data.assumptions.receivablesNote ? <Text style={styles.note}>Receivables: {data.assumptions.receivablesNote}</Text> : null}
            {data.assumptions.payablesNote ? <Text style={styles.note}>Payables: {data.assumptions.payablesNote}</Text> : null}
            {data.assumptions.retainedEarningsNote ? (
              <Text style={styles.note}>Retained Earnings: {data.assumptions.retainedEarningsNote}</Text>
            ) : null}
          </View>
        )}
      </Page>
    </Document>
  )
}
