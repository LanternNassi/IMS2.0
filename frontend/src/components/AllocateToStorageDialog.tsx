"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { StoreAutocomplete } from "./StoreAutocomplete"
import { Store } from "@/types/productTypes"
import api from "@/Utils/Request"
import { Check, AlertCircle, Package } from "lucide-react"
import { CircularProgress, Snackbar } from "@mui/material"
import type { TransactionItem } from "./TransactionTable"

interface StorageAllocation {
  productVariationId?: string
  productGenericId?: string | null
  quantity: number
  storageId: string
  reorderLevel: number
}

interface ItemAllocation {
  itemId: string
  productName: string
  totalQuantity: number
  allocatedQuantity: number
  allocations: Array<{
    store: Store | null
    quantity: number
    reorderLevel: number
  }>
}

interface AllocateToStorageDialogProps {
  open: boolean
  onClose: () => void
  purchaseId: string
  items: TransactionItem[]
  onAllocationComplete: () => void
}

export const AllocateToStorageDialog: React.FC<AllocateToStorageDialogProps> = ({
  open,
  onClose,
  purchaseId,
  items,
  onAllocationComplete,
}) => {
  const [allocations, setAllocations] = useState<ItemAllocation[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  })

  useEffect(() => {
    if (open && items.length > 0) {
      // Initialize allocations for all items
      const initialAllocations: ItemAllocation[] = items.map((item) => ({
        itemId: item.id,
        productName: item.productVariation?.name || "Unknown Product",
        totalQuantity: item.quantity,
        allocatedQuantity: 0,
        allocations: [
          {
            store: null,
            quantity: 0,
            reorderLevel: 0,
          },
        ],
      }))
      setAllocations(initialAllocations)
      setCurrentIndex(0)
    }
  }, [open, items])

  const currentItem = allocations[currentIndex]
  const currentPurchaseItem = items[currentIndex]

  const handleAddAllocation = () => {
    if (!currentItem) return

    const updatedAllocations = [...allocations]
    updatedAllocations[currentIndex] = {
      ...currentItem,
      allocations: [
        ...currentItem.allocations,
        {
          store: null,
          quantity: 0,
          reorderLevel: 0,
        },
      ],
    }
    setAllocations(updatedAllocations)
  }

  const handleRemoveAllocation = (allocationIndex: number) => {
    if (!currentItem || currentItem.allocations.length <= 1) return

    const updatedAllocations = [...allocations]
    const removedQty = currentItem.allocations[allocationIndex].quantity
    updatedAllocations[currentIndex] = {
      ...currentItem,
      allocatedQuantity: currentItem.allocatedQuantity - removedQty,
      allocations: currentItem.allocations.filter((_, idx) => idx !== allocationIndex),
    }
    setAllocations(updatedAllocations)
  }

  const handleStoreChange = (allocationIndex: number, store: Store | null) => {
    const updatedAllocations = [...allocations]
    updatedAllocations[currentIndex].allocations[allocationIndex].store = store
    setAllocations(updatedAllocations)
  }

  const handleQuantityChange = (allocationIndex: number, quantity: number) => {
    const updatedAllocations = [...allocations]
    const oldQty = currentItem.allocations[allocationIndex].quantity
    updatedAllocations[currentIndex].allocations[allocationIndex].quantity = quantity

    // Recalculate total allocated quantity
    const totalAllocated = updatedAllocations[currentIndex].allocations.reduce(
      (sum, alloc) => sum + alloc.quantity,
      0
    )
    updatedAllocations[currentIndex].allocatedQuantity = totalAllocated

    setAllocations(updatedAllocations)
  }

  const handleReorderLevelChange = (allocationIndex: number, reorderLevel: number) => {
    const updatedAllocations = [...allocations]
    updatedAllocations[currentIndex].allocations[allocationIndex].reorderLevel = reorderLevel
    setAllocations(updatedAllocations)
  }

  const validateCurrentItem = () => {
    if (!currentItem) return false

    // Check if all quantities are allocated
    if (currentItem.allocatedQuantity !== currentItem.totalQuantity) {
      setSnackbar({
        open: true,
        message: `Please allocate all ${currentItem.totalQuantity} units. Currently allocated: ${currentItem.allocatedQuantity}`,
        severity: "error",
      })
      return false
    }

    // Check if all allocations have a store selected
    const hasInvalidAllocation = currentItem.allocations.some(
      (alloc) => !alloc.store || alloc.quantity <= 0
    )
    if (hasInvalidAllocation) {
      setSnackbar({
        open: true,
        message: "Please select a store and valid quantity for all allocations",
        severity: "error",
      })
      return false
    }

    return true
  }

  const handleNext = async () => {
    if (!validateCurrentItem()) return

    if (currentIndex < allocations.length - 1) {
      // Move to next item
      setCurrentIndex(currentIndex + 1)
    } else {
      // All items allocated, submit to API
      await handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create payload for all allocations
      const payloads: StorageAllocation[] = []

      allocations.forEach((itemAlloc, idx) => {
        const purchaseItem = items[idx]
        itemAlloc.allocations.forEach((alloc) => {
          if (alloc.store && alloc.quantity > 0) {
            payloads.push({
              productVariationId: purchaseItem.productVariationId,
              productGenericId: purchaseItem.productGenericId || null,
              quantity: alloc.quantity,
              storageId: alloc.store.id,
              reorderLevel: alloc.reorderLevel,
            })
          }
        })
      })

      // Submit all allocations
      await Promise.all(
        payloads.map((payload) => api.post("/ProductStorages", payload))
      )

      // Update purchase allocation status
      await api.put(`/Purchases/Allocate/${purchaseId}`)

      setSnackbar({
        open: true,
        message: "All products allocated to storages successfully!",
        severity: "success",
      })

      // Wait a moment for user to see success message
      setTimeout(() => {
        onAllocationComplete()
        onClose()
      }, 1500)
    } catch (error) {
      console.error("Error allocating to storages:", error)
      setSnackbar({
        open: true,
        message: "Failed to allocate products. Please try again.",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const remainingQuantity = currentItem
    ? currentItem.totalQuantity - currentItem.allocatedQuantity
    : 0

  const isComplete = currentItem
    ? currentItem.allocatedQuantity === currentItem.totalQuantity &&
      currentItem.allocations.every((alloc) => alloc.store && alloc.quantity > 0)
    : false

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Allocate Products to Storages
            </DialogTitle>
            <DialogDescription>
              Allocating item {currentIndex + 1} of {allocations.length}. Distribute quantities
              across different stores.
            </DialogDescription>
          </DialogHeader>

          {currentItem && (
            <div className="space-y-6">
              {/* Current Item Info */}
              <div className="rounded-lg border border-border dark:border-gray-700 p-4 bg-muted/30 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground dark:text-white">{currentItem.productName}</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Total Quantity: <span className="font-semibold">{currentItem.totalQuantity}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Allocated</p>
                    <p
                      className={`text-2xl font-bold ${
                        currentItem.allocatedQuantity === currentItem.totalQuantity
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {currentItem.allocatedQuantity} / {currentItem.totalQuantity}
                    </p>
                  </div>
                </div>

                {remainingQuantity > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {remainingQuantity} unit(s) remaining to allocate
                    </span>
                  </div>
                )}
              </div>

              {/* Allocations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold dark:text-white">Storage Allocations</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={"dark:bg-gray-800 dark:border-gray-700 dark:text-white"}
                    onClick={handleAddAllocation}
                    disabled={remainingQuantity === 0}
                  >
                    Add Storage
                  </Button>
                </div>

                {currentItem.allocations.map((allocation, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border dark:border-gray-700 p-4 space-y-4 bg-card dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Allocation {idx + 1}</Badge>
                      {currentItem.allocations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAllocation(idx)}
                          className="text-destructive hover:text-destructive dark:text-destructive dark:hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <Label className="dark:text-gray-300">Store *</Label>
                        <StoreAutocomplete
                          value={allocation.store}
                          onChange={(store) => handleStoreChange(idx, store)}
                          label=""
                          required
                          size="small"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Quantity *</Label>
                        <Input
                          type="number"
                          min={0}
                          className="dark:border-white"
                          max={currentItem.totalQuantity}
                          value={allocation.quantity || ""}
                          onChange={(e) =>
                            handleQuantityChange(idx, parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <Label className="dark:text-gray-300">Reorder Level</Label>
                        <Input
                          type="number"
                          min={0}
                          className="dark:border-white"
                          value={allocation.reorderLevel || ""}
                          onChange={(e) =>
                            handleReorderLevelChange(idx, parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-border dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  className={"dark:bg-gray-800 dark:border-gray-700 dark:text-white"}
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 || loading}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {isComplete && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-md">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Complete</span>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isComplete || loading}
                  className="min-w-[120px] text-black dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  {loading ? (
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  ) : currentIndex === allocations.length - 1 ? (
                    "Submit All"
                  ) : (
                    "Next Item"
                  )}
                </Button>
              </div>

              {/* Progress Indicator */}
              <div className="flex gap-2 justify-center pt-2">
                {allocations.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex
                        ? "w-8 bg-primary"
                        : idx < currentIndex
                        ? "w-2 bg-emerald-500"
                        : "w-2 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 2,
            backgroundColor: snackbar.severity === "error" ? "#dc2626" : "#16a34a",
          },
        }}
      />
    </>
  )
}
