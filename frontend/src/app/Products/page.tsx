"use client"

import { useState } from "react"
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
} from "@mui/material"
import { Add, Edit, Delete, Search, FilterList, Visibility, Close } from "@mui/icons-material"
import { ProductForm } from "@/components/product-form"
import { ProductDetails } from "@/components/product-details"

// Types based on the provided C# classes
export type Product = {
  id: string
  productName: string
  barCode?: string
  description?: string
  baseCostPrice: number
  baseRetailPrice: number
  baseWholeSalePrice: number
  baseDiscount?: number
  stackSize: number
  basicUnitofMeasure: string
  reorderLevel: number
  isTaxable: boolean
  taxRate?: number
  isActive: boolean
  variations: ProductVariation[]
  generics: ProductGeneric[]
}

export type ProductVariation = {
  id: string
  productId: string
  name: string
  unitSize: number
  retailPrice: number
  wholeSalePrice: number
  discount?: number
  unitofMeasure?: string
  isActive: boolean
  isMain: boolean
}

export type ProductGeneric = {
  id: string
  productId: string
  expiryDate: Date
  manufactureDate: Date
  batchNumber?: string
  supplierId: string
  supplierName?: string
  storage: ProductStorage[]
}

export type ProductStorage = {
  id: string
  productGenericId: string
  quantity: number
  storageId: string
  storageName?: string
  reorderLevel: number
}

export type Supplier = {
  id: string
  name: string
}

export type Store = {
  id: string
  name: string
}

// Mock data
const mockSuppliers: Supplier[] = [
  { id: "1", name: "Supplier A" },
  { id: "2", name: "Supplier B" },
  { id: "3", name: "Supplier C" },
]

const mockStores: Store[] = [
  { id: "1", name: "Main Warehouse" },
  { id: "2", name: "Store Front" },
  { id: "3", name: "Distribution Center" },
]

const mockProducts: Product[] = [
  {
    id: "1",
    productName: "Paracetamol",
    barCode: "123456789",
    description: "Pain reliever and fever reducer",
    baseCostPrice: 5.0,
    baseRetailPrice: 10.0,
    baseWholeSalePrice: 7.5,
    baseDiscount: 0,
    stackSize: 100,
    basicUnitofMeasure: "tablet",
    reorderLevel: 20,
    isTaxable: true,
    taxRate: 5,
    isActive: true,
    variations: [
      {
        id: "1",
        productId: "1",
        name: "500mg",
        unitSize: 1,
        retailPrice: 10.0,
        wholeSalePrice: 7.5,
        discount: 0,
        unitofMeasure: "tablet",
        isActive: true,
        isMain: true,
      },
    ],
    generics: [
      {
        id: "1",
        productId: "1",
        expiryDate: new Date("2025-12-31"),
        manufactureDate: new Date("2023-01-01"),
        batchNumber: "BATCH001",
        supplierId: "1",
        supplierName: "Supplier A",
        storage: [
          {
            id: "1",
            productGenericId: "1",
            quantity: 500,
            storageId: "1",
            storageName: "Main Warehouse",
            reorderLevel: 100,
          },
        ],
      },
    ],
  },
  {
    id: "2",
    productName: "Ibuprofen",
    barCode: "987654321",
    description: "Anti-inflammatory medication",
    baseCostPrice: 6.0,
    baseRetailPrice: 12.0,
    baseWholeSalePrice: 9.0,
    baseDiscount: 0,
    stackSize: 100,
    basicUnitofMeasure: "tablet",
    reorderLevel: 20,
    isTaxable: true,
    taxRate: 5,
    isActive: true,
    variations: [
      {
        id: "2",
        productId: "2",
        name: "200mg",
        unitSize: 1,
        retailPrice: 12.0,
        wholeSalePrice: 9.0,
        discount: 0,
        unitofMeasure: "tablet",
        isActive: true,
        isMain: true,
      },
    ],
    generics: [
      {
        id: "2",
        productId: "2",
        expiryDate: new Date("2025-06-30"),
        manufactureDate: new Date("2023-02-01"),
        batchNumber: "BATCH002",
        supplierId: "2",
        supplierName: "Supplier B",
        storage: [
          {
            id: "2",
            productGenericId: "2",
            quantity: 300,
            storageId: "1",
            storageName: "Main Warehouse",
            reorderLevel: 50,
          },
        ],
      },
    ],
  },
]

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isViewProductOpen, setIsViewProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })

  const filteredProducts = products.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddProduct = (product: Product) => {
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      variations: product.variations.map((v) => ({
        ...v,
        id: crypto.randomUUID(),
        productId: product.id,
      })),
      generics: product.generics.map((g) => ({
        ...g,
        id: crypto.randomUUID(),
        productId: product.id,
        storage: g.storage.map((s) => ({
          ...s,
          id: crypto.randomUUID(),
          productGenericId: g.id,
        })),
      })),
    }
    setProducts([...products, newProduct])
    setIsAddProductOpen(false)
    setSnackbar({ open: true, message: `${product.productName} has been added successfully.` })
  }

  const handleEditProduct = (product: Product) => {
    setProducts(products.map((p) => (p.id === product.id ? product : p)))
    setIsEditProductOpen(false)
    setSnackbar({ open: true, message: `${product.productName} has been updated successfully.` })
  }

  const handleDeleteProduct = (id: string) => {
    const productToDelete = products.find((p) => p.id === id)
    setProducts(products.filter((p) => p.id !== id))
    setSnackbar({ open: true, message: `${productToDelete?.productName} has been deleted.` })
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsViewProductOpen(true)
  }

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product)
    setIsEditProductOpen(true)
  }

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

        {/* Search and Filter Section */}
        <Box sx={{ mb: 3, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Search by product name, barcode, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredProducts.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Products
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {filteredProducts.filter((p) => p.isActive).length}
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
                        ${product.baseRetailPrice.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium" color="info.main">
                        ${product.baseWholeSalePrice.toFixed(2)}
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
                        <IconButton
                          onClick={() => handleDeleteProduct(product.id)}
                          size="small"
                          sx={{
                            "&:hover": { bgcolor: "error.50", color: "error.main" },
                            borderRadius: 1,
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
            <ProductForm onSubmit={handleAddProduct} suppliers={mockSuppliers} stores={mockStores} />
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
                product={selectedProduct}
                onSubmit={handleEditProduct}
                suppliers={mockSuppliers}
                stores={mockStores}
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
                product={selectedProduct}
                onEdit={() => {
                  setIsViewProductOpen(false)
                  setIsEditProductOpen(true)
                }}
              />
            )}
          </Box>
        </Box>
      </Drawer>

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
