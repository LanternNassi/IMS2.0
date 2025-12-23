"use client"

import { useState, useEffect } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import api from "@/Utils/Request"

export type ExpenditureType = "UTILITIES" | "PAYMENTS" | "BENEFITS" | "MISCELLANEOUS"

export type ExpenditureCategory = {
  id: string
  name: string
  description?: string
  type: ExpenditureType
}

export type Expense = {
  id: string
  name: string
  description: string
  amount: number
  expenditureCategoryId: string
  expenditureCategory?: ExpenditureCategory
  date: Date
}

interface AddExpenditureDialogProps {
  selectedType: ExpenditureType
  categories: ExpenditureCategory[]
  onAddExpense: (expense: Expense) => void
  onAddCategory: (category: ExpenditureCategory) => void
  trigger?: React.ReactNode
}

export function AddExpenditureDialog({
  selectedType,
  categories,
  onAddExpense,
  onAddCategory,
  trigger,
}: AddExpenditureDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    categoryId: "",
    newCategoryName: "",
    newCategoryDescription: "",
    date: new Date().toISOString().split("T")[0],
    linkedFinancialAccountId: "",
  })
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [financialAccounts, setFinancialAccounts] = useState<Array<{
    id: string;
    accountName: string;
    bankName: string;
    type: string;
  }>>([]);

  // Fetch financial accounts on component mount
  useEffect(() => {
    const fetchFinancialAccounts = async () => {
      try {
        const response = await api.get('/FinancialAccounts?includeMetadata=false&page=1&pageSize=100');
        setFinancialAccounts(response.data.financialAccounts || []);
      } catch (error) {
        console.error('Error fetching financial accounts:', error);
      }
    };
    fetchFinancialAccounts();
  }, [])

  const filteredCategories = categories.filter((c) => c.type === selectedType)

  const CheckIfBusinessDayisOpen = async (): Promise<boolean> => {
    const response = await api.get('/CashReconciliations/is-today-open')
    return response.data.isOpen as boolean
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isOpen = await CheckIfBusinessDayisOpen()

    if (!isOpen) {
      setError("Cannot add expenditure. Business day is not open.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let categoryId = formData.categoryId
      let category = categories.find((c) => c.id === categoryId)

      // Create new category if needed
      if (isCreatingCategory && formData.newCategoryName) {
        const categoryPayload = {
          name: formData.newCategoryName,
          description: formData.newCategoryDescription || "",
          type: selectedType,
        }

        const categoryResponse = await api.post("/ExpenditureCategories", categoryPayload)
        const newCategory: ExpenditureCategory = {
          id: categoryResponse.data.id,
          name: categoryResponse.data.name,
          description: categoryResponse.data.description,
          type: categoryResponse.data.type,
        }
        onAddCategory(newCategory)
        categoryId = newCategory.id
        category = newCategory
      }

      // Create new expenditure
      const expenditurePayload = {
        name: formData.name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenditureCategoryId: categoryId,
        linkedFinancialAccountId: formData.linkedFinancialAccountId || null,
      }

      const expenditureResponse = await api.post("/Expenditures", expenditurePayload)
      const newExpense: Expense = {
        id: expenditureResponse.data.id,
        name: expenditureResponse.data.name,
        description: expenditureResponse.data.description,
        amount: expenditureResponse.data.amount,
        expenditureCategoryId: expenditureResponse.data.expenditureCategoryId,
        expenditureCategory: category,
        date: new Date(formData.date),
      }

      onAddExpense(newExpense)

      // Reset form and close dialog
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      console.error("Error creating expenditure:", err)
      setError("Failed to create expenditure. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      amount: "",
      categoryId: "",
      newCategoryName: "",
      newCategoryDescription: "",
      date: new Date().toISOString().split("T")[0],
      linkedFinancialAccountId: "",
    })
    setIsCreatingCategory(false)
    setError(null)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="dark:bg-gray-900" size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 bg-white max-w-2xl" transparent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Expenditure</DialogTitle>
          <DialogDescription>Record a new expense for {selectedType} category</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Expense Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Office Rent"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Shs) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Expenditure Category *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs"
              >
                {isCreatingCategory ? (
                  <>
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" /> New Category
                  </>
                )}
              </Button>
            </div>
            {isCreatingCategory ? (
              <div className="space-y-3 p-4 border dark:border-gray-600 rounded-lg">
                <Input
                  placeholder="Category name"
                  value={formData.newCategoryName}
                  onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                  required={isCreatingCategory}
                  className="dark:bg-gray-700 dark:border-gray-600"
                />
                <Textarea
                  placeholder="Category description (optional)"
                  value={formData.newCategoryDescription}
                  onChange={(e) => setFormData({ ...formData, newCategoryDescription: e.target.value })}
                  className="dark:bg-gray-700 dark:border-gray-600 resize-none"
                  rows={2}
                />
              </div>
            ) : (
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                required={!isCreatingCategory}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} {cat.description && `- ${cat.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Financial Account */}
          <div className="space-y-2">
            <Label htmlFor="financialAccount">Financial Account (Optional)</Label>
            <Select
              value={formData.linkedFinancialAccountId || undefined}
              onValueChange={(value) => setFormData({ ...formData, linkedFinancialAccountId: value })}
            >
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600" id="financialAccount">
                <SelectValue placeholder="Select financial account (optional)" />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-white">
                {financialAccounts
                  .filter(account => account.type !== 'CREDIT')
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id} className="dark:text-white">
                      {account.accountName} - {account.bankName} ({account.type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description/Notes *</Label>
            <Textarea
              id="description"
              placeholder="Add details about this expense..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="dark:bg-gray-700 dark:border-gray-600 resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="dark:bg-gray-600"
              onClick={() => {
                setIsDialogOpen(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Expenditure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
