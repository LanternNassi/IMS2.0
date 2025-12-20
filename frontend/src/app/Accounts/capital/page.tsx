"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  PieChart,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Download,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  CircleDollarSign,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Autocomplete, TextField, CircularProgress } from "@mui/material"
import api from "@/Utils/Request"
import { useToast } from "@/hooks/use-toast"
import PaginationControls from "@/components/PaginationControls"

interface CapitalAccount {
  id: string
  ownerId: string
  ownerName?: string
  type: "INITIAL_CAPITAL" | "PROFIT_DISTRIBUTION" | "WITHDRAWAL" | "ADDITIONAL_INVESTMENT"
  amount: number
  transactionDate: string
  owner?: User
  description: string
  referenceNumber: string
  linkedFinancialAccountId?: string
  linkedFinancialAccount?: FinancialAccount
  createdAt?: string
  updatedAt?: string
}

interface User {
  id: string
  username: string
  email: string
  gender?: string
  telephone?: string
  role?: string
}

interface FinancialAccount {
  id: string
  accountName: string
  type: string
  accountNumber: string
  balance: number
  bankName: string
  description: string
  isActive: boolean
}

interface TypeBreakdown {
  type: string
  count: number
  totalAmount: number
}

interface OwnerBreakdown {
  ownerId: string
  ownerName: string
  totalInvested: number
  totalWithdrawn: number
  netContribution: number
}

interface Metadata {
  totalCapital: number
  totalWithdrawals: number
  totalDistributions: number
  netEquity: number
  transactionCount: number
  typeBreakdown: TypeBreakdown[]
  ownerBreakdown: OwnerBreakdown[]
}

interface Pagination {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}


const COLORS = {
  INITIAL_CAPITAL: "#3b82f6",
  ADDITIONAL_INVESTMENT: "#10b981",
  WITHDRAWAL: "#ef4444",
  PROFIT_DISTRIBUTION: "#f59e0b",
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_CAPITAL: "Initial Capital",
  PROFIT_DISTRIBUTION: "Profit Distribution",
  WITHDRAWAL: "Withdrawal",
  ADDITIONAL_INVESTMENT: "Additional Investment",
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  INITIAL_CAPITAL: <Building className="h-4 w-4" />,
  ADDITIONAL_INVESTMENT: <TrendingUp className="h-4 w-4" />,
  WITHDRAWAL: <TrendingDown className="h-4 w-4" />,
  PROFIT_DISTRIBUTION: <CircleDollarSign className="h-4 w-4" />,
}

const CapitalAccountsPage = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [capitalAccounts, setCapitalAccounts] = useState<CapitalAccount[]>([])
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CapitalAccount | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<CapitalAccount | null>(null)

  // User autocomplete states
  const [userOptions, setUserOptions] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Financial account autocomplete states
  const [financialAccountOptions, setFinancialAccountOptions] = useState<FinancialAccount[]>([])
  const [selectedFinancialAccount, setSelectedFinancialAccount] = useState<FinancialAccount | null>(null)
  const [financialAccountLoading, setFinancialAccountLoading] = useState(false)
  const [financialAccountSearchQuery, setFinancialAccountSearchQuery] = useState("")

  
  const fetchCapitalAccounts = useCallback(
    async (page: number = 1, pageSize: number = 50) => {
      setIsLoading(true)
      try {
        const response = await api.get(`/CapitalAccounts?includeMetadata=true&page=${page}&pageSize=${pageSize}`)
        setCapitalAccounts(response.data.capitalTransactions || [])
        setMetadata(response.data.metadata || null)
        setPagination(response.data.pagination || {
          currentPage: 1,
          pageSize: 50,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        })
      } catch (error) {
        console.error("Error fetching capital accounts:", error)
        toast({
          title: "Capital Accounts Management",
          variant: "destructive",
          description: "Failed to load capital accounts.",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    fetchCapitalAccounts()
  }, [fetchCapitalAccounts])


  const handlePageChange = (newPage: number) => {
    fetchCapitalAccounts(newPage, pagination.pageSize)
  }

  const CheckIfBusinessDayisOpen = async (): Promise<boolean> => {
    const response = await api.get('/CashReconciliations/is-today-open')
    return response.data.isOpen as boolean
  }

  const handlePageSizeChange = (newPageSize: number) => {
    fetchCapitalAccounts(1, newPageSize)
  }

  const fetchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserOptions([])
      return
    }

    setUserLoading(true)
    try {
      const response = await api.get(`/Users?keywords=${encodeURIComponent(searchTerm)}`)
      setUserOptions(response.data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      setUserOptions([])
    } finally {
      setUserLoading(false)
    }
  }

  const fetchFinancialAccounts = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setFinancialAccountOptions([])
      return
    }

    setFinancialAccountLoading(true)
    try {
      const response = await api.get(
        `/FinancialAccounts?searchTerm=${encodeURIComponent(searchTerm)}&includeMetadata=false&page=1&pageSize=50`
      )
      setFinancialAccountOptions(response.data.financialAccounts || [])
    } catch (error) {
      console.error("Error fetching financial accounts:", error)
      setFinancialAccountOptions([])
    } finally {
      setFinancialAccountLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Shs ${(amount / 1000000000).toFixed(2)}B`
    } else if (amount >= 1000000) {
      return `Shs ${(amount / 1000000).toFixed(1)}M`
    }
    return `Shs ${amount.toLocaleString()}`
  }

  const formatFullCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const filteredAccounts = capitalAccounts.filter((account) => {
    const matchesSearch =
      account.owner?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || account.type === typeFilter
    return matchesSearch && matchesType
  })

  const pieChartData = metadata?.typeBreakdown?.map((item) => ({
    name: TYPE_LABELS[item.type] || item.type,
    value: item.totalAmount,
    count: item.count,
    color: COLORS[item.type as keyof typeof COLORS] || "#6b7280",
  })) || []

  const ownerChartData = metadata?.ownerBreakdown?.map((owner) => ({
    name: owner.ownerName,
    invested: owner.totalInvested,
    withdrawn: owner.totalWithdrawn,
    net: owner.netContribution,
  })) || []

  const handleEdit = (account: CapitalAccount) => {
    setEditingAccount(account)
    if (account.owner) {
      setSelectedUser(account.owner)
      setUserSearchQuery(account.owner.username)
    }
    // Note: If you have linkedFinancialAccount data in the response, pre-fill it here
    if (account.linkedFinancialAccount) {
      setSelectedFinancialAccount(account.linkedFinancialAccount)
      setFinancialAccountSearchQuery(account.linkedFinancialAccount.accountName)
    }
    setIsFormOpen(true)
  }

  const handleDelete = (account: CapitalAccount) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (accountToDelete) {
      try {
        await api.delete(`/CapitalAccounts/${accountToDelete.id}`)
        toast({
          title: "Capital Accounts Management",
          description: "Capital account successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
        fetchCapitalAccounts(pagination.currentPage, pagination.pageSize)
      } catch (error) {
        console.error("Error deleting capital account:", error)
        toast({
          title: "Capital Accounts Management",
          variant: "destructive",
          description: "An error occurred. Capital account couldn't be deleted.",
        })
      }
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingAccount(null)
    setSelectedUser(null)
    setUserSearchQuery("")
    setUserOptions([])
    setSelectedFinancialAccount(null)
    setFinancialAccountSearchQuery("")
    setFinancialAccountOptions([])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const isOpen = await CheckIfBusinessDayisOpen()

    if (!isOpen) {
      toast({
        title: "Capital Accounts Management",
        variant: "destructive",
        description: "Cannot save capital account. Business day is not open.",
      })
      return
    }

    const formData = new FormData(e.currentTarget)

    try {
      if (editingAccount) {
        // Update existing account
        const updatePayload = {
          amount: Number(formData.get("amount")),
          transactionDate: new Date(formData.get("date") as string).toISOString(),
          description: formData.get("description") as string,
          referenceNumber: formData.get("reference") as string,
        }

        await api.put(`/CapitalAccounts/${editingAccount.id}`, updatePayload)
        toast({
          title: "Capital Accounts Management",
          description: "Capital account successfully updated.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
      } else {
        // Create new account
        if (!selectedUser) {
          toast({
            title: "Capital Accounts Management",
            variant: "destructive",
            description: "Please select an owner.",
          })
          return
        }

        const createPayload = {
          ownerId: selectedUser.id,
          type: formData.get("type") as string,
          amount: Number(formData.get("amount")),
          transactionDate: new Date(formData.get("date") as string).toISOString(),
          description: formData.get("description") as string,
          referenceNumber: formData.get("reference") as string,
          linkedFinancialAccountId: selectedFinancialAccount?.id || null,
        }

        await api.post("/CapitalAccounts", createPayload)
        toast({
          title: "Capital Accounts Management",
          description: "Capital account successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        })
      }

      fetchCapitalAccounts(pagination.currentPage, pagination.pageSize)
      handleFormClose()
    } catch (error) {
      console.error("Error saving capital account:", error)
      toast({
        title: "Capital Accounts Management",
        variant: "destructive",
        description: `An error occurred. Capital account couldn't be ${editingAccount ? "updated" : "created"}.`,
      })
    }
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Capital Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track capital investments, withdrawals and distributions
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 bg-transparent"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              setEditingAccount(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Capital */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Capital</p>
                <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(metadata?.totalCapital || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{metadata?.transactionCount || 0} transactions</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Equity */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Net Equity</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(metadata?.netEquity || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">
                    {metadata?.totalCapital ? ((metadata.netEquity / metadata.totalCapital) * 100).toFixed(1) : 0}% retained
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Withdrawals */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(metadata?.totalWithdrawals || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">
                    {metadata?.totalCapital ? ((metadata.totalWithdrawals / metadata.totalCapital) * 100).toFixed(1) : 0}% of capital
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Distributions */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Distributions</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{formatCurrency(metadata?.totalDistributions || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Profit payouts</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <CircleDollarSign className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Owners Count */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Stakeholders</p>
                <p className="text-2xl font-bold text-foreground mt-1">{metadata?.ownerBreakdown?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active investors</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capital Distribution Pie Chart */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Capital Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatFullCurrency(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Breakdown Cards */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Transaction Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metadata?.typeBreakdown.map((item) => {
              const percentage = (item.totalAmount / metadata.totalCapital) * 100
              const color = COLORS[item.type as keyof typeof COLORS] || "#6b7280"
              return (
                <div
                  key={item.type}
                  className="p-3 rounded-lg bg-muted/50 dark:bg-gray-700/50 hover:bg-muted dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <span style={{ color }}>{TYPE_ICONS[item.type]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{TYPE_LABELS[item.type]}</p>
                        <p className="text-xs text-muted-foreground">{item.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color }}>
                        {formatCurrency(item.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted dark:bg-gray-600 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Owner Breakdown */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Stakeholder Contributions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metadata?.ownerBreakdown.map((owner, index) => {
              const sharePercentage = (owner.netContribution / metadata.netEquity) * 100
              const isExpanded = expandedOwner === owner.ownerId
              return (
                <div key={owner.ownerId} className="rounded-lg bg-muted/50 dark:bg-gray-700/50 overflow-hidden">
                  <button
                    className="w-full p-3 flex items-center justify-between hover:bg-muted dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setExpandedOwner(isExpanded ? null : owner.ownerId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {owner.ownerName.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{owner.ownerName}</p>
                        <p className="text-xs text-muted-foreground">{sharePercentage.toFixed(1)}% equity share</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-500">
                        {formatCurrency(owner.netContribution)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-border dark:border-gray-600 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Invested</span>
                        <span className="text-blue-500 font-medium">{formatCurrency(owner.totalInvested)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Withdrawn</span>
                        <span className="text-red-500 font-medium">{formatCurrency(owner.totalWithdrawn)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted dark:bg-gray-600 overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                          style={{ width: `${sharePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by owner, description or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px] dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INITIAL_CAPITAL">Initial Capital</SelectItem>
                <SelectItem value="ADDITIONAL_INVESTMENT">Additional Investment</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="PROFIT_DISTRIBUTION">Profit Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold">Owner</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Type</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Amount</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Description</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Reference</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No transactions found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((account) => {
                      const color = COLORS[account.type as keyof typeof COLORS] || "#6b7280"
                      return (
                        <TableRow
                          key={account.id}
                          className="dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-700/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                {account.owner?.username?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{account.owner?.username}</p>
                                <p className="text-xs text-muted-foreground">{account.owner?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${color}15`,
                                color: color,
                              }}
                            >
                              {TYPE_ICONS[account.type]}
                              {TYPE_LABELS[account.type]}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className="font-semibold"
                              style={{
                                color:
                                  account.type === "WITHDRAWAL" || account.type === "PROFIT_DISTRIBUTION"
                                    ? "#ef4444"
                                    : "#10b981",
                              }}
                            >
                              {account.type === "WITHDRAWAL" || account.type === "PROFIT_DISTRIBUTION" ? "-" : "+"}
                              {formatFullCurrency(account.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(account.transactionDate)}</TableCell>
                          <TableCell>
                            <span className="text-foreground max-w-[200px] truncate block">
                              {account.description || "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted dark:bg-gray-700 px-2 py-1 rounded">
                              {account.referenceNumber || "-"}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                                onClick={() => handleEdit(account)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                                onClick={() => handleDelete(account)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
          itemName="transactions"
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Transaction" : "Add Capital Transaction"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update the capital transaction details." : "Record a new capital transaction."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Autocomplete
                size="small"
                options={userOptions}
                getOptionLabel={(option) => option.username || ""}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                value={selectedUser}
                inputValue={userSearchQuery}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === "input") {
                    setUserSearchQuery(newInputValue)
                    fetchUsers(newInputValue)
                  } else if (reason === "reset") {
                    setUserSearchQuery(selectedUser?.username || "")
                  } else if (reason === "clear") {
                    setUserSearchQuery("")
                    setSelectedUser(null)
                    setUserOptions([])
                  }
                }}
                onChange={(_, newValue) => {
                  setSelectedUser(newValue)
                  setUserSearchQuery(newValue?.username || "")
                }}
                loading={userLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search owner..."
                    variant="outlined"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {userLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--input-bg)',
                        '& fieldset': {
                          borderColor: 'var(--input-border)',
                        },
                      },
                    }}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financialAccount">Linked Financial Account (Optional)</Label>
              <Autocomplete
                size="small"
                options={financialAccountOptions}
                getOptionLabel={(option) => `${option.accountName} - ${option.bankName}` || ""}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                value={selectedFinancialAccount}
                inputValue={financialAccountSearchQuery}
                onInputChange={(_, newInputValue, reason) => {
                  if (reason === "input") {
                    setFinancialAccountSearchQuery(newInputValue)
                    fetchFinancialAccounts(newInputValue)
                  } else if (reason === "reset") {
                    setFinancialAccountSearchQuery(selectedFinancialAccount?.accountName || "")
                  } else if (reason === "clear") {
                    setFinancialAccountSearchQuery("")
                    setSelectedFinancialAccount(null)
                    setFinancialAccountOptions([])
                  }
                }}
                onChange={(_, newValue) => {
                  setSelectedFinancialAccount(newValue)
                  setFinancialAccountSearchQuery(newValue?.accountName || "")
                }}
                loading={financialAccountLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search financial account..."
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {financialAccountLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'var(--input-bg)',
                        '& fieldset': {
                          borderColor: 'var(--input-border)',
                        },
                      },
                    }}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select name="type" defaultValue={editingAccount?.type || ""} required>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="INITIAL_CAPITAL">Initial Capital</SelectItem>
                  <SelectItem value="ADDITIONAL_INVESTMENT">Additional Investment</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="PROFIT_DISTRIBUTION">Profit Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0"
                defaultValue={editingAccount?.amount || ""}
                className="dark:bg-gray-700 dark:border-gray-600"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  editingAccount
                    ? new Date(editingAccount.transactionDate).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                className="dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Enter description..."
                defaultValue={editingAccount?.description || ""}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                name="reference"
                placeholder="Enter reference..."
                defaultValue={editingAccount?.referenceNumber || ""}
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleFormClose}
                className="dark:bg-gray-700 dark:border-gray-600 bg-transparent"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                {editingAccount ? "Update" : "Add"} Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this capital transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="dark:bg-gray-700 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CapitalAccountsPage
