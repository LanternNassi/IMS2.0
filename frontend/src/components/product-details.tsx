"use client"

import React from "react"
import { Box, Button, Chip, Grid, Tab, Tabs, Typography, Stack, Divider } from "@mui/material"
import { Edit as EditIcon, Info, Inventory, LocalShipping, Store } from "@mui/icons-material"
import { format } from "date-fns"
import type { Product } from "@/app/Products/page"

type ProductDetailsProps = {
  product: Product
  onEdit: () => void
}

export function ProductDetails({ product, onEdit }: ProductDetailsProps) {
  const [tab, setTab] = React.useState(0)

  return (
    <Box
      className="bg-primary dark:bg-primary-dark text-black dark:text-white"
      sx={{
        width: "100%",
        p: 3,
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {product.productName}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography color="text.secondary" variant="body1">
              {product.barCode || "No barcode"}
            </Typography>
            <Chip
              label={product.isActive ? "Active" : "Inactive"}
              color={product.isActive ? "success" : "default"}
              size="small"
            />
          </Stack>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit} sx={{ borderRadius: 2 }}>
          Edit Product
        </Button>
      </Stack>

      {/* Tabs */}
      <Box sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              fontWeight: 500,
              textTransform: "none",
              fontSize: "0.95rem",
            },
          }}
        >
          <Tab label="Basic Information" icon={<Info />} iconPosition="start" />
          <Tab label={`Variations (${product.variations.length})`} icon={<Inventory />} iconPosition="start" />
          <Tab label={`Generics (${product.generics.length})`} icon={<LocalShipping />} iconPosition="start" />
          <Tab label="Storage" icon={<Store />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Basic Info Tab */}
      {tab === 0 && (
        <Box>
          {/* Description */}
          {product.description && (
            <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {product.description}
              </Typography>
            </Box>
          )}

          {/* Pricing Information */}
          <Box sx={{ mb: 4, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Pricing Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Base Cost Price
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${product.baseCostPrice.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Base Retail Price
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ${product.baseRetailPrice.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Base Wholesale Price
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    ${product.baseWholeSalePrice.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Base Discount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {product.baseDiscount ? `${product.baseDiscount.toFixed(2)}%` : "No discount"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tax Information
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {product.isTaxable
                      ? `Taxable (${product.taxRate ? `${product.taxRate}%` : "No rate specified"})`
                      : "Non-taxable"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Inventory Settings */}
          <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Inventory Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Stack Size
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {product.stackSize}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Basic Unit of Measure
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {product.basicUnitofMeasure}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reorder Level
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {product.reorderLevel}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Variations Tab */}
      {tab === 1 && (
        <Box>
          {product.variations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No variations available
              </Typography>
              <Typography color="text.secondary">This product doesn't have any variations configured.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {product.variations.map((variation) => (
                <Grid item xs={12} lg={6} key={variation.id}>
                  <Box sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2, height: "100%" }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {variation.name || "Unnamed Variation"}
                      </Typography>
                      {variation.isMain && <Chip label="Main" color="primary" size="small" />}
                      <Chip
                        label={variation.isActive ? "Active" : "Inactive"}
                        color={variation.isActive ? "success" : "default"}
                        size="small"
                      />
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Unit Size
                        </Typography>
                        <Typography fontWeight="medium">{variation.unitSize}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Unit of Measure
                        </Typography>
                        <Typography fontWeight="medium">
                          {variation.unitofMeasure || product.basicUnitofMeasure}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Retail Price
                        </Typography>
                        <Typography fontWeight="bold" color="success.main">
                          ${variation.retailPrice.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Wholesale Price
                        </Typography>
                        <Typography fontWeight="bold" color="info.main">
                          ${variation.wholeSalePrice.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Discount
                        </Typography>
                        <Typography fontWeight="medium">
                          {variation.discount ? `${variation.discount.toFixed(2)}%` : "No discount"}
                        </Typography>
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
        <Box>
          {product.generics.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No generics available
              </Typography>
              <Typography color="text.secondary">This product doesn't have any generic batch information.</Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {product.generics.map((generic) => (
                <Box key={generic.id} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Box mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      {generic.batchNumber ? `Batch: ${generic.batchNumber}` : "Generic Batch"}
                    </Typography>
                    <Typography color="text.secondary">Supplier: {generic.supplierName || "Not specified"}</Typography>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Manufacture Date
                        </Typography>
                        <Typography fontWeight="medium">
                          {generic.manufactureDate instanceof Date
                            ? format(generic.manufactureDate, "PPP")
                            : format(new Date(generic.manufactureDate), "PPP")}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Expiry Date
                        </Typography>
                        <Typography fontWeight="medium">
                          {generic.expiryDate instanceof Date
                            ? format(generic.expiryDate, "PPP")
                            : format(new Date(generic.expiryDate), "PPP")}
                        </Typography>
                      </Box>
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
        <Box>
          {product.generics.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No storage information available
              </Typography>
              <Typography color="text.secondary">Add generics first to track storage information.</Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {product.generics.map((generic) => (
                <Box key={generic.id} sx={{ p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
                  <Box mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      {generic.batchNumber ? `Batch: ${generic.batchNumber}` : "Generic Batch"}
                    </Typography>
                    <Typography color="text.secondary">Supplier: {generic.supplierName || "Not specified"}</Typography>
                  </Box>
                  {generic.storage.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: "center", bgcolor: "grey.50", borderRadius: 1 }}>
                      <Typography color="text.secondary">No storage locations configured for this batch.</Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {generic.storage.map((storage) => (
                        <Grid item xs={12} md={4} key={storage.id}>
                          <Box sx={{ p: 2, borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Store Location
                            </Typography>
                            <Typography fontWeight="bold" gutterBottom>
                              {storage.storageName || "Unknown Store"}
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Stack direction="row" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                Quantity:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {storage.quantity}
                              </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                Reorder Level:
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {storage.reorderLevel}
                              </Typography>
                            </Stack>
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
    </Box>
  )
}
