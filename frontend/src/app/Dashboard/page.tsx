"use client"

import { useState, useEffect } from "react"
import {
  ArrowDown,
  ArrowUp,  
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"
import { useDashboardStore } from "@/store/useDashboardStore"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsDashboard() {
  const [darkMode] = useState(true)
  const [dateRange, setDateRange] = useState("thisMonth")
  
  const {
    summary,
    sales,
    products,
    customers,
    transactions,
    suppliers,
    recentTransactions,
    inventoryAlerts,
    loading,
    error,
    fetchDashboardData,
    refreshDashboard,
  } = useDashboardStore()

  useEffect(() => {
    fetchDashboardData(dateRange)
  }, [dateRange, fetchDashboardData])

  const handleRefresh = () => {
    refreshDashboard(dateRange)
  }

  const handleDateRangeChange = (value: string) => {
    setDateRange(value)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`min-h-screen dark:bg-gray-900`}>
      <div className="flex bg-background dark:bg-gray-950 text-foreground">
            
          <div className="flex flex-col flex-1">
            

            <main className="flex-1 overflow-auto p-6 bg-muted/40 dark:bg-gray-900">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Dashboard Analytics</h1>
                    <p className="text-muted-foreground">Overview of your inventory system performance</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={dateRange} onValueChange={handleDateRangeChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      className="dark:bg-gray-800" 
                      variant="outline" 
                      size="icon"
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="dark:bg-gray-800" variant="outline" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "Loading..." : summary ? formatCurrency(summary.totalRevenue) : "UGX 0.00"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {summary && summary.revenueChange !== 0 && (
                          <span className={`${summary.revenueChange > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                            {summary.revenueChange > 0 ? (
                              <ArrowUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDown className="mr-1 h-3 w-3" />
                            )}
                            {summary.revenueChange > 0 ? '+' : ''}{summary.revenueChange.toFixed(1)}%
                          </span>
                        )}
                        {summary && summary.revenueChange === 0 && (
                          <span className="text-muted-foreground">No change</span>
                        )}
                        {!summary && !loading && <span className="text-muted-foreground">No data</span>}
                        {" "}from last period
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "Loading..." : summary ? summary.totalProducts.toLocaleString() : "0"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {summary && summary.productsChange !== 0 && (
                          <span className={`${summary.productsChange > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                            {summary.productsChange > 0 ? (
                              <ArrowUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDown className="mr-1 h-3 w-3" />
                            )}
                            {summary.productsChange > 0 ? '+' : ''}{summary.productsChange.toFixed(1)}%
                          </span>
                        )}
                        {summary && summary.productsChange === 0 && (
                          <span className="text-muted-foreground">No change</span>
                        )}
                        {!summary && !loading && <span className="text-muted-foreground">No data</span>}
                        {" "}from last period
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "Loading..." : summary ? summary.activeCustomers.toLocaleString() : "0"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {summary && summary.customersChange !== 0 && (
                          <span className={`${summary.customersChange > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                            {summary.customersChange > 0 ? (
                              <ArrowUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDown className="mr-1 h-3 w-3" />
                            )}
                            {summary.customersChange > 0 ? '+' : ''}{summary.customersChange.toFixed(1)}%
                          </span>
                        )}
                        {summary && summary.customersChange === 0 && (
                          <span className="text-muted-foreground">No change</span>
                        )}
                        {!summary && !loading && <span className="text-muted-foreground">No data</span>}
                        {" "}from last period
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "Loading..." : summary ? summary.pendingOrders.toLocaleString() : "0"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {summary && summary.pendingOrdersChange !== 0 && (
                          <span className={`${summary.pendingOrdersChange > 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                            {summary.pendingOrdersChange > 0 ? (
                              <ArrowUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDown className="mr-1 h-3 w-3" />
                            )}
                            {summary.pendingOrdersChange > 0 ? '+' : ''}{summary.pendingOrdersChange.toFixed(1)}%
                          </span>
                        )}
                        {summary && summary.pendingOrdersChange === 0 && (
                          <span className="text-muted-foreground">No change</span>
                        )}
                        {!summary && !loading && <span className="text-muted-foreground">No data</span>}
                        {" "}from last period
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Section */}
                <Tabs defaultValue="sales" className="space-y-4 dark:bg-gray-900">
                  <TabsList className="dark:bg-gray-800">
                    <TabsTrigger className="dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200" value="sales">Sales</TabsTrigger>
                    <TabsTrigger className="dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200" value="products">Products</TabsTrigger>
                    <TabsTrigger className="dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200" value="customers">Customers</TabsTrigger>
                    <TabsTrigger className="dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200" value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger className="dark:data-[state=active]:bg-gray-700 data-[state=active]:bg-gray-200" value="suppliers">Suppliers</TabsTrigger>
                  </TabsList>

                  {/* Sales Tab */}
                  <TabsContent value="sales" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>Sales Overview</CardTitle>
                          <CardDescription>Monthly sales performance</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={sales?.monthlySales || []}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  color: "hsl(var(--card-foreground))",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary) / 0.2)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Selling Products</CardTitle>
                          <CardDescription>This month</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {loading ? (
                              <div className="text-center text-muted-foreground">Loading...</div>
                            ) : sales?.topProducts && sales.topProducts.length > 0 ? (
                              sales.topProducts.map((product, index) => {
                                const maxUnits = Math.max(...sales.topProducts.map(p => p.unitsSold))
                                const percentage = maxUnits > 0 ? (product.unitsSold / maxUnits) * 100 : 0
                                return (
                                  <div key={index} className="flex items-center">
                                    <div className="w-full">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium">{product.name}</span>
                                          <span className="text-sm font-medium">UGX {product.price.toLocaleString()}</span>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">{product.unitsSold} units sold</div>
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="text-center text-muted-foreground">No data available</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Products Tab */}
                  <TabsContent value="products" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>Product Inventory Status</CardTitle>
                          <CardDescription>Current stock levels by category</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={products?.inventoryByCategory || []}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  color: "hsl(var(--card-foreground))",
                                }}
                              />
                              <Bar dataKey="stock" fill="hsl(var(--primary))" name="Stock" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Product Categories</CardTitle>
                          <CardDescription>Distribution by category</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <>
                            <Pie
                              data={products?.categoryDistribution || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {(products?.categoryDistribution || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                color: "hsl(var(--card-foreground))",
                              }}
                            />
                            </>
                            
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Customers Tab */}
                  <TabsContent value="customers" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle>Customer Types</CardTitle>
                          <CardDescription>New vs Returning</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                          <>
                          <Pie
                              data={customers?.customerTypes || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {(customers?.customerTypes || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                color: "hsl(var(--card-foreground))",
                              }}
                            />
                          </>
                            
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>Customer Growth</CardTitle>
                          <CardDescription>Monthly customer acquisition</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={customers?.monthlyGrowth || []}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="month" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  color: "hsl(var(--card-foreground))",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="customers"
                                name="Customers"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Transactions Tab */}
                  <TabsContent value="transactions" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>Transaction Overview</CardTitle>
                          <CardDescription>Sales vs Purchases (Weekly)</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={transactions?.weeklyTransactions || []}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  color: "hsl(var(--card-foreground))",
                                }}
                              />
                              <Legend />
                              <Bar dataKey="sales" fill="#0088FE" name="Sales" />
                              <Bar dataKey="purchases" fill="#00C49F" name="Purchases" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Payment Methods</CardTitle>
                          <CardDescription>Transaction distribution</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <>
                            <Pie
                              data={transactions?.paymentMethods || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {(transactions?.paymentMethods || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                color: "hsl(var(--card-foreground))",
                              }}
                            />
                            </>
                            
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Suppliers Tab */}
                  <TabsContent value="suppliers" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle>Top Suppliers</CardTitle>
                          <CardDescription>By purchase volume</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <>
                            <Pie
                              data={suppliers?.topSuppliers || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {(suppliers?.topSuppliers || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                color: "hsl(var(--card-foreground))",
                              }}
                            />
                            </>
                            
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>Supplier Performance</CardTitle>
                          <CardDescription>Delivery time and quality rating</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={suppliers?.supplierPerformance || []}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  borderColor: "hsl(var(--border))",
                                  color: "hsl(var(--card-foreground))",
                                }}
                              />
                              <Legend />
                              <Bar dataKey="deliveryTime" fill="#0088FE" name="Delivery Time (days)" />
                              <Bar dataKey="quality" fill="#00C49F" name="Quality Rating (0-5)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Recent Activity */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Latest 5 transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="text-center text-muted-foreground">Loading...</div>
                        ) : recentTransactions && recentTransactions.length > 0 ? (
                          recentTransactions.map((transaction, index) => (
                            <div key={index} className="flex items-center">
                              <div className="mr-4 rounded-full bg-primary/10 p-2">
                                {transaction.type === 'sale' ? (
                                  <ShoppingCart className="h-4 w-4 text-primary" />
                                ) : transaction.type === 'purchase' ? (
                                  <Truck className="h-4 w-4 text-primary" />
                                ) : (
                                  <CreditCard className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{transaction.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.type === 'purchase' ? `From: ${transaction.description}` : formatCurrency(transaction.amount)}
                                </p>
                              </div>
                              <div className="text-xs text-muted-foreground">{formatDate(transaction.date)}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground">No recent transactions</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full dark:bg-gray-800">
                        View All Transactions
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Alerts</CardTitle>
                      <CardDescription>Items requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading ? (
                          <div className="text-center text-muted-foreground">Loading...</div>
                        ) : inventoryAlerts && inventoryAlerts.length > 0 ? (
                          inventoryAlerts.map((alert, index) => {
                            const getIcon = () => {
                              if (alert.type === 'expiring') return <Calendar className="h-4 w-4" />
                              return <Package className="h-4 w-4" />
                            }
                            const getColor = () => {
                              if (alert.severity === 'critical') return 'destructive'
                              if (alert.severity === 'warning') return 'yellow-500'
                              return 'green-500'
                            }
                            const color = getColor()
                            return (
                              <div key={index} className="flex items-center">
                                <div className={`mr-4 rounded-full bg-${color}/10 p-2`}>
                                  <div className={`text-${color}`}>
                                    {getIcon()}
                                  </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <p className="text-sm font-medium leading-none">{alert.productName}</p>
                                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                                </div>
                                <Badge 
                                  variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
                                  className={alert.severity !== 'critical' ? `text-${color} border-${color}` : ''}
                                >
                                  {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
                                </Badge>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-center text-muted-foreground">No alerts</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full dark:bg-gray-800">
                        View All Alerts
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </main>
          </div>
      </div>
    </div>
  )
}
