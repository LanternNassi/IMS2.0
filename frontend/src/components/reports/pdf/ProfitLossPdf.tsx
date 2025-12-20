"use client"

import React from "react"
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type { ProfitLossData } from "@/components/profile-loss-statement"

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
  label: {
    color: "#111827",
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

function row(label: string, amount: number, currency: string, options?: { indent?: number; bold?: boolean }) {
  const indent = options?.indent ?? 0
  const bold = options?.bold ?? false
  return (
    <View style={styles.row}>
      <Text style={{ ...styles.label, marginLeft: indent * 12, fontWeight: bold ? 700 : 400 }}>{label}</Text>
      <Text style={{ ...styles.mono, fontWeight: bold ? 700 : 400, color: amount < 0 ? "#b91c1c" : "#111827" }}>
        {formatCurrency(amount, currency)}
      </Text>
    </View>
  )
}

export function ProfitLossPdfDocument({
  data,
  companyName,
  companyAddress,
  currency,
}: {
  data: ProfitLossData
  companyName: string
  companyAddress: string
  currency?: string
}) {
  const effectiveCurrency = currency ?? data.reportingCurrency ?? "UGX"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{companyName}</Text>
          <Text style={styles.subtitle}>{companyAddress}</Text>
          <Text style={{ ...styles.title, fontSize: 14, marginTop: 8 }}>PROFIT & LOSS STATEMENT</Text>
          <Text style={styles.subtitle}>
            Period: {(data.periodUtcStart || "").split("T")[0] || "N/A"} to {(data.periodUtcEnd || "").split("T")[0] || "N/A"}
          </Text>
          <Text style={styles.subtitle}>Currency: {effectiveCurrency}</Text>
        </View>

        <Text style={styles.sectionTitle}>REVENUE</Text>
        <View style={styles.box}>
          {row("Sales Revenue", data.salesRevenue, effectiveCurrency, { indent: 1 })}
          {row("Sales Refunds", data.salesRefunds, effectiveCurrency, { indent: 1 })}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>Net Sales Revenue</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>{formatCurrency(data.netSalesRevenue, effectiveCurrency)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>COST OF GOODS SOLD</Text>
        <View style={styles.box}>
          <View style={{ ...styles.row, ...styles.totalRow, marginTop: 0, paddingTop: 0, borderTopWidth: 0 }}>
            <Text style={{ fontWeight: 700 }}>COGS (Estimated)</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>
              {formatCurrency(data.costOfGoodsSoldEstimated, effectiveCurrency)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>OPERATING EXPENSES</Text>
        <View style={styles.box}>
          {data.operatingExpensesByCategory?.map((expense) => (
            <React.Fragment key={expense.categoryId}>
              {row(expense.categoryName, expense.amount, effectiveCurrency, { indent: 1 })}
            </React.Fragment>
          ))}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>Total Operating Expenses</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>
              {formatCurrency(data.operatingExpensesTotal, effectiveCurrency)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>SUMMARY</Text>
        <View style={styles.box}>
          {row("Gross Profit", data.grossProfit, effectiveCurrency, { bold: true })}
          <View style={{ ...styles.row, ...styles.totalRow }}>
            <Text style={{ fontWeight: 700 }}>NET INCOME (Estimated)</Text>
            <Text style={{ ...styles.mono, fontWeight: 700 }}>{formatCurrency(data.netIncomeEstimated, effectiveCurrency)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
