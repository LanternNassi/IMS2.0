import { create } from 'zustand'
import api from '../Utils/Request'

interface DashboardSummary {
  totalRevenue: number
  totalProducts: number
  activeCustomers: number
  pendingOrders: number
  revenueChange: number
  productsChange: number
  customersChange: number
  pendingOrdersChange: number
}

interface SalesData {
  monthlySales: Array<{ name: string; total: number }>
  topProducts: Array<{
    name: string
    price: number
    unitsSold: number
    totalRevenue: number
  }>
}

interface ProductsData {
  inventoryByCategory: Array<{ name: string; stock: number }>
  categoryDistribution: Array<{ name: string; value: number }>
}

interface CustomersData {
  customerTypes: Array<{ name: string; value: number }>
  monthlyGrowth: Array<{ month: string; customers: number }>
}

interface TransactionsData {
  weeklyTransactions: Array<{
    name: string
    sales: number
    purchases: number
  }>
  paymentMethods: Array<{ name: string; value: number }>
}

interface SuppliersData {
  topSuppliers: Array<{ name: string; value: number }>
  supplierPerformance: Array<{
    name: string
    deliveryTime: number
    quality: number
  }>
}

interface RecentTransaction {
  id: string
  type: string
  title: string
  amount: number
  date: string
  description: string
}

interface InventoryAlert {
  type: string
  productName: string
  message: string
  severity: string
}

interface DashboardState {
  summary: DashboardSummary | null
  sales: SalesData | null
  products: ProductsData | null
  customers: CustomersData | null
  transactions: TransactionsData | null
  suppliers: SuppliersData | null
  recentTransactions: RecentTransaction[]
  inventoryAlerts: InventoryAlert[]
  loading: boolean
  error: string | null
  fetchDashboardData: (dateRange?: string) => Promise<void>
  refreshDashboard: (dateRange?: string) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  summary: null,
  sales: null,
  products: null,
  customers: null,
  transactions: null,
  suppliers: null,
  recentTransactions: [],
  inventoryAlerts: [],
  loading: false,
  error: null,

  fetchDashboardData: async (dateRange = 'thisMonth') => {
    set({ loading: true, error: null })
    try {
      const res = await api.get(`/Dashboard/all?dateRange=${dateRange}`)
      set({
        summary: res.data.summary,
        sales: res.data.sales,
        products: res.data.products,
        customers: res.data.customers,
        transactions: res.data.transactions,
        suppliers: res.data.suppliers,
        recentTransactions: res.data.recentTransactions || [],
        inventoryAlerts: res.data.inventoryAlerts || [],
        loading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch dashboard data',
        loading: false,
      })
      console.error('Dashboard fetch error:', error)
    }
  },

  refreshDashboard: async (dateRange = 'thisMonth') => {
    await get().fetchDashboardData(dateRange)
  },
}))

