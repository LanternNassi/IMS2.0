"use client"

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { CashFlowData } from "@/components/cashflow-statement"

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
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
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

function cfRow(label: string, amount: number, currency: string, indent = 0, bold = false) {
  return (
    <View style={styles.row}>
      <Text style={{ marginLeft: indent * 12, fontWeight: bold ? 700 : 400 }}>{label}</Text>
      <Text style={{ ...styles.mono, fontWeight: bold ? 700 : 400, color: amount < 0 ? "#b91c1c" : "#111827" }}>
        {amount < 0 ? `(${formatCurrency(Math.abs(amount), currency)})` : formatCurrency(amount, currency)}
      </Text>
    </View>
  )
}

export function CashFlowPdfDocument({
  data,
  companyName,
  companyAddress,
  startDate,
  endDate,
  currency = "UGX",
}: {
  data: CashFlowData
  companyName: string
  companyAddress: string
  startDate?: string
  endDate?: string
  currency?: string
}) {
  // Calculate net cash from each activity
  const netOperating =
    data.breakdown.salesCollections +
    data.breakdown.unlinkedSalesCollections +
    data.breakdown.transfersIn -
    data.breakdown.purchasePayments -
    data.breakdown.unlinkedPurchasePayments -
    data.breakdown.expenditures -
    data.breakdown.unlinkedExpenditures -
    data.breakdown.transfersOut

  const netInvesting = -(data.breakdown.fixedAssetPurchases + data.breakdown.unlinkedFixedAssetPurchases)

  const netFinancing =
    data.breakdown.capitalContributions +
    data.breakdown.unlinkedCapitalContributions -
    data.breakdown.capitalWithdrawals -
    data.breakdown.unlinkedCapitalWithdrawals

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>{companyAddress}</Text>
          <Text style={{ ...styles.title, fontSize: 14, marginTop: 8 }}>CASH FLOW STATEMENT</Text>
          <Text style={styles.subtitle}>Period: {startDate || "N/A"} to {endDate || "N/A"}</Text>
        </View>

        <Text style={styles.sectionTitle}>OPERATING ACTIVITIES</Text>
        <View style={styles.box}>
          <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>Cash Inflows:</Text>
          {cfRow("Sales Collections", data.breakdown.salesCollections, currency, 1)}
          {data.breakdown.unlinkedSalesCollections > 0 &&
            cfRow("Unlinked Sales Collections", data.breakdown.unlinkedSalesCollections, currency, 1)}
          {cfRow("Transfers In", data.breakdown.transfersIn, currency, 1)}
          <Text style={{ fontSize: 9, fontWeight: 700, marginTop: 4 }}>Cash Outflows:</Text>
          {cfRow("Purchase Payments", -data.breakdown.purchasePayments, currency, 1)}
          {data.breakdown.unlinkedPurchasePayments > 0 &&
            cfRow("Unlinked Purchase Payments", -data.breakdown.unlinkedPurchasePayments, currency, 1)}
          {cfRow("Operating Expenditures", -data.breakdown.expenditures, currency, 1)}
          {data.breakdown.unlinkedExpenditures > 0 &&
            cfRow("Unlinked Expenditures", -data.breakdown.unlinkedExpenditures, currency, 1)}
          {cfRow("Transfers Out", -data.breakdown.transfersOut, currency, 1)}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>Net Cash from Operations</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>{formatCurrency(netOperating, currency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>INVESTING ACTIVITIES</Text>
        <View style={styles.box}>
          {cfRow("Purchase of Fixed Assets", -data.breakdown.fixedAssetPurchases, currency, 0)}
          {data.breakdown.unlinkedFixedAssetPurchases > 0 &&
            cfRow("Unlinked Fixed Asset Purchases", -data.breakdown.unlinkedFixedAssetPurchases, currency, 0)}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>Net Cash from Investing</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>{formatCurrency(netInvesting, currency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>FINANCING ACTIVITIES</Text>
        <View style={styles.box}>
          {cfRow("Capital Contributions", data.breakdown.capitalContributions, currency, 0)}
          {data.breakdown.unlinkedCapitalContributions > 0 &&
            cfRow("Unlinked Capital Contributions", data.breakdown.unlinkedCapitalContributions, currency, 0)}
          {cfRow("Capital Withdrawals", -data.breakdown.capitalWithdrawals, currency, 0)}
          {data.breakdown.unlinkedCapitalWithdrawals > 0 &&
            cfRow("Unlinked Capital Withdrawals", -data.breakdown.unlinkedCapitalWithdrawals, currency, 0)}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>Net Cash from Financing</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>{formatCurrency(netFinancing, currency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CASH SUMMARY</Text>
        <View style={styles.box}>
          {cfRow("Net Cash Flow", data.netCashFlow, currency, 0, true)}
          {cfRow("Cash Beginning", data.openingCashBalance, currency, 0)}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>Cash Ending</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>{formatCurrency(data.closingCashBalance, currency)}</Text>
          </View>
        </View>

        {data.cashAccounts && data.cashAccounts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>CASH ACCOUNTS</Text>
            <View style={styles.box}>
              {data.cashAccounts.map((account) => cfRow(account.accountName, account.balance, currency, 0))}
            </View>
          </>
        )}
      </Page>
    </Document>
  )
}
