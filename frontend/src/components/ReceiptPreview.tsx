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
  companyAddress = "Kampala, Uganda"
}: ReceiptPreviewProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 text-black dark:text-white">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{companyName}</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">{companyAddress}</p>
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
              <span className="text-center">Shs {item.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-right">Shs {item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>

        <Separator className="dark:bg-white" />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sub Total:</span>
            <span>Shs {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Discount:</span>
              <span>-{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold">
            <span>Grand Total:</span>
            <span>Shs {(totalAmount - discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Paid Amount:</span>
            <span>Shs {paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm font-semibold">
            <span>Return Amount:</span>
            <span>Shs {returnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
  )
}