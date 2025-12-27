"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Drawer,
  Snackbar,
  Chip,
  Typography,
  Stack,
  Pagination
} from "@mui/material"
import { Add, Edit, Delete, Search, FilterList, Visibility, Close, Upload } from "@mui/icons-material"
import { ProductForm } from "@/components/product-form"
import { ProductDetails } from "@/components/product-details"
import { Product, ProductVariation, Supplier, Store } from "../../types/productTypes"
import { useProductStore } from "../../store/useProductStore"
import { ExcelImportDialog, ColumnMapping } from "@/components/ExcelImportDialog"
import { useStoresStore } from "../../store/useStoresStore"
import { useSupplierStore } from "../../store/useSupplierStore"
import { useCategoriesStore } from "../../store/useCategoryStore"
import { useAuthStore } from "../../store/useAuthStore"
import api from "../../Utils/Request"



export default function ProductManagement() {
  const { products, fetchProducts, pagination, addProduct, updateProduct } = useProductStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isViewProductOpen, setIsViewProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleProductSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    if (event.target.value === "") {
      fetchProducts()
      return
    }
    if (event.target.value.length < 3) {
      return
    }
    fetchProducts(1, event.target.value)
  }

  const handleAddProduct = (product: Product) => {
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      variations: product.variations.map((v) => ({
        ...v,
        id: crypto.randomUUID(),
      })),
      generics: product.generics.map((g) => ({
        ...g,
        id: crypto.randomUUID(),
        productStorages: g.productStorages.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          productGenericId: g.id,
        })),
      })),
    }
    // setProducts([...products, newProduct])
    addProduct(newProduct, () => {
      setIsAddProductOpen(false)
      setSnackbar({ open: true, message: `${product.productName} has been added successfully.` })
    }, (error) => {
      setSnackbar({ open: true, message: `Failed to add ${product.productName}: ${error.message}` })
    })
  }

    const handleEditProduct = (product: Product) => {
      // setProducts(products.map((p) => (p.id === product.id ? product : p)))
      updateProduct(product, () => {
        setIsEditProductOpen(false)
        setSnackbar({ open: true, message: `${product.productName} has been updated successfully.` })
      }, (error) => {
        setSnackbar({ open: true, message: `Failed to update ${product.productName}: ${error.message}` })
      })
    }

    const handleDeleteProduct = (id: string) => {
      const productToDelete = products.find((p) => p.id === id)
      // setProducts(products.filter((p) => p.id !== id))
      setSnackbar({ open: true, message: `${productToDelete?.productName} has been deleted.` })
    }

    const handleViewProduct = (product: Product) => {
      setSelectedProduct(product)
      setIsViewProductOpen(true)
    }

    const handleEditClick = (product: Product) => {
      const currentUser = useAuthStore.getState().user
      if (currentUser?.role !== "admin") {
        setSnackbar({ open: true, message: "You are not authorized to edit this product." })
        return
      }
      setSelectedProduct(product)
      setIsEditProductOpen(true)
    }

    // Column mappings for product import
    const productColumnMappings: ColumnMapping[] = [
      {
        field: "productName",
        possibleNames: ["product name", "productname"],
        required: true,
      },
      {
        field: "category",
        possibleNames: ["category", "Category"],
      },
      {
        field: "description",
        possibleNames: ["description", "Description"],
        transform: (value: string) => value.toString().trim(),
      },
      {
        field: "costPrice",
        possibleNames: ["rate(supplier's price)", "rate", "supplier's price", "supplier price", "cost price", "costprice"],
        transform: (value) => parseFloat(value) || 0,
      },
      {
        field: "wholesalePrice",
        possibleNames: ["wholesale price", "wholesaleprice", "Wholesale Price"],
        transform: (value) => parseFloat(value) || 0,
      },
      {
        field: "sellingPrice",
        possibleNames: ["selling price", "retail price", "retailprice", "sellingprice"],
        transform: (value) => parseFloat(value) || 0,
      },
      {
        field: "quantity",
        possibleNames: ["quantity", "qty"],
        transform: (value) => parseFloat(value) || 0,
      },
      {
        field: "addedBy",
        possibleNames: ["added by", "addedby"],
      },
    ]

    // Helper function to extract base product name and variation details
    const parseProductName = (productName: string) => {
      // Try to match patterns like "Product Name (size)" or "Product Name (unit)"
      const match = productName.match(/^(.+?)\s*\(([^)]+)\)$/)
      if (match) {
        const baseName = match[1].trim()
        const variationSuffix = match[2].trim()
        
        // Parse unit size from common patterns
        let unitSize = 1
        let unitOfMeasure = ""
        
        // Handle fractions like (1/4), (1/2), (3/4) with optional unit like (1/4Ltr)
        const fractionWithUnitMatch = variationSuffix.match(/^(\d+)\/(\d+)([a-zA-Z]+)?$/i)
        if (fractionWithUnitMatch) {
          const numerator = parseFloat(fractionWithUnitMatch[1])
          const denominator = parseFloat(fractionWithUnitMatch[2])
          unitSize = numerator / denominator
          unitOfMeasure = fractionWithUnitMatch[3]?.toLowerCase() || "unit"
        }
        // Handle fractions like (1/4), (1/2), (3/4)
        else {
          const fractionMatch = variationSuffix.match(/^(\d+)\/(\d+)$/)
          if (fractionMatch) {
            const numerator = parseFloat(fractionMatch[1])
            const denominator = parseFloat(fractionMatch[2])
            unitSize = numerator / denominator
            unitOfMeasure = "unit"
          }
          // Handle liter/volume units
          else if (variationSuffix.toLowerCase().match(/^(ltr|liter|litre|ml|kg|g)$/i)) {
            unitSize = 1
            unitOfMeasure = variationSuffix.toLowerCase()
          }
          // Handle numeric values
          else if (!isNaN(parseFloat(variationSuffix))) {
            unitSize = parseFloat(variationSuffix)
            unitOfMeasure = "unit"
          }
          else {
            // Default: use the suffix as unit of measure
            unitSize = 1
            unitOfMeasure = variationSuffix
          }
        }
        
        return {
          baseName,
          variationName: productName, // Full name as variation name (e.g., "Green Miracle (1/4 Ltr)")
          unitSize,
          unitOfMeasure: unitOfMeasure || "unit"
        }
      }
      
      // No variation pattern found - treat as single product
      return {
        baseName: productName,
        variationName: productName,
        unitSize: 1,
        unitOfMeasure: "unit"
      }
    }

    // Group Excel rows by base product name
    const groupProductsByBaseName = (data: any[]) => {
      const grouped = new Map<string, any[]>()
      
      data.forEach((row) => {
        const { baseName } = parseProductName(row.productName)
        if (!grouped.has(baseName)) {
          grouped.set(baseName, [])
        }
        grouped.get(baseName)!.push(row)
      })
      
      return grouped
    }

    const handleImportProducts = async (data: any[]) => {
      if (!data || data.length === 0) {
        setSnackbar({ open: true, message: "No data to import" })
        return
      }

      setIsImportDialogOpen(false)
      setSnackbar({ open: true, message: `Processing ${data.length} product(s)...` })

      try {
        const { fetchStores, createStore } = useStoresStore.getState()
        const { fetchSuppliers, createSupplier } = useSupplierStore.getState()
        const { fetchCategories, createCategory } = useCategoriesStore.getState()

        // Get or create default store
        let stores = await fetchStores(null)
        let defaultStoreId = stores && stores.length > 0 ? stores[0].id : null
        
        if (!defaultStoreId) {
          // Create default store
          await new Promise<void>((resolve, reject) => {
            createStore(
              {
                name: "Default Store",
                address: "Default Address",
                description: "Default store created during import"
              },
              async () => {
                stores = await fetchStores(null)
                defaultStoreId = stores && stores.length > 0 ? stores[0].id : null
                resolve()
              },
              () => reject(new Error("Failed to create default store"))
            )
          })
        }

        // Get or create default supplier
        let suppliers = await fetchSuppliers(null, 1)
        let defaultSupplierId = suppliers && suppliers.length > 0 ? suppliers[0].id : null
        
        if (!defaultSupplierId) {
          // Create default supplier
          await new Promise<void>((resolve, reject) => {
            createSupplier(
              {
                companyName: "Default Supplier",
                contactPerson: "N/A",
                emailAddress: "default@supplier.com",
                phoneNumber: "0000000000",
                address: "Default Address",
                tin: "",
                status: "Active",
                moreInfo: "Default supplier created during import",
                supplierTags: []
              },
              async () => {
                suppliers = await fetchSuppliers(null, 1)
                defaultSupplierId = suppliers && suppliers.length > 0 ? suppliers[0].id : null
                resolve()
              },
              () => reject(new Error("Failed to create default supplier"))
            )
          })
        }

        // Create categories for unique categories in the data
        const uniqueCategories = [...new Set(data.map(row => row.category).filter(Boolean))]
        const categoryMap = new Map<string, string>() // category name -> category id
        
        await fetchCategories(null)
        const existingCategories = useCategoriesStore.getState().categories || []
        
        for (const categoryName of uniqueCategories) {
          const existing = existingCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
          if (existing) {
            categoryMap.set(categoryName, existing.id)
          } else {
            // Create new category via API directly (since store expects categoryDto without id)
            try {
              const response = await api.post('/Categories', {
                id: crypto.randomUUID(),
                name: categoryName,
                description: `Category created during import: ${categoryName}`
              })
              if (response.data && response.data.id) {
                categoryMap.set(categoryName, response.data.id)
              } else {
                // Fallback: fetch categories again to get the new one
                await fetchCategories(null)
                const updatedCategories = useCategoriesStore.getState().categories || []
                const newCategory = updatedCategories.find(c => c.name === categoryName)
                if (newCategory) {
                  categoryMap.set(categoryName, newCategory.id)
                }
              }
            } catch (error: any) {
              console.error(`Failed to create category "${categoryName}":`, error)
              // Continue without failing the entire import
            }
          }
        }

        // Group products by base name
        const groupedProducts = groupProductsByBaseName(data)
        const productsToCreate: Array<{ product: Product; variations: Array<{ row: any; variation: ProductVariation }> }> = []
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []
        
        for (const [baseName, variations] of groupedProducts.entries()) {
          try {
            // Use the first variation's data for base product properties
            const firstVariation = variations[0]
            
            // Parse all variations
            const productVariations: Array<{ row: any; variation: ProductVariation }> = variations.map((row, index) => {
              const parsed = parseProductName(row.productName)
              return {
                row,
                variation: {
                  id: crypto.randomUUID(),
                  name: parsed.variationName, // Full name like "Green Miracle (1/4 Ltr)"
                  unitSize: parsed.unitSize,
                  retailPrice: row.sellingPrice || 0,
                  wholeSalePrice: row.wholesalePrice || 0,
                  costPrice: row.costPrice || 0,
                  discount: 0,
                  unitofMeasure: parsed.unitOfMeasure,
                  isActive: true,
                  isMain: index === 0, // First variation is main
                }
              }
            })

            // Calculate base prices from variations (use main variation)
            const mainVariation = productVariations[0].variation
            
            // Create product
            const product: Product = {
              id: crypto.randomUUID(),
              productName: baseName, // Base name like "Green Miracle"
              barCode: undefined,
              description: firstVariation.description || "",
              baseCostPrice: mainVariation.costPrice,
              baseRetailPrice: mainVariation.retailPrice,
              baseWholeSalePrice: mainVariation.wholeSalePrice,
              baseDiscount: 0,
              stackSize: mainVariation.unitSize,
              basicUnitofMeasure: mainVariation.unitofMeasure || "unit",
              reorderLevel: 10, // Default reorder level
              isTaxable: false,
              taxRate: undefined,
              isActive: true,
              variations: productVariations.map(pv => pv.variation),
              generics: [],
              storages: []
            }

            productsToCreate.push({ product, variations: productVariations })
          } catch (error: any) {
            errorCount++
            errors.push(`Failed to process "${baseName}": ${error.message}`)
          }
        }

        // Calculate total amount from all imported products (costPrice * quantity)
        let totalImportAmount = 0
        for (const { variations } of productsToCreate) {
          for (const { row } of variations) {
            const costPrice = parseFloat(row.costPrice) || 0
            const quantity = parseFloat(row.quantity) || 0
            totalImportAmount += costPrice * quantity
          }
        }

        // Get or create default BANK FinancialAccount
        let bankAccountId: string | null = null
        try {
          const financialAccountsResponse = await api.get('/FinancialAccounts')
          const financialAccounts = financialAccountsResponse.data?.financialAccounts || financialAccountsResponse.data || []
          
          // Find existing BANK account (enum can be string "BANK" or number 0)
          const bankAccount = financialAccounts.find((acc: any) => 
            (acc.type === 'BANK' || acc.type === 0) && acc.isActive
          )
          
          if (bankAccount) {
            bankAccountId = bankAccount.id
          } else {
            // Create default BANK account (type: 0 = BANK enum value)
            const newBankAccountResponse = await api.post('/FinancialAccounts', {
              id: crypto.randomUUID(),
              accountName: 'Default Bank Account',
              type: 0, // BANK enum value
              accountNumber: null,
              balance: 0,
              bankName: 'Default Bank',
              description: 'Default bank account created during product import',
              isActive: true,
              isDefault: true
            })
            bankAccountId = newBankAccountResponse.data.id
          }
        } catch (error: any) {
          console.error('Failed to get or create bank account:', error)
          errors.push(`Failed to get or create bank account: ${error.message}`)
        }

        // Get current user for CapitalAccount and Purchase
        const currentUser = useAuthStore.getState().user
        if (!currentUser || !currentUser.id) {
          throw new Error('User not authenticated. Please log in to import products.')
        }

        // Create CapitalAccount if total amount > 0
        if (totalImportAmount > 0 && bankAccountId) {
          try {
            await api.post('/CapitalAccounts', {
              id: crypto.randomUUID(),
              ownerId: currentUser.id,
              type: 0, // INITIAL_CAPITAL enum value
              amount: totalImportAmount,
              transactionDate: new Date().toISOString(),
              description: `Initial capital from product import - ${productsToCreate.length} product(s)`,
              referenceNumber: `IMPORT-${Date.now()}`,
              linkedFinancialAccountId: bankAccountId
            })
          } catch (error: any) {
            console.error('Failed to create capital account:', error)
            errors.push(`Failed to create capital account: ${error.message}`)
          }
        }

        // Create Purchase record (without items) to balance the books
        if (totalImportAmount > 0 && bankAccountId && defaultSupplierId) {
          try {
            await api.post('/Purchases', {
              id: crypto.randomUUID(),
              purchaseNumber: `IMPORT-${Date.now()}`,
              purchaseDate: new Date().toISOString(),
              supplierId: defaultSupplierId,
              processedBy: currentUser.id,
              totalAmount: totalImportAmount,
              paidAmount: totalImportAmount,
              tax: 0,
              grandTotal: totalImportAmount,
              notes: `Purchase record for product import - ${productsToCreate.length} product(s). Products imported via Excel.`,
              isPaid: true,
              linkedFinancialAccountId: bankAccountId,
              items: [] // No items, just the amount
            })
          } catch (error: any) {
            console.error('Failed to create purchase record:', error)
            errors.push(`Failed to create purchase record: ${error.message}`)
          }
        }

        // Create products and their stock
        for (const { product, variations } of productsToCreate) {
          try {
            // Create the product first
            await new Promise<void>((resolve, reject) => {
              addProduct(
                product,
                () => resolve(),
                (error) => reject(error)
              )
            })

            // Fetch the created product to get the actual variation IDs from the backend
            const createdProduct = await useProductStore.getState().fetchProductById(product.id)
            
            // Create ProductGeneric and ProductStorage for variations with quantity > 0
            for (const { row, variation } of variations) {
              const quantity = parseFloat(row.quantity) || 0
              
              if (quantity > 0) {
                try {
                  // Find the created variation by matching the name
                  const createdVariation = createdProduct.variations?.find(
                    v => v.name === variation.name
                  )

                  if (createdVariation && defaultStoreId && defaultSupplierId) {
                    // Create ProductGeneric
                    const genericResponse = await api.post('/ProductGenerics', {
                      id: crypto.randomUUID(),
                      productId: product.id,
                      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
                      manufactureDate: new Date().toISOString(),
                      batchNumber: `IMPORT-${Date.now()}`,
                      supplierId: defaultSupplierId
                    })

                    const genericId = genericResponse.data.id

                    // Create ProductStorage
                    await api.post('/ProductStorages', {
                      id: crypto.randomUUID(),
                      productGenericId: genericId,
                      productVariationId: createdVariation.id,
                      quantity: quantity,
                      storageId: defaultStoreId,
                      reorderLevel: 10
                    })
                  }
                } catch (error: any) {
                  console.error(`Failed to create stock for variation "${variation.name}":`, error)
                  errors.push(`Failed to create stock for "${variation.name}": ${error.message}`)
                }
              }
            }

            successCount++
          } catch (error: any) {
            errorCount++
            errors.push(`Failed to create "${product.productName}": ${error.message}`)
          }
        }

        // Refresh product list
        await fetchProducts()

        // Show results
        let message = `Successfully imported ${successCount} product(s) with ${data.length} variation(s).`
        if (errorCount > 0) {
          message += ` ${errorCount} error(s) occurred.`
          console.error("Import errors:", errors)
        }
        
        setSnackbar({ 
          open: true, 
          message 
        })
      } catch (error: any) {
        console.error("Import error:", error)
        setSnackbar({ 
          open: true, 
          message: `Failed to import products: ${error.message}` 
        })
      }
    }

    const renderProductPreviewRow = (row: any, index: number) => (
      <TableRow key={index}>
        <TableCell>{row.productName || ""}</TableCell>
        <TableCell>{row.category || ""}</TableCell>
        <TableCell>{row.description || ""}</TableCell>
        <TableCell align="right">
          Shs {row.costPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </TableCell>
        <TableCell align="right">
          Shs {row.wholesalePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </TableCell>
        <TableCell align="right">
          Shs {row.sellingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </TableCell>
        <TableCell align="right">{row.quantity || 0}</TableCell>
        <TableCell>{row.addedBy || ""}</TableCell>
      </TableRow>
    )

    return (
      <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Product Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your product inventory, variations, and storage locations
              </Typography>
            </Box>
            {useAuthStore.getState().user?.role == "admin" && (
              <>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Upload />}
                onClick={() => setIsImportDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Import Excel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => setIsAddProductOpen(true)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Add Product
              </Button>
            </Stack>
            </>
            )}
          </Stack>

          {/* Search and Filter Section */}
          <Box sx={{ mb: 3, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                variant="outlined"
                placeholder="Search by product name, barcode, or description..."
                value={searchTerm}
                onChange={handleProductSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                fullWidth
                size="medium"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Filters
              </Button>
            </Stack>
          </Box>

          {/* Products Summary */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {pagination?.totalCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Products
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {pagination?.totalCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Products
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="warning.main">
                  {filteredProducts.filter((p) => !p.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inactive Products
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Products Table */}
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Product Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Retail Price</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Wholesale Price</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Unit</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.95rem" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No products found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first product"}
                        </Typography>
                        {!searchTerm && (
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setIsAddProductOpen(true)}
                            sx={{ borderRadius: 2 }}
                          >
                            Add Product
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product, index) => (
                    <TableRow
                      key={product.id}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        borderBottom: index === filteredProducts.length - 1 ? "none" : 1,
                        borderColor: "divider",
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {product.productName}
                          </Typography>
                          {product.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {product.description.length > 50
                                ? `${product.description.substring(0, 50)}...`
                                : product.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {product.barCode || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium" color="success.main">
                          Shs {product.baseRetailPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium" color="info.main">
                          Shs {product.baseWholeSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{product.basicUnitofMeasure}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.isActive ? "Active" : "Inactive"}
                          color={product.isActive ? "success" : "default"}
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <IconButton
                            onClick={() => handleViewProduct(product)}
                            size="small"
                            sx={{
                              "&:hover": { bgcolor: "primary.50", color: "primary.main" },
                              borderRadius: 1,
                            }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleEditClick(product)}
                            size="small"
                            sx={{
                              "&:hover": { bgcolor: "warning.50", color: "warning.main" },
                              borderRadius: 1,
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {/* <IconButton
                            onClick={() => handleDeleteProduct(product.id)}
                            size="small"
                            sx={{
                              "&:hover": { bgcolor: "error.50", color: "error.main" },
                              borderRadius: 1,
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton> */}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            count={pagination?.pages || 1}
            hideNextButton={pagination ? !pagination.next : true}
            hidePrevButton={pagination ? !pagination.previous : true}
            onChange={async (event, page) => {
              await fetchProducts(page)
            }}
            
            color="primary"
            sx={{ p: 2, display: 'flex', justifyContent: 'center' }}
          />
        </Box>

        {/* Add Product Drawer */}
        <Drawer anchor="right" open={isAddProductOpen} onClose={() => setIsAddProductOpen(false)}>
          <Box
            className="bg-primary dark:bg-primary-dark text-black dark:text-white"
            sx={{
              width: { xs: "100vw", sm: 700, md: 800 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Add New Product
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a new product with all necessary details
                  </Typography>
                </Box>
                <IconButton onClick={() => setIsAddProductOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, overflow: "auto" }}>
              <ProductForm onSubmit={handleAddProduct} />
            </Box>
          </Box>
        </Drawer>

        {/* Edit Product Drawer */}
        <Drawer anchor="right" open={isEditProductOpen} onClose={() => setIsEditProductOpen(false)}>
          <Box
            className="bg-primary dark:bg-primary-dark text-black dark:text-white"
            sx={{
              width: { xs: "100vw", sm: 700, md: 800 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Edit Product
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update product information and settings
                  </Typography>
                </Box>
                <IconButton onClick={() => setIsEditProductOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, overflow: "auto" }}>
              {selectedProduct && (
                <ProductForm
                  productId={selectedProduct.id}
                  onSubmit={handleEditProduct}
                />
              )}
            </Box>
          </Box>
        </Drawer>

        {/* View Product Drawer */}
        <Drawer anchor="right" open={isViewProductOpen} onClose={() => setIsViewProductOpen(false)}>
          <Box
            className="bg-primary dark:bg-primary-dark text-black dark:text-white"
            sx={{
              width: { xs: "100vw", sm: 700, md: 800 },
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Product Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View comprehensive product information
                  </Typography>
                </Box>
                <IconButton onClick={() => setIsViewProductOpen(false)}>
                  <Close />
                </IconButton>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, overflow: "auto" }}>
              {selectedProduct && (
                <ProductDetails
                  productId={selectedProduct.id}
                  onEdit={() => {
                    setIsViewProductOpen(false)
                    setIsEditProductOpen(true)
                  }}
                />
              )}
            </Box>
          </Box>
        </Drawer>

        {/* Excel Import Dialog */}
        <ExcelImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          title="Import Products from Excel"
          description="Select an Excel file with the following columns: Product Name, Category, Description, Rate(Supplier's Price), Wholesale Price, Selling Price, Quantity, Added By"
          columnMappings={productColumnMappings}
          onImport={handleImportProducts}
          renderPreviewRow={renderProductPreviewRow}
          importButtonText="Import Products"
        />

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
      </Box>
    )
  }
