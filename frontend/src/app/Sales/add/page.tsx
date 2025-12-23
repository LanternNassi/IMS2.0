"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, Trash2, ChevronRight, Home, Printer, X } from "lucide-react"

import { Button, TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Checkbox, FormControlLabel } from "@mui/material"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { CustomerAutocomplete } from "@/components/CustomerAutocomplete"
import { ProductAutocomplete, type ProductVariation } from "@/components/ProductAutocomplete"
import { ReceiptPreview } from "@/components/ReceiptPreview"
import type { Sale, SalesItem } from "@/app/Sales/page"

import { customer, useCustomerStore } from "@/store/useCustomerStore"
import api from "@/Utils/Request"
import { useRouter } from "next/navigation"
import { useReactToPrint } from 'react-to-print'
import { useAuthStore } from "@/store/useAuthStore"
import { useSystemConfigStore } from "@/store/useSystemConfigStore"


const saleFormSchema = z.object({
    // customerId: z.string().min(1, "Customer is required"),
    notes: z.string().optional(),
})


export default function AddSale() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { getCustomerById } = useCustomerStore()
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
    const router = useRouter()
    const {user} = useAuthStore()
    const { config } = useSystemConfigStore()
    const [items, setItems] = useState<SalesItem[]>([])
    const [selectedProductId, setSelectedProductId] = useState("")
    const [selectedProduct, setSelectedProduct] = useState<ProductVariation | null>(null)
    const [selectedQuantity, setSelectedQuantity] = useState("")
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [createdSaleId, setCreatedSaleId] = useState<string | null>(null)
    const [fetchedSaleData, setFetchedSaleData] = useState<any>(null)
    const [saleIdInput, setSaleIdInput] = useState<string>("")
    const [editingItemData, setEditingItemData] = useState<{
        quantity: string;
        basePrice: string;
    }>({ quantity: "", basePrice: "" })

    // Temporary: Fetch first user ID for processedBy
    const [currentUserId, setCurrentUserId] = useState<string>("")

    const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<customer | null>(null)
    const [selectedStorage, setSelectedStorage] = useState<string>("") // Storage location name
    const [selectedRateType, setSelectedRateType] = useState<"wholeSale" | "selling" | "custom">("selling")
    const [customPrice, setCustomPrice] = useState<string>("")
    const [showCustomPriceDialog, setShowCustomPriceDialog] = useState(false)
    const [tempCustomPrice, setTempCustomPrice] = useState<string>("")



    const [totalAmount, setTotalAmount] = useState(0)
    const [paidAmount, setPaidAmount] = useState(0)
    const [returnAmount, setReturnAmount] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [isTaken, setIsTaken] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState<string>("CASH")
    const [financialAccounts, setFinancialAccounts] = useState<Array<{
        id: string;
        accountName: string;
        bankName: string;
        type: string;
        isDefault: boolean;
    }>>([])
    const [linkedFinancialAccountId, setLinkedFinancialAccountId] = useState<string | null>(null)

    useEffect(() => {

        let amount = items.reduce((sum, item) => sum + item.totalPrice, 0)

        if (discount) {
            amount -= discount
        }

        setReturnAmount(paidAmount - amount)

        setTotalAmount(amount)
    }, [items, discount, paidAmount])

    // Temporary: Fetch first user ID
    useEffect(() => {
        const fetchFirstUser = async () => {
            try {
                const response = await api.get('/users')
                const users = response.data
                if (users && users.length > 0) {
                    setCurrentUserId(users[0].id)
                }
            } catch (error) {
                console.error('Error fetching users:', error)
            }
        }
        fetchFirstUser()
    }, [])

    // Fetch financial accounts
    useEffect(() => {
        const fetchFinancialAccounts = async () => {
            try {
                const response = await api.get('/FinancialAccounts?includeMetadata=false&page=1&pageSize=100')
                const accounts = response.data.financialAccounts || []
                setFinancialAccounts(accounts)

                // Auto-select the default account
                const defaultAccount = accounts.find((acc: any) => acc.isDefault === true)
                if (defaultAccount) {
                    setLinkedFinancialAccountId(defaultAccount.id)
                    setPaymentMethod(defaultAccount.type)
                }
            } catch (error) {
                console.error('Error fetching financial accounts:', error)
            }
        }
        fetchFinancialAccounts()
    }, [])

    // Refs for keyboard navigation
    const customerSearchRef = useRef<HTMLInputElement>(null)
    const productSearchRef = useRef<HTMLInputElement>(null)
    const productQtyRef = useRef<HTMLInputElement>(null)
    const addButtonRef = useRef<HTMLButtonElement>(null)
    const notesRef = useRef<HTMLTextAreaElement>(null)
    const submitButtonRef = useRef<HTMLButtonElement>(null)

    const receiptRef = useRef<HTMLDivElement>(null)

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${new Date().toISOString()}`,
        preserveAfterPrint: true,
    })

    const CheckIfBusinessDayisOpen = async (): Promise<boolean> => {
        const response = await api.get('/CashReconciliations/is-today-open')
        return response.data.isOpen as boolean
    }

    const fetchSaleById = async () => {
        if (!saleIdInput.trim()) {
            setSnackbar({ open: true, message: "Please enter a sale ID" })
            return
        }

        const salesPrefix = saleIdInput.trim().split("-")[1]

        try {
            const response = await api.get(`/Sales/SalePrefix/${salesPrefix}`)
            const saleData = response.data
            setFetchedSaleData(saleData)
            setSnackbar({ open: true, message: "Sale data loaded successfully" })
        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message || "Failed to fetch sale data" })
            setFetchedSaleData(null)
        }
    }

    const form = useForm<z.infer<typeof saleFormSchema>>({
        resolver: zodResolver(saleFormSchema),
        defaultValues: {
            notes: "",
        },
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement

            // Number keys for quick section navigation
            if (e.altKey && !e.shiftKey && !e.ctrlKey) {
                switch (e.key) {
                    case "1":
                        e.preventDefault()
                        customerSearchRef.current?.focus()
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

                if (activeElement === customerSearchRef.current || target.closest('[data-section="customer"]')) {
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
                } else if (activeElement === productSearchRef.current || target.closest('[data-section="customer"]')) {
                    customerSearchRef.current?.focus()
                }
                return
            }

            // Tab from quantity field to Add button
            if (e.key === "Tab" && target === productQtyRef.current && !e.shiftKey) {
                if (selectedProduct && selectedQuantity && selectedStorage) {
                    e.preventDefault()
                    addButtonRef.current?.focus()
                }
            }

            // Enter key behavior
            if (e.key === "Enter") {
                const activeElement = document.activeElement

                // If Add button is focused or we're in quantity field with valid data
                if (activeElement === addButtonRef.current ||
                    (activeElement === productQtyRef.current && selectedProduct && selectedQuantity && selectedStorage)) {
                    e.preventDefault()
                    addProduct()
                    productSearchRef.current?.focus()
                    return // Prevent further processing
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
    }, [selectedProduct, selectedQuantity, selectedStorage, items.length])

    const addProduct = () => {
        if (!selectedProduct || !selectedQuantity) {
            return
        }

        if (!selectedStorage) {
            setSnackbar({ open: true, message: "Please select a storage location" })
            return
        }

        const quantity = Number.parseFloat(selectedQuantity)

        // Check if selected storage has enough quantity
        const storageData = selectedProduct.storages?.[selectedStorage]
        const availableQuantity = storageData?.quantity || 0
        if (quantity > availableQuantity) {
            setSnackbar({ open: true, message: `Only ${availableQuantity} units available in ${selectedStorage}` })
            return
        }

        // Determine the price based on selected rate type
        let pricePerUnit = 0
        if (selectedRateType === "wholeSale") {
            pricePerUnit = selectedProduct.wholeSalePrice || 0
        } else if (selectedRateType === "selling") {
            pricePerUnit = selectedProduct.retailPrice || 0
        } else if (selectedRateType === "custom") {
            pricePerUnit = parseFloat(customPrice) || 0
        } else {
            pricePerUnit = selectedProduct.retailPrice || 0
        }

        console.log("Product added ", selectedProduct, quantity, pricePerUnit)

        const totalPrice = pricePerUnit * quantity

        const newItem: SalesItem = {
            id: crypto.randomUUID(),
            productId: selectedProduct.productId,
            productVariationId: selectedProduct.id,
            productName: selectedProduct.name,
            basePrice: pricePerUnit,
            quantity,
            totalPrice,
            storageId: storageData?.storeId, // Store the storage ID
        }

        setItems([...items, newItem])
        setSelectedProduct(null)
        setSelectedProductId("")
        setSelectedQuantity("")
        setSelectedRateType("wholeSale")
        setSelectedStorage("")
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



    const handleFormSubmit = async (data: z.infer<typeof saleFormSchema>) => {
        const businessDayIsOpen = await CheckIfBusinessDayisOpen()

        if (!businessDayIsOpen) {
            setSnackbar({ open: true, message: "Cannot process sale. Business day is not open." })
            return
        }

        if (user?.username == "master"){
            setSnackbar({ open: true, message: "Cannot process sale. Logged in as master user." })
            return
        }

        if (items.length === 0) {
            setSnackbar({ open: true, message: "Please add at least one item to the sale." })
            return
        }

        if (paidAmount < (totalAmount - discount)) {
            if (!selectedCustomerDetails) {
                setSnackbar({ open: true, message: "Please select a customer for the sale or ensure the paid amount covers the total." })
                return
            }
        }

        setIsSubmitting(true)

        const saleData: Sale = {
            id: crypto.randomUUID(),
            customerId: selectedCustomerDetails?.id || undefined,
            customerName: selectedCustomerDetails?.name || undefined,
            items,
            totalAmount,
            paidAmount: returnAmount <= 0 ? paidAmount : (totalAmount - discount),
            changeAmount: returnAmount,
            discount: discount,
            isPaid: paidAmount >= (totalAmount - discount),
            isTaken: isTaken,
            paymentMethod: paymentMethod,
            processedById: user?.id || currentUserId, // Temporary: Use first user's ID
            linkedFinancialAccountId: linkedFinancialAccountId || undefined,
            finalAmount: paidAmount,
            createdAt: new Date(),
            isCompleted: paidAmount >= (totalAmount - discount),
            notes: data.notes,
        }

        // console.log(saleData)

        try {
            const response = await api.post("/Sales", saleData)
            setCreatedSaleId(response.data.id)
            setSnackbar({ open: true, message: "Sale created successfully." })

            // Wait for state to update before printing
            await new Promise(resolve => setTimeout(resolve, 100))
            handlePrint()

            // Wait for print dialog before clearing
            await new Promise(resolve => setTimeout(resolve, 500))
            ClearAll()

        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message || "Failed to save sale. Please try again." })
        } finally {
            setIsSubmitting(false)
        }
    }
    const ClearAll = () => {
        setSelectedCustomerDetails(null)
        setItems([])
        setTotalAmount(0)
        setPaidAmount(0)
        setReturnAmount(0)
        setDiscount(0)
        setCreatedSaleId(null)
        setFetchedSaleData(null)
        setSaleIdInput("")
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


                    {/* Row 1: Customer Details */}
                    <Card className="dark:bg-gray-900 dark:border-gray-700">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg dark:text-gray-200">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0" data-section="customer">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                                {/* Search Customer */}
                                <CustomerAutocomplete
                                    value={selectedCustomerDetails}
                                    onChange={async (customer) => {
                                        if (customer) {
                                            // form.setValue("customerId", customer.id)
                                            const fullCustomer = await getCustomerById(customer.id)
                                            setSelectedCustomerDetails(fullCustomer)
                                            // Auto-focus to product search after customer selection
                                            setTimeout(() => productSearchRef.current?.focus(), 100)
                                        } else {
                                            // form.setValue("customerId", "")
                                            setSelectedCustomerDetails(null)
                                        }
                                    }}
                                    label="Search (Alt+1)"
                                    fullWidth
                                    size="small"
                                    // required
                                    inputRef={customerSearchRef}
                                />

                                {/* Contact */}
                                <TextField
                                    label="Contact"
                                    value={selectedCustomerDetails?.phone || ""}
                                    InputProps={{ readOnly: true }}
                                    fullWidth
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                                />

                                {/* Address */}
                                <TextField
                                    label="Address"
                                    value={selectedCustomerDetails?.address || ""}
                                    InputProps={{ readOnly: true }}
                                    fullWidth
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                                />

                                {/* Name */}
                                <TextField
                                    label="Name"
                                    value={selectedCustomerDetails?.name || ""}
                                    InputProps={{ readOnly: true }}
                                    fullWidth
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                                />

                                {/* Email */}
                                <TextField
                                    label="Email"
                                    value={selectedCustomerDetails?.email || ""}
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
                                        // Reset rate selections and storage
                                        setSelectedRateType("wholeSale")
                                        setCustomPrice("")

                                        // Auto-select first storage location if available
                                        if (product?.storages && Object.keys(product.storages).length > 0) {
                                            const firstStorage = Object.keys(product.storages)[0]
                                            setSelectedStorage(firstStorage)
                                        } else {
                                            setSelectedStorage("")
                                        }

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

                                {/* Storage Location Selection */}
                                <Select
                                    value={selectedStorage}
                                    onChange={(e) => setSelectedStorage(e.target.value)}
                                    fullWidth
                                    size="small"
                                    disabled={!selectedProduct}
                                    displayEmpty
                                    sx={{
                                        backgroundColor: selectedProduct ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                        '& .MuiSelect-select': { py: '8.5px' }
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        Select Storage ({selectedProduct?.unitofMeasure || 'Unit'})
                                    </MenuItem>
                                    {selectedProduct?.storages && Object.keys(selectedProduct.storages).length > 0 ? (
                                        Object.entries(selectedProduct.storages).map(([storageName, storageData]) => (
                                            <MenuItem key={storageName} value={storageName}>
                                                {storageName}: {storageData.quantity.toLocaleString()} {selectedProduct.unitofMeasure}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem value="" disabled>
                                            No storage locations available
                                        </MenuItem>
                                    )}
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
                                        {selectedProduct?.wholeSalePrice != null
                                            ? selectedProduct.wholeSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : "0.00"}
                                    </MenuItem>
                                    <MenuItem value="selling">
                                        {selectedProduct?.retailPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                    </MenuItem>
                                    <MenuItem value="custom">
                                        {customPrice ? `(${parseFloat(customPrice).toFixed(2)})` : ""}
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
                                        if (e.key === "Enter" && selectedProduct && selectedQuantity && selectedStorage) {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            addProduct()
                                            productSearchRef.current?.focus()
                                        }
                                    }}
                                />

                                {/* Add Button */}
                                <div className="flex items-end">
                                    <Button
                                        onClick={addProduct}
                                        disabled={!selectedProduct || !selectedQuantity || !selectedStorage}
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
                                            value={paidAmount}
                                            size="small"
                                            sx={{ width: '150px', '& input': { textAlign: 'right' } }}
                                            onChange={(value) => {
                                                setPaidAmount(Number(value.target.value))
                                                console.log(value.target.value)
                                            }}
                                        />
                                    </div>

                                    <div className="border-t dark:border-gray-700 pt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-blue-500 dark:text-blue-400 font-medium text-lg">Grand Total</span>
                                            <span className="text-2xl font-bold dark:text-white">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-blue-500 dark:text-blue-400 font-medium">Return amount</span>
                                            <span className="text-xl font-semibold dark:text-white">{returnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        <div className="border-t dark:border-gray-700 pt-3">
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={isTaken}
                                                        onChange={(e) => setIsTaken(e.target.checked)}
                                                        sx={{
                                                            color: 'rgb(59 130 246)',
                                                            '&.Mui-checked': {
                                                                color: 'rgb(59 130 246)',
                                                            },
                                                        }}
                                                    />
                                                }
                                                label="Products Taken"
                                                sx={{
                                                    '& .MuiFormControlLabel-label': {
                                                        color: 'rgb(59 130 246)',
                                                        fontWeight: 500,
                                                    },
                                                    '.dark &': {
                                                        '& .MuiFormControlLabel-label': {
                                                            color: 'rgb(96 165 250)',
                                                        },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Overview */}
                        <div className="space-y-6">
                            <Card className="dark:bg-gray-900 dark:border-gray-700">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg dark:text-gray-200">Payment Method</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select
                                        value={linkedFinancialAccountId || ""}
                                        onChange={(e) => {
                                            const selectedId = e.target.value
                                            setLinkedFinancialAccountId(selectedId || null)
                                            // Set payment method based on account type
                                            const selectedAccount = financialAccounts.find(acc => acc.id === selectedId)
                                            if (selectedAccount) {
                                                setPaymentMethod(selectedAccount.type)
                                            } else {
                                                setPaymentMethod("CASH")
                                            }
                                        }}
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        sx={{
                                            '& .MuiSelect-select': { py: '8.5px' }
                                        }}
                                    >
                                        <MenuItem value="">Select Account</MenuItem>
                                        {financialAccounts
                                            .filter(account => account.type !== 'CREDIT')
                                            .map((account) => (
                                                <MenuItem key={account.id} value={account.id}>
                                                    {account.accountName} - {account.bankName} ({account.type})
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </CardContent>
                            </Card>

                            <Card className="dark:bg-gray-900 dark:border-gray-700">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg dark:text-gray-200">Preview</CardTitle>
                                        <Button
                                            onClick={handlePrint}
                                            className="gap-2"
                                        >
                                            <Printer className="h-4 w-4" />
                                            Print
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Sale ID Input for fetching existing sales */}
                                    <div className="mb-4 space-y-2">
                                        <div className="flex justify-between items-end">
                                            <TextField
                                                label="Sale ID"
                                                value={saleIdInput}
                                                onChange={(e) => setSaleIdInput(e.target.value)}
                                                placeholder="Enter sale ID to load receipt"
                                                size="small"
                                                sx={{ width: '200px' }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        fetchSaleById()
                                                    }
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={fetchSaleById}
                                                    variant="outlined"
                                                    size="small"
                                                    className="whitespace-nowrap"
                                                >
                                                    Load Sale
                                                </Button>
                                                {fetchedSaleData && (
                                                    <Button
                                                        onClick={() => {
                                                            setFetchedSaleData(null)
                                                            setSaleIdInput("")
                                                        }}
                                                        variant="outlined"
                                                        size="small"
                                                        color="error"
                                                        title="Clear loaded sale"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {fetchedSaleData && (
                                            <div className="text-sm text-green-600 dark:text-green-400">
                                                Loaded sale: {fetchedSaleData.id}
                                            </div>
                                        )}
                                    </div>

                                    <div ref={receiptRef}>
                                        <ReceiptPreview
                                            saleId={fetchedSaleData?.id || createdSaleId || undefined}
                                            customerName={fetchedSaleData?.customer?.name || selectedCustomerDetails?.name || "Walk-in Customer"}
                                            items={fetchedSaleData?.saleItems || items}
                                            totalAmount={fetchedSaleData?.totalAmount || totalAmount}
                                            discount={fetchedSaleData?.discount || discount}
                                            paidAmount={fetchedSaleData?.paidAmount || paidAmount}
                                            returnAmount={fetchedSaleData?.changeAmount || returnAmount}
                                            date={fetchedSaleData?.createdAt ? new Date(fetchedSaleData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                                            companyName={config?.organisationName || "Admin@enterprises"}
                                            companyAddress={config?.registeredBusinessAddress || "Kampala, Uganda"}
                                            companyDescription={config?.organisationDescription || "Dealer in all kinds of goods and services"}
                                            companyPhones={config?.contacts?.map(contact => contact.telephone) || ["+256 700 000 000", "+256 700 000 001"]}
                                        />
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