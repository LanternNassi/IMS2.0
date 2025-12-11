"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, Trash2, Pill, ChevronRight, Home } from "lucide-react"

import { Button, TextField, Snackbar } from "@mui/material"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SearchableSelect } from "@/components/searchable-select"
import { SupplierAutocomplete } from "@/components/SupplierAutocomplete"
import { ProductAutocomplete, type ProductVariation } from "@/components/ProductAutocomplete"
import { BatchModal } from "@/components/batch-modal"
import type { Purchase, PurchaseItem } from "@/app/Purchases/page"
import api from "@/Utils/Request"
import { useRouter } from "next/navigation"

import { supplier, useSupplierStore } from "@/store/useSupplierStore"

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
})

type PurchaseFormProps = {
  purchase?: Purchase
  suppliers: Array<{ id: string; name: string }>
}

// Mock data
const mockSuppliers = [
  { id: "1", name: "Supplier A" },
  { id: "2", name: "Supplier B" },
  { id: "3", name: "Supplier C" },
  { id: "4", name: "Premium Pharma Distributors" },
  { id: "5", name: "Global Medical Supplies" },
]

export default function PurchaseForm({
  purchase,
  suppliers = mockSuppliers,
}: PurchaseFormProps) {
  const [items, setItems] = useState<PurchaseItem[]>(purchase?.items || [])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<ProductVariation | null>(null)
  const [selectedQuantity, setSelectedQuantity] = useState("")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemData, setEditingItemData] = useState<{
    quantity: string;
    baseCostPrice: string;
  }>({ quantity: "", baseCostPrice: "" })
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<supplier | null>(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PurchaseItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const { getSupplierById } = useSupplierStore()
  const router = useRouter()

  // Refs for keyboard navigation
  const supplierSearchRef = useRef<HTMLInputElement>(null)
  const productSearchRef = useRef<HTMLInputElement>(null)
  const productQtyRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const form = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: purchase?.supplierId || "",
      notes: purchase?.notes || "",
    },
  })

  const selectedSupplier = suppliers?.find((s) => s.id === form.watch("supplierId"))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      // Number keys for quick section navigation
      if (e.altKey && !e.shiftKey && !e.ctrlKey) {
        switch (e.key) {
          case "1":
            e.preventDefault()
            supplierSearchRef.current?.focus()
            return
          case "2":
            e.preventDefault()
            productSearchRef.current?.focus()
            return
          case "3":
            e.preventDefault()
            productQtyRef.current?.focus()
            return
          case "4":
            e.preventDefault()
            notesRef.current?.focus()
            return
        }
      }

      // Arrow Down - Navigate to next section
      if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault()
        const activeElement = document.activeElement

        if (activeElement === supplierSearchRef.current || target.closest('[data-section="supplier"]')) {
          productSearchRef.current?.focus()
        } else if (activeElement === productSearchRef.current || target.closest('[data-section="product"]')) {
          productQtyRef.current?.focus()
        } else if (activeElement === productQtyRef.current || activeElement === addButtonRef.current) {
          notesRef.current?.focus()
        } else if (activeElement === notesRef.current) {
          submitButtonRef.current?.focus()
        }
        return
      }

      // Arrow Up - Navigate to previous section
      if (e.key === "ArrowUp" && e.altKey) {
        e.preventDefault()
        const activeElement = document.activeElement

        if (activeElement === submitButtonRef.current || activeElement === notesRef.current) {
          productQtyRef.current?.focus()
        } else if (activeElement === productQtyRef.current || activeElement === addButtonRef.current || target.closest('[data-section="product"]')) {
          productSearchRef.current?.focus()
        } else if (activeElement === productSearchRef.current || target.closest('[data-section="supplier"]')) {
          supplierSearchRef.current?.focus()
        }
        return
      }

      // Tab from quantity field to Add button
      if (e.key === "Tab" && target === productQtyRef.current && !e.shiftKey) {
        if (selectedProduct && selectedQuantity) {
          e.preventDefault()
          addButtonRef.current?.focus()
        }
      }

      // Enter key behavior
      if (e.key === "Enter") {
        const activeElement = document.activeElement

        // If Add button is focused or we're in quantity field with valid data
        if (activeElement === addButtonRef.current ||
          (activeElement === productQtyRef.current && selectedProduct && selectedQuantity)) {
          e.preventDefault()
          addProduct()
          productSearchRef.current?.focus()
        }
        // If notes textarea or any other input (except autocomplete dropdown)
        else if (activeElement === notesRef.current ||
          (target.tagName === 'INPUT' && !target.closest('[role="combobox"]'))) {
          // Don't prevent default in textarea to allow line breaks
          if (activeElement !== notesRef.current) {
            e.preventDefault()
          }
          // Submit form if items exist
          if (items.length > 0 && activeElement !== notesRef.current) {
            form.handleSubmit(handleFormSubmit)()
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedProduct, selectedQuantity, items.length])

  const addProduct = () => {
    if (!selectedProduct || !selectedQuantity) {
      return
    }

    const quantity = Number.parseFloat(selectedQuantity)
    // Use wholeSalePrice as the cost price for purchases
    const costPrice = selectedProduct.wholeSalePrice || 0
    const totalPrice = costPrice * quantity

    const newItem: PurchaseItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.productId,
      productVariationId: selectedProduct.id,
      productName: selectedProduct.name,
      baseCostPrice: costPrice,
      quantity,
      totalPrice,
      hasGeneric: false,
    }

    setItems([...items, newItem])
    setSelectedProduct(null)
    setSelectedProductId("")
    setSelectedQuantity("")
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const startEditingItem = (item: PurchaseItem) => {
    setEditingItemId(item.id)
    setEditingItemData({
      quantity: item.quantity.toString(),
      baseCostPrice: (item.baseCostPrice || 0).toString(),
    })
  }

  const cancelEditingItem = () => {
    setEditingItemId(null)
    setEditingItemData({ quantity: "", baseCostPrice: "" })
  }

  const saveEditingItem = () => {
    if (!editingItemId) return

    const quantity = parseFloat(editingItemData.quantity)
    const baseCostPrice = parseFloat(editingItemData.baseCostPrice)

    if (isNaN(quantity) || isNaN(baseCostPrice) || quantity <= 0 || baseCostPrice <= 0) {
      return
    }

    setItems(
      items.map((item) =>
        item.id === editingItemId
          ? {
            ...item,
            quantity,
            baseCostPrice,
            totalPrice: baseCostPrice * quantity,
          }
          : item,
      ),
    )

    cancelEditingItem()
  }

  const handleBatchClick = (item: PurchaseItem) => {
    setSelectedItem(item)
    setIsBatchModalOpen(true)
  }

  const handleBatchSave = (item: PurchaseItem, batchData: any) => {
    setItems(
      items.map((i) =>
        i.id === item.id ? { ...i, ...batchData, hasGeneric: true } : i,
      ),
    )
    setIsBatchModalOpen(false)
    setSelectedItem(null)
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)

  const handleFormSubmit = async (data: z.infer<typeof purchaseFormSchema>) => {
    if (items.length === 0) {
      setSnackbar({ open: true, message: "Please add at least one product to the purchase." })
      return
    }

    if (!selectedSupplierDetails) {
      setSnackbar({ open: true, message: "Please select a supplier before submitting." })
      return
    }

    setIsSubmitting(true)

    const purchaseData: Purchase = {
      id: purchase?.id || crypto.randomUUID(),
      supplierId: data.supplierId,
      processedBy: "8F077C6B-EF9E-4802-6166-08DE28E2F419", // To be filled by backend
      supplierName: selectedSupplierDetails.companyName || "",
      items,
      totalAmount,
      paidAmount,
      createdAt: purchase?.createdAt || new Date(),
      notes: data.notes,
    }

    try {
      if (purchase?.id) {
        // Update existing purchase
        await api.put(`/Purchases/${purchase.id}`, purchaseData)
        setSnackbar({ open: true, message: `Purchase from ${selectedSupplierDetails.companyName} has been updated successfully.` })
      } else {
        // Create new purchase
        console.log("Submitting purchase data:", purchaseData)
        await api.post("/Purchases", purchaseData)
        setSnackbar({ open: true, message: `Purchase from ${selectedSupplierDetails.companyName} has been recorded successfully.` })
      }

      // Navigate back to purchases list
      router.push("/Purchases")
    } catch (error: any) {
      console.error("Error submitting purchase:", error)

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save purchase. Please try again."

      setSnackbar({ open: true, message: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dark:bg-gray-900 bg-white rounded-lg w-[80vw] mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link
          href="/Purchases"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Home className="h-4 w-4" />
          Purchases
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">Add Purchase</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">


          {/* Row 1: Supplier Details */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-gray-200">Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0" data-section="supplier">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Search Supplier */}
                <SupplierAutocomplete
                  value={selectedSupplierDetails}
                  onChange={async (supplier) => {
                    if (supplier) {
                      form.setValue("supplierId", supplier.id)
                      const fullSupplier = await getSupplierById(supplier.id)
                      setSelectedSupplierDetails(fullSupplier)
                      // Auto-focus to product search after supplier selection
                      setTimeout(() => productSearchRef.current?.focus(), 100)
                    } else {
                      form.setValue("supplierId", "")
                      setSelectedSupplierDetails(null)
                    }
                  }}
                  label="Search (Alt+1)"
                  fullWidth
                  size="small"
                  required
                  inputRef={supplierSearchRef}
                />

                {/* Contact */}
                <TextField
                  label="Contact"
                  value={selectedSupplierDetails?.phoneNumber || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />

                {/* Address */}
                <TextField
                  label="Address"
                  value={selectedSupplierDetails?.address || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />

                {/* Name */}
                <TextField
                  label="Name"
                  value={selectedSupplierDetails?.companyName || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />

                {/* Email */}
                <TextField
                  label="Email"
                  value={selectedSupplierDetails?.emailAddress || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />
              </div>
              <FormMessage className="mt-2" />
            </CardContent>
          </Card>

          {/* Row 2: Product Details */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-gray-200">Product Details</CardTitle>
            </CardHeader>
            <CardContent data-section="product">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
                {/* Search Product */}
                <ProductAutocomplete
                  value={selectedProduct}
                  onChange={(product) => {
                    setSelectedProduct(product)
                    setSelectedProductId(product?.id || "")
                    // Auto-focus to quantity after product selection
                    if (product) {
                      setTimeout(() => productQtyRef.current?.focus(), 100)
                    }
                  }}
                  label="Search (Alt+2)"
                  fullWidth
                  size="small"
                  inputRef={productSearchRef}
                />

                {/* Product Name */}
                <TextField
                  label="Name"
                  value={selectedProduct?.name || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />

                {/* Unit of Measure */}
                <TextField
                  label="Unit"
                  value={selectedProduct?.unitofMeasure || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />

                {/* Wholesale Price (Cost) */}
                <TextField
                  label="Cost Price"
                  value={selectedProduct?.wholeSalePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                />

                {/* Quantity */}
                <TextField
                  label="Qty (Alt+3)"
                  type="number"
                  placeholder="0"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value)}
                  inputRef={productQtyRef}
                  fullWidth
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedProduct && selectedQuantity) {
                      e.preventDefault()
                      addProduct()
                      productSearchRef.current?.focus()
                    }
                  }}
                />

                {/* Add Button */}
                <div className="flex items-end">
                  <Button
                    onClick={addProduct}
                    disabled={!selectedProduct || !selectedQuantity}
                    className="w-full"
                    variant="contained"
                    color="primary"
                    ref={addButtonRef}
                  >
                    <Plus className="mr-2 h-4 w-4" /> ADD
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Row 3: Two Columns - Products Table & Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Added Products & Summary */}
            <div className="space-y-6">
              {/* Added Products */}
              <Card className="dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg dark:text-gray-200">Added Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No products added yet
                    </div>
                  ) : (
                    <div className="rounded-md border dark:border-gray-700 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <TableHead className="dark:text-gray-300 text-xs">Product</TableHead>
                            <TableHead className="dark:text-gray-300 text-xs">Quantity</TableHead>
                            <TableHead className="dark:text-gray-300 text-xs">Rate</TableHead>
                            <TableHead className="dark:text-gray-300 text-xs">Total</TableHead>
                            <TableHead className="dark:text-gray-300 text-xs w-10">Generic</TableHead>
                            <TableHead className="dark:text-gray-300 text-xs w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => {
                            const isEditing = editingItemId === item.id
                            return (
                              <TableRow key={item.id} className="dark:border-gray-700">
                                <TableCell className="font-medium dark:text-gray-200 text-sm">
                                  {item.productName}
                                </TableCell>
                                <TableCell className="dark:text-gray-300 text-sm">
                                  {isEditing ? (
                                    <TextField
                                      type="number"
                                      value={editingItemData.quantity}
                                      onChange={(e) => setEditingItemData({ ...editingItemData, quantity: e.target.value })}
                                      size="small"
                                      sx={{ width: '80px' }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                    />
                                  ) : (
                                    item.quantity
                                  )}
                                </TableCell>
                                <TableCell className="dark:text-gray-300 text-sm">
                                  {isEditing ? (
                                    <TextField
                                      type="number"
                                      value={editingItemData.baseCostPrice}
                                      onChange={(e) => setEditingItemData({ ...editingItemData, baseCostPrice: e.target.value })}
                                      size="small"
                                      sx={{ width: '100px' }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                    />
                                  ) : (
                                    (item.baseCostPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold dark:text-gray-200 text-sm">
                                  {isEditing ? (
                                    (parseFloat(editingItemData.quantity || "0") * parseFloat(editingItemData.baseCostPrice || "0")).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  ) : (
                                    item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outlined"
                                    onClick={() => handleBatchClick(item)}
                                    title="Add batch/generic information"
                                    className={`h-7 w-7 min-w-0 ${item.hasGeneric ? "dark:bg-gray-600" : ""}`}
                                    disabled={isEditing}
                                  >
                                    <Pill className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {isEditing ? (
                                      <>
                                        <Button
                                          variant="contained"
                                          color="success"
                                          onClick={saveEditingItem}
                                          className="h-7 w-7 min-w-0"
                                          size="small"
                                        >
                                          ✓
                                        </Button>
                                        <Button
                                          variant="outlined"
                                          onClick={cancelEditingItem}
                                          className="h-7 w-7 min-w-0"
                                          size="small"
                                        >
                                          ✕
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="outlined"
                                          onClick={() => startEditingItem(item)}
                                          className="h-7 w-7 min-w-0"
                                          size="small"
                                          title="Edit item"
                                        >
                                          ✎
                                        </Button>
                                        <Button
                                          variant="contained"
                                          color="error"
                                          onClick={() => removeItem(item.id)}
                                          className="h-7 w-7 min-w-0"
                                          size="small"
                                          title="Delete item"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Section */}
              <Card className="dark:bg-gray-900 dark:border-gray-700">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-500 dark:text-blue-400 font-medium">Sub Total</span>
                    <TextField
                      value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      InputProps={{ readOnly: true }}
                      size="small"
                      sx={{ width: '150px', '& input': { textAlign: 'right' }, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-500 dark:text-blue-400 font-medium">Discount</span>
                    <TextField
                      type="number"
                      value={discount}
                      size="small"
                      sx={{ width: '150px', '& input': { textAlign: 'right' } }}
                      onChange={(value) => {
                        setDiscount(Number(value.target.value))
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blue-500 dark:text-blue-400 font-medium">Paid amount</span>
                    <TextField
                      type="number"
                      value = {paidAmount || 0}
                      size="small"
                      sx={{ width: '150px', '& input': { textAlign: 'right' } }}
                      onChange={(value) => {
                        setPaidAmount(Number(value.target.value))
                      }}
                    />
                  </div>

                  <div className="border-t dark:border-gray-700 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-500 dark:text-blue-400 font-medium text-lg">Grand Total</span>
                      <span className="text-2xl font-bold dark:text-white">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-blue-500 dark:text-blue-400 font-medium">Return amount</span>
                      <span className="text-xl font-semibold dark:text-white">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Overview */}
            <div className="space-y-6">
              <Card className="dark:bg-gray-900 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg dark:text-gray-200">Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-gray-400">
                    Preview Area
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notes and Submit Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg dark:text-gray-200">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <TextField
                          placeholder="Add any notes about this purchase... (Alt+4)"
                          {...field}
                          multiline
                          rows={2}
                          fullWidth
                          inputRef={notesRef}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex items-end">
              <Button
                type="submit"
                variant="contained"
                disabled={items.length === 0 || isSubmitting}
                className="w-full h-12 text-lg font-semibold"
                ref={submitButtonRef}
              >
                {isSubmitting ? "SAVING..." : "SAVE TRANSACTION"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Batch Modal */}
      {selectedItem && (
        <BatchModal
          isOpen={isBatchModalOpen}
          item={selectedItem}
          onClose={() => setIsBatchModalOpen(false)}
          onSave={(batchData) => handleBatchSave(selectedItem, batchData)}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 2,
          },
        }}
      />
    </div>
  )
}