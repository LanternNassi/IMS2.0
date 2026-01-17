"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, Trash2, ChevronRight, Home, FileText, Check } from "lucide-react"

import { Button, TextField, Select, MenuItem, Snackbar, FormControlLabel, Checkbox } from "@mui/material"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { CustomerAutocomplete } from "@/components/CustomerAutocomplete"

import { customer, useCustomerStore } from "@/store/useCustomerStore"

// API Response Types for Sales
type CustomerInfo = {
  id: string
  name: string
  customerType: string
  address: string
  phone: string
  email: string
  accountNumber: string
  moreInfo: string
  customerTags: any[]
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type ProcessedByInfo = {
  id: string
  username: string
  email: string
  gender: string
  telephone: string
  role: string
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type ProductVariationInfo = {
  id: string
  productId: string
  name: string
  unitSize: number
  retailPrice: number
  wholeSalePrice: number
  costPrice: number
  discount: number
  unitofMeasure: string
  isActive: boolean
  isMain: boolean
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type SaleItemFromAPI = {
  id: string
  saleId: string
  productVariationId: string
  productStorageId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  vatAmount: number
  profitMargin: number
  productVariation: ProductVariationInfo
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type CreditNoteItemFromAPI = {
  id: string
  creditNoteId: string
  productVariationId: string | null
  productName: string | null
  description: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  taxAmount: number
  saleItemId: string | null
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type CreditNoteFromAPI = {
  id: string
  creditNoteNumber: string
  creditNoteDate: string
  saleId: string | null
  customerId: string
  processedById: string
  totalAmount: number
  taxAmount: number
  subTotal: number
  reason: string
  description: string | null
  notes: string | null
  status: string
  isApplied: boolean
  linkedFinancialAccountId: string | null
  customer: CustomerInfo
  processedBy: ProcessedByInfo
  linkedFinancialAccount: any | null
  creditNoteItems: CreditNoteItemFromAPI[]
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type SaleFromAPI = {
  id: string
  customerId: string
  processedById: string
  taxRecordId: string | null
  saleDate: string
  totalAmount: number
  paidAmount: number
  changeAmount: number
  outstandingAmount: number
  discount: number
  finalAmount: number
  profit: number
  isPaid: boolean
  isRefunded: boolean
  isTaken: boolean
  paymentMethod: string
  isCompleted: boolean
  wasPartialPayment: boolean
  linkedFinancialAccountId: string | null
  customer: CustomerInfo
  processedBy: ProcessedByInfo
  saleItems: SaleItemFromAPI[]
  creditNotes: CreditNoteFromAPI[]
  notes: string | null
  taxRecord: any | null
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

type SalesResponse = {
  pagination: {
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  sales: SaleFromAPI[]
}
import api from "@/Utils/Request"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const creditNoteFormSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
  applyToBalance: z.boolean(),
})

type CreditNoteItem = {
  id: string
  productVariationId?: string
  productName?: string
  description?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxAmount?: number
  saleItemId?: string
  originalQuantity?: number // Original quantity from sale item
  originalTotalPrice?: number // Original total price from sale item
}

const reasonOptions = [
  { value: "ReturnedGoods", label: "Returned Goods" },
  { value: "Overcharge", label: "Overcharge" },
  { value: "Discount", label: "Discount" },
  { value: "DamagedGoods", label: "Damaged Goods" },
  { value: "WrongItem", label: "Wrong Item" },
  { value: "Cancellation", label: "Cancellation" },
  { value: "Warranty", label: "Warranty" },
  { value: "Other", label: "Other" },
]

export default function AddCreditNote() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { getCustomerById } = useCustomerStore()
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const router = useRouter()
  const { user } = useAuthStore()

  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<customer | null>(null)
  const [selectedSale, setSelectedSale] = useState<SaleFromAPI | null>(null)
  const [customerSales, setCustomerSales] = useState<SaleFromAPI[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  const [items, setItems] = useState<CreditNoteItem[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemData, setEditingItemData] = useState<{
    quantity: string
    unitPrice: string
    description: string
  }>({ quantity: "", unitPrice: "", description: "" })

  const [totalAmount, setTotalAmount] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [subTotal, setSubTotal] = useState(0)
  const [financialAccounts, setFinancialAccounts] = useState<Array<{
    id: string
    accountName: string
    bankName: string
    type: string
  }>>([])
  const [selectedFinancialAccountId, setSelectedFinancialAccountId] = useState<string>("")

  const form = useForm<z.infer<typeof creditNoteFormSchema>>({
    resolver: zodResolver(creditNoteFormSchema),
    defaultValues: {
      reason: "",
      description: "",
      notes: "",
      applyToBalance: true,
    },
  })

  useEffect(() => {
    const newSubTotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const newTaxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0)
    setSubTotal(newSubTotal)
    setTaxAmount(newTaxAmount)
    setTotalAmount(newSubTotal + newTaxAmount)
  }, [items])

  useEffect(() => {
    if (selectedCustomerDetails?.id) {
      fetchCustomerSales(selectedCustomerDetails.id)
    }
  }, [selectedCustomerDetails])

  // Fetch financial accounts on component mount
  useEffect(() => {
    const fetchFinancialAccounts = async () => {
      try {
        const response = await api.get('/FinancialAccounts?includeMetadata=false&page=1&pageSize=100')
        setFinancialAccounts(response.data.financialAccounts || [])
      } catch (error) {
        console.error('Error fetching financial accounts:', error)
      }
    }
    fetchFinancialAccounts()
  }, [])

  const fetchCustomerSales = async (customerId: string) => {
    setLoadingSales(true)
    try {
      const response = await api.get<SalesResponse>("/Sales", {
        params: {
          customerId: customerId,
          includeMetadata: false,
          page: 1,
          pageSize: 100,
        },
      })
      setCustomerSales(response.data.sales || [])
    } catch (error) {
      console.error("Error fetching customer sales:", error)
      setSnackbar({ open: true, message: "Failed to load customer sales" })
    } finally {
      setLoadingSales(false)
    }
  }

  const handleSaleSelection = (sale: SaleFromAPI) => {
    setSelectedSale(sale)
    
    // Convert sale items to credit note items
    const creditNoteItems: CreditNoteItem[] = sale.saleItems.map((item) => ({
      id: crypto.randomUUID(),
      productVariationId: item.productVariationId,
      productName: item.productVariation?.name || "Unknown Product",
      description: `Return from Sale ${sale.id.slice(0, 8)}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      taxAmount: item.vatAmount || 0,
      saleItemId: item.id,
      originalQuantity: item.quantity, // Store original quantity
      originalTotalPrice: item.totalPrice, // Store original total price
    }))

    setItems(creditNoteItems)
  }

  const addManualItem = () => {
    const newItem: CreditNoteItem = {
      id: crypto.randomUUID(),
      productName: "Manual Entry",
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      taxAmount: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const startEditingItem = (item: CreditNoteItem) => {
    setEditingItemId(item.id)
    setEditingItemData({
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      description: item.description || "",
    })
  }

  const cancelEditingItem = () => {
    setEditingItemId(null)
    setEditingItemData({ quantity: "", unitPrice: "", description: "" })
  }

  const saveEditingItem = () => {
    if (!editingItemId) return

    const quantity = parseFloat(editingItemData.quantity)
    const unitPrice = parseFloat(editingItemData.unitPrice)

    if (isNaN(quantity) || isNaN(unitPrice) || quantity <= 0 || unitPrice <= 0) {
      setSnackbar({ open: true, message: "Quantity and unit price must be greater than 0" })
      return
    }

    // Find the item being edited
    const itemBeingEdited = items.find((item) => item.id === editingItemId)
    if (!itemBeingEdited) {
      return
    }

    // Validate against original values if they exist (items from sale)
    if (itemBeingEdited.originalQuantity !== undefined) {
      if (quantity >= itemBeingEdited.originalQuantity) {
        setSnackbar({
          open: true,
          message: `Quantity must be less than the original quantity (${itemBeingEdited.originalQuantity})`,
        })
        return
      }
    }

    const newTotalPrice = unitPrice * quantity

    // Validate total price against original if it exists
    if (itemBeingEdited.originalTotalPrice !== undefined) {
      if (newTotalPrice > itemBeingEdited.originalTotalPrice) {
        setSnackbar({
          open: true,
          message: `Total amount (${newTotalPrice.toLocaleString()}) cannot exceed the original amount (${itemBeingEdited.originalTotalPrice.toLocaleString()})`,
        })
        return
      }
    }

    setItems(
      items.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              quantity,
              unitPrice,
              totalPrice: newTotalPrice,
              description: editingItemData.description || item.description,
            }
          : item
      )
    )

    cancelEditingItem()
  }

  const handleFormSubmit = async (data: z.infer<typeof creditNoteFormSchema>) => {
    if (items.length === 0) {
      setSnackbar({ open: true, message: "Please add at least one item to the credit note." })
      return
    }

    if (!selectedCustomerDetails) {
      setSnackbar({ open: true, message: "Please select a customer." })
      return
    }

    setIsSubmitting(true)

    const creditNoteData = {
      id: crypto.randomUUID(),
      creditNoteDate: new Date().toISOString(),
      saleId: selectedSale?.id || null,
      customerId: selectedCustomerDetails?.id || "",
      processedById: user?.id || "",
      totalAmount: totalAmount,
      taxAmount: taxAmount,
      subTotal: subTotal,
      reason: data.reason,
      description: data.description,
      notes: data.notes,
      applyToBalance: data.applyToBalance ?? true,
      linkedFinancialAccountId: selectedFinancialAccountId || null,
      items: items.map(item => ({
        id: crypto.randomUUID(),
        productVariationId: item.productVariationId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        taxAmount: item.taxAmount || 0,
        saleItemId: item.saleItemId,
      })),
    }

    try {
      const response = await api.post("/CreditNotes", creditNoteData)
      
      // Extract application message from response (check multiple possible response structures)
      const applicationMessage = response.data?.applicationMessage || 
                                 response.data?.ApplicationMessage ||
                                 response.data?.creditNote?.applicationMessage ||
                                 response.data?.CreditNote?.applicationMessage ||
                                 response.data?.CreditNote?.ApplicationMessage
      const successMessage = applicationMessage 
        ? `Credit note created successfully. ${applicationMessage}`
        : `Credit note created successfully for ${selectedCustomerDetails.name}`
      
      setSnackbar({ open: true, message: successMessage })
      
      setTimeout(() => {
        router.push("/CreditNotes")
      }, applicationMessage ? 12000 : 1500) // Longer delay if application message is present
    } catch (error: any) {
      console.error("Error submitting credit note:", error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to create credit note. Please try again."
      setSnackbar({ open: true, message: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="dark:bg-gray-900 bg-white rounded-lg w-[80vw] mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link
          href="/CreditNotes"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Home className="h-4 w-4" />
          Credit Notes
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">New Credit Note</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Row 1: Customer Details */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-gray-200">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormItem>
                <FormControl>
                  <CustomerAutocomplete
                    value={selectedCustomerDetails}
                    onChange={async (customer) => {
                      if (customer) {
                        const fullCustomer = await getCustomerById(customer.id)
                        setSelectedCustomerDetails(fullCustomer || null)
                      } else {
                        setSelectedCustomerDetails(null)
                      }
                    }}
                    label="Customer"
                    required
                  />
                </FormControl>
                {!selectedCustomerDetails && (
                  <p className="text-sm text-red-500 mt-1">Customer is required</p>
                )}
              </FormItem>
            </CardContent>
          </Card>

          {/* Row 2: Select Sale (if customer selected) */}
          {selectedCustomerDetails && (
            <Card className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg dark:text-gray-200">
                  Select Sale (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSales ? (
                  <div className="text-center py-4 text-gray-500">Loading sales...</div>
                ) : customerSales.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No sales found for this customer</div>
                ) : (
                  <div className="rounded-md border dark:border-gray-700 overflow-hidden max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                        <TableRow className="dark:border-gray-700">
                          <TableHead className="dark:text-gray-300">Sale #</TableHead>
                          <TableHead className="dark:text-gray-300">Date</TableHead>
                          <TableHead className="dark:text-gray-300">Items</TableHead>
                          <TableHead className="dark:text-gray-300">Total</TableHead>
                          <TableHead className="dark:text-gray-300">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerSales.map((sale) => (
                          <TableRow
                            key={sale.id}
                            className={cn(
                              "dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                              selectedSale?.id === sale.id && "bg-blue-50 dark:bg-blue-900/20"
                            )}
                            onClick={() => handleSaleSelection(sale)}
                          >
                            <TableCell className="font-mono text-sm dark:text-gray-200">
                              SA-{sale.id.slice(0, 8)}
                            </TableCell>
                            <TableCell className="text-sm dark:text-gray-300">
                              {format(new Date(sale.addedAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-sm dark:text-gray-300">
                              {sale.saleItems.length} items
                            </TableCell>
                            <TableCell className="text-sm font-semibold dark:text-gray-200">
                              {formatCurrency(sale.finalAmount)}
                            </TableCell>
                            <TableCell>
                              {selectedSale?.id === sale.id && (
                                <Check className="h-5 w-5 text-emerald-500" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    variant="outlined"
                    onClick={addManualItem}
                    startIcon={<Plus className="h-4 w-4" />}
                    fullWidth
                  >
                    Add Manual Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row 3: Credit Note Items */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-gray-200">Credit Note Items</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No items added yet. Select a sale or add manual items.
                </div>
              ) : (
                <div className="rounded-md border dark:border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <TableHead className="dark:text-gray-300">Product</TableHead>
                        <TableHead className="dark:text-gray-300">Description</TableHead>
                        <TableHead className="dark:text-gray-300">Quantity</TableHead>
                        <TableHead className="dark:text-gray-300">Unit Price</TableHead>
                        <TableHead className="dark:text-gray-300">Total</TableHead>
                        <TableHead className="dark:text-gray-300 w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const isEditing = editingItemId === item.id
                        return (
                          <TableRow key={item.id} className="dark:border-gray-700">
                            <TableCell className="font-medium dark:text-gray-200 text-sm">
                              {item.productName || "—"}
                            </TableCell>
                            <TableCell className="dark:text-gray-300 text-sm">
                              {isEditing ? (
                                <TextField
                                  value={editingItemData.description}
                                  onChange={(e) =>
                                    setEditingItemData({ ...editingItemData, description: e.target.value })
                                  }
                                  size="small"
                                  sx={{ width: "200px" }}
                                  placeholder="Enter description..."
                                  multiline
                                  maxRows={2}
                                />
                              ) : (
                                item.description || "—"
                              )}
                            </TableCell>
                            <TableCell className="dark:text-gray-300 text-sm">
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  value={editingItemData.quantity}
                                  onChange={(e) =>
                                    setEditingItemData({ ...editingItemData, quantity: e.target.value })
                                  }
                                  size="small"
                                  sx={{ width: "80px" }}
                                  inputProps={{
                                    min: 0.01,
                                    max: item.originalQuantity ? item.originalQuantity - 0.01 : undefined,
                                    step: 0.01,
                                  }}
                                  helperText={
                                    item.originalQuantity
                                      ? `Max: ${(item.originalQuantity - 0.01).toFixed(2)}`
                                      : undefined
                                  }
                                  error={
                                    !!(item.originalQuantity &&
                                    parseFloat(editingItemData.quantity) >= item.originalQuantity)
                                  }
                                />
                              ) : (
                                item.quantity
                              )}
                            </TableCell>
                            <TableCell className="dark:text-gray-300 text-sm">
                              {isEditing ? (
                                <TextField
                                  type="number"
                                  value={editingItemData.unitPrice}
                                  onChange={(e) =>
                                    setEditingItemData({ ...editingItemData, unitPrice: e.target.value })
                                  }
                                  size="small"
                                  sx={{ width: "100px" }}
                                  inputProps={{
                                    min: 0.01,
                                    max:
                                      item.originalTotalPrice && parseFloat(editingItemData.quantity) > 0
                                        ? item.originalTotalPrice / parseFloat(editingItemData.quantity)
                                        : undefined,
                                    step: 0.01,
                                  }}
                                  helperText={
                                    item.originalTotalPrice && parseFloat(editingItemData.quantity) > 0
                                      ? `Max: ${formatCurrency(item.originalTotalPrice / parseFloat(editingItemData.quantity))}`
                                      : undefined
                                  }
                                  error={
                                    !!(
                                      item.originalTotalPrice &&
                                      parseFloat(editingItemData.quantity) > 0 &&
                                      parseFloat(editingItemData.unitPrice) * parseFloat(editingItemData.quantity) >
                                        item.originalTotalPrice
                                    )
                                  }
                                />
                              ) : (
                                formatCurrency(item.unitPrice)
                              )}
                            </TableCell>
                            <TableCell className="font-semibold dark:text-gray-200 text-sm">
                              {isEditing
                                ? formatCurrency(
                                    parseFloat(editingItemData.quantity || "0") *
                                      parseFloat(editingItemData.unitPrice || "0")
                                  )
                                : formatCurrency(item.totalPrice)}
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
                                      title="Remove item"
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

                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-semibold dark:text-gray-200">{formatCurrency(subTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                      <span className="font-semibold dark:text-gray-200">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2">
                      <span className="dark:text-gray-200">Total:</span>
                      <span className="text-blue-600 dark:text-blue-400">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Row 4: Credit Note Details */}
          <Card className="dark:bg-gray-900 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg dark:text-gray-200">Credit Note Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select {...field} fullWidth displayEmpty>
                        <MenuItem value="" disabled>
                          Select Reason
                        </MenuItem>
                        {reasonOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextField
                        {...field}
                        label="Description"
                        multiline
                        rows={2}
                        fullWidth
                        placeholder="Brief description of the credit note reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TextField
                        {...field}
                        label="Additional Notes"
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Any additional notes or comments"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormControl>
                  <TextField
                    id="financial-account-select"
                    select
                    label="Financial Account (Optional)"
                    value={selectedFinancialAccountId}
                    onChange={(e) => setSelectedFinancialAccountId(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">None</MenuItem>
                    {financialAccounts
                      .filter(account => account.type !== 'CREDIT')
                      .map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.accountName} - {account.bankName} ({account.type})
                        </MenuItem>
                      ))}
                  </TextField>
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="applyToBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Apply to customer balance immediately"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outlined"
              onClick={() => router.push("/CreditNotes")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || items.length === 0}
              startIcon={<FileText className="h-4 w-4" />}
            >
              {isSubmitting ? "Creating..." : "Create Credit Note"}
            </Button>
          </div>
        </form>
      </Form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.message.includes("applied to") || snackbar.message.includes("deducted from") || snackbar.message.includes("added to") ? 12000 : 6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </div>
  )
}
