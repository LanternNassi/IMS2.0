"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  CreditCard,
  Wallet,
  PiggyBank,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Landmark,
  DollarSign,
  ChevronDown,
  ChevronUp,
  X,
  Building,
  Banknote,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import api from "@/Utils/Request"
import { useToast } from "@/hooks/use-toast"
import PaginationControls from "@/components/PaginationControls"
import { set } from "date-fns"

// Types
interface FinancialAccount {
  id: string
  accountName: string
  type: "BANK" | "CASH" | "MOBILE_MONEY" | "CREDIT" | "SAVINGS"
  accountNumber: string
  balance: number
  bankName: string
  description: string
  isActive: boolean
  isDefault: boolean
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
}

interface AccountTypeBreakdown {
  type: string
  count: number
  totalBalance: number
}

interface Metadata {
  totalBalance: number
  totalAccounts: number
  activeAccounts: number
  inactiveAccounts: number
  accountTypeBreakdown: AccountTypeBreakdown[]
}

interface Pagination {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface AccountFormData {
  accountName: string
  type: "BANK" | "CASH" | "MOBILE_MONEY" | "CREDIT" | "SAVINGS"
  accountNumber: string
  balance: number
  bankName: string
  description: string
  isActive: boolean
  isDefault: boolean
}

type ReconciliationRow = {
  financialAccountId: string
  countedBalance: number
  notes: string
}


const accountTypeConfig = {
  BANK: { icon: Building2, color: "bg-blue-500", bgColor: "bg-blue-500/10", textColor: "text-blue-400" },
  CASH: { icon: Banknote, color: "bg-emerald-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-400" },
  MOBILE_MONEY: { icon: Wallet, color: "bg-amber-500", bgColor: "bg-amber-500/10", textColor: "text-amber-400" },
  CREDIT: { icon: CreditCard, color: "bg-rose-500", bgColor: "bg-rose-500/10", textColor: "text-rose-400" },
  SAVINGS: { icon: PiggyBank, color: "bg-violet-500", bgColor: "bg-violet-500/10", textColor: "text-violet-400" },
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  if (dateStr === "0001-01-01T00:00:00") return "N/A"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function FinancialAccountsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [metadata, setMetadata] = useState<Metadata>({
    totalBalance: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    inactiveAccounts: 0,
    accountTypeBreakdown: [],
  })
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null)
  const [formData, setFormData] = useState<AccountFormData>({
    accountName: "",
    type: "BANK",
    accountNumber: "",
    balance: 0,
    bankName: "",
    description: "",
    isActive: true,
    isDefault: false,
  })

  // Reconciliation states
  const [isOpenDayDialogOpen, setIsOpenDayDialogOpen] = useState(false)
  const [isCloseDayDialogOpen, setIsCloseDayDialogOpen] = useState(false)
  const [openBusinessDate, setOpenBusinessDate] = useState(new Date().toISOString().split("T")[0])
  const [closeBusinessDate, setCloseBusinessDate] = useState(new Date().toISOString().split("T")[0])
  const [openRows, setOpenRows] = useState<ReconciliationRow[]>([])
  const [closeRows, setCloseRows] = useState<ReconciliationRow[]>([])
  const [businessDayIsOpen, setBusinessDayIsOpen] = useState<boolean>(false)

  useEffect(() => {
    fetchFinancialAccounts()
    CheckIfBusinessDayisOpen()
  })

  const fetchFinancialAccounts = async (page: number = 1, pageSize: number = 50) => {
    setIsLoading(true)
    try {
      const response = await api.get(
        `/FinancialAccounts?includeMetadata=true&page=${page}&pageSize=${pageSize}`
      )
      setAccounts(response.data.financialAccounts || [])
      setMetadata(response.data.metadata || {
        totalBalance: 0,
        totalAccounts: 0,
        activeAccounts: 0,
        inactiveAccounts: 0,
        accountTypeBreakdown: [],
      })
      setPagination(response.data.pagination || {
        currentPage: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      })
    } catch (error) {
      console.error("Error fetching financial accounts:", error)
      toast({
        title: "Financial Accounts Management",
        variant: "destructive",
        description: "Failed to load financial accounts.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchFinancialAccounts(newPage, pagination.pageSize)
  }

  const CheckIfBusinessDayisOpen = async () => {
    const response = await api.get('/CashReconciliations/is-today-open')
    setBusinessDayIsOpen(response.data.isOpen as boolean)
  }


  const toBusinessDateUtc = (dateStr: string) => {
    return new Date(`${dateStr}T00:00:00Z`).toISOString()
  }

  // Filter accounts
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.bankName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "ALL" || account.type === filterType
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && account.isActive) ||
      (filterStatus === "INACTIVE" && !account.isActive)
    return matchesSearch && matchesType && matchesStatus
  })

  // Chart data
  const pieChartData = metadata.accountTypeBreakdown.map((item) => ({
    name: item.type.replace("_", " "),
    value: item.totalBalance,
    count: item.count,
  }))

  const barChartData = metadata.accountTypeBreakdown.map((item) => ({
    name: item.type.replace("_", " "),
    balance: item.totalBalance,
    count: item.count,
  }))

  const handleOpenForm = (account?: FinancialAccount) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        accountName: account.accountName,
        type: account.type,
        accountNumber: account.accountNumber,
        balance: account.balance,
        bankName: account.bankName,
        description: account.description,
        isActive: account.isActive,
        isDefault: account.isDefault,
      })
    } else {
      setEditingAccount(null)
      setFormData({
        accountName: "",
        type: "BANK",
        accountNumber: "",
        balance: 0,
        bankName: "",
        description: "",
        isActive: true,
        isDefault: false,
      })
    }
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingAccount(null)
  }

  const handleSaveAccount = async () => {
    try {
      if (editingAccount) {
        // Update existing account
        const updatePayload = {
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          balance: formData.balance,
          bankName: formData.bankName,
          description: formData.description,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
        }

        await api.put(`/FinancialAccounts/${editingAccount.id}`, updatePayload)
        toast({
          title: "Financial Accounts Management",
          description: "Financial account successfully updated.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
      } else {
        // Create new account
        const createPayload = {
          accountName: formData.accountName,
          type: formData.type,
          accountNumber: formData.accountNumber,
          balance: formData.balance,
          bankName: formData.bankName,
          description: formData.description,
          isActive: formData.isActive,
          isDefault: formData.isDefault,
        }

        await api.post("/FinancialAccounts", createPayload)
        toast({
          title: "Financial Accounts Management",
          description: "Financial account successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
      }

      fetchFinancialAccounts(pagination.currentPage, pagination.pageSize)
      handleCloseForm()
    } catch (error) {
      console.error("Error saving financial account:", error)
      toast({
        title: "Financial Accounts Management",
        variant: "destructive",
        description: `An error occurred. Financial account couldn't be ${editingAccount ? "updated" : "created"}.`,
      })
    }
  }

  const handleDeleteAccount = async (id: string) => {
    try {
      await api.delete(`/FinancialAccounts/${id}`)
      toast({
        title: "Financial Accounts Management",
        description: "Financial account successfully deleted.",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
      })
      fetchFinancialAccounts(pagination.currentPage, pagination.pageSize)
    } catch (error) {
      console.error("Error deleting financial account:", error)
      toast({
        title: "Financial Accounts Management",
        variant: "destructive",
        description: "An error occurred. Financial account couldn't be deleted.",
      })
    }
  }

  const toggleAccountStatus = async (id: string) => {
    const account = accounts.find((acc) => acc.id === id)
    if (!account) return

    try {
      const updatePayload = {
        accountName: account.accountName,
        accountNumber: account.accountNumber,
        balance: account.balance,
        bankName: account.bankName,
        description: account.description,
        isActive: !account.isActive,
      }

      await api.put(`/FinancialAccounts/${id}`, updatePayload)
      toast({
        title: "Financial Accounts Management",
        description: `Account ${!account.isActive ? "activated" : "deactivated"} successfully.`,
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
      })
      fetchFinancialAccounts(pagination.currentPage, pagination.pageSize)
    } catch (error) {
      console.error("Error toggling account status:", error)
      toast({
        title: "Financial Accounts Management",
        variant: "destructive",
        description: "An error occurred. Account status couldn't be changed.",
      })
    }
  }

  const handleOpenBusinessDay = async () => {
    try {
      if (openRows.length === 0) {
        toast({
          title: "No Accounts",
          variant: "destructive",
          description: "No accounts available to reconcile.",
        })
        return
      }

      const businessDateUtc = toBusinessDateUtc(openBusinessDate)
      const results = await Promise.allSettled(
        openRows.map((row) =>
          api.post("/CashReconciliations/open", {
            financialAccountId: row.financialAccountId,
            businessDateUtc,
            openingCountedBalance: row.countedBalance,
            notes: row.notes,
          })
        )
      )

      const failedCount = results.filter((r) => r.status === "rejected").length
      const successCount = results.length - failedCount

      if (failedCount === 0) {
        toast({
          title: "Business Day Opened",
          description: `Opened for ${successCount} account(s).`,
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
        setIsOpenDayDialogOpen(false)
        setOpenRows([])
      } else {
        toast({
          title: "Partial Success",
          variant: "destructive",
          description: `Opened for ${successCount} account(s). Failed for ${failedCount} account(s).`,
        })
      }
    } catch (error) {
      console.error("Error opening business day:", error)
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to open business day. Please try again.",
      })
    }
  }

  const handleCloseBusinessDay = async () => {
    try {
      if (closeRows.length === 0) {
        toast({
          title: "No Accounts",
          variant: "destructive",
          description: "No accounts available to reconcile.",
        })
        return
      }

      const businessDateUtc = toBusinessDateUtc(closeBusinessDate)
      const results = await Promise.allSettled(
        closeRows.map((row) =>
          api.post("/CashReconciliations/close", {
            financialAccountId: row.financialAccountId,
            businessDateUtc,
            closingCountedBalance: row.countedBalance,
            notes: row.notes,
          })
        )
      )

      const failedCount = results.filter((r) => r.status === "rejected").length
      const successCount = results.length - failedCount

      if (failedCount === 0) {
        toast({
          title: "Business Day Closed",
          description: `Closed for ${successCount} account(s).`,
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
        setIsCloseDayDialogOpen(false)
        setCloseRows([])
      } else {
        toast({
          title: "Partial Success",
          variant: "destructive",
          description: `Closed for ${successCount} account(s). Failed for ${failedCount} account(s).`,
        })
      }
    } catch (error) {
      console.error("Error closing business day:", error)
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to close business day. Please try again.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              Financial Accounts
            </h1>
            <p className="text-slate-400 mt-1">Manage and monitor all your financial accounts</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={businessDayIsOpen}
              onClick={() => {
                setOpenBusinessDate(new Date().toISOString().split("T")[0])
                setOpenRows(
                  accounts
                    .filter((acc) => acc.isActive)
                    .map((acc) => ({
                      financialAccountId: acc.id,
                      countedBalance: acc.balance || 0,
                      notes: "",
                    }))
                )
                setIsOpenDayDialogOpen(true)
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Open Day
            </Button>
            <Button
            disabled={!businessDayIsOpen}
              onClick={() => {
                setCloseBusinessDate(new Date().toISOString().split("T")[0])
                setCloseRows(
                  accounts
                    .filter((acc) => acc.isActive)
                    .map((acc) => ({
                      financialAccountId: acc.id,
                      countedBalance: acc.balance || 0,
                      notes: "",
                    }))
                )
                setIsCloseDayDialogOpen(true)
              }}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white gap-2"
            >
              <XCircle className="h-4 w-4" />
              Close Day
            </Button>
            <Button
              onClick={() => handleOpenForm()}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Total Balance</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metadata.totalBalance)}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">Across all accounts</span>
            </div>
          </div>

          {/* Total Accounts */}
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm font-medium">Total Accounts</p>
                <p className="text-2xl font-bold text-white mt-1">{metadata.totalAccounts}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Building className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <span>{metadata.accountTypeBreakdown.length} account types</span>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border border-cyan-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300 text-sm font-medium">Active Accounts</p>
                <p className="text-2xl font-bold text-white mt-1">{metadata.activeAccounts}</p>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${(metadata.activeAccounts / metadata.totalAccounts) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {((metadata.activeAccounts / metadata.totalAccounts) * 100).toFixed(0)}% of total
              </p>
            </div>
          </div>

          {/* Inactive Accounts */}
          <div className="bg-gradient-to-br from-slate-600/20 to-slate-800/20 border border-slate-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm font-medium">Inactive Accounts</p>
                <p className="text-2xl font-bold text-white mt-1">{metadata.inactiveAccounts}</p>
              </div>
              <div className="p-3 bg-slate-500/20 rounded-xl">
                <XCircle className="h-6 w-6 text-slate-400" />
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-400">
              {metadata.inactiveAccounts > 0 ? "Review inactive accounts" : "All accounts active"}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Distribution Pie Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Balance Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                            <p className="text-white font-medium">{payload[0].payload.name}</p>
                            <p className="text-slate-300 text-sm">{formatCurrency(payload[0].value as number)}</p>
                            <p className="text-slate-400 text-xs">{payload[0].payload.count} account(s)</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {pieChartData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-slate-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account Type Breakdown Bar Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Balance by Account Type</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} stroke="#64748b" />
                  <YAxis type="category" dataKey="name" stroke="#64748b" width={100} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
                            <p className="text-white font-medium">{payload[0].payload.name}</p>
                            <p className="text-slate-300 text-sm">
                              Balance: {formatCurrency(payload[0].value as number)}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="balance" radius={[0, 4, 4, 0]}>
                    {barChartData.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Account Type Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(accountTypeConfig).map(([type, config]) => {
            const typeData = metadata.accountTypeBreakdown.find((t) => t.type === type)
            const Icon = config.icon
            return (
              <div
                key={type}
                className={`${config.bgColor} border border-slate-700/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-105`}
                onClick={() => setFilterType(type === filterType ? "ALL" : type)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${config.color} rounded-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{type.replace("_", " ")}</p>
                    <p className={`text-lg font-bold ${config.textColor}`}>{typeData?.count || 0}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by account name, number, or bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Account Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="ALL" className="text-white">
                  All Types
                </SelectItem>
                <SelectItem value="BANK" className="text-white">
                  Bank
                </SelectItem>
                <SelectItem value="CASH" className="text-white">
                  Cash
                </SelectItem>
                <SelectItem value="MOBILE_MONEY" className="text-white">
                  Mobile Money
                </SelectItem>
                <SelectItem value="CREDIT" className="text-white">
                  Credit
                </SelectItem>
                <SelectItem value="SAVINGS" className="text-white">
                  Savings
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="ALL" className="text-white">
                  All Status
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-white">
                  Active
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-white">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-lg font-semibold text-white">Accounts ({filteredAccounts.length})</h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No accounts found</p>
              <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredAccounts.map((account) => {
                const config = accountTypeConfig[account.type]
                const Icon = config.icon
                const isExpanded = expandedAccountId === account.id

                return (
                  <div key={account.id} className="transition-colors hover:bg-slate-800/30">
                    {/* Account Row */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedAccountId(isExpanded ? null : account.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`p-3 ${config.color} rounded-xl shrink-0`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h4 className="text-white font-semibold truncate">{account.accountName}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${account.isActive
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-slate-500/20 text-slate-400"
                                }`}
                            >
                              {account.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-slate-400">{account.bankName}</span>
                            <span className="text-sm text-slate-500">{account.accountNumber}</span>
                          </div>
                        </div>

                        {/* Balance */}
                        <div className="text-right shrink-0">
                          <p className={`text-xl font-bold ${config.textColor}`}>{formatCurrency(account.balance)}</p>
                          <p className="text-xs text-slate-500 mt-1">{account.type.replace("_", " ")}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-white"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                              <DropdownMenuItem
                                className="text-white cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenForm(account)
                                }}
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-white cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleAccountStatus(account.id)
                                }}
                              >
                                {account.isActive ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAccount(account.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 bg-slate-800/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-700/50">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Description</p>
                            <p className="text-sm text-slate-300 mt-1">{account.description || "No description"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Account Number</p>
                            <p className="text-sm text-slate-300 mt-1 font-mono">{account.accountNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Created</p>
                            <p className="text-sm text-slate-300 mt-1">{formatDate(account.addedAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Last Updated</p>
                            <p className="text-sm text-slate-300 mt-1">{formatDate(account.updatedAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                            onClick={() => handleOpenForm(account)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Account
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            View Transactions
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && (
          <PaginationControls
            currentPage={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
            hasPreviousPage={pagination.hasPreviousPage}
            hasNextPage={pagination.hasNextPage}
            onPageChange={handlePageChange}
            itemName="accounts"
          />
        )}
      </div>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              {editingAccount ? "Edit Account" : "Add New Account"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Account Name</Label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., ABSA Main"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Account Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: AccountFormData["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="BANK" className="text-white">
                      Bank
                    </SelectItem>
                    <SelectItem value="CASH" className="text-white">
                      Cash
                    </SelectItem>
                    <SelectItem value="MOBILE_MONEY" className="text-white">
                      Mobile Money
                    </SelectItem>
                    <SelectItem value="CREDIT" className="text-white">
                      Credit
                    </SelectItem>
                    <SelectItem value="SAVINGS" className="text-white">
                      Savings
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Account Number</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g., 192039301"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Bank / Provider Name</Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., ABSA Bank"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Opening Balance</Label>
              <Input
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                placeholder="0"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the account..."
                rows={3}
                className="bg-slate-800 border-slate-700 text-white resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Active Status</p>
                <p className="text-sm text-slate-400">Enable to use this account for transactions</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Default Account</p>
                <p className="text-sm text-slate-400">Set as the default account for this type</p>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseForm}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveAccount}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {editingAccount ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Business Day Dialog */}
      <Dialog open={isOpenDayDialogOpen} onOpenChange={setIsOpenDayDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Open Business Day
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Business Date</Label>
              <Input
                type="date"
                value={openBusinessDate}
                onChange={(e) => setOpenBusinessDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">Applies to all accounts below</p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
              {openRows.map((row) => {
                const account = accounts.find((acc) => acc.id === row.financialAccountId)
                const actualBalance = account?.balance || 0
                const difference = row.countedBalance - actualBalance
                const notesRequired = difference !== 0

                return (
                  <div key={row.financialAccountId} className="border border-slate-800 rounded-lg p-3 bg-slate-900/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{account?.accountName ?? "Unknown Account"}</p>
                        <p className="text-xs text-slate-400">
                          {account?.type?.replace("_", " ") ?? ""}
                          {account?.isDefault ? " • Default" : ""}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Actual: {formatCurrency(actualBalance)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {difference === 0 ? (
                          <p className="text-xs text-emerald-400">✓ Matches</p>
                        ) : (
                          <p className="text-xs text-amber-400">
                            Diff: {formatCurrency(Math.abs(difference))} {difference > 0 ? "excess" : "shortage"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mt-3">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Opening Counted Balance</Label>
                        <Input
                          type="number"
                          value={row.countedBalance}
                          onChange={(e) => {
                            const next = Number(e.target.value)
                            setOpenRows((prev) =>
                              prev.map((r) =>
                                r.financialAccountId === row.financialAccountId ? { ...r, countedBalance: next } : r
                              )
                            )
                          }}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">
                          Notes {notesRequired ? <span className="text-rose-400">*</span> : "(Optional)"}
                        </Label>
                        <Textarea
                          value={row.notes}
                          onChange={(e) =>
                            setOpenRows((prev) =>
                              prev.map((r) =>
                                r.financialAccountId === row.financialAccountId ? { ...r, notes: e.target.value } : r
                              )
                            )
                          }
                          placeholder={
                            notesRequired
                              ? "Required: Explain the difference between counted and actual balance..."
                              : "Any notes for this account..."
                          }
                          rows={2}
                          className="bg-slate-800 border-slate-700 text-white resize-none"
                        />
                        {notesRequired && !row.notes.trim() ? (
                          <p className="text-xs text-rose-400">* Notes are required when there is a difference</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpenDayDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleOpenBusinessDay}
              disabled={(() => {
                if (openRows.length === 0) return true
                return openRows.some((row) => {
                  const account = accounts.find((acc) => acc.id === row.financialAccountId)
                  const actualBalance = account?.balance || 0
                  const difference = row.countedBalance - actualBalance
                  return difference !== 0 && !row.notes.trim()
                })
              })()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Open Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Business Day Dialog */}
      <Dialog open={isCloseDayDialogOpen} onOpenChange={setIsCloseDayDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <XCircle className="h-6 w-6 text-rose-500" />
              Close Business Day
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Business Date</Label>
              <Input
                type="date"
                value={closeBusinessDate}
                onChange={(e) => setCloseBusinessDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-400">Applies to all accounts below</p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
              {closeRows.map((row) => {
                const account = accounts.find((acc) => acc.id === row.financialAccountId)
                const actualBalance = account?.balance || 0
                const difference = row.countedBalance - actualBalance
                const notesRequired = difference !== 0

                return (
                  <div key={row.financialAccountId} className="border border-slate-800 rounded-lg p-3 bg-slate-900/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{account?.accountName ?? "Unknown Account"}</p>
                        <p className="text-xs text-slate-400">
                          {account?.type?.replace("_", " ") ?? ""}
                          {account?.isDefault ? " • Default" : ""}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Actual: {formatCurrency(actualBalance)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {difference === 0 ? (
                          <p className="text-xs text-emerald-400">✓ Matches</p>
                        ) : (
                          <p className="text-xs text-amber-400">
                            Diff: {formatCurrency(Math.abs(difference))} {difference > 0 ? "excess" : "shortage"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mt-3">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Closing Counted Balance</Label>
                        <Input
                          type="number"
                          value={row.countedBalance}
                          onChange={(e) => {
                            const next = Number(e.target.value)
                            setCloseRows((prev) =>
                              prev.map((r) =>
                                r.financialAccountId === row.financialAccountId ? { ...r, countedBalance: next } : r
                              )
                            )
                          }}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-300">
                          Notes {notesRequired ? <span className="text-rose-400">*</span> : "(Optional)"}
                        </Label>
                        <Textarea
                          value={row.notes}
                          onChange={(e) =>
                            setCloseRows((prev) =>
                              prev.map((r) =>
                                r.financialAccountId === row.financialAccountId ? { ...r, notes: e.target.value } : r
                              )
                            )
                          }
                          placeholder={
                            notesRequired
                              ? "Required: Explain the difference between counted and actual balance..."
                              : "Any notes for this account..."
                          }
                          rows={2}
                          className="bg-slate-800 border-slate-700 text-white resize-none"
                        />
                        {notesRequired && !row.notes.trim() ? (
                          <p className="text-xs text-rose-400">* Notes are required when there is a difference</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCloseDayDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCloseBusinessDay}
              disabled={(() => {
                if (closeRows.length === 0) return true
                return closeRows.some((row) => {
                  const account = accounts.find((acc) => acc.id === row.financialAccountId)
                  const actualBalance = account?.balance || 0
                  const difference = row.countedBalance - actualBalance
                  return difference !== 0 && !row.notes.trim()
                })
              })()}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Close Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
