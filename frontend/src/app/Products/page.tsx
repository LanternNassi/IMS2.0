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
import { Add, Edit, Delete, Search, FilterList, Visibility, Close } from "@mui/icons-material"
import { ProductForm } from "@/components/product-form"
import { ProductDetails } from "@/components/product-details"
import { Product, Supplier, Store } from "../../types/productTypes"
import { useProductStore } from "../../store/useProductStore"



export default function ProductManagement() {
  const { products, fetchProducts, pagination, addProduct, updateProduct } = useProductStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isEditProductOpen, setIsEditProductOpen] = useState(false)
  const [isViewProductOpen, setIsViewProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })

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
