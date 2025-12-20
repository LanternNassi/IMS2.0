import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceData } from './InvoicePdf'

// Register fonts if needed
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' })

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  companyInfo: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 5,
  },
  billTo: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  customerInfo: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  tableCellRight: {
    flex: 1,
    fontSize: 10,
    textAlign: 'right',
  },
  totals: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    fontSize: 12,
  },
  totalRowBold: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    fontSize: 14,
    fontWeight: 'bold',
    borderTop: 1,
    borderTopColor: '#000',
  },
  footer: {
    marginTop: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
  },
  signature: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 200,
    borderTop: 1,
    borderTopColor: '#000',
    paddingTop: 10,
    textAlign: 'center',
  },
})

interface InvoicePdfDocumentProps {
  data: InvoiceData
  companyName?: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  companyTaxId?: string
  includeOutstanding?: boolean
  includePaymentDetails?: boolean
  notes?: string
}

export function InvoicePdfDocument({
  data,
  companyName = "Inventory Management System",
  companyAddress = "Kampala, Uganda",
  companyPhone = "+256 700 000 000",
  companyEmail = "info@company.com",
  companyTaxId = "TIN: 1234567890",
  includeOutstanding = true,
  includePaymentDetails = true,
  notes = "",
}: InvoicePdfDocumentProps) {
  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusText = () => {
    if (data.sale.isPaid) return "PAID"
    if (data.sale.paidAmount > 0) return "PARTIALLY PAID"
    return "UNPAID"
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>{companyAddress}</Text>
            <Text style={styles.companyDetails}>{companyPhone} | {companyEmail}</Text>
            <Text style={styles.companyDetails}>{companyTaxId}</Text>
          </View>

          <Text style={styles.invoiceTitle}>INVOICE</Text>

          <Text style={styles.invoiceNumber}>Invoice #: SA-{data.sale.id.slice(0, 8)}</Text>
          <Text style={styles.invoiceNumber}>Date: {formatDate(data.sale.saleDate)}</Text>
          <Text style={styles.invoiceNumber}>Status: {getStatusText()}</Text>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>BILL TO:</Text>
          <Text style={styles.customerInfo}>{data.customer.name}</Text>
          <Text style={styles.customerInfo}>{data.customer.address}</Text>
          <Text style={styles.customerInfo}>Phone: {data.customer.phone}</Text>
          <Text style={styles.customerInfo}>Email: {data.customer.email}</Text>
          <Text style={styles.customerInfo}>Account #: {data.customer.accountNumber}</Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>ITEMS</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.tableCell}>#</Text>
            <Text style={styles.tableCell}>Description</Text>
            <Text style={styles.tableCellCenter}>Qty</Text>
            <Text style={styles.tableCellRight}>Unit Price</Text>
            <Text style={styles.tableCellRight}>Total</Text>
          </View>

          {data.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{index + 1}</Text>
              <View style={styles.tableCell}>
                <Text>{item.product.productName}</Text>
                {/* {item.variation && (
                  <Text style={{ fontSize: 8, color: '#666' }}>
                    {item.variation.name} ({item.variation.unitSize} {item.variation.unitofMeasure})
                  </Text>
                )}
                {item.generic && (
                  <Text style={{ fontSize: 8, color: '#666' }}>
                    Batch: {item.generic.batchNumber} | Expiry: {formatDate(item.generic.expiryDate)}
                  </Text>
                )} */}
              </View>
              <Text style={styles.tableCellCenter}>{item.quantity}</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(data.sale.totalAmount)}</Text>
          </View>
          <View style={styles.totalRowBold}>
            <Text>Total Amount:</Text>
            <Text>{formatCurrency(data.sale.finalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Amount Paid:</Text>
            <Text>{formatCurrency(data.sale.paidAmount)}</Text>
          </View>
          {includeOutstanding && (
            <View style={styles.totalRow}>
              <Text>Outstanding Balance:</Text>
              <Text>{formatCurrency(data.sale.outstandingAmount)}</Text>
            </View>
          )}
        </View>

        {/* Payment Details */}
        {includePaymentDetails && data.payments.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>PAYMENT HISTORY</Text>
            {data.payments.map((payment, index) => (
              <View key={payment.id} style={{ marginBottom: 10, padding: 10, backgroundColor: '#f9f9f9' }}>
                <Text>Payment #{index + 1} - {formatDate(payment.addedAt)}</Text>
                <Text>Amount: {formatCurrency(payment.paidAmount)}</Text>
                <Text>Method: {payment.paymentMethod.replaceAll("_", " ")}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <Text>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Processed by: {data.processedBy.username} ({data.processedBy.role})</Text>
          <Text>Thank you for your business!</Text>
          <Text>For queries, contact: {companyEmail}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Authorized By</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}