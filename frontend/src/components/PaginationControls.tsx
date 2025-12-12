"use client"

import { Button } from "@/components/ui/button"
import { Stack, Typography } from "@mui/material"

interface PaginationControlsProps {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
  itemName?: string // e.g., "purchases", "sales", "expenses"
}

export default function PaginationControls({
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  itemName = "items",
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t dark:border-gray-700 border-gray-200">
      <Typography variant="body2" className="dark:text-gray-400 text-gray-600 text-sm">
        Showing {startItem} to {endItem} of {totalCount} {itemName}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage}
          onClick={() => onPageChange(currentPage - 1)}
          className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          Previous
        </Button>
        <Typography variant="body2" className="dark:text-gray-300 text-gray-700 text-sm">
          Page {currentPage} of {totalPages}
        </Typography>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          Next
        </Button>
      </Stack>
    </div>
  )
}
