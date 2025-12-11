"use client"

import { useState, useEffect } from "react"
import { Plus, Download, TrendingUp, ShoppingCart, DollarSign, Package } from "lucide-react"
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Typography,
  Stack,
  Card as MuiCard,
  CardContent,
  Snackbar,
  CircularProgress,
} from "@mui/material"
import { Search, FilterList } from "@mui/icons-material"
import { Card } from "@/components/ui/card"
import { TransactionTable, Transaction } from "@/components/TransactionTable"
import { useRouter } from "next/navigation"
import api from "@/Utils/Request"
import PaginationControls from "@/components/PaginationControls"

// Types
export type PurchaseItem = {
  id: string
  productId: string
  productVariationId: string
  productName: string
  baseCostPrice?: number
  quantity: number
  totalPrice: number
  batchNumber?: string
  hasGeneric: boolean
}

export type Purchase = {
  id: string
  supplierId: string
  processedBy: string
  supplierName: string
  items: PurchaseItem[]
  totalAmount: number
  paidAmount: number
  createdAt: Date
  notes?: string
}

interface PurchaseMetadata {
  totalAmount: number
  paidAmount: number
  grandTotal: number
  paidPurchases: number
  totalPurchases: number
  supplierBreakdown: Array<{
    supplierId: string
    supplierName: string
    count: number
    totalAmount: number
    paidAmount: number
    grandTotal: number
  }>
}

interface Pagination {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Transaction[]>([])
  const [metadata, setMetadata] = useState<PurchaseMetadata | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 30,
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })
  const router = useRouter()

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async (page: number = 1, pageSize: number = 30) => {
    setLoading(true)
    try {
      const response = await api.get(`/Purchases?includeMetadata=true&page=${page}&pageSize=${pageSize}`)
      setPurchases(response.data.purchases || [])
      setMetadata(response.data.metadata || null)
      setPagination(response.data.pagination || {
        currentPage: 1,
        pageSize: 30,
        totalCount: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      })
    } catch (error: any) {
      console.error("Error fetching purchases:", error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to load purchases",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.supplier?.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.purchaseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleView = (purchase: Transaction) => {
    // TODO: Implement view details
    console.log("View purchase:", purchase)
  }

  const handleEdit = (purchase: Transaction) => {
    router.push(`/Purchases/edit/${purchase.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this purchase?")) return

    try {
      await api.delete(`/Purchases/${id}`)
      setSnackbar({ open: true, message: "Purchase deleted successfully" })
      fetchPurchases(pagination.currentPage, pagination.pageSize)
    } catch (error: any) {
      console.error("Error deleting purchase:", error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete purchase",
      })
    }
  }

  const handleAllocate = async (purchase: Transaction) => {
    // After allocation is complete, refetch purchases to update allocation status
    await fetchPurchases(pagination.currentPage, pagination.pageSize)
    setSnackbar({ open: true, message: "Products allocated to storages successfully" })
  }

  const handlePageChange = (newPage: number) => {
    fetchPurchases(newPage, pagination.pageSize)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    fetchPurchases(1, newPageSize)
  }


  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Purchase Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and manage all your purchase transactions
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus />}
            onClick={() => router.push("/Purchases/add")}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Record Purchase
          </Button>
        </Stack>

        {/* Metadata Cards */}
        {metadata && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              <MuiCard sx={{ minWidth: 200, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        bgcolor: "primary.50",
                        color: "primary.main",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <ShoppingCart />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {metadata.totalPurchases}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Purchases
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MuiCard>

              <MuiCard sx={{ minWidth: 200, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        bgcolor: "success.50",
                        color: "success.main",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <DollarSign />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        UGX {metadata.totalAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MuiCard>

              <MuiCard sx={{ minWidth: 200, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        bgcolor: "warning.50",
                        color: "warning.main",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <TrendingUp />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        UGX {metadata.paidAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Amount Paid
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MuiCard>

              <MuiCard sx={{ minWidth: 200, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        bgcolor: "info.50",
                        color: "info.main",
                        p: 1.5,
                        borderRadius: 2,
                      }}
                    >
                      <Package />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {metadata.paidPurchases}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Paid Purchases
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MuiCard>
            </Stack>
          </Box>
        )}

        {/* Search and Filter Section */}
        <Box sx={{ mb: 3, p: 3, border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              variant="outlined"
              placeholder="Search by supplier, purchase number, or notes..."
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
      </Box>

      {/* Purchases Table */}
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TransactionTable
            transactions={filteredPurchases}
            type="purchase"
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAllocate={handleAllocate}
          />
        )}
      </Box>

      {/* Pagination Controls */}
      {!loading && (
        <PaginationControls
          currentPage={pagination.currentPage}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          totalPages={pagination.totalPages}
          hasPreviousPage={pagination.hasPreviousPage}
          hasNextPage={pagination.hasNextPage}
          onPageChange={handlePageChange}
          itemName="purchases"
        />
      )}

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

