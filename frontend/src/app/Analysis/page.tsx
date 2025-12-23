"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
  Clock,
  Target,
  ArrowUpRight,
  X,
} from "lucide-react"
import api from "@/Utils/Request"
import { Snackbar } from "@mui/material"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {Checkbox} from "@mui/material"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts"

// Types based on API payload
type ProductVariation = {
  variationId: string
  variationName: string
  unitSize: number
  unitOfMeasure: string
  quantitySold: number
  sales: number
}

type ProductSummary = {
  productId: string
  productName: string
  productCode: string
  totalQuantitySold: number
  totalSales: number
  totalProfit: number
  transactionCount: number
  uniqueCustomers: number
  averageUnitPrice: number
  averageQuantityPerTransaction: number
  mostRecentSale: string
  oldestSale: string
  topVariations: ProductVariation[]
}

type VariationSummary = {
  productVariationId: string
  productName: string
  variationName: string
  unitSize: number
  unitOfMeasure: string
  retailPrice: number
  costPrice: number
  totalQuantitySold: number
  totalSales: number
  totalProfit: number
  transactionCount: number
  averageUnitPrice: number
  profitMarginPercentage: number
}

type CustomerSummary = {
  customerId: string
  customerName: string
  customerPhone: string
  customerType: string
  totalQuantityPurchased: number
  totalSpent: number
  transactionCount: number
  uniqueProducts: number
  averageTransactionValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
}

type TimeSeries = {
  date: string
  totalQuantitySold: number
  totalSales: number
  totalProfit: number
  transactionCount: number
  uniqueProducts: number
  averageSaleValue: number
}

type SalesItem = {
  id: string
  saleId: string
  productVariationId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  profitMargin: number
  sale: {
    id: string
    saleDate: string
    totalAmount: number
    paymentMethod: string
    customer: {
      id: string
      name: string
      phone: string
      customerType: string
    }
  }
  product: {
    id: string
    name: string
    code: string
  }
  productVariation: {
    id: string
    name: string
    unitSize: number
    unitofMeasure: string
    retailPrice: number
    costPrice: number
  }
}

type OverallSummary = {
  totalQuantitySold: number
  totalSalesRevenue: number
  totalProfit: number
  totalTransactions: number
  uniqueProducts: number
  uniqueVariations: number
  uniqueCustomers: number
  averageTransactionValue: number
  averageQuantityPerTransaction: number
  overallProfitMargin: number
  dateRange: {
    startDate: string
    endDate: string
  }
}

// Mock data based on the API payload
const mockData = {
  overallSummary: {
    totalQuantitySold: 170,
    totalSalesRevenue: 924852,
    totalProfit: 354000,
    totalTransactions: 8,
    uniqueProducts: 3,
    uniqueVariations: 4,
    uniqueCustomers: 2,
    averageTransactionValue: 115606.5,
    averageQuantityPerTransaction: 21.25,
    overallProfitMargin: 38.28,
    dateRange: {
      startDate: "2025-12-06T11:12:55.4920013",
      endDate: "2025-12-11T13:23:08.8190543",
    },
  },
  productSummary: [
    {
      productId: "6c1c7002-e41c-4162-9432-e9b8b96c9e55",
      productName: "Oshothane 1Ltr",
      productCode: "OSH-001",
      totalQuantitySold: 77,
      totalSales: 924000,
      totalProfit: 354000,
      transactionCount: 5,
      uniqueCustomers: 2,
      averageUnitPrice: 12000,
      averageQuantityPerTransaction: 15.4,
      mostRecentSale: "2025-12-11T13:23:08.8190543",
      oldestSale: "2025-12-06T12:18:52.7412938",
      topVariations: [
        {
          variationId: "324d23eb-9174-40eb-bca7-af33b17eff3e",
          variationName: "Oshothane 1Ltr",
          unitSize: 12,
          unitOfMeasure: "Liters",
          quantitySold: 57,
          sales: 684000,
        },
        {
          variationId: "a0809fba-97fb-4cc3-9db6-1d3b38c5b0da",
          variationName: "Oshothane (1 Ltr) Yara",
          unitSize: 1,
          unitOfMeasure: "Liters",
          quantitySold: 20,
          sales: 240000,
        },
      ],
    },
    {
      productId: "6ab5c288-d3eb-47b7-be41-08de2a7e9b1e",
      productName: "Yaramila Java",
      productCode: "YAR-002",
      totalQuantitySold: 30,
      totalSales: 600,
      totalProfit: 0,
      transactionCount: 1,
      uniqueCustomers: 1,
      averageUnitPrice: 20,
      averageQuantityPerTransaction: 30,
      mostRecentSale: "2025-12-06T11:12:55.4920013",
      oldestSale: "2025-12-06T11:12:55.4920013",
      topVariations: [
        {
          variationId: "a9abba7f-0635-490e-4491-08de2a7e9b2d",
          variationName: "Yaramila Java",
          unitSize: 1,
          unitOfMeasure: "bag",
          quantitySold: 30,
          sales: 600,
        },
      ],
    },
    {
      productId: "90d373d9-b8f3-4b52-a16e-a10533c7dd22",
      productName: "Weed master 1L",
      productCode: "WDM-003",
      totalQuantitySold: 63,
      totalSales: 252,
      totalProfit: 0,
      transactionCount: 2,
      uniqueCustomers: 1,
      averageUnitPrice: 4,
      averageQuantityPerTransaction: 31.5,
      mostRecentSale: "2025-12-06T12:03:15.6024949",
      oldestSale: "2025-12-06T11:12:55.4920013",
      topVariations: [
        {
          variationId: "8971587a-ec51-40c3-8e05-b528491217a5",
          variationName: "Weed master 1L",
          unitSize: 12,
          unitOfMeasure: "Litres",
          quantitySold: 63,
          sales: 252,
        },
      ],
    },
  ],
  variationSummary: [
    {
      productVariationId: "324d23eb-9174-40eb-bca7-af33b17eff3e",
      productName: "Oshothane 1Ltr",
      variationName: "Oshothane 1Ltr",
      unitSize: 12,
      unitOfMeasure: "Liters",
      retailPrice: 13000,
      costPrice: 10000,
      totalQuantitySold: 57,
      totalSales: 684000,
      totalProfit: 114000,
      transactionCount: 4,
      averageUnitPrice: 12000,
      profitMarginPercentage: 16.67,
    },
    {
      productVariationId: "a0809fba-97fb-4cc3-9db6-1d3b38c5b0da",
      productName: "Oshothane 1Ltr",
      variationName: "Oshothane (1 Ltr) Yara",
      unitSize: 1,
      unitOfMeasure: "Liters",
      retailPrice: 13000,
      costPrice: 0,
      totalQuantitySold: 20,
      totalSales: 240000,
      totalProfit: 240000,
      transactionCount: 1,
      averageUnitPrice: 12000,
      profitMarginPercentage: 100,
    },
    {
      productVariationId: "a9abba7f-0635-490e-4491-08de2a7e9b2d",
      productName: "Yaramila Java",
      variationName: "Yaramila Java",
      unitSize: 1,
      unitOfMeasure: "bag",
      retailPrice: 25,
      costPrice: 0,
      totalQuantitySold: 30,
      totalSales: 600,
      totalProfit: 0,
      transactionCount: 1,
      averageUnitPrice: 20,
      profitMarginPercentage: 0,
    },
    {
      productVariationId: "8971587a-ec51-40c3-8e05-b528491217a5",
      productName: "Weed master 1L",
      variationName: "Weed master 1L",
      unitSize: 12,
      unitOfMeasure: "Litres",
      retailPrice: 6,
      costPrice: 0,
      totalQuantitySold: 63,
      totalSales: 252,
      totalProfit: 0,
      transactionCount: 2,
      averageUnitPrice: 4,
      profitMarginPercentage: 0,
    },
  ],
  customerSummary: [
    {
      customerId: "8efa8747-8391-449e-2197-08de38b610a4",
      customerName: "Sudais",
      customerPhone: "0758989094",
      customerType: "client",
      totalQuantityPurchased: 40,
      totalSpent: 480000,
      transactionCount: 2,
      uniqueProducts: 1,
      averageTransactionValue: 240000,
      lastPurchaseDate: "2025-12-11T13:08:00.0804158",
      firstPurchaseDate: "2025-12-11T13:08:00.0804158",
    },
    {
      customerId: "03c11a3b-88b6-4ae2-6df3-08de28e33a57",
      customerName: "John Batist",
      customerPhone: "0758989094",
      customerType: "client",
      totalQuantityPurchased: 130,
      totalSpent: 444852,
      transactionCount: 6,
      uniqueProducts: 3,
      averageTransactionValue: 74142,
      lastPurchaseDate: "2025-12-11T13:23:08.8190543",
      firstPurchaseDate: "2025-12-06T11:12:55.4920013",
    },
  ],
  timeSeries: [
    {
      date: "2025-12-06T00:00:00",
      totalQuantitySold: 95,
      totalSales: 24852,
      totalProfit: 4000,
      transactionCount: 4,
      uniqueProducts: 3,
      averageSaleValue: 6213,
    },
    {
      date: "2025-12-11T00:00:00",
      totalQuantitySold: 75,
      totalSales: 900000,
      totalProfit: 350000,
      transactionCount: 4,
      uniqueProducts: 1,
      averageSaleValue: 225000,
    },
  ],
  salesItems: [
    {
      id: "cce055c7-4ec3-44b0-ba78-770018ce534d",
      saleId: "36f8e2cf-e3ab-4c95-9252-154326dce0db",
      productVariationId: "324d23eb-9174-40eb-bca7-af33b17eff3e",
      quantity: 15,
      unitPrice: 12000,
      totalPrice: 180000,
      profitMargin: 30000,
      sale: {
        id: "36f8e2cf-e3ab-4c95-9252-154326dce0db",
        saleDate: "2025-12-11T13:23:08.8190543",
        totalAmount: 180000,
        paymentMethod: "CASH",
        customer: {
          id: "03c11a3b-88b6-4ae2-6df3-08de28e33a57",
          name: "John Batist",
          phone: "0758989094",
          customerType: "client",
        },
      },
      product: {
        id: "6c1c7002-e41c-4162-9432-e9b8b96c9e55",
        name: "Oshothane 1Ltr",
        code: "OSH-001",
      },
      productVariation: {
        id: "324d23eb-9174-40eb-bca7-af33b17eff3e",
        name: "Oshothane 1Ltr",
        unitSize: 12,
        unitofMeasure: "Liters",
        retailPrice: 13000,
        costPrice: 10000,
      },
    },
    {
      id: "22fff39f-956d-4c90-bb1d-b922a2cff897",
      saleId: "7c470b73-3ff5-4374-88ac-b7076f0210cd",
      productVariationId: "a0809fba-97fb-4cc3-9db6-1d3b38c5b0da",
      quantity: 20,
      unitPrice: 12000,
      totalPrice: 240000,
      profitMargin: 240000,
      sale: {
        id: "7c470b73-3ff5-4374-88ac-b7076f0210cd",
        saleDate: "2025-12-11T13:08:00.0804158",
        totalAmount: 480000,
        paymentMethod: "CASH",
        customer: {
          id: "8efa8747-8391-449e-2197-08de38b610a4",
          name: "Sudais",
          phone: "0758989094",
          customerType: "client",
        },
      },
      product: {
        id: "6c1c7002-e41c-4162-9432-e9b8b96c9e55",
        name: "Oshothane 1Ltr",
        code: "OSH-001",
      },
      productVariation: {
        id: "a0809fba-97fb-4cc3-9db6-1d3b38c5b0da",
        name: "Oshothane (1 Ltr) Yara",
        unitSize: 1,
        unitofMeasure: "Liters",
        retailPrice: 13000,
        costPrice: 0,
      },
    },
  ],
}

// Mock products and customers for filter dropdowns
const mockProducts = [
  { id: "6c1c7002-e41c-4162-9432-e9b8b96c9e55", name: "Oshothane 1Ltr" },
  { id: "6ab5c288-d3eb-47b7-be41-08de2a7e9b1e", name: "Yaramila Java" },
  { id: "90d373d9-b8f3-4b52-a16e-a10533c7dd22", name: "Weed master 1L" },
]

const mockVariations = [
  {
    id: "324d23eb-9174-40eb-bca7-af33b17eff3e",
    name: "Oshothane 1Ltr",
    productId: "6c1c7002-e41c-4162-9432-e9b8b96c9e55",
  },
  {
    id: "a0809fba-97fb-4cc3-9db6-1d3b38c5b0da",
    name: "Oshothane (1 Ltr) Yara",
    productId: "6c1c7002-e41c-4162-9432-e9b8b96c9e55",
  },
  {
    id: "a9abba7f-0635-490e-4491-08de2a7e9b2d",
    name: "Yaramila Java",
    productId: "6ab5c288-d3eb-47b7-be41-08de2a7e9b1e",
  },
  {
    id: "8971587a-ec51-40c3-8e05-b528491217a5",
    name: "Weed master 1L",
    productId: "90d373d9-b8f3-4b52-a16e-a10533c7dd22",
  },
]

const mockCustomers = [
  { id: "8efa8747-8391-449e-2197-08de38b610a4", name: "Sudais" },
  { id: "03c11a3b-88b6-4ae2-6df3-08de28e33a57", name: "John Batist" },
]

const PRODUCT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export default function ProductAnalysis() {
  const [startDate, setStartDate] = useState(new Date(2025, 11, 1))
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31))
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [selectedVariation, setSelectedVariation] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [variationSearch, setVariationSearch] = useState("")
  const [customerNameSearch, setCustomerNameSearch] = useState("")
  const [includeUnpaid, setIncludeUnpaid] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
  })

  // Dropdown open states
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)
  const [variationDropdownOpen, setVariationDropdownOpen] = useState(false)
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)

  // API data state
  const [apiData, setApiData] = useState<any>(null)

  // Fetch data from API
  const fetchAnalysisData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      if (selectedProduct) params.append("productId", selectedProduct)
      if (selectedVariation) params.append("productVariationId", selectedVariation)
      if (selectedCustomer) params.append("customerId", selectedCustomer)
      if (customerNameSearch) params.append("customerName", customerNameSearch)
      params.append("includeUnpaid", includeUnpaid.toString())

      const response = await api.get(`/Sales/ProductAnalysis?${params}`)
      setApiData(response.data)
    } catch (error: any) {
      console.error("Error fetching analysis data:", error)
      setSnackbar({
        open: true,
        message: "Failed to load analysis data",
        severity: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate, selectedProduct, selectedVariation, selectedCustomer, customerNameSearch, includeUnpaid])

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchAnalysisData()
  }, [startDate, endDate, selectedProduct, selectedVariation, selectedCustomer, customerNameSearch, includeUnpaid, fetchAnalysisData])

  // Extract data from API response
  const overallSummary = apiData?.metadata?.overallSummary || {
    totalQuantitySold: 0,
    totalSalesRevenue: 0,
    totalProfit: 0,
    totalTransactions: 0,
    uniqueProducts: 0,
    uniqueVariations: 0,
    uniqueCustomers: 0,
    averageTransactionValue: 0,
    averageQuantityPerTransaction: 0,
    overallProfitMargin: 0,
    dateRange: { startDate: "", endDate: "" },
  }
  const productSummary: ProductSummary[] = apiData?.metadata?.productSummary || []
  const variationSummary: VariationSummary[] = apiData?.metadata?.variationSummary || []
  const customerSummary: CustomerSummary[] = apiData?.metadata?.customerSummary || []
  const timeSeries: TimeSeries[] = apiData?.metadata?.timeSeries || []
  const salesItems: SalesItem[] = apiData?.salesItems || []

  // Types for dropdown items
  type DropdownProduct = { id: string; name: string }
  type DropdownVariation = { id: string; name: string; productId?: string }
  type DropdownCustomer = { id: string; name: string }
  type ActiveFilter = { type: string; label?: string }

  // Extract unique products, variations, and customers from API data
  const availableProducts: DropdownProduct[] = productSummary.map((p: ProductSummary) => ({
    id: p.productId,
    name: p.productName,
  }))

  const availableVariations: DropdownVariation[] = variationSummary.map((v: VariationSummary) => ({
    id: v.productVariationId,
    name: v.variationName,
    productId: productSummary.find((p: ProductSummary) => p.productName === v.productName)?.productId,
  }))

  const availableCustomers: DropdownCustomer[] = customerSummary.map((c: CustomerSummary) => ({
    id: c.customerId,
    name: c.customerName,
  }))

  // Filter products based on search
  const filteredProducts = availableProducts.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()))

  // Filter variations based on selected product and search
  const filteredVariations = availableVariations.filter(
    (v) =>
      (!selectedProduct || v.productId === selectedProduct) &&
      v.name.toLowerCase().includes(variationSearch.toLowerCase()),
  )

  // Filter customers based on search
  const filteredCustomers = availableCustomers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()))

  // Active filters display
  const activeFilters: ActiveFilter[] = [
    selectedProduct && { type: "product", label: availableProducts.find((p) => p.id === selectedProduct)?.name },
    selectedVariation && { type: "variation", label: availableVariations.find((v) => v.id === selectedVariation)?.name },
    selectedCustomer && { type: "customer", label: availableCustomers.find((c) => c.id === selectedCustomer)?.name },
    customerNameSearch && { type: "customerName", label: `Name: ${customerNameSearch}` },
    includeUnpaid && { type: "includeUnpaid", label: "Including unpaid sales" },
  ].filter(Boolean) as ActiveFilter[]

  const clearFilter = (type: string) => {
    switch (type) {
      case "product":
        setSelectedProduct("")
        setSelectedVariation("")
        break
      case "variation":
        setSelectedVariation("")
        break
      case "customer":
        setSelectedCustomer("")
        break
      case "customerName":
        setCustomerNameSearch("")
        break
      case "includeUnpaid":
        setIncludeUnpaid(false)
        break
    }
  }

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  // Chart data
  const productRevenueData : {name: string, revenue: number, profit: number, fill: string}[] = productSummary.map((p: ProductSummary, i: number) => ({
    name: p.productName,
    revenue: p.totalSales,
    profit: p.totalProfit,
    fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  }))

  const productQuantityData: {name: string, quantity: number, fill: string}[] = productSummary.map((p: ProductSummary, i: number) => ({
    name: p.productName,
    quantity: p.totalQuantitySold,
    fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  }))

  const profitMarginData: {name: string, margin: number, fill: string}[] = variationSummary.map((v: VariationSummary, i: number) => ({
    name: v.variationName.length > 15 ? v.variationName.substring(0, 15) + "..." : v.variationName,
    margin: v.profitMarginPercentage,
    fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  }))

  const timeSeriesData: {date: string, sales: number, profit: number, quantity: number}[] = timeSeries.map((t: TimeSeries) => ({
    date: formatShortDate(t.date),
    sales: t.totalSales,
    profit: t.totalProfit,
    quantity: t.totalQuantitySold,
  }))

  const customerSpendData: {name: string, spent: number, transactions: number, fill: string}[] = customerSummary.map((c: CustomerSummary, i: number) => ({
    name: c.customerName,
    spent: c.totalSpent,
    transactions: c.transactionCount,
    fill: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
  }))

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-2">Product Analysis</h1>
        <p className="dark:text-gray-400 text-gray-600">
          Comprehensive insights into product sales, variations, and customer purchasing patterns
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="dark:text-gray-400 text-gray-600">Loading analysis data...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Filters Section */}
      <Card className="dark:bg-gray-800 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Analysis Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate.toISOString().split("T")[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                End Date
              </label>
              <input
                type="date"
                value={endDate.toISOString().split("T")[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Select with Autocomplete */}
            <div className="space-y-2 relative">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Package className="h-3.5 w-3.5" />
                Product
              </label>
              <div className="relative">
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value)
                    setProductDropdownOpen(true)
                  }}
                  onFocus={() => setProductDropdownOpen(true)}
                  className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
                />
                {productDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    <div
                      className="px-3 py-2 text-sm dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedProduct("")
                        setProductSearch("")
                        setProductDropdownOpen(false)
                      }}
                    >
                      All Products
                    </div>
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`px-3 py-2 text-sm cursor-pointer ${
                          selectedProduct === product.id
                            ? "dark:bg-blue-600 bg-blue-100 dark:text-white text-blue-900"
                            : "dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setSelectedProduct(product.id)
                          setProductSearch(product.name)
                          setProductDropdownOpen(false)
                          setSelectedVariation("")
                        }}
                      >
                        {product.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Variation Select with Autocomplete */}
            <div className="space-y-2 relative">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" />
                Variation
              </label>
              <div className="relative">
                <Input
                  placeholder="Search variations..."
                  value={variationSearch}
                  onChange={(e) => {
                    setVariationSearch(e.target.value)
                    setVariationDropdownOpen(true)
                  }}
                  onFocus={() => setVariationDropdownOpen(true)}
                  className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
                />
                {variationDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    <div
                      className="px-3 py-2 text-sm dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedVariation("")
                        setVariationSearch("")
                        setVariationDropdownOpen(false)
                      }}
                    >
                      All Variations
                    </div>
                    {filteredVariations.map((variation) => (
                      <div
                        key={variation.id}
                        className={`px-3 py-2 text-sm cursor-pointer ${
                          selectedVariation === variation.id
                            ? "dark:bg-blue-600 bg-blue-100 dark:text-white text-blue-900"
                            : "dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setSelectedVariation(variation.id)
                          setVariationSearch(variation.name)
                          setVariationDropdownOpen(false)
                        }}
                      >
                        {variation.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Select with Autocomplete */}
            <div className="space-y-2 relative">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Customer
              </label>
              <div className="relative">
                <Input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setCustomerDropdownOpen(true)
                  }}
                  onFocus={() => setCustomerDropdownOpen(true)}
                  className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
                />
                {customerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 dark:bg-gray-700 bg-white border dark:border-gray-600 border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    <div
                      className="px-3 py-2 text-sm dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer("")
                        setCustomerSearch("")
                        setCustomerDropdownOpen(false)
                      }}
                    >
                      All Customers
                    </div>
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`px-3 py-2 text-sm cursor-pointer ${
                          selectedCustomer === customer.id
                            ? "dark:bg-blue-600 bg-blue-100 dark:text-white text-blue-900"
                            : "dark:text-gray-300 text-gray-700 hover:dark:bg-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setSelectedCustomer(customer.id)
                          setCustomerSearch(customer.name)
                          setCustomerDropdownOpen(false)
                        }}
                      >
                        {customer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Name Search */}
            <div className="space-y-2">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Customer Name
              </label>
              <Input
                placeholder="Search by name..."
                value={customerNameSearch}
                onChange={(e) => setCustomerNameSearch(e.target.value)}
                className="dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-gray-300"
              />
            </div>

            {/* Include Unpaid Checkbox */}
            <div className="space-y-2">
              <label className="text-xs font-medium dark:text-gray-400 text-gray-600 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" />
                Payment Status
              </label>
              <div className="flex items-center gap-2 px-3 py-2 dark:bg-gray-700 bg-gray-100 rounded-md border dark:border-gray-600 border-gray-300">
                <Checkbox
                  id="includeUnpaid"
                  checked={includeUnpaid}
                  onChange={(event) => setIncludeUnpaid(event.target.checked)}
                  className="dark:border-gray-500 border-gray-400"
                />
                <label
                  htmlFor="includeUnpaid"
                  className="text-sm dark:text-gray-300 text-gray-700 cursor-pointer"
                >
                  Include unpaid sales
                </label>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t dark:border-gray-700 border-gray-200">
              <span className="text-xs dark:text-gray-400 text-gray-600 py-1">Active filters:</span>
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.type}
                  variant="secondary"
                  className="dark:bg-blue-500/20 bg-blue-100 dark:text-blue-300 text-blue-700 cursor-pointer hover:dark:bg-blue-500/30 hover:bg-blue-200"
                  onClick={() => clearFilter(filter.type)}
                >
                  {filter.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <Card className="dark:bg-gradient-to-br dark:from-blue-900/50 dark:to-blue-800/30 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg dark:bg-blue-500/20 bg-blue-200">
                  <DollarSign className="h-4 w-4 dark:text-blue-300 text-blue-700" />
                </div>
                <ArrowUpRight className="h-4 w-4 dark:text-blue-400 text-blue-600" />
              </div>
              <p className="text-xs font-medium dark:text-blue-200 text-blue-700 uppercase tracking-wide mb-1">
                Total Revenue
              </p>
              <p className="text-xl font-bold dark:text-white text-blue-900">
                {formatCurrency(overallSummary.totalSalesRevenue)}
              </p>
              <p className="text-xs dark:text-blue-300 text-blue-600 mt-1">
                {overallSummary.totalTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="dark:bg-gradient-to-br dark:from-emerald-900/50 dark:to-emerald-800/30 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg dark:bg-emerald-500/20 bg-emerald-200">
                  <TrendingUp className="h-4 w-4 dark:text-emerald-300 text-emerald-700" />
                </div>
                <ArrowUpRight className="h-4 w-4 dark:text-emerald-400 text-emerald-600" />
              </div>
              <p className="text-xs font-medium dark:text-emerald-200 text-emerald-700 uppercase tracking-wide mb-1">
                Total Profit
              </p>
              <p className="text-xl font-bold dark:text-white text-emerald-900">
                {formatCurrency(overallSummary.totalProfit)}
              </p>
              <p className="text-xs dark:text-emerald-300 text-emerald-600 mt-1">
                {overallSummary.overallProfitMargin.toFixed(1)}% margin
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quantity Sold */}
        <Card className="dark:bg-gradient-to-br dark:from-amber-900/50 dark:to-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg dark:bg-amber-500/20 bg-amber-200">
                  <ShoppingCart className="h-4 w-4 dark:text-amber-300 text-amber-700" />
                </div>
                <span className="text-xs dark:text-amber-400 text-amber-600 font-medium">
                  {overallSummary.averageQuantityPerTransaction.toFixed(1)} avg
                </span>
              </div>
              <p className="text-xs font-medium dark:text-amber-200 text-amber-700 uppercase tracking-wide mb-1">
                Quantity Sold
              </p>
              <p className="text-xl font-bold dark:text-white text-amber-900">
                {overallSummary.totalQuantitySold.toLocaleString()}
              </p>
              <p className="text-xs dark:text-amber-300 text-amber-600 mt-1">units</p>
            </div>
          </CardContent>
        </Card>

        {/* Unique Products */}
        <Card className="dark:bg-gradient-to-br dark:from-purple-900/50 dark:to-purple-800/30 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg dark:bg-purple-500/20 bg-purple-200">
                  <Package className="h-4 w-4 dark:text-purple-300 text-purple-700" />
                </div>
                <Badge className="text-xs dark:bg-purple-500/30 bg-purple-200 dark:text-purple-300 text-purple-700 border-0">
                  {overallSummary.uniqueVariations} vars
                </Badge>
              </div>
              <p className="text-xs font-medium dark:text-purple-200 text-purple-700 uppercase tracking-wide mb-1">
                Products
              </p>
              <p className="text-xl font-bold dark:text-white text-purple-900">{overallSummary.uniqueProducts}</p>
              <p className="text-xs dark:text-purple-300 text-purple-600 mt-1">unique products</p>
            </div>
          </CardContent>
        </Card>

        {/* Unique Customers */}
        <Card className="dark:bg-gradient-to-br dark:from-cyan-900/50 dark:to-cyan-800/30 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:border-cyan-800">
          <CardContent className="pt-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg dark:bg-cyan-500/20 bg-cyan-200">
                  <Users className="h-4 w-4 dark:text-cyan-300 text-cyan-700" />
                </div>
              </div>
              <p className="text-xs font-medium dark:text-cyan-200 text-cyan-700 uppercase tracking-wide mb-1">
                Customers
              </p>
              <p className="text-xl font-bold dark:text-white text-cyan-900">{overallSummary.uniqueCustomers}</p>
              <p className="text-xs dark:text-cyan-300 text-cyan-600 mt-1">unique buyers</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Transaction */}
        <Card className="dark:bg-gradient-to-br dark:from-rose-900/50 dark:to-rose-800/30 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 dark:border-rose-800">
          <CardContent className="pt-5">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg dark:bg-rose-500/20 bg-rose-200">
                  <Target className="h-4 w-4 dark:text-rose-300 text-rose-700" />
                </div>
              </div>
              <p className="text-xs font-medium dark:text-rose-200 text-rose-700 uppercase tracking-wide mb-1">
                Avg Transaction
              </p>
              <p className="text-xl font-bold dark:text-white text-rose-900">
                {formatCurrency(overallSummary.averageTransactionValue)}
              </p>
              <p className="text-xs dark:text-rose-300 text-rose-600 mt-1">per sale</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="dark:bg-gray-800 bg-gray-100">
          <TabsTrigger value="overview" className="gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="variations" className="gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <Layers className="h-4 w-4" />
            Variations
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2 dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200">
            <Clock className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Product */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">
                  Revenue by Product
                </CardTitle>
                <CardDescription>Sales distribution across products</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={productRevenueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    />
                    <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit by Product */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">
                  Profit by Product
                </CardTitle>
                <CardDescription>Profit distribution across products</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={productRevenueData.filter((d) => d.profit > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="profit"
                    >
                      {productRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {productRevenueData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs dark:text-gray-400 text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales Trend Over Time */}
            <Card className="dark:bg-gray-800 bg-white lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Sales Trend</CardTitle>
                <CardDescription>Revenue and profit over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                      name="Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#profitGradient)"
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold dark:text-gray-200 text-gray-700">
                Product Performance
              </CardTitle>
              <CardDescription>Detailed breakdown by product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700 border-gray-200">
                    <TableHead className="dark:text-gray-400 text-gray-600">Product</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Qty Sold</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Revenue</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Profit</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Transactions</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Avg Price</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSummary.map((product, index) => (
                    <>
                      <TableRow
                        key={product.productId}
                        className="dark:border-gray-700 border-gray-200 cursor-pointer hover:dark:bg-gray-700/50 hover:bg-gray-50"
                        onClick={() =>
                          setExpandedProduct(expandedProduct === product.productId ? null : product.productId)
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: PRODUCT_COLORS[index % PRODUCT_COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium dark:text-gray-200 text-gray-900">{product.productName}</p>
                              <p className="text-xs dark:text-gray-500 text-gray-500">{product.productCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700 font-medium">
                          {product.totalQuantitySold}
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700 font-medium">
                          {formatCurrency(product.totalSales)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              product.totalProfit > 0 ? "text-emerald-500" : "dark:text-gray-500 text-gray-500"
                            }
                          >
                            {formatCurrency(product.totalProfit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700">
                          {product.transactionCount}
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700">
                          {formatCurrency(product.averageUnitPrice)}
                        </TableCell>
                        <TableCell>
                          {expandedProduct === product.productId ? (
                            <ChevronUp className="h-4 w-4 dark:text-gray-400 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 dark:text-gray-400 text-gray-600" />
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedProduct === product.productId && (
                        <TableRow className="dark:bg-gray-900 bg-gray-50">
                          <TableCell colSpan={7} className="p-4">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="dark:bg-gray-700/50 bg-white p-3 rounded-lg">
                                  <p className="text-xs dark:text-gray-400 text-gray-600">Unique Customers</p>
                                  <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                                    {product.uniqueCustomers}
                                  </p>
                                </div>
                                <div className="dark:bg-gray-700/50 bg-white p-3 rounded-lg">
                                  <p className="text-xs dark:text-gray-400 text-gray-600">Avg Qty/Transaction</p>
                                  <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                                    {product.averageQuantityPerTransaction.toFixed(1)}
                                  </p>
                                </div>
                                <div className="dark:bg-gray-700/50 bg-white p-3 rounded-lg">
                                  <p className="text-xs dark:text-gray-400 text-gray-600">First Sale</p>
                                  <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                                    {formatDate(product.oldestSale)}
                                  </p>
                                </div>
                                <div className="dark:bg-gray-700/50 bg-white p-3 rounded-lg">
                                  <p className="text-xs dark:text-gray-400 text-gray-600">Last Sale</p>
                                  <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                                    {formatDate(product.mostRecentSale)}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium dark:text-gray-300 text-gray-700 mb-2">
                                  Top Variations
                                </p>
                                <div className="space-y-2">
                                  {product.topVariations.map((variation) => (
                                    <div
                                      key={variation.variationId}
                                      className="flex items-center justify-between dark:bg-gray-700/30 bg-white p-2 rounded"
                                    >
                                      <div>
                                        <p className="text-sm dark:text-gray-300 text-gray-700">
                                          {variation.variationName}
                                        </p>
                                        <p className="text-xs dark:text-gray-500 text-gray-500">
                                          {variation.unitSize} {variation.unitOfMeasure}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium dark:text-gray-300 text-gray-700">
                                          {formatCurrency(variation.sales)}
                                        </p>
                                        <p className="text-xs dark:text-gray-500 text-gray-500">
                                          {variation.quantitySold} units
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variations Tab */}
        <TabsContent value="variations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profit Margin Chart */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">Profit Margins</CardTitle>
                <CardDescription>By variation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={profitMarginData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="name"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    />
                    <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
                      {profitMarginData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Variations Table */}
            <Card className="dark:bg-gray-800 bg-white lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold dark:text-gray-200 text-gray-700">
                  Variation Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700 border-gray-200">
                      <TableHead className="dark:text-gray-400 text-gray-600">Variation</TableHead>
                      <TableHead className="dark:text-gray-400 text-gray-600 text-right">Unit Size</TableHead>
                      <TableHead className="dark:text-gray-400 text-gray-600 text-right">Retail</TableHead>
                      <TableHead className="dark:text-gray-400 text-gray-600 text-right">Cost</TableHead>
                      <TableHead className="dark:text-gray-400 text-gray-600 text-right">Qty Sold</TableHead>
                      <TableHead className="dark:text-gray-400 text-gray-600 text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variationSummary.map((variation, index) => (
                      <TableRow key={variation.productVariationId} className="dark:border-gray-700 border-gray-200">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: PRODUCT_COLORS[index % PRODUCT_COLORS.length] }}
                            />
                            <div>
                              <p className="font-medium dark:text-gray-200 text-gray-900">{variation.variationName}</p>
                              <p className="text-xs dark:text-gray-500 text-gray-500">{variation.productName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700">
                          {variation.unitSize} {variation.unitOfMeasure}
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700">
                          {formatCurrency(variation.retailPrice)}
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700">
                          {formatCurrency(variation.costPrice)}
                        </TableCell>
                        <TableCell className="text-right dark:text-gray-300 text-gray-700">
                          {variation.totalQuantitySold}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={`${
                              variation.profitMarginPercentage > 50
                                ? "dark:bg-emerald-500/20 bg-emerald-100 dark:text-emerald-400 text-emerald-700"
                                : variation.profitMarginPercentage > 0
                                  ? "dark:bg-amber-500/20 bg-amber-100 dark:text-amber-400 text-amber-700"
                                  : "dark:bg-gray-500/20 bg-gray-100 dark:text-gray-400 text-gray-700"
                            } border-0`}
                          >
                            {variation.profitMarginPercentage.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Spend Chart */}
            <Card className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">
                  Customer Spending
                </CardTitle>
                <CardDescription>Total spent by customer</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={customerSpendData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="spent"
                    >
                      {customerSpendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {customerSpendData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs dark:text-gray-400 text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card className="dark:bg-gray-800 bg-white lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold dark:text-gray-200 text-gray-700">
                  Customer Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customerSummary.map((customer, index) => (
                  <div
                    key={customer.customerId}
                    className="dark:bg-gray-700/30 bg-gray-50 p-4 rounded-lg border dark:border-gray-700 border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: PRODUCT_COLORS[index % PRODUCT_COLORS.length] }}
                        >
                          {customer.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold dark:text-gray-200 text-gray-900">{customer.customerName}</p>
                          <p className="text-xs dark:text-gray-500 text-gray-500">{customer.customerPhone}</p>
                        </div>
                      </div>
                      <Badge className="dark:bg-blue-500/20 bg-blue-100 dark:text-blue-400 text-blue-700 border-0 capitalize">
                        {customer.customerType}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs dark:text-gray-500 text-gray-500">Total Spent</p>
                        <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs dark:text-gray-500 text-gray-500">Qty Purchased</p>
                        <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                          {customer.totalQuantityPurchased}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs dark:text-gray-500 text-gray-500">Transactions</p>
                        <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                          {customer.transactionCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs dark:text-gray-500 text-gray-500">Avg Transaction</p>
                        <p className="text-lg font-semibold dark:text-gray-200 text-gray-900">
                          {formatCurrency(customer.averageTransactionValue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t dark:border-gray-600 border-gray-200">
                      <div className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-600">
                        <Clock className="h-3 w-3" />
                        First: {formatDate(customer.firstPurchaseDate)}
                      </div>
                      <div className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-600">
                        <Clock className="h-3 w-3" />
                        Last: {formatDate(customer.lastPurchaseDate)}
                      </div>
                      <div className="flex items-center gap-1 text-xs dark:text-gray-400 text-gray-600">
                        <Package className="h-3 w-3" />
                        {customer.uniqueProducts} products
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-semibold dark:text-gray-200 text-gray-700">
                Recent Transactions
              </CardTitle>
              <CardDescription>Individual sale items with details</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700 border-gray-200">
                    <TableHead className="dark:text-gray-400 text-gray-600">Date</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600">Product</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600">Variation</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600">Customer</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Qty</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Unit Price</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Total</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600 text-right">Profit</TableHead>
                    <TableHead className="dark:text-gray-400 text-gray-600">Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesItems.map((item) => (
                    <TableRow key={item.id} className="dark:border-gray-700 border-gray-200">
                      <TableCell className="dark:text-gray-300 text-gray-700">
                        {formatDate(item.sale.saleDate)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium dark:text-gray-200 text-gray-900">{item.product.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm dark:text-gray-400 text-gray-600">{item.productVariation.name}</p>
                        <p className="text-xs dark:text-gray-500 text-gray-500">
                          {item.productVariation.unitSize} {item.productVariation.unitofMeasure}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="dark:text-gray-300 text-gray-700">{item.sale.customer ? item.sale.customer.name : "N/A"}</p>
                        <p className="text-xs dark:text-gray-500 text-gray-500 capitalize">
                          {item.sale.customer ? item.sale.customer.customerType : "N/A"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-medium dark:text-gray-300 text-gray-700">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right dark:text-gray-300 text-gray-700">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium dark:text-gray-200 text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={item.profitMargin > 0 ? "text-emerald-500" : "dark:text-gray-500 text-gray-500"}
                        >
                          {formatCurrency(item.profitMargin)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="dark:bg-blue-500/20 bg-blue-100 dark:text-blue-400 text-blue-700 border-0">
                          {item.sale.paymentMethod}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 2,
            backgroundColor: snackbar.severity === "error" ? "#EF4444" : "#10B981",
          },
        }}
      />
    </div>
  )
}
