"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, AlertCircle, Download, X } from "lucide-react"


import { Button } from "@mui/material"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { PurchaseDocumentation } from "@/components/purchase-documentation"
import {useRouter} from "next/navigation"

// Types
export type SalesItem = {
  id: string
  productId: string
  productName: string
  basePrice: number
  baseCostPrice?: number
  quantity: number
  totalPrice: number
  batchNumber?: string
  hasGeneric: boolean
}

export type Sale = {
  id: string
  supplierId: string
  supplierName: string
  items: SalesItem[]
  totalAmount: number
  createdAt: Date
  notes?: string
}

    
export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [docSale, setDocSale] = useState<Sale | null>(null)
  const { toast } = useToast()

  const router = useRouter()

  const handleAddSale = (sale: Sale) => {
    setSales([...sales, { ...sale, id: crypto.randomUUID(), createdAt: new Date() }])
    setIsFormOpen(false)
    toast({
      title: "Sale Created",
      description: `Sale from ${sale.supplierName} has been recorded.`,
    })
  }

  const handleEditSale = (sale: Sale) => {
    setSales(sales.map((s) => (s.id === sale.id ? sale : s)))
    setIsEditOpen(false)
    setSelectedSale(null)
    toast({
      title: "Sale Updated",
      description: "Sale details have been updated successfully.",
    })
  }

  const handleDeleteSale = (id: string) => {
    const sale = sales.find((s) => s.id === id)
    setSales(sales.filter((s) => s.id !== id))
    toast({
      title: "Sale Deleted",
      description: `Sale from ${sale?.supplierName} has been deleted.`,
    })
  }

  const handleEditClick = (sale: Sale) => {
    setSelectedSale(sale)
    setIsEditOpen(true)
  }

  const handleViewDoc = (sale: Sale) => {
    setDocSale(sale)
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900">Sales Management</h1>
            <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">Record and manage product sales</p>
          </div>
          <Button onClick={() => {
            router.push('/Sales/add')
          }} variant="contained" color="primary">
            <Plus className="mr-2 h-4 w-4" /> Record Sale
          </Button>
        </div>

        {/* Sales List */}
        <Card className="dark:bg-gray-800 bg-white">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Sales Records</CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <Alert className="dark:bg-gray-900 dark:border-gray-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No sales recorded yet. Click "Record Sale" to add a new sale.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="rounded-md border dark:border-gray-700 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-gray-200">{sale.supplierName}</TableCell>
                        <TableCell className="dark:text-gray-300">{sale.items.length}</TableCell>
                        <TableCell className="font-semibold dark:text-gray-200">
                          ${sale.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">{sale.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="contained"
                              onClick={() => handleViewDoc(sale)}
                              title="View Documentation"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">View Doc</span>
                            </Button>
                            <Button variant="contained" onClick={() => handleEditClick(sale)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="contained" onClick={() => handleDeleteSale(sale.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  

      {/* Documentation Modal */}
      {docSale && (
        <Dialog open={!!docSale} onOpenChange={() => setDocSale(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 bg-white">
            <DialogHeader className="flex flex-row items-center justify-between">
              <div>
                <DialogTitle>Sale Documentation</DialogTitle>
                <DialogDescription>Sale record and receipt</DialogDescription>
              </div>
              <Button variant="contained" onClick={() => setDocSale(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <PurchaseDocumentation purchase={docSale} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
