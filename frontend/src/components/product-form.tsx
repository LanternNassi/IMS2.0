"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  Stack,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material"
import { Add, Delete, Save, Info, ErrorOutline, SwapHoriz } from "@mui/icons-material"

import { Product, ProductVariation, ProductGeneric, ProductStorage, Supplier, Store } from '../types/productTypes'

import { useProductStore } from "../store/useProductStore"
import { SupplierAutocomplete } from './SupplierAutocomplete'
import { StoreAutocomplete } from './StoreAutocomplete'
import { useStoresStore } from "@/store/useStoresStore"

export function ProductForm({
  productId,
  onSubmit,
}: { productId?: string; onSubmit: (product: Product) => void }) {

  const [tab, setTab] = useState(0)

  const { fetchProductById } = useProductStore((state) => state)
  const { getStoreById } = useStoresStore((state) => state)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Transfer dialog state
  const [transferDialog, setTransferDialog] = useState<{
    open: boolean
    genericIndex: number
    storageIndex: number
    sourceStorage: ProductStorage | null
  }>({
    open: false,
    genericIndex: -1,
    storageIndex: -1,
    sourceStorage: null,
  })
  const [transferQuantity, setTransferQuantity] = useState<number>(0)
  const [destinationStore, setDestinationStore] = useState<Store | null>(null)

  const initialProduct: Product = {
    id: "",
    productName: "",
    barCode: "",
    description: "",
    baseCostPrice: 0,
    baseRetailPrice: 0,
    baseWholeSalePrice: 0,
    baseDiscount: 0,
    stackSize: 1,
    basicUnitofMeasure: "",
    reorderLevel: 0,
    isTaxable: false,
    taxRate: 0,
    isActive: true,
    variations: [],
    generics: [],
    storages: [],
  }

  const [product, setProduct] = useState<Product>(initialProduct)
  const [form, setForm] = useState<Product>(initialProduct)

  useEffect(() => {
    if (!productId) {
      return
    }
    setIsLoading(true)
    fetchProductById(productId).then((response) => {
      setIsLoading(false)

      if (response) {
        setProduct(response)
        setForm(response)
      }
    })
  }, [productId, fetchProductById])

  // Auto-sync main variation with product details for new products
  useEffect(() => {
    if (!productId) {
      setProduct(prev => {
        // Find existing main variation ID to preserve it
        const existingMainId = prev.variations.find(v => v.isMain)?.id

        // Create or update main variation based on product form
        const mainVariation: ProductVariation = {
          id: existingMainId || crypto.randomUUID(),
          name: form.productName || "Main",
          unitSize: form.stackSize,
          costPrice: form.baseCostPrice,
          retailPrice: form.baseRetailPrice,
          wholeSalePrice: form.baseWholeSalePrice,
          discount: form.baseDiscount,
          unitofMeasure: form.basicUnitofMeasure,
          isActive: form.isActive,
          isMain: true,
        }

        const otherVariations = prev.variations.filter(v => !v.isMain)
        return {
          ...prev,
          variations: [mainVariation, ...otherVariations]
        }
      })
    }
  }, [productId, form.productName, form.stackSize, form.baseCostPrice, form.baseRetailPrice, form.baseWholeSalePrice, form.baseDiscount, form.basicUnitofMeasure, form.isActive])

  // Handlers for form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Tabs
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTab(newValue)

  // Variations
  const addVariation = () => {
    const newVariation: any = {
      id: crypto.randomUUID(),
      name: "",
      unitSize: 1,
      costPrice: 0,
      retailPrice: 0,
      wholeSalePrice: 0,
      discount: 0,
      unitofMeasure: form.basicUnitofMeasure,
      isActive: true,
      isMain: false,
    }

    // Only add productId when editing an existing product
    if (productId) {
      newVariation.productId = form.id
    }

    setProduct({
      ...product,
      variations: [
        ...product.variations,
        newVariation,
      ]
    })
  }
  const removeVariation = (index: number) => {
    const newVariations = [...product.variations]
    newVariations.splice(index, 1)
    setProduct({
      ...product,
      variations: newVariations,
    })
  }
  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...product.variations]
    newVariations[index] = { ...newVariations[index], [field]: value }
    setProduct({
      ...product,
      variations: newVariations,
    })
  }

  // Generics
  const addGeneric = () => {
    const newGeneric: ProductGeneric = {
      id: crypto.randomUUID(),
      productId: form.id || "",
      expiryDate: new Date(),
      manufactureDate: new Date(),
      batchNumber: "",
      supplierId: "",
      supplierName: "",
      productStorages: [],
    }
    setProduct({
      ...product!,
      generics: [...product!.generics, newGeneric],
    })
  }
  const removeGeneric = (index: number) => {
    const newGenerics = [...product!.generics]
    newGenerics.splice(index, 1)
    setProduct({
      ...product!,
      generics: newGenerics,
    })
  }
  const updateGeneric = (index: number, field: keyof ProductGeneric, value: any) => {
    const newGenerics = [...product!.generics]
    newGenerics[index] = { ...newGenerics[index], [field]: value }
    setProduct({
      ...product!,
      generics: newGenerics,
    })
  }

  // Storage
  const addStorage = (genericIndex: number) => {
    const newGenerics = [...product!.generics]
    const existingStorages = newGenerics[genericIndex].productStorages || []

    // Calculate total quantity across all existing storages
    const totalQuantity = existingStorages.reduce((sum, storage) => sum + (storage.quantity || 0), 0)

    // Calculate quantity to allocate to new storage (proportional distribution)
    // If there are existing storages, take a portion from each proportionally
    let quantityForNewStorage = 0
    const updatedStorages = existingStorages.map((storage) => {
      if (totalQuantity > 0 && existingStorages.length > 0) {
        // Take a proportional amount from each existing storage
        // For example, if we have 2 storages and add a 3rd, each gives 1/3 of their quantity
        const proportion = 1 / (existingStorages.length + 1)
        const quantityToDeduct = (storage.quantity || 0) * proportion
        quantityForNewStorage += quantityToDeduct

        return {
          ...storage,
          quantity: Math.max(0, (storage.quantity || 0) - quantityToDeduct)
        }
      }
      return storage
    })

    const newStorage: ProductStorage = {
      id: crypto.randomUUID(),
      productGenericId: newGenerics[genericIndex].id,
      productVariationId: product!.variations.find((v) => v.isMain)?.id || "",
      quantity: quantityForNewStorage,
      storageId: "",
      storageName: "",
      reorderLevel: form.reorderLevel,
    }

    newGenerics[genericIndex].productStorages = [...updatedStorages, newStorage]
    setProduct({
      ...product!,
      generics: newGenerics,
    })
  }

  const removeStorage = (genericIndex: number, storageIndex: number) => {
    const newGenerics = [...product!.generics]
    const storages = [...(newGenerics[genericIndex].productStorages || [])]
    const storageToRemove = storages[storageIndex]
    const quantityToRedistribute = storageToRemove?.quantity || 0

    // Remove the storage and create new array
    const remainingStorages = storages
      .filter((_, index) => index !== storageIndex)
      .map(storage => ({ ...storage })) // Create new objects to avoid mutation

    // Redistribute the quantity to remaining storages
    if (remainingStorages.length > 0 && quantityToRedistribute > 0) {
      // Distribute proportionally based on existing quantities
      const totalRemainingQuantity = remainingStorages.reduce((sum, s) => sum + (s.quantity || 0), 0)

      if (totalRemainingQuantity > 0) {
        // Proportional distribution based on existing quantities
        const updatedStorages = remainingStorages.map((storage) => {
          const proportion = (storage.quantity || 0) / totalRemainingQuantity
          return {
            ...storage,
            quantity: (storage.quantity || 0) + (quantityToRedistribute * proportion)
          }
        })
        newGenerics[genericIndex].productStorages = updatedStorages
      } else {
        // If all remaining storages have 0 quantity, distribute equally
        const equalShare = quantityToRedistribute / remainingStorages.length
        const updatedStorages = remainingStorages.map((storage) => ({
          ...storage,
          quantity: (storage.quantity || 0) + equalShare
        }))
        newGenerics[genericIndex].productStorages = updatedStorages
      }
    } else if (remainingStorages.length > 0 && quantityToRedistribute > 0) {
      // If no existing quantity, add all to the first storage
      const updatedStorages = remainingStorages.map((storage, index) => ({
        ...storage,
        quantity: index === 0
          ? (storage.quantity || 0) + quantityToRedistribute
          : (storage.quantity || 0)
      }))
      newGenerics[genericIndex].productStorages = updatedStorages
    } else {
      newGenerics[genericIndex].productStorages = remainingStorages
    }

    setProduct({
      ...product!,
      generics: newGenerics,
    })
  }
  const updateStorage = async (genericIndex: number, storageIndex: number, field: keyof ProductStorage, value: any) => {
    const newGenerics = [...product!.generics]
    newGenerics[genericIndex].productStorages[storageIndex] = {
      ...newGenerics[genericIndex].productStorages[storageIndex],
      [field]: value,
    }
    if (field === "storageId") {
      const store = await getStoreById(value)
      if (store) {
        newGenerics[genericIndex].productStorages[storageIndex].storageName = store.name
      }
    }
    setProduct({
      ...product!,
      generics: newGenerics,
    })
  }

  // Transfer products between storages
  const handleOpenTransferDialog = (genericIndex: number, storageIndex: number) => {
    const sourceStorage = product!.generics[genericIndex].productStorages[storageIndex]
    setTransferDialog({
      open: true,
      genericIndex,
      storageIndex,
      sourceStorage,
    })
    setTransferQuantity(0)
    setDestinationStore(null)
  }

  const handleCloseTransferDialog = () => {
    setTransferDialog({
      open: false,
      genericIndex: -1,
      storageIndex: -1,
      sourceStorage: null,
    })
    setTransferQuantity(0)
    setDestinationStore(null)
  }

  const handleTransferProducts = () => {
    if (!destinationStore || transferQuantity <= 0) {
      return
    }

    const { genericIndex, storageIndex, sourceStorage } = transferDialog
    if (!sourceStorage) return

    // Validate transfer quantity doesn't exceed source quantity
    if (transferQuantity > (sourceStorage.quantity || 0)) {
      alert(`Cannot transfer more than available quantity (${sourceStorage.quantity || 0})`)
      return
    }

    const newGenerics = [...product!.generics]
    const storages = [...newGenerics[genericIndex].productStorages]

    // Deduct from source storage
    const updatedSourceStorage = {
      ...storages[storageIndex],
      quantity: Math.max(0, (storages[storageIndex].quantity || 0) - transferQuantity),
    }
    storages[storageIndex] = updatedSourceStorage

    // Find or create destination storage
    const destinationStorageIndex = storages.findIndex(
      (s) => s.storageId === destinationStore.id && s.id !== sourceStorage.id
    )

    if (destinationStorageIndex >= 0) {
      // Destination storage exists, add to it
      storages[destinationStorageIndex] = {
        ...storages[destinationStorageIndex],
        quantity: (storages[destinationStorageIndex].quantity || 0) + transferQuantity,
      }
    } else {
      // Create new destination storage
      const newStorage: ProductStorage = {
        id: crypto.randomUUID(),
        productGenericId: newGenerics[genericIndex].id,
        productVariationId: sourceStorage.productVariationId || product!.variations.find((v) => v.isMain)?.id || "",
        quantity: transferQuantity,
        storageId: destinationStore.id,
        storageName: destinationStore.name,
        reorderLevel: sourceStorage.reorderLevel || form.reorderLevel,
        store: destinationStore,
      }
      storages.push(newStorage)
    }

    newGenerics[genericIndex].productStorages = storages
    setProduct({
      ...product!,
      generics: newGenerics,
    })

    handleCloseTransferDialog()
  }

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Merge form data with product variations and generics (which contain storages)
    const completeProduct: Product = {
      ...form,
      variations: product.variations,
      generics: product.generics,
    }
    onSubmit(completeProduct)
  }


  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          p: 4
        }}
      >
        <Stack spacing={3} alignItems="center">
          <CircularProgress size={60} thickness={4} />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6" color="text.secondary" fontWeight="medium">
              Loading product details...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch the information
            </Typography>
          </Stack>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      component="form"
      className="bg-primary dark:bg-primary-dark text-black dark:text-white"
      onSubmit={handleSubmit}
      sx={{
        width: "100%",
        p: 3,
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {productId ? "Edit Product" : "Create New Product"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {productId ? "Update product information and settings" : "Fill in the details to create a new product"}
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.95rem",
            },
          }}
        >
          <Tab label="Basic Information" />
          <Tab label={`Variations (${product.variations.length})`} />
          {productId && <Tab label={`Generics (${product.generics.length})`} />}
          {productId && <Tab label="Storage Management" />}
        </Tabs>
      </Box>

      {/* Basic Info Tab */}
      {tab === 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Info color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Product Details
              </Typography>
            </Stack>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Product Name"
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Barcode"
                  name="barCode"
                  value={form.barCode || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={form.description || ""}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pricing Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Base Cost Price"
                  name="baseCostPrice"
                  type="number"
                  value={form.baseCostPrice}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ startAdornment: "Shs." }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Base Retail Price"
                  name="baseRetailPrice"
                  type="number"
                  value={form.baseRetailPrice}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ startAdornment: "Shs." }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Base Wholesale Price"
                  name="baseWholeSalePrice"
                  type="number"
                  value={form.baseWholeSalePrice}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ startAdornment: "Shs." }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Base Discount (%)"
                  name="baseDiscount"
                  type="number"
                  value={form.baseDiscount}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tax Rate (%)"
                  name="taxRate"
                  type="number"
                  value={form.taxRate}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  disabled={!form.isTaxable}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Inventory Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Stack Size"
                  name="stackSize"
                  type="number"
                  value={form.stackSize}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Unit of Measure"
                  name="basicUnitofMeasure"
                  value={form.basicUnitofMeasure}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Reorder Level"
                  name="reorderLevel"
                  type="number"
                  value={form.reorderLevel}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={4}>
                  <FormControlLabel
                    control={<Checkbox checked={form.isTaxable} onChange={handleChange} name="isTaxable" />}
                    label="Taxable Product"
                  />
                  <FormControlLabel
                    control={<Checkbox checked={form.isActive} onChange={handleChange} name="isActive" />}
                    label="Active Product"
                  />
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Variations Tab */}
      {tab === 1 && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Product Variations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create different variations of your product with unique pricing and specifications
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={addVariation} sx={{ borderRadius: 2 }}>
              Add Variation
            </Button>
          </Stack>

          {product.variations.length > 0 && product.variations.some(v => v.isMain) && (
            <Box sx={{ p: 2, mb: 3, bgcolor: 'info.lighter', borderRadius: 1, border: 1, borderColor: 'info.main' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Info color="info" fontSize="small" />
                <Typography variant="body2" color="info.main">
                  The main variation is automatically derived from the product details above. Edit the Basic Information tab to modify it.
                </Typography>
              </Stack>
            </Box>
          )}

          {product.variations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography color="text.secondary" variant="h6" gutterBottom>
                No additional variations
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                The main variation is created automatically from product details. Add more variations for different sizes or packages.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {product.variations.map((variation, index) => (
                <Grid item xs={12} lg={6} key={variation.id}>
                  <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">{variation.name || `Variation ${index + 1}`}</Typography>
                        {variation.isMain && <Chip label="Main" color="primary" size="small" />}
                      </Stack>
                      <IconButton
                        onClick={() => removeVariation(index)}
                        disabled={product.variations.length === 1 || variation.isMain}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          label="Variation Name"
                          value={variation.name}
                          onChange={(e) => updateVariation(index, "name", e.target.value)}
                          fullWidth
                          variant="outlined"
                          disabled={variation.isMain}
                          helperText={variation.isMain ? "Edit from Basic Information tab" : ""}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Unit Size"
                          type="number"
                          value={variation.unitSize}
                          onChange={(e) => updateVariation(index, "unitSize", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          disabled={variation.isMain}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Unit of Measure"
                          value={variation.unitofMeasure || ""}
                          onChange={(e) => updateVariation(index, "unitofMeasure", e.target.value)}
                          fullWidth
                          variant="outlined"
                          disabled={variation.isMain}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Cost Price"
                          type="number"
                          value={variation.costPrice}
                          onChange={(e) => updateVariation(index, "costPrice", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          InputProps={{ startAdornment: "Shs." }}
                          disabled={variation.isMain}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Retail Price"
                          type="number"
                          value={variation.retailPrice}
                          onChange={(e) => updateVariation(index, "retailPrice", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          InputProps={{ startAdornment: "Shs." }}
                          disabled={variation.isMain}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Wholesale Price"
                          type="number"
                          value={variation.wholeSalePrice}
                          onChange={(e) => updateVariation(index, "wholeSalePrice", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          InputProps={{ startAdornment: "Shs." }}
                          disabled={variation.isMain}
                        />
                      </Grid>
                      <Grid item xs={6} md={12}>
                        <TextField
                          label="Discount (%)"
                          type="number"
                          value={variation.discount || 0}
                          onChange={(e) => updateVariation(index, "discount", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          disabled={variation.isMain}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={variation.isActive}
                                onChange={(_, checked) => updateVariation(index, "isActive", checked)}
                                disabled={variation.isMain}
                              />
                            }
                            label="Active"
                          />
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={variation.isMain}
                                onChange={(_, checked) => {
                                  if (checked) {
                                    const newVariations = product.variations.map((v, i) => ({ ...v, isMain: i === index }))
                                    setProduct({
                                      ...product,
                                      variations: newVariations,
                                    })
                                  } else {
                                    updateVariation(index, "isMain", false)
                                  }
                                }}
                              />
                            }
                            label="Main Variation"
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Generics Tab */}
      {tab === 2 && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Product Generics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track batch information, expiry dates, and supplier details
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={addGeneric} sx={{ borderRadius: 2 }}>
              Add Generic
            </Button>
          </Stack>

          {product.generics.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography color="text.secondary" variant="h6" gutterBottom>
                No generics added yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Add generics to track batch information, expiry dates, and supplier details
              </Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={addGeneric}>
                Add First Generic
              </Button>
            </Box>
          ) : (
            <Stack spacing={3}>
              {product.generics.map((generic, index) => (
                <Box key={generic.id} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6">
                        {generic.batchNumber ? `Batch: ${generic.batchNumber}` : `Generic ${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supplier: {generic.supplier?.companyName || "Not specified"}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => removeGeneric(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Stack>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Batch Number"
                        value={generic.batchNumber || ""}
                        onChange={(e) => updateGeneric(index, "batchNumber", e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <SupplierAutocomplete
                        value={generic.supplier || null}
                        onChange={(newValue) => {
                          const newGenerics = [...product!.generics]
                          if (newValue) {
                            newGenerics[index] = {
                              ...newGenerics[index],
                              supplierId: newValue.id,
                              supplier: newValue
                            }
                          } else {
                            newGenerics[index] = {
                              ...newGenerics[index],
                              supplierId: "",
                              supplier: undefined
                            }
                          }
                          setProduct({
                            ...product!,
                            generics: newGenerics,
                          })
                        }}
                        label="Supplier"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Manufacture Date"
                        type="date"
                        value={
                          generic.manufactureDate instanceof Date
                            ? generic.manufactureDate.toISOString().split("T")[0]
                            : new Date(generic.manufactureDate).toISOString().split("T")[0]
                        }
                        onChange={(e) => updateGeneric(index, "manufactureDate", new Date(e.target.value))}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Expiry Date"
                        type="date"
                        value={
                          generic.expiryDate instanceof Date
                            ? generic.expiryDate.toISOString().split("T")[0]
                            : new Date(generic.expiryDate).toISOString().split("T")[0]
                        }
                        onChange={(e) => updateGeneric(index, "expiryDate", new Date(e.target.value))}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Storage Tab */}
      {tab === 3 && (
        <Box sx={{ mb: 3 }}>
          <Box mb={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Storage Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage inventory across different storage locations for each generic batch
            </Typography>
          </Box>

          {product!.generics.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography color="text.secondary" variant="h6" gutterBottom>
                No generics available
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Add generics in the Generics tab first, then manage their storage locations here
              </Typography>
              <Button variant="outlined" onClick={() => setTab(2)}>
                Go to Generics Tab
              </Button>
            </Box>
          ) : (
            <Stack spacing={3}>
              {product.generics.map((generic, genericIndex) => (
                <Box key={generic.id} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Box mb={2}>
                    <Typography variant="h6">
                      {generic.batchNumber ? `Batch: ${generic.batchNumber}` : `Generic ${genericIndex + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supplier: {generic.supplier?.companyName || "Not specified"}
                    </Typography>
                  </Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Storage Locations
                    </Typography>
                    {/* <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => addStorage(genericIndex)}
                      sx={{ borderRadius: 1 }}
                    >
                      Add Storage
                    </Button> */}
                  </Stack>

                  {generic.productStorages.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center", borderRadius: 1 }}>
                      <Typography color="text.secondary" gutterBottom>
                        No storage locations added yet
                      </Typography>
                      <Button variant="text" size="small" onClick={() => addStorage(genericIndex)}>
                        Add Storage Location
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {generic.productStorages.map((storage, storageIndex) => (
                        <Grid item xs={12} key={storage.id}>
                          <Box sx={{ p: 2, borderRadius: 2 }}>
                            <Grid container spacing={2} alignItems="flex-end">

                              <Grid item xs={12} md={2.5}>
                                <StoreAutocomplete
                                  value={storage.store || null}
                                  onChange={(newValue) => {
                                    const newGenerics = [...product!.generics]
                                    if (newValue) {
                                      newGenerics[genericIndex].productStorages[storageIndex] = {
                                        ...newGenerics[genericIndex].productStorages[storageIndex],
                                        storageId: newValue.id,
                                        store: newValue
                                      }
                                    } else {
                                      newGenerics[genericIndex].productStorages[storageIndex] = {
                                        ...newGenerics[genericIndex].productStorages[storageIndex],
                                        storageId: "",
                                        store: undefined
                                      }
                                    }
                                    setProduct({
                                      ...product!,
                                      generics: newGenerics,
                                    })
                                  }}
                                  label="Store"
                                  size="small"
                                />
                              </Grid>

                              <Grid item xs={12} md={2}>
                                <TextField
                                  label="Quantity"
                                  type="number"
                                  size="small"
                                  value={storage.quantity}
                                  onChange={(e) =>
                                    updateStorage(genericIndex, storageIndex, "quantity", Number(e.target.value))
                                  }
                                  fullWidth
                                />
                              </Grid>

                              <Grid item xs={12} md={2}>
                                <TextField
                                  label="Reorder Level"
                                  type="number"
                                  size="small"
                                  value={storage.reorderLevel}
                                  onChange={(e) =>
                                    updateStorage(genericIndex, storageIndex, "reorderLevel", Number(e.target.value))
                                  }
                                  fullWidth
                                />
                              </Grid>

                              <Grid item xs={12} md={2.5}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Variation</InputLabel>
                                  <Select
                                    value={storage.productVariationId || ""}
                                    label="Variation"
                                    onChange={(e) =>
                                      updateStorage(genericIndex, storageIndex, "productVariationId", e.target.value)
                                    }
                                  >
                                    {product.variations.map((variation) => (
                                      <MenuItem key={variation.id} value={variation.id}>
                                        {variation.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12} md={2.5}>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<SwapHoriz />}
                                    onClick={() => handleOpenTransferDialog(genericIndex, storageIndex)}
                                    sx={{ minWidth: 'auto', px: 1.5, flexShrink: 0 }}
                                  >
                                    Transfer
                                  </Button>

                                  <IconButton
                                    onClick={() => removeStorage(genericIndex, storageIndex)}
                                    color="error"
                                    size="small"
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      flexShrink: 0,
                                      '& .MuiSvgIcon-root': {
                                        fontSize: '1.2rem'
                                      }
                                    }}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </Grid>

                            </Grid>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Transfer Products Dialog */}
      <Dialog
        open={transferDialog.open}
        onClose={handleCloseTransferDialog}
        maxWidth="sm"
        fullWidth
        
      >
        <DialogTitle className="dark:bg-gray-900 dark:text-white">
          <Stack direction="row" spacing={1} alignItems="center">
            <SwapHoriz color="primary" />
            <Typography variant="h6">Transfer Products</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent className="dark:bg-gray-900 dark:text-white">
          <Stack spacing={3} sx={{ mt: 1 }}>
            {transferDialog.sourceStorage && (
              <Alert severity="info">
                <Typography variant="body2" fontWeight="medium">
                  Source: {transferDialog.sourceStorage.store?.name || "Unknown Store"}
                </Typography>
                <Typography variant="body2">
                  Available Quantity: {transferDialog.sourceStorage.quantity || 0}
                </Typography>
              </Alert>
            )}

            <TextField
              label="Quantity to Transfer"
              type="number"
              value={transferQuantity}
              onChange={(e) => {
                const value = Number(e.target.value)
                const maxQuantity = transferDialog.sourceStorage?.quantity || 0
                setTransferQuantity(Math.max(0, Math.min(value, maxQuantity)))
              }}
              inputProps={{
                min: 0,
                max: transferDialog.sourceStorage?.quantity || 0,
              }}
              fullWidth
              helperText={`Maximum: ${transferDialog.sourceStorage?.quantity || 0}`}
            />

            <StoreAutocomplete
              value={destinationStore}
              onChange={(newValue) => {
                setDestinationStore(newValue)
                // Prevent selecting the same store as source
                if (newValue && newValue.id === transferDialog.sourceStorage?.storageId) {
                  alert("Cannot transfer to the same store. Please select a different destination.")
                  setDestinationStore(null)
                }
              }}
              label="Destination Store"
              required
            />

            {destinationStore && transferQuantity > 0 && (
              <Alert severity="success">
                <Typography variant="body2">
                  Transferring <strong>{transferQuantity}</strong> units from{" "}
                  <strong>{transferDialog.sourceStorage?.store?.name || "Unknown"}</strong> to{" "}
                  <strong>{destinationStore.name}</strong>
                </Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions className="dark:bg-gray-900 dark:text-white">
          <Button onClick={handleCloseTransferDialog}>Cancel</Button>
          <Button
            onClick={handleTransferProducts}
            variant="contained"
            disabled={!destinationStore || transferQuantity <= 0 || transferQuantity > (transferDialog.sourceStorage?.quantity || 0)}
            startIcon={<SwapHoriz />}
          >
            Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Button */}
      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<Save />}
          size="large"
          sx={{ borderRadius: 2, px: 4 }}
        >
          {productId ? "Update Product" : "Save Product"}
        </Button>
      </Stack>
    </Box>
  )
}
