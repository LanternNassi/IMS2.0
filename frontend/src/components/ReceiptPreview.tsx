"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Printer, FileText, Receipt } from 'lucide-react'

interface SaleItem {
  id: string
  productName: string
  quantity: number
  basePrice: number
  totalPrice: number
}

interface ReceiptPreviewProps {
  saleId?: string
  customerName?: string
  items: SaleItem[]
  totalAmount: number
  discount: number
  paidAmount: number
  returnAmount: number
  date?: string
  companyName?: string
  companyAddress?: string
  companyDescription?: string
  companyPhones?: string[]
}

// Helper function to truncate text for thermal printer (max 20 chars)
const truncateText = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// Helper function to format currency for thermal printer
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Helper function to format currency for thermal printer without trailing zeros
const formatCurrencyThermal = (amount: number): string => {
  // Format with decimals, then remove trailing zeros and decimal point if needed
  const formatted = amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return formatted.replace(/\.00$/, '')
}

export function ReceiptPreview({
  saleId,
  customerName = "Walk-in Customer",
  items,
  totalAmount,
  discount,
  paidAmount,
  returnAmount,
  date = new Date().toLocaleDateString(),
  companyName = "Inventory Management System",
  companyAddress = "Kampala, Uganda",
  companyDescription = "Dealer in all kinds of goods and services",
  companyPhones = ["+256 700 000 000", "+256 700 000 001"]
}: ReceiptPreviewProps) {
  const [viewMode, setViewMode] = useState<'card' | 'thermal' | 'medium'>('thermal')

  // Update body class for print styles
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = document.body.className.replace(/view-mode-\w+/g, '')
      document.body.classList.add(`view-mode-${viewMode}`)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove(`view-mode-${viewMode}`)
      }
    }
  }, [viewMode])

  return (
    <div className={`receipt-preview-wrapper view-mode-${viewMode}`}>
      {/* Dynamic page size rule based on view mode */}
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          ${viewMode === 'thermal' ? 'size: 80mm auto; margin: 0; padding: 5mm;' : ''}
          ${viewMode === 'medium' ? 'size: 148mm 105mm; margin: 0; padding: 8mm;' : ''}
          ${viewMode === 'card' ? 'size: A5; margin: 0; padding: 10mm;' : ''}
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          
          /* Thermal printer format (80mm) */
          .view-mode-thermal .thermal-receipt,
          .view-mode-thermal .thermal-receipt * {
            visibility: visible;
          }
          
          .view-mode-thermal .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            margin: 0;
            padding: 5mm;
            background: white;
            color: black;
            font-size: 8pt;
            line-height: 1.2;
            font-weight: normal;
          }
          
          .view-mode-thermal .thermal-receipt .receipt-table th,
          .view-mode-thermal .thermal-receipt .receipt-table td {
            border: 1px solid #000 !important;
            font-weight: bold !important;
          }
          
          .view-mode-thermal .thermal-receipt .receipt-info.description,
          .view-mode-thermal .thermal-receipt .receipt-info.address,
          .view-mode-thermal .thermal-receipt .receipt-info.phones,
          .view-mode-thermal .thermal-receipt .receipt-line.date-line,
          .view-mode-thermal .thermal-receipt .receipt-line.customer-line,
          .view-mode-thermal .thermal-receipt .receipt-line.subtotal-line,
          .view-mode-thermal .thermal-receipt .receipt-line.paid-amount-line,
          .view-mode-thermal .thermal-receipt .receipt-footer {
            font-weight: bold !important;
          }
          
          /* Medium format (half A5 = 148mm x 105mm) */
          .view-mode-medium .medium-receipt,
          .view-mode-medium .medium-receipt * {
            visibility: visible;
          }
          
          .view-mode-medium .medium-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 148mm;
            max-width: 148mm;
            margin: 0;
            padding: 8mm;
            background: white;
            color: black;
          }
          
          /* Card format */
          .view-mode-card .card-receipt,
          .view-mode-card .card-receipt * {
            visibility: visible;
          }
          
          .view-mode-card .card-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
            background: white;
            color: black;
          }
          
          .no-print,
          .hidden {
            display: none !important;
            visibility: hidden !important;
          }
        }
        
        /* Screen styles for all formats */
        .receipt-preview-wrapper {
          width: 100%;
        }
        
        /* Thermal receipt styles */
        .thermal-receipt {
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 5px;
          background: white;
          color: black;
          font-size: 8pt;
          line-height: 1.2;
          font-weight: normal;
        }
        
        .thermal-receipt .receipt-header {
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          margin-bottom: 4px;
        }
        
        .thermal-receipt .receipt-title {
          font-weight: bold;
          font-size: 10pt;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .thermal-receipt .receipt-info {
          font-size: 8pt;
          margin: 1px 0;
          word-wrap: break-word;
          white-space: normal;
          font-weight: normal;
        }
        
        .thermal-receipt .receipt-info.description {
          word-wrap: break-word;
          white-space: normal;
          overflow-wrap: break-word;
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-info.address {
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-info.phones {
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-section {
          margin: 4px 0;
        }
        
        .thermal-receipt .receipt-line {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-size: 9pt;
          font-weight: normal;
        }
        
        .thermal-receipt .receipt-line.date-line,
        .thermal-receipt .receipt-line.customer-line {
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-line.subtotal-line,
        .thermal-receipt .receipt-line.paid-amount-line {
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
          font-size: 8pt;
        }
        
        .thermal-receipt .receipt-table th,
        .thermal-receipt .receipt-table td {
          border: 1px solid #000;
          padding: 2px 3px;
          text-align: left;
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-table th {
          font-weight: bold;
          text-align: center;
        }
        
        .thermal-receipt .receipt-table .col-product {
          width: 40%;
          text-align: left;
        }
        
        .thermal-receipt .receipt-table .col-qty {
          width: 10%;
          text-align: center;
        }
        
        .thermal-receipt .receipt-table .col-rate {
          width: 25%;
          text-align: right;
        }
        
        .thermal-receipt .receipt-table .col-total {
          width: 25%;
          text-align: right;
        }
        
        .thermal-receipt .receipt-line-item {
          display: flex;
          justify-content: space-between;
          margin: 1px 0;
          font-size: 7pt;
          padding: 1px 0;
          align-items: flex-start;
          font-weight: normal;
        }
        
        .thermal-receipt .item-name {
          flex: 0 0 40%;
          text-align: left;
          max-width: 40%;
          word-wrap: break-word;
          white-space: normal;
          overflow-wrap: break-word;
          font-size: 7pt;
          font-weight: normal;
        }
        
        .thermal-receipt .item-qty {
          width: 10%;
          text-align: center;
          font-size: 7pt;
          font-weight: normal;
        }
        
        .thermal-receipt .item-price {
          width: 25%;
          text-align: right;
          font-size: 7pt;
          font-weight: normal;
        }
        
        .thermal-receipt .item-total {
          width: 25%;
          text-align: right;
          font-weight: normal;
          font-size: 7pt;
        }
        
        .thermal-receipt .receipt-divider {
          border-top: 1px solid #000;
          margin: 4px 0;
        }
        
        .thermal-receipt .receipt-total {
          font-weight: bold;
          font-size: 9pt;
        }
        
        .thermal-receipt .receipt-footer {
          text-align: center;
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid #000;
          font-size: 8pt;
          font-weight: bold;
        }
        
        /* Medium format styles (half A5) */
        .medium-receipt {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          width: 148mm;
          max-width: 148mm;
          margin: 0 auto;
          padding: 12px;
          background: white;
          color: black;
          font-size: 11pt;
          line-height: 1.4;
        }
        
        .medium-receipt .receipt-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        
        .medium-receipt .receipt-title {
          font-weight: bold;
          font-size: 16pt;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        
        .medium-receipt .receipt-info {
          font-size: 9pt;
          margin: 3px 0;
        }
        
        .medium-receipt .receipt-section {
          margin: 10px 0;
        }
        
        .medium-receipt .receipt-line {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
          font-size: 10pt;
        }
        
        .medium-receipt .receipt-line-item {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
          font-size: 9pt;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 3px;
        }
        
        .medium-receipt .item-name {
          flex: 1;
          text-align: left;
          max-width: 50%;
        }
        
        .medium-receipt .item-qty {
          width: 10%;
          text-align: center;
        }
        
        .medium-receipt .item-price {
          width: 20%;
          text-align: right;
        }
        
        .medium-receipt .item-total {
          width: 20%;
          text-align: right;
          font-weight: bold;
        }
        
        .medium-receipt .receipt-divider {
          border-top: 2px solid #000;
          margin: 8px 0;
        }
        
        .medium-receipt .receipt-total {
          font-weight: bold;
          font-size: 12pt;
        }
        
        .medium-receipt .receipt-footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px solid #000;
          font-size: 9pt;
        }
      `}} />

      {/* View Mode Toggle */}
      <div className="mb-4 no-print">
        <Tabs value={viewMode} className='dark:bg-gray-900' onValueChange={(value) => setViewMode(value as 'card' | 'thermal' | 'medium')}>
          <TabsList className="w-full justify-start dark:bg-gray-800">
            <TabsTrigger value="card" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
              <FileText className="h-4 w-4" />
              Card Preview
            </TabsTrigger>
            <TabsTrigger value="thermal" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
              <Printer className="h-4 w-4" />
              Thermal (80mm)
            </TabsTrigger>
            <TabsTrigger value="medium" className="flex items-center gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
              <Receipt className="h-4 w-4" />
              Medium (Half A5)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Screen preview - Card component */}
      <div className={viewMode !== 'card' ? 'hidden' : ''}>
        <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 text-black dark:text-white card-receipt">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{companyName}</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">{companyDescription}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{companyAddress}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{companyPhones.join(", ")}</p>
        <Separator className="mt-2 dark:bg-white" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Header Info */}
        <div className="text-center">
          <h3 className="font-semibold text-lg">SALES RECEIPT</h3>
            <div className="flex justify-between items-center mt-2">
            <div className="flex flex-col items-start">
              {saleId && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receipt : SA-{saleId.slice(0,8)}
              </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
              Date: {date}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
              Customer: {customerName}
              </p>
            </div>
            </div>
        </div>

        <Separator className="dark:bg-white" />

        {/* Items */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 font-semibold text-sm pb-2 border-b border-gray-300 dark:border-gray-600">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Rate</span>
            <span className="text-right">Total</span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-4 gap-2 text-sm">
              <span title={item.productName}>{item.productName}</span>
              <span className="text-center">{item.quantity}</span>
                <span className="text-center">Shs {formatCurrency(item.basePrice)}</span>
                <span className="text-right">Shs {formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <Separator className="dark:bg-white" />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sub Total:</span>
              <span>Shs {formatCurrency(totalAmount)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Discount:</span>
                <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold">
            <span>Grand Total:</span>
              <span>Shs {formatCurrency(totalAmount - discount)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Paid Amount:</span>
              <span>Shs {formatCurrency(paidAmount)}</span>
          </div>

          <div className="flex justify-between text-sm font-semibold">
            <span>Return Amount:</span>
              <span>Shs {formatCurrency(returnAmount)}</span>
            </div>
        </div>

        <Separator className='dark:bg-white' />

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          <p>Thank you for your business!</p>
          <p>Visit us again</p>
        </div>
      </CardContent>
    </Card>
      </div>

      {/* Thermal printer optimized receipt */}
      <div className={`thermal-receipt ${viewMode !== 'thermal' ? 'hidden' : ''}`}>
        <div className="receipt-header">
          <div className="receipt-title">{truncateText(companyName, 32)}</div>
          {companyDescription && (
            <div className="receipt-info description">{companyDescription}</div>
          )}
          {companyAddress && (
            <div className="receipt-info address">{truncateText(companyAddress, 32)}</div>
          )}
          {companyPhones && companyPhones.length > 0 && (
            <div className="receipt-info phones">{truncateText(companyPhones.join(", "), 32)}</div>
          )}
        </div>

        <div className="receipt-section">
          <div className="receipt-line" style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
            SALES RECEIPT
          </div>
          
          {saleId && (
            <div className="receipt-line">
              <span>Receipt:</span>
              <span>SA-{saleId.slice(0,8)}</span>
            </div>
          )}
          
          <div className="receipt-line date-line">
            <span>Date:</span>
            <span>{date}</span>
          </div>
          
          <div className="receipt-line customer-line">
            <span>Customer:</span>
            <span>{truncateText(customerName, 20)}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Items Table */}
        <table className="receipt-table">
          <thead>
            <tr>
              <th className="col-product">Product</th>
              <th className="col-qty">Qty</th>
              <th className="col-rate">Rate</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="col-product" title={item.productName}>{item.productName}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-rate">Shs {formatCurrencyThermal(item.basePrice)}</td>
                <td className="col-total">Shs {formatCurrencyThermal(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider"></div>

        {/* Totals */}
        <div className="receipt-section">
          <div className="receipt-line subtotal-line">
            <span>Sub Total:</span>
            <span>Shs {formatCurrencyThermal(totalAmount)}</span>
          </div>

          {discount > 0 && (
            <div className="receipt-line">
              <span>Discount:</span>
              <span>-Shs {formatCurrencyThermal(discount)}</span>
            </div>
          )}

          <div className="receipt-line receipt-total">
            <span>Grand Total:</span>
            <span>Shs {formatCurrencyThermal(totalAmount - discount)}</span>
          </div>

          <div className="receipt-line paid-amount-line">
            <span>Paid Amount:</span>
            <span>Shs {formatCurrencyThermal(paidAmount)}</span>
          </div>

          <div className="receipt-line receipt-total">
            <span>Balance:</span>
            <span>Shs {formatCurrencyThermal(returnAmount)}</span>
          </div>
        </div>

        {/* Space for stamps */}
        <div style={{ height: '70mm', minHeight: '70mm', marginTop: '8px' }}></div>

        <div className="receipt-divider"></div>

        {/* Footer */}
        <div className="receipt-footer">
          <div>Thank you for your business!</div>
          <div>Visit us again</div>
        </div>
      </div>

      {/* Medium format receipt (half A5) */}
      <div className={`medium-receipt ${viewMode !== 'medium' ? 'hidden' : ''}`}>
        <div className="receipt-header">
          <div className="receipt-title">{companyName}</div>
          {companyDescription && (
            <div className="receipt-info">{companyDescription}</div>
          )}
          {companyAddress && (
            <div className="receipt-info">{companyAddress}</div>
          )}
          {companyPhones && companyPhones.length > 0 && (
            <div className="receipt-info">{companyPhones.join(", ")}</div>
          )}
        </div>

        <div className="receipt-section">
          <div className="receipt-line" style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>
            SALES RECEIPT
          </div>
          
          {saleId && (
            <div className="receipt-line">
              <span>Receipt:</span>
              <span>SA-{saleId.slice(0,8)}</span>
            </div>
          )}
          
          <div className="receipt-line">
            <span>Date:</span>
            <span>{date}</span>
          </div>
          
          <div className="receipt-line">
            <span>Customer:</span>
            <span>{customerName}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Items Header */}
        <div className="receipt-line" style={{ fontWeight: 'bold', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '6px' }}>
          <span className="item-name">Item</span>
          <span className="item-qty">Qty</span>
          <span className="item-price">Rate</span>
          <span className="item-total">Total</span>
        </div>

        {/* Items */}
        {items.map((item) => (
          <div key={item.id} className="receipt-line-item">
            <span className="item-name" title={item.productName}>{item.productName}</span>
            <span className="item-qty">{item.quantity}</span>
            <span className="item-price">Shs {formatCurrency(item.basePrice)}</span>
            <span className="item-total">Shs {formatCurrency(item.totalPrice)}</span>
          </div>
        ))}

        <div className="receipt-divider"></div>

        {/* Totals */}
        <div className="receipt-section">
          <div className="receipt-line">
            <span>Sub Total:</span>
            <span>Shs {formatCurrency(totalAmount)}</span>
          </div>

          {discount > 0 && (
            <div className="receipt-line">
              <span>Discount:</span>
              <span>-Shs {formatCurrency(discount)}</span>
            </div>
          )}

          <div className="receipt-line receipt-total">
            <span>Grand Total:</span>
            <span>Shs {formatCurrency(totalAmount - discount)}</span>
          </div>

          <div className="receipt-line">
            <span>Paid Amount:</span>
            <span>Shs {formatCurrency(paidAmount)}</span>
          </div>

          <div className="receipt-line receipt-total">
            <span>Return Amount:</span>
            <span>Shs {formatCurrency(returnAmount)}</span>
          </div>
        </div>

        {/* Space for stamps */}
        <div style={{ height: '40mm', minHeight: '40mm' }}></div>

        <div className="receipt-divider"></div>

        {/* Footer */}
        <div className="receipt-footer">
          <div>Thank you for your business!</div>
          <div>Visit us again</div>
        </div>
      </div>
    </div>
  )
}