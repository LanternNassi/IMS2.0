"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Button,
  Checkbox,
  Divider,
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
  Chip,
} from "@mui/material"
import { Add, Delete, Save, Info } from "@mui/icons-material"
import type { Product, ProductVariation, ProductGeneric, ProductStorage, Supplier, Store } from "@/app/Products/page"

export function ProductForm({
  product,
  onSubmit,
  suppliers,
  stores,
}: { product?: Product; onSubmit: (product: Product) => void; suppliers: Supplier[]; stores: Store[] }) {
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState<Product>(
    product || {
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
    },
  )
  const [variations, setVariations] = useState<ProductVariation[]>(product?.variations || [])
  const [generics, setGenerics] = useState<ProductGeneric[]>(product?.generics || [])

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
    setVariations([
      ...variations,
      {
        id: crypto.randomUUID(),
        productId: form.id || "",
        name: "",
        unitSize: 1,
        retailPrice: 0,
        wholeSalePrice: 0,
        discount: 0,
        unitofMeasure: form.basicUnitofMeasure,
        isActive: true,
        isMain: variations.length === 0,
      },
    ])
  }
  const removeVariation = (index: number) => {
    const newVariations = [...variations]
    newVariations.splice(index, 1)
    setVariations(newVariations)
  }
  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...variations]
    newVariations[index] = { ...newVariations[index], [field]: value }
    setVariations(newVariations)
  }

  // Generics
  const addGeneric = () => {
    const newGeneric: ProductGeneric = {
      id: crypto.randomUUID(),
      productId: form.id || "",
      expiryDate: new Date(),
      manufactureDate: new Date(),
      batchNumber: "",
      supplierId: suppliers[0]?.id || "",
      supplierName: suppliers[0]?.name || "",
      storage: [],
    }
    setGenerics([...generics, newGeneric])
  }
  const removeGeneric = (index: number) => {
    const newGenerics = [...generics]
    newGenerics.splice(index, 1)
    setGenerics(newGenerics)
  }
  const updateGeneric = (index: number, field: keyof ProductGeneric, value: any) => {
    const newGenerics = [...generics]
    newGenerics[index] = { ...newGenerics[index], [field]: value }
    setGenerics(newGenerics)
  }

  // Storage
  const addStorage = (genericIndex: number) => {
    const newGenerics = [...generics]
    const newStorage: ProductStorage = {
      id: crypto.randomUUID(),
      productGenericId: newGenerics[genericIndex].id,
      variationId: variations.find((v) => v.isMain)?.id || "",
      quantity: 0,
      storageId: stores[0]?.id || "",
      storageName: stores[0]?.name || "",
      reorderLevel: form.reorderLevel,
    }
    newGenerics[genericIndex].storage = [...(newGenerics[genericIndex].storage || []), newStorage]
    setGenerics(newGenerics)
  }
  const removeStorage = (genericIndex: number, storageIndex: number) => {
    const newGenerics = [...generics]
    newGenerics[genericIndex].storage.splice(storageIndex, 1)
    setGenerics(newGenerics)
  }
  const updateStorage = (genericIndex: number, storageIndex: number, field: keyof ProductStorage, value: any) => {
    const newGenerics = [...generics]
    newGenerics[genericIndex].storage[storageIndex] = {
      ...newGenerics[genericIndex].storage[storageIndex],
      [field]: value,
    }
    if (field === "storageId") {
      const store = stores.find((s) => s.id === value)
      if (store) {
        newGenerics[genericIndex].storage[storageIndex].storageName = store.name
      }
    }
    setGenerics(newGenerics)
  }

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...form, variations, generics })
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
          {product ? "Edit Product" : "Create New Product"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {product ? "Update product information and settings" : "Fill in the details to create a new product"}
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
          <Tab label={`Variations (${variations.length})`} />
          <Tab label={`Generics (${generics.length})`} />
          <Tab label="Storage Management" />
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
              <Grid item xs={12} md={4}>
                <TextField
                  label="Base Cost Price"
                  name="baseCostPrice"
                  type="number"
                  value={form.baseCostPrice}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ startAdornment: "$" }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Base Retail Price"
                  name="baseRetailPrice"
                  type="number"
                  value={form.baseRetailPrice}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ startAdornment: "$" }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Base Wholesale Price"
                  name="baseWholeSalePrice"
                  type="number"
                  value={form.baseWholeSalePrice}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  InputProps={{ startAdornment: "$" }}
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

          {variations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography color="text.secondary" variant="h6" gutterBottom>
                No variations created yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Add variations to offer different sizes, packages, or configurations of your product
              </Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={addVariation}>
                Create First Variation
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {variations.map((variation, index) => (
                <Grid item xs={12} lg={6} key={variation.id}>
                  <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">{variation.name || `Variation ${index + 1}`}</Typography>
                        {variation.isMain && <Chip label="Main" color="primary" size="small" />}
                      </Stack>
                      <IconButton
                        onClick={() => removeVariation(index)}
                        disabled={variations.length === 1}
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
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Unit of Measure"
                          value={variation.unitofMeasure || ""}
                          onChange={(e) => updateVariation(index, "unitofMeasure", e.target.value)}
                          fullWidth
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Retail Price"
                          type="number"
                          value={variation.retailPrice}
                          onChange={(e) => updateVariation(index, "retailPrice", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          InputProps={{ startAdornment: "$" }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Wholesale Price"
                          type="number"
                          value={variation.wholeSalePrice}
                          onChange={(e) => updateVariation(index, "wholeSalePrice", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                          InputProps={{ startAdornment: "$" }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Discount (%)"
                          type="number"
                          value={variation.discount || 0}
                          onChange={(e) => updateVariation(index, "discount", Number(e.target.value))}
                          fullWidth
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={variation.isActive}
                                onChange={(_, checked) => updateVariation(index, "isActive", checked)}
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
                                    const newVariations = variations.map((v, i) => ({ ...v, isMain: i === index }))
                                    setVariations(newVariations)
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

          {generics.length === 0 ? (
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
              {generics.map((generic, index) => (
                <Box key={generic.id} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h6">
                        {generic.batchNumber ? `Batch: ${generic.batchNumber}` : `Generic ${index + 1}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Supplier: {generic.supplierName || "Not specified"}
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
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Supplier</InputLabel>
                        <Select
                          value={generic.supplierId}
                          label="Supplier"
                          onChange={(e) => {
                            updateGeneric(index, "supplierId", e.target.value)
                            const supplier = suppliers.find((s) => s.id === e.target.value)
                            if (supplier) {
                              updateGeneric(index, "supplierName", supplier.name)
                            }
                          }}
                        >
                          {suppliers.map((supplier) => (
                            <MenuItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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

          {generics.length === 0 ? (
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
              {generics.map((generic, genericIndex) => (
                <Box key={generic.id} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Box mb={2}>
                    <Typography variant="h6">
                      {generic.batchNumber ? `Batch: ${generic.batchNumber}` : `Generic ${genericIndex + 1}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Supplier: {generic.supplierName || "Not specified"}
                    </Typography>
                  </Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Storage Locations
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => addStorage(genericIndex)}
                      sx={{ borderRadius: 1 }}
                    >
                      Add Storage
                    </Button>
                  </Stack>

                  {generic.storage.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center", bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography color="text.secondary" gutterBottom>
                        No storage locations added yet
                      </Typography>
                      <Button variant="text" size="small" onClick={() => addStorage(genericIndex)}>
                        Add Storage Location
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {generic.storage.map((storage, storageIndex) => (
                        <Grid item xs={12} key={storage.id}>
                          <Box sx={{ p: 2, borderRadius: 1 }}>
                            <Grid container spacing={2} alignItems="center">


                              <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Store</InputLabel>
                                  <Select
                                    value={storage.storageId}
                                    label="Store"
                                    onChange={(e) =>
                                      updateStorage(genericIndex, storageIndex, "storageId", e.target.value)
                                    }
                                  >
                                    {stores.map((store) => (
                                      <MenuItem key={store.id} value={store.id}>
                                        {store.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12} md={3}>
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

                              <Grid item xs={12} md={3}>
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
                                    value={storage.variationId || ""}
                                    label="Variation"
                                    onChange={(e) =>
                                      updateStorage(genericIndex, storageIndex, "variationId", e.target.value)
                                    }
                                  >
                                    {variations.map((variation) => (
                                      <MenuItem key={variation.id} value={variation.id}>
                                        {variation.name}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12} md={0.5}>
                                <Stack direction="row" justifyContent="center" alignItems="center" height="100%">
                                  <IconButton
                                    onClick={() => removeStorage(genericIndex, storageIndex)}
                                    color="error"
                                    size="small"
                                  >
                                    <Delete />
                                  </IconButton>
                                </Stack>
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
          {product ? "Update Product" : "Save Product"}
        </Button>
      </Stack>
    </Box>
  )
}
