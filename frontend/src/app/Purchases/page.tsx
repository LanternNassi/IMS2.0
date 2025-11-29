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
export type PurchaseItem = {
  id: string
  productId: string
  productName: string
  baseCostPrice?: number
  quantity: number
  totalPrice: number
  batchNumber?: string
  hasGeneric: boolean
}

export type Purchase = {
  id: string
  supplierId: string
  supplierName: string
  items: PurchaseItem[]
  totalAmount: number
  createdAt: Date
  notes?: string
}

// Mock data
const mockSuppliers = [
  { id: "1", name: "Supplier A" },
  { id: "2", name: "Supplier B" },
  { id: "3", name: "Supplier C" },
  { id: "4", name: "Premium Pharma Distributors" },
  { id: "5", name: "Global Medical Supplies" },
]

const mockProducts = [
  { id: "1", name: "Paracetamol", baseCostPrice: 5.0 },
  { id: "2", name: "Ibuprofen", baseCostPrice: 6.0 },
  { id: "3", name: "Aspirin", baseCostPrice: 4.5 },
  { id: "4", name: "Amoxicillin", baseCostPrice: 8.5 },
  { id: "5", name: "Metformin", baseCostPrice: 3.2 },
]

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [docPurchase, setDocPurchase] = useState<Purchase | null>(null)
  const { toast } = useToast()

  const router = useRouter()

  const handleAddPurchase = (purchase: Purchase) => {
    setPurchases([...purchases, { ...purchase, id: crypto.randomUUID(), createdAt: new Date() }])
    setIsFormOpen(false)
    toast({
      title: "Purchase Created",
      description: `Purchase from ${purchase.supplierName} has been recorded.`,
    })
  }

  const handleEditPurchase = (purchase: Purchase) => {
    setPurchases(purchases.map((p) => (p.id === purchase.id ? purchase : p)))
    setIsEditOpen(false)
    setSelectedPurchase(null)
    toast({
      title: "Purchase Updated",
      description: "Purchase details have been updated successfully.",
    })
  }

  const handleDeletePurchase = (id: string) => {
    const purchase = purchases.find((p) => p.id === id)
    setPurchases(purchases.filter((p) => p.id !== id))
    toast({
      title: "Purchase Deleted",
      description: `Purchase from ${purchase?.supplierName} has been deleted.`,
    })
  }

  const handleEditClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setIsEditOpen(true)
  }

  const handleViewDoc = (purchase: Purchase) => {
    setDocPurchase(purchase)
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900">Purchase Management</h1>
            <p className="text-sm dark:text-gray-400 text-gray-600 mt-1">Record and manage product purchases</p>
          </div>
          <Button onClick={() => {
            router.push('/Purchases/add')
          }} variant="contained" color="primary">
            <Plus className="mr-2 h-4 w-4" /> Record Purchase
          </Button>
        </div>

        {/* Purchase List */}
        <Card className="dark:bg-gray-800 bg-white">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Purchase Records</CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <Alert className="dark:bg-gray-900 dark:border-gray-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No purchases recorded yet. Click "Record Purchase" to add a new purchase order.
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
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id} className="dark:border-gray-700">
                        <TableCell className="font-medium dark:text-gray-200">{purchase.supplierName}</TableCell>
                        <TableCell className="dark:text-gray-300">{purchase.items.length}</TableCell>
                        <TableCell className="font-semibold dark:text-gray-200">
                          ${purchase.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">{purchase.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="contained"
                              onClick={() => handleViewDoc(purchase)}
                              title="View Documentation"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">View Doc</span>
                            </Button>
                            <Button variant="contained" onClick={() => handleEditClick(purchase)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="contained" onClick={() => handleDeletePurchase(purchase.id)}>
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
      {docPurchase && (
        <Dialog open={!!docPurchase} onOpenChange={() => setDocPurchase(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 bg-white">
            <DialogHeader className="flex flex-row items-center justify-between">
              <div>
                <DialogTitle>Purchase Documentation</DialogTitle>
                <DialogDescription>Purchase record and receipt</DialogDescription>
              </div>
              <Button variant="contained" onClick={() => setDocPurchase(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <PurchaseDocumentation purchase={docPurchase} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
