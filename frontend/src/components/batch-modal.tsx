"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@mui/material"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import type { PurchaseItem } from "@/app/Purchases/page"

type BatchModalProps = {
  isOpen: boolean
  item: PurchaseItem
  onClose: () => void
  onSave: (batchData: any) => void
}

export function BatchModal({ isOpen, item, onClose, onSave }: BatchModalProps) {
  const [batchNumber, setBatchNumber] = useState(item.batchNumber || "")
  const [manufactureDateValue, setManufactureDateValue] = useState("")
  const [expiryDateValue, setExpiryDateValue] = useState("")

  const handleSave = () => {
    onSave({
      batchNumber,
      manufactureDateValue,
      expiryDateValue,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-200">Add Batch Information</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Add batch/generic details for {item.productName}
          </DialogDescription>
        </DialogHeader>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardContent className="space-y-4 pt-6">
            {/* Product Info */}
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
              <p className="text-sm dark:text-gray-300">
                <span className="font-medium">Product:</span> {item.productName}
              </p>
              <p className="text-sm dark:text-gray-300">
                <span className="font-medium">Quantity:</span> {item.quantity}
              </p>
            </div>

            {/* Batch Number */}
            <div className="space-y-2">
              <Label htmlFor="batch" className="dark:text-gray-200">
                Batch Number
              </Label>
              <Input
                id="batch"
                placeholder="e.g., BATCH001"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Manufacture Date */}
            <div className="space-y-2">
              <Label htmlFor="mfg-date" className="dark:text-gray-200">
                Manufacture Date
              </Label>
              <Input
                id="mfg-date"
                type="date"
                value={manufactureDateValue}
                onChange={(e) => setManufactureDateValue(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiry-date" className="dark:text-gray-200">
                Expiry Date
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDateValue}
                onChange={(e) => setExpiryDateValue(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outlined" onClick={onClose} className="dark:border-gray-600 bg-transparent">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save Batch Information
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
