"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2, Calendar, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { AddExpenditureDialog, type ExpenditureType, type ExpenditureCategory, type Expense } from "@/components/AddExpenditureDialog"
import api from "@/Utils/Request"
import { Snackbar } from "@mui/material"

const TYPE_COLORS: { type: ExpenditureType; color: string }[] = [
  { type: "UTILITIES", color: "#3B82F6" },
  { type: "PAYMENTS", color: "#10B981" },
  { type: "BENEFITS", color: "#F59E0B" },
  { type: "MISCELLANEOUS", color: "#8B5CF6" },
]

export default function ExpenditureManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenditureCategory[]>([])
  const [startDate, setStartDate] = useState(new Date(2025, 11, 1))
  const [endDate, setEndDate] = useState(new Date(2025, 11, 31))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get("/ExpenditureCategories")
      setCategories(response.data)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setSnackbar({ open: true, message: "Failed to load categories" })
    }
  }

  // Fetch expenditures with filters and metadata
  const fetchExpenditures = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        includeMetadata: "true",
      })

      const response = await api.get(`/Expenditures?${params}`)
      
      // Transform the data to match frontend format
      const expendituresData = response.data.expenditures || response.data
      const transformedExpenses = expendituresData.map((exp: any) => ({
        id: exp.id,
        name: exp.name,
        description: exp.description,
        amount: exp.amount,
        expenditureCategoryId: exp.expenditureCategoryId,
        expenditureCategory: exp.expenditureCategory,
        date: new Date(exp.addedAt || exp.date),
      }))
      
      setExpenses(transformedExpenses)
    } catch (err: any) {
      console.error("Error fetching expenditures:", err)
      setError("Failed to load expenditures. Please try again.")
      setSnackbar({ open: true, message: "Failed to load expenditures" })
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCategories()
    fetchExpenditures()
  }, [])

  // Refetch when date range changes
  useEffect(() => {
    fetchExpenditures()
  }, [startDate, endDate])

  const filteredExpenses = expenses.filter((exp) => exp.date >= startDate && exp.date <= endDate)

  const getTypeTotal = (type: ExpenditureType) => {
    return filteredExpenses.filter((exp) => exp.expenditureCategory?.type === type).reduce((sum, exp) => sum + exp.amount, 0)
  }

  const getTotalExpenditure = () => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  const chartData = TYPE_COLORS.map((item) => ({
    name: item.type,
    value: getTypeTotal(item.type),
    fill: item.color,
  })).filter((item) => item.value > 0)

  const typeExpenses = TYPE_COLORS.map((item) => ({
    type: item.type,
    color: item.color,
    total: getTypeTotal(item.type),
    count: filteredExpenses.filter((exp) => exp.expenditureCategory?.type === item.type).length,
  }))

  const handleAddExpense = (expense: Expense) => {
    // Refresh expenditures from API
    fetchExpenditures()
    setSnackbar({ open: true, message: `Expenditure "${expense.name}" added successfully` })
  }

  const handleAddCategory = (category: ExpenditureCategory) => {
    // Refresh categories from API
    fetchCategories()
    setSnackbar({ open: true, message: `Category "${category.name}" created successfully` })
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 p-6 space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-2">Expenditure Management</h1>
        <p className="dark:text-gray-400 text-gray-600">Track and manage all business expenses</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="dark:text-gray-400 text-gray-600">Loading expenditures...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Date Range and Total Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <Card className="dark:bg-gray-800 bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-semibold dark:text-gray-300 text-gray-700">Date Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 mb-2 block">Start Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 dark:text-gray-500 text-gray-400" />
                  <input
                    type="date"
                    value={startDate.toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                    className="flex-1 px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium dark:text-gray-400 text-gray-600 mb-2 block">End Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 dark:text-gray-500 text-gray-400" />
                  <input
                    type="date"
                    value={endDate.toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    className="flex-1 px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:text-white text-gray-900 rounded-md text-sm border dark:border-gray-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Expenditure Card */}
        <Card className="lg:col-span-2 dark:bg-gradient-to-br dark:from-blue-900 dark:to-blue-800 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold dark:text-blue-100 text-blue-900">
                Total Expenditure
              </CardTitle>
              <TrendingUp className="h-5 w-5 dark:text-blue-200 text-blue-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold dark:text-white text-blue-900 mb-2">
              Shs{" "}
              {getTotalExpenditure().toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs dark:text-blue-200 text-blue-700">{filteredExpenses.length} expenses recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {typeExpenses.map((item) => (
          <Card
            key={item.type}
            className="dark:bg-gray-800 bg-white hover:dark:bg-gray-750 hover:bg-gray-50 transition-colors"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold dark:text-gray-200 text-gray-700">{item.type}</CardTitle>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs dark:text-gray-400 text-gray-600 uppercase tracking-wide">Total Amount</p>
                <p className="text-2xl font-bold dark:text-white text-gray-900">
                  Shs {item.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-xs dark:text-gray-400 text-gray-600">{item.count} transactions</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="dark:bg-gray-800 bg-white lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Shs ${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center dark:text-gray-400 text-gray-600">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="dark:bg-gray-800 bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {typeExpenses.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium dark:text-gray-200 text-gray-700">{item.type}</span>
                    </div>
                    <span className="text-sm font-bold dark:text-white text-gray-900">
                      Shs {item.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.total / getTotalExpenditure()) * 100 || 0}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Items by Type */}
      <div className="space-y-6">
        {typeExpenses.map((item) => {
          const typeItems = filteredExpenses.filter((exp) => exp.expenditureCategory?.type === item.type)
          return (
            <Card key={item.type} className="dark:bg-gray-800 bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <div>
                      <CardTitle className="text-base">{item.type}</CardTitle>
                      <CardDescription>{typeItems.length} items</CardDescription>
                    </div>
                  </div>
                  <AddExpenditureDialog
                    selectedType={item.type}
                    categories={categories}
                    onAddExpense={handleAddExpense}
                    onAddCategory={handleAddCategory}
                    trigger={
                      <Button 
                        className="dark:bg-gray-900" 
                        size="sm" 
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                {typeItems.length > 0 ? (
                  <div className="rounded-lg border dark:border-gray-700 border-gray-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="dark:bg-gray-700 bg-gray-50">
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeItems.map((expense) => (
                          <TableRow key={expense.id} className="dark:hover:bg-gray-700 hover:bg-gray-50">
                            <TableCell className="text-sm font-medium">{expense.name}</TableCell>
                            <TableCell className="text-sm dark:text-gray-300 text-gray-600">
                              {expense.expenditureCategory?.name}
                            </TableCell>
                            <TableCell className="text-sm font-bold text-right">
                              Shs{" "}
                              {expense.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-sm dark:text-gray-300 text-gray-600">
                              {expense.date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-sm dark:text-gray-400 text-gray-500">
                              {expense.description || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 dark:hover:bg-red-900/20 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 dark:text-red-400 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center dark:text-gray-400 text-gray-600">
                    <p className="text-sm">No expenses recorded for this type</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
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
          },
        }}
      />
    </div>
  )
}
