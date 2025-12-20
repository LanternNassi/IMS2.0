"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, ShoppingCart, DollarSign, Package, CheckCircle } from "lucide-react"
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
import { SalesTable, type Sale as SaleTableType } from "@/components/SalesTable"
import { useRouter } from "next/navigation"
import api from "@/Utils/Request"
import PaginationControls from "@/components/PaginationControls"

// Types
export type SalesItem = {
  id: string
  productId: string
  productVariationId: string
  productName: string
  basePrice: number
  baseCostPrice?: number
  quantity: number
  totalPrice: number
  batchNumber?: string
  storageId?: string // Storage location ID
}

export type Sale = {
  id: string
  customerId: string | null | undefined
  customerName: string | null | undefined
  items: SalesItem[]
  totalAmount: number
  paidAmount?: number
  changeAmount?: number
  finalAmount?: number
  isPaid?: boolean
  isTaken?: boolean
  paymentMethod?: string
  processedById?: string
  linkedFinancialAccountId?: string
  isCompleted?: boolean
  discount?: number
  createdAt: Date
  notes?: string
}

interface SalesMetadata {
  totalAmount: number
  paidAmount: number
  finalAmount: number
  totalProfit: number
  outstandingAmount: number
  paidSales: number
  completedSales: number
  totalSales: number
  paymentMethodBreakdown: Array<{
    paymentMethod: string
    count: number
    totalAmount: number
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

    
export default function SalesPage() {
  const [sales, setSales] = useState<SaleTableType[]>([])
  const [metadata, setMetadata] = useState<SalesMetadata | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 50,
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
    fetchSales()
  }, [])

  const fetchSales = async (page: number = 1, pageSize: number = 50) => {
    setLoading(true)
    try {
      const response = await api.get(`/Sales?includeMetadata=true&page=${page}&pageSize=${pageSize}`)
      setSales(response.data.sales || [])
      setMetadata(response.data.metadata || null)
      setPagination(response.data.pagination || {
        currentPage: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      })
    } catch (error: any) {
      console.error("Error fetching sales:", error)
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to load sales",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(
    (sale) =>
      sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleView = (sale: SaleTableType) => {
    // TODO: Implement view details
    console.log("View sale:", sale)
  }

  const handleEdit = (sale: SaleTableType) => {
    router.push(`/Sales/edit/${sale.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return

    try {
      await api.delete(`/Sales/${id}`)
      setSnackbar({ open: true, message: "Sale deleted successfully" })
      fetchSales(pagination.currentPage, pagination.pageSize)
    } catch (error: any) {
      console.error("Error deleting sale:", error)

      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete sale",
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchSales(newPage, pagination.pageSize)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    fetchSales(1, newPageSize)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Sales Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and manage all your sales transactions
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus />}
            onClick={() => router.push("/Sales/add")}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Record Sale
          </Button>
        </Stack>

        {/* Metadata Cards */}
        {metadata && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
              <MuiCard sx={{ minWidth: 250, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ wordBreak: 'break-word' }}>
                        UGX {metadata.totalAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MuiCard>

              <MuiCard sx={{ minWidth: 250, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ wordBreak: 'break-word' }}>
                        UGX {metadata.totalProfit.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Profit
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </MuiCard>

              <MuiCard sx={{ minWidth: 250, flex: 1, borderRadius: 2 }} className="dark:bg-gray-800">
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
                      <CheckCircle />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {metadata.completedSales}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Sales
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
              placeholder="Search by customer, sale number, or notes..."
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

      {/* Sales Table */}
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <SalesTable
            sales={filteredSales}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
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
          itemName="sales"
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
