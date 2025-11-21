"use client"

import { useState } from "react"
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

export default function AnalyticsDashboard() {
  const [darkMode] = useState(true)
  const [dateRange, setDateRange] = useState("thisMonth")

  

  // Sample data for charts
  const salesData = [
    { name: "Jan", total: 1500 },
    { name: "Feb", total: 2300 },
    { name: "Mar", total: 3200 },
    { name: "Apr", total: 2800 },
    { name: "May", total: 3600 },
    { name: "Jun", total: 4100 },
    { name: "Jul", total: 3800 },
    { name: "Aug", total: 4300 },
    { name: "Sep", total: 4800 },
    { name: "Oct", total: 5200 },
    { name: "Nov", total: 4900 },
    { name: "Dec", total: 5800 },
  ]

  const productCategoryData = [
    { name: "Electronics", value: 35 },
    { name: "Clothing", value: 25 },
    { name: "Food", value: 20 },
    { name: "Home", value: 15 },
    { name: "Other", value: 5 },
  ]

  const customerData = [
    { name: "New", value: 65 },
    { name: "Returning", value: 35 },
  ]

  const transactionData = [
    { name: "Mon", sales: 20, purchases: 15 },
    { name: "Tue", sales: 25, purchases: 18 },
    { name: "Wed", sales: 30, purchases: 20 },
    { name: "Thu", sales: 28, purchases: 22 },
    { name: "Fri", sales: 35, purchases: 25 },
    { name: "Sat", sales: 40, purchases: 30 },
    { name: "Sun", sales: 32, purchases: 18 },
  ]

  const supplierData = [
    { name: "Supplier A", value: 40 },
    { name: "Supplier B", value: 30 },
    { name: "Supplier C", value: 20 },
    { name: "Others", value: 10 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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
                    <Select value={dateRange} onValueChange={setDateRange}>
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
                    <Button className="dark:bg-gray-800" variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
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
                      <div className="text-2xl font-bold">$45,231.89</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-500 flex items-center">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          +20.1%
                        </span>{" "}
                        from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">2,345</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-500 flex items-center">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          +12.5%
                        </span>{" "}
                        from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,893</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-500 flex items-center">
                          <ArrowUp className="mr-1 h-3 w-3" />
                          +8.2%
                        </span>{" "}
                        from last month
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">42</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-red-500 flex items-center">
                          <ArrowDown className="mr-1 h-3 w-3" />
                          -4.5%
                        </span>{" "}
                        from last month
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
                              data={salesData}
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
                            <div className="flex items-center">
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">Laptop Pro</span>
                                  <span className="text-sm font-medium">$1,200</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">85 units sold</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">Wireless Earbuds</span>
                                  <span className="text-sm font-medium">$89</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: "70%" }}></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">70 units sold</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">Smart Watch</span>
                                  <span className="text-sm font-medium">$199</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: "65%" }}></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">65 units sold</div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">Bluetooth Speaker</span>
                                  <span className="text-sm font-medium">$79</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full" style={{ width: "50%" }}></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">50 units sold</div>
                              </div>
                            </div>
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
                              data={[
                                { name: "Electronics", stock: 450 },
                                { name: "Clothing", stock: 320 },
                                { name: "Food", stock: 280 },
                                { name: "Home", stock: 190 },
                                { name: "Other", stock: 120 },
                              ]}
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
                              <Bar dataKey="stock" fill="hsl(var(--primary))" />
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
                              data={productCategoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {productCategoryData.map((entry, index) => (
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
                              data={customerData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {customerData.map((entry, index) => (
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
                              data={[
                                { month: "Jan", customers: 120 },
                                { month: "Feb", customers: 145 },
                                { month: "Mar", customers: 162 },
                                { month: "Apr", customers: 190 },
                                { month: "May", customers: 210 },
                                { month: "Jun", customers: 252 },
                                { month: "Jul", customers: 265 },
                                { month: "Aug", customers: 280 },
                                { month: "Sep", customers: 310 },
                                { month: "Oct", customers: 335 },
                                { month: "Nov", customers: 360 },
                                { month: "Dec", customers: 390 },
                              ]}
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
                              data={transactionData}
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
                              data={[
                                { name: "Credit Card", value: 45 },
                                { name: "Cash", value: 30 },
                                { name: "Bank Transfer", value: 15 },
                                { name: "Mobile Payment", value: 10 },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {productCategoryData.map((entry, index) => (
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
                              data={supplierData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {supplierData.map((entry, index) => (
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
                              data={[
                                { name: "Supplier A", deliveryTime: 4.5, quality: 4.8 },
                                { name: "Supplier B", deliveryTime: 3.8, quality: 4.2 },
                                { name: "Supplier C", deliveryTime: 4.2, quality: 4.5 },
                                { name: "Supplier D", deliveryTime: 3.5, quality: 3.9 },
                                { name: "Supplier E", deliveryTime: 4.7, quality: 4.6 },
                              ]}
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
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-primary/10 p-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Order #12345</p>
                            <p className="text-xs text-muted-foreground">$1,234.56</p>
                          </div>
                          <div className="text-xs text-muted-foreground">2 hours ago</div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-primary/10 p-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Order #12344</p>
                            <p className="text-xs text-muted-foreground">$876.50</p>
                          </div>
                          <div className="text-xs text-muted-foreground">5 hours ago</div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-primary/10 p-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Payment Received</p>
                            <p className="text-xs text-muted-foreground">$2,500.00</p>
                          </div>
                          <div className="text-xs text-muted-foreground">Yesterday</div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-primary/10 p-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Order #12343</p>
                            <p className="text-xs text-muted-foreground">$345.00</p>
                          </div>
                          <div className="text-xs text-muted-foreground">Yesterday</div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-primary/10 p-2">
                            <Truck className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Supplier Delivery</p>
                            <p className="text-xs text-muted-foreground">50 units received</p>
                          </div>
                          <div className="text-xs text-muted-foreground">2 days ago</div>
                        </div>
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
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-destructive/10 p-2">
                            <Package className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Laptop Pro</p>
                            <p className="text-xs text-muted-foreground">Low stock (5 units)</p>
                          </div>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-destructive/10 p-2">
                            <Package className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Wireless Earbuds</p>
                            <p className="text-xs text-muted-foreground">Low stock (8 units)</p>
                          </div>
                          <Badge variant="destructive">Critical</Badge>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-yellow-500/10 p-2">
                            <Package className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Smart Watch</p>
                            <p className="text-xs text-muted-foreground">Low stock (12 units)</p>
                          </div>
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                            Warning
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-yellow-500/10 p-2">
                            <Calendar className="h-4 w-4 text-yellow-500" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Bluetooth Speaker</p>
                            <p className="text-xs text-muted-foreground">Expiring in 30 days</p>
                          </div>
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                            Warning
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 rounded-full bg-green-500/10 p-2">
                            <Package className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">USB-C Cable</p>
                            <p className="text-xs text-muted-foreground">Overstocked (200+ units)</p>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500">
                            Info
                          </Badge>
                        </div>
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
