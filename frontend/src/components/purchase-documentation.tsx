"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Printer } from "lucide-react"
import type { Purchase } from "@/app/Purchases/page"

type PurchaseDocumentationProps = {
  purchase: Purchase
}

export function PurchaseDocumentation({ purchase }: PurchaseDocumentationProps) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const docContent = generateDocContent()
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(docContent))
    element.setAttribute("download", `purchase-${purchase.id}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const generateDocContent = () => {
    return `
PURCHASE RECEIPT & DOCUMENTATION
=====================================

Purchase ID: ${purchase.id}
Date: ${purchase.createdAt.toLocaleDateString()} ${purchase.createdAt.toLocaleTimeString()}
Supplier: ${purchase.supplierName}

=====================================
PURCHASE ITEMS
=====================================

${purchase.items
  .map(
    (item, idx) => `
${idx + 1}. ${item.productName}
   Quantity: ${item.quantity}
   Unit Cost: $${item.baseCostPrice?.toFixed(2)}
   Total: $${item.totalPrice.toFixed(2)}
   ${item.hasGeneric ? `Batch Number: ${item.batchNumber || "N/A"}` : ""}
`,
  )
  .join("\n")}

=====================================
SUMMARY
=====================================
Total Items: ${purchase.items.length}
Total Amount: $${purchase.totalAmount.toFixed(2)}
Items with Batch Info: ${purchase.items.filter((i) => i.hasGeneric).length}

${purchase.notes ? `\nNotes:\n${purchase.notes}` : ""}

Generated: ${new Date().toLocaleString()}
    `
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold dark:text-white">Purchase Receipt</h1>
        <p className="text-gray-600 dark:text-gray-400">Official Purchase Documentation</p>
      </div>

      {/* Purchase Info */}
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-200">Purchase Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Purchase ID</p>
            <p className="font-semibold dark:text-gray-200">{purchase.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
            <p className="font-semibold dark:text-gray-200">{purchase.createdAt.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Supplier</p>
            <p className="font-semibold dark:text-gray-200">{purchase.supplierName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
            <p className="font-semibold dark:text-gray-200">{purchase.createdAt.toLocaleTimeString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-200">Purchase Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">#</TableHead>
                  <TableHead className="dark:text-gray-300">Product</TableHead>
                  <TableHead className="dark:text-gray-300">Quantity</TableHead>
                  <TableHead className="dark:text-gray-300">Unit Cost</TableHead>
                  <TableHead className="dark:text-gray-300">Total</TableHead>
                  <TableHead className="dark:text-gray-300">Batch Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item, idx) => (
                  <TableRow key={item.id} className="dark:border-gray-700">
                    <TableCell className="dark:text-gray-300">{idx + 1}</TableCell>
                    <TableCell className="font-medium dark:text-gray-200">{item.productName}</TableCell>
                    <TableCell className="dark:text-gray-300">{item.quantity}</TableCell>
                    <TableCell className="dark:text-gray-300">${item.baseCostPrice?.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold dark:text-gray-200">${item.totalPrice.toFixed(2)}</TableCell>
                    <TableCell className="dark:text-gray-300">
                      {item.hasGeneric ? (
                        <span className="text-green-600 dark:text-green-400">✓ {item.batchNumber}</span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-200">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="dark:text-gray-300">Total Items:</span>
            <span className="font-semibold dark:text-gray-200">{purchase.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="dark:text-gray-300">Items with Batch Info:</span>
            <span className="font-semibold dark:text-gray-200">
              {purchase.items.filter((i) => i.hasGeneric).length}
            </span>
          </div>
          <div className="border-t dark:border-gray-700 pt-3 mt-3 flex justify-between text-lg">
            <span className="font-semibold dark:text-gray-200">Total Amount:</span>
            <span className="font-bold text-xl dark:text-green-400">${purchase.totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Notes if present */}
      {purchase.notes && (
        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="dark:text-gray-300 whitespace-pre-wrap">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="flex-1 bg-transparent">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
        <Button onClick={handleDownload} className="flex-1">
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background-color: white;
          }
          .dark\\:bg-gray-900 {
            background-color: white !important;
          }
          .dark\\:text-white {
            color: black !important;
          }
          .dark\\:text-gray-200 {
            color: black !important;
          }
          .dark\\:text-gray-300 {
            color: #333 !important;
          }
          .dark\\:border-gray-700 {
            border-color: #ddd !important;
          }
        }
      `}</style>
    </div>
  )
}
