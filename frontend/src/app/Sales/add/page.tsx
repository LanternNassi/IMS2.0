"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, Trash2, Pill, ChevronRight, Home } from "lucide-react"

import { Button, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material"
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
import { ProductAutocomplete, type Product } from "@/components/ProductAutocomplete"
import { BatchModal } from "@/components/batch-modal"
import type { Sale, SalesItem } from "@/app/Sales/page"

import { supplier, useSupplierStore } from "@/store/useSupplierStore"
import { set } from "date-fns"

const saleFormSchema = z.object({
    supplierId: z.string().min(1, "Supplier is required"),
    notes: z.string().optional(),
})

type SaleFormProps = {
    sale?: Sale
    suppliers: Array<{ id: string; name: string }>
    products: Product[]
    onSubmit: (sale: Sale) => void
}

// Mock data
const mockSuppliers = [
    { id: "1", name: "Supplier A" },
    { id: "2", name: "Supplier B" },
    { id: "3", name: "Supplier C" },
    { id: "4", name: "Premium Pharma Distributors" },
    { id: "5", name: "Global Medical Supplies" },
]

const mockProducts: Product[] = [
    { id: "1", name: "Paracetamol", baseWholeSalePrice: 120000, baseSellingPrice: 150000, stores: { 'Front store': 4, 'Back store': 3 } },
    { id: "2", name: "Ibuprofen", baseWholeSalePrice: 100000, baseSellingPrice: 130000, stores: { 'Front store': 6, 'Back store': 2 } },
    { id: "3", name: "Aspirin", baseWholeSalePrice: 90000, baseSellingPrice: 110000, stores: { 'Front store': 5, 'Back store': 4 } },
    { id: "4", name: "Amoxicillin", baseWholeSalePrice: 85000, baseSellingPrice: 100000, stores: { 'Front store': 7, 'Back store': 3 } },
    { id: "5", name: "Metformin", baseWholeSalePrice: 32000, baseSellingPrice: 50000, stores: { 'Front store': 8, 'Back store': 6 } },
]

export default function SaleForm({
    sale,
    suppliers = mockSuppliers,
    products = mockProducts,
    onSubmit,
}: SaleFormProps) {
    const [items, setItems] = useState<SalesItem[]>(sale?.items || [])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [selectedQuantity, setSelectedQuantity] = useState("")
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [editingItemData, setEditingItemData] = useState<{
        quantity: string;
        basePrice: string;
    }>({ quantity: "", basePrice: "" })

    const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<supplier | null>(null)
    const [selectedStore, setSelectedStore] = useState<string>("")
    const [selectedRateType, setSelectedRateType] = useState<"wholeSale" | "selling" | "custom">("selling")
    const [customPrice, setCustomPrice] = useState<string>("")
    const [showCustomPriceDialog, setShowCustomPriceDialog] = useState(false)
    const [tempCustomPrice, setTempCustomPrice] = useState<string>("")
    const { getSupplierById } = useSupplierStore()



    const [totalAmount, setTotalAmount] = useState(0)
    const [paidAmount, setPaidAmount] = useState(0)
    const [returnAmount, setReturnAmount] = useState(0)
    const [discount, setDiscount] = useState(0)

    useEffect(() => {

        let amount = items.reduce((sum, item) => sum + item.totalPrice, 0)

        if (discount) {
            amount -= discount
        }

        if (paidAmount) {
            setReturnAmount(paidAmount - amount)
        }

        setTotalAmount(amount)
    }, [items, discount, paidAmount])

    // Refs for keyboard navigation
    const supplierSearchRef = useRef<HTMLInputElement>(null)
    const productSearchRef = useRef<HTMLInputElement>(null)
    const productQtyRef = useRef<HTMLInputElement>(null)
    const addButtonRef = useRef<HTMLButtonElement>(null)
    const notesRef = useRef<HTMLTextAreaElement>(null)
    const submitButtonRef = useRef<HTMLButtonElement>(null)

    const form = useForm<z.infer<typeof saleFormSchema>>({
        resolver: zodResolver(saleFormSchema),
        defaultValues: {
            supplierId: sale?.supplierId || "",
            notes: sale?.notes || "",
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

        // Determine the price based on selected rate type
        let pricePerUnit = 0
        if (selectedRateType === "wholeSale") {
            pricePerUnit = selectedProduct.baseWholeSalePrice || 0
        } else if (selectedRateType === "selling") {
            pricePerUnit = selectedProduct.baseSellingPrice || 0
        } else if (selectedRateType === "custom") {
            pricePerUnit = parseFloat(customPrice) || 0
        } else {
            pricePerUnit = selectedProduct.baseSellingPrice || 0
        }

        console.log("Product added ", selectedProduct, quantity, pricePerUnit)

        const totalPrice = pricePerUnit * quantity

        const newItem: SalesItem = {
            id: crypto.randomUUID(),
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            basePrice: pricePerUnit,
            quantity,
            totalPrice,
            hasGeneric: false,
        }

        setItems([...items, newItem])
        setSelectedProduct(null)
        setSelectedProductId("")
        setSelectedQuantity("")
        setSelectedStore("")
        setSelectedRateType("wholeSale")
    }

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id))
    }

    const startEditingItem = (item: SalesItem) => {
        setEditingItemId(item.id)
        setEditingItemData({
            quantity: item.quantity.toString(),
            basePrice: item.basePrice.toString(),
        })
    }

    const cancelEditingItem = () => {
        setEditingItemId(null)
        setEditingItemData({ quantity: "", basePrice: "" })
    }

    const saveEditingItem = () => {
        if (!editingItemId) return

        const quantity = parseFloat(editingItemData.quantity)
        const basePrice = parseFloat(editingItemData.basePrice)

        if (isNaN(quantity) || isNaN(basePrice) || quantity <= 0 || basePrice <= 0) {
            return
        }

        setItems(
            items.map((item) =>
                item.id === editingItemId
                    ? {
                        ...item,
                        quantity,
                        basePrice,
                        totalPrice: basePrice * quantity,
                    }
                    : item,
            ),
        )

        cancelEditingItem()
    }



    const handleFormSubmit = (data: z.infer<typeof saleFormSchema>) => {
        if (items.length === 0) {
            return
        }

        const saleData: Sale = {
            id: sale?.id || crypto.randomUUID(),
            supplierId: data.supplierId,
            supplierName: selectedSupplier?.name || "",
            items,
            totalAmount,
            createdAt: sale?.createdAt || new Date(),
            notes: data.notes,
        }

        onSubmit(saleData)
    }

    return (
        <div className="dark:bg-gray-900 bg-white rounded-lg w-[80vw] mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="mb-6 flex items-center gap-2 text-sm">
                <Link
                    href="/Sales"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                    <Home className="h-4 w-4" />
                    Sales
                </Link>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Add Sale</span>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">


                    {/* Row 1: Supplier Details */}
                    <Card className="dark:bg-gray-900 dark:border-gray-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg dark:text-gray-200">Customer Details</CardTitle>
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
                                        // Reset store and rate selections
                                        setSelectedStore(product ? product.stores ? Object.keys(product.stores)[0] : "" : "")
                                        setSelectedRateType("wholeSale")
                                        setCustomPrice("")

                                        // Auto-focus to quantity after product selection
                                        if (product) {
                                            setTimeout(() => productQtyRef.current?.focus(), 100)
                                        }
                                    }}
                                    products={products.map(p => ({
                                        id: p.id,
                                        name: p.name,
                                        baseCostPrice: p.baseCostPrice,
                                        baseSellingPrice: p.baseSellingPrice,
                                        baseWholeSalePrice: p.baseWholeSalePrice,
                                        stores: p.stores,
                                        inventory: Object.values(p.stores ?? {}).reduce((acc, curr) => acc + curr, 0)
                                    }))}
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

                                {/* Inventory - Store Selection */}
                                <Select
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                    displayEmpty
                                    fullWidth
                                    size="small"
                                    disabled={!selectedProduct}
                                    sx={{
                                        backgroundColor: selectedProduct ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                        '& .MuiSelect-select': { py: '8.5px' }
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        <em>Select Store</em>
                                    </MenuItem>
                                    {selectedProduct?.stores && Object.entries(selectedProduct.stores).map(([storeName, qty]) => (
                                        <MenuItem key={storeName} value={storeName}>
                                            {storeName} ({qty} units)
                                        </MenuItem>
                                    ))}
                                </Select>

                                {/* Rate - Price Type Selection */}
                                <Select
                                    value={selectedRateType}
                                    onChange={(e) => {
                                        const value = e.target.value as "wholeSale" | "selling" | "custom"
                                        setSelectedRateType(value)
                                        if (value === "custom") {
                                            setTempCustomPrice(customPrice || "")
                                            setShowCustomPriceDialog(true)
                                        }
                                    }}
                                    fullWidth
                                    size="small"
                                    disabled={!selectedProduct}
                                    sx={{
                                        backgroundColor: selectedProduct ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                        '& .MuiSelect-select': { py: '8.5px' }
                                    }}
                                >
                                    <MenuItem value="wholeSale">
                                        {selectedProduct?.baseWholeSalePrice != null
                                            ? selectedProduct.baseWholeSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : "0.00"}
                                    </MenuItem>
                                    <MenuItem value="selling">
                                        {selectedProduct?.baseSellingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                    </MenuItem>
                                    <MenuItem value="custom">
                                        Custom Price {customPrice ? `(${parseFloat(customPrice).toFixed(2)})` : ""}
                                    </MenuItem>
                                </Select>

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
                                                                            value={editingItemData.basePrice}
                                                                            onChange={(e) => setEditingItemData({ ...editingItemData, basePrice: e.target.value })}
                                                                            size="small"
                                                                            sx={{ width: '100px' }}
                                                                            inputProps={{ min: 0, step: 0.01 }}
                                                                        />
                                                                    ) : (
                                                                        item.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="font-semibold dark:text-gray-200 text-sm">
                                                                    {isEditing ? (
                                                                        (parseFloat(editingItemData.quantity || "0") * parseFloat(editingItemData.basePrice || "0")).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                    ) : (
                                                                        item.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                    )}
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
                                            value={paidAmount || ""}
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
                                            <span className="text-xl font-semibold dark:text-white">{returnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                disabled={items.length === 0}
                                className="w-full h-12 text-lg font-semibold"
                                ref={submitButtonRef}
                            >
                                SAVE TRANSACTION
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>


            {/* Custom Price Dialog */}
            <Dialog open={showCustomPriceDialog} onClose={() => setShowCustomPriceDialog(false)}>
                <DialogTitle>Enter Custom Price</DialogTitle>
                <DialogContent sx={{ minWidth: '300px', pt: 2 }}>
                    <TextField
                        label="Custom Price"
                        type="number"
                        value={tempCustomPrice}
                        onChange={(e) => setTempCustomPrice(e.target.value)}
                        fullWidth
                        autoFocus
                        inputProps={{ step: "0.01", min: "0" }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && tempCustomPrice) {
                                e.preventDefault()
                                setCustomPrice(tempCustomPrice)
                                setShowCustomPriceDialog(false)
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setSelectedRateType("wholeSale")
                            setShowCustomPriceDialog(false)
                        }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setCustomPrice(tempCustomPrice)
                            setShowCustomPriceDialog(false)
                        }}
                        variant="contained"
                        disabled={!tempCustomPrice || parseFloat(tempCustomPrice) <= 0}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}