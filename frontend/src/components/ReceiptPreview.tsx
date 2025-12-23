"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
  return (
    <>
      {/* Print-specific styles for thermal printer */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 5mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .thermal-receipt,
          .thermal-receipt * {
            visibility: visible;
          }
          
          .thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            margin: 0;
            padding: 5mm;
            background: white;
            color: black;
            font-size: 10pt;
            line-height: 1.2;
          }
          
          .thermal-receipt .no-print {
            display: none;
          }
        }
        
        .thermal-receipt {
          font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 8px;
          background: white;
          color: black;
          font-size: 10pt;
          line-height: 1.3;
        }
        
        .thermal-receipt .receipt-header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        
        .thermal-receipt .receipt-title {
          font-weight: bold;
          font-size: 12pt;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        
        .thermal-receipt .receipt-info {
          font-size: 8pt;
          margin: 2px 0;
        }
        
        .thermal-receipt .receipt-section {
          margin: 8px 0;
        }
        
        .thermal-receipt .receipt-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
          font-size: 9pt;
        }
        
        .thermal-receipt .receipt-line-item {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          font-size: 8pt;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 2px;
        }
        
        .thermal-receipt .item-name {
          flex: 1;
          text-align: left;
          max-width: 45%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .thermal-receipt .item-qty {
          width: 8%;
          text-align: center;
        }
        
        .thermal-receipt .item-price {
          width: 22%;
          text-align: right;
        }
        
        .thermal-receipt .item-total {
          width: 25%;
          text-align: right;
          font-weight: bold;
        }
        
        .thermal-receipt .receipt-divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        
        .thermal-receipt .receipt-total {
          font-weight: bold;
          font-size: 10pt;
        }
        
        .thermal-receipt .receipt-footer {
          text-align: center;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px dashed #000;
          font-size: 8pt;
        }
      `}} />

      {/* Screen preview - Card component */}
      <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 text-black dark:text-white no-print">
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

      {/* Thermal printer optimized receipt */}
      <div className="thermal-receipt">
        <div className="receipt-header">
          <div className="receipt-title">{truncateText(companyName, 32)}</div>
          {companyDescription && (
            <div className="receipt-info">{truncateText(companyDescription, 32)}</div>
          )}
          {companyAddress && (
            <div className="receipt-info">{truncateText(companyAddress, 32)}</div>
          )}
          {companyPhones && companyPhones.length > 0 && (
            <div className="receipt-info">{truncateText(companyPhones.join(", "), 32)}</div>
          )}
        </div>

        <div className="receipt-section">
          <div className="receipt-line" style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '6px' }}>
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
            <span>{truncateText(customerName, 20)}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Items Header */}
        <div className="receipt-line" style={{ fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
          <span className="item-name">Item</span>
          <span className="item-qty">Qty</span>
          <span className="item-price">Rate</span>
          <span className="item-total">Total</span>
        </div>

        {/* Items */}
        {items.map((item) => (
          <div key={item.id} className="receipt-line-item">
            <span className="item-name" title={item.productName}>{truncateText(item.productName, 18)}</span>
            <span className="item-qty">{item.quantity}</span>
            <span className="item-price">{formatCurrency(item.basePrice)}</span>
            <span className="item-total">{formatCurrency(item.totalPrice)}</span>
          </div>
        ))}

        <div className="receipt-divider"></div>

        {/* Totals */}
        <div className="receipt-section">
          <div className="receipt-line">
            <span>Sub Total:</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>

          {discount > 0 && (
            <div className="receipt-line">
              <span>Discount:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="receipt-line receipt-total">
            <span>Grand Total:</span>
            <span>{formatCurrency(totalAmount - discount)}</span>
          </div>

          <div className="receipt-line">
            <span>Paid:</span>
            <span>{formatCurrency(paidAmount)}</span>
          </div>

          <div className="receipt-line receipt-total">
            <span>Change:</span>
            <span>{formatCurrency(returnAmount)}</span>
          </div>
        </div>

        <div className="receipt-divider"></div>

        {/* Footer */}
        <div className="receipt-footer">
          <div>Thank you for your business!</div>
          <div>Visit us again</div>
        </div>
      </div>
    </>
  )
}