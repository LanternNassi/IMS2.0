"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
import { useTransactionStore, Transaction, TransactionDto } from "@/store/useTransactionStore";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import { TextField, MenuItem } from "@mui/material";
import Pagination from '@mui/material/Pagination';
import Edit from "@/components/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast";
import Dialog from "@/components/Dialog";
import api from "@/Utils/Request";

const page = () => {
  const [editRow, setEditRow] = useState<Transaction | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [filters, setFilters] = React.useState({
    searchTerm: "",
    fromAccountId: "",
    toAccountId: "",
    type: "",
    status: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });
  const { toast } = useToast();
  const {
    isLoading,
    createTransaction,
    fetchTransactions,
    getTransactionById,
    deleteTransaction,
    updateTransaction,
    transactions,
    pagination,
  } = useTransactionStore((state) => state);
  const [submitting, setsubmitting] = useState<boolean>(false);
  const [financialAccounts, setFinancialAccounts] = useState<Array<{
    id: string;
    accountName: string;
    bankName: string;
    type: string;
  }>>([]);

  useEffect(() => {
    const params: any = {};
    if (filters.searchTerm) params.searchTerm = filters.searchTerm;
    if (filters.fromAccountId) params.fromAccountId = filters.fromAccountId;
    if (filters.toAccountId) params.toAccountId = filters.toAccountId;
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.minAmount) params.minAmount = filters.minAmount;
    if (filters.maxAmount) params.maxAmount = filters.maxAmount;

    fetchTransactions(params, currentPage);
  }, [fetchTransactions, currentPage, filters]);

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
  }, []);

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      fromAccountId: "",
      toAccountId: "",
      type: "",
      status: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.startsWith("0001-01-01")) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toDatetimeLocalValue = (isoLike?: string) => {
    if (!isoLike) return "";
    const date = new Date(isoLike);
    if (Number.isNaN(date.getTime())) {
      // Fallback for already-trimmed strings
      return isoLike.replace("Z", "").slice(0, 16);
    }
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  };

  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          id="from-account-select"
          select
          name="fromFinancialAccountId"
          label="From Account *"
          defaultValue={editRow ? editRow.fromFinancialAccountId : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        >
          {financialAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.accountName} - {account.bankName} ({account.type})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          id="to-account-select"
          select
          name="toFinancialAccountId"
          label="To Account *"
          defaultValue={editRow ? editRow.toFinancialAccountId : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        >
          {financialAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.accountName} - {account.bankName} ({account.type})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          variant="outlined"
          id="movement-date"
          name="movementDate"
          label="Movement Date *"
          type="datetime-local"
          defaultValue={
            editRow?.movementDate
              ? toDatetimeLocalValue(editRow.movementDate)
              : toDatetimeLocalValue(new Date().toISOString())
          }
          sx={{ width: "25vw" }}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="amount"
          label="Amount (Shs)"
          type="number"
          defaultValue={editRow ? editRow.amount : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          id="transaction-type-select"
          select
          name="type"
          label="Transaction Type *"
          defaultValue={editRow ? editRow.type : "TRANSFER"}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        >
          <MenuItem value="TRANSFER">Transfer</MenuItem>
          <MenuItem value="DEPOSIT">Deposit</MenuItem>
          <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
          <MenuItem value="PAYMENT">Payment</MenuItem>
          <MenuItem value="REFUND">Refund</MenuItem>
          <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
        </TextField>

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="referenceNumber"
          label="Reference Number"
          defaultValue={editRow ? editRow.referenceNumber : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="fees"
          label="Fees (Shs)"
          type="number"
          defaultValue={editRow ? editRow.fees : "0"}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="description"
          label="Description"
          defaultValue={editRow ? editRow.description : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          multiline
          rows={2}
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="notes"
          label="Notes (Optional)"
          defaultValue={editRow ? editRow.notes : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          multiline
          rows={2}
        />

        <LoadingButton
          type="submit"
          sx={{ width: "25vw", height: "8vh" }}
          variant="contained"
          tabIndex={-1}
          loading={submitting}
          loadingPosition="start"
          startIcon={<SaveIcon fontSize="large" />}
        >
          <span>Submit</span>
        </LoadingButton>
      </>
    );
  };

  const handleEdit = async (id: string) => {
    const transaction = await getTransactionById(id);
    if (transaction) {
      setEditRow(transaction);
    }
    setedit(true);
  };

  const editTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editRow) {
      const formData = new FormData(event.target as HTMLFormElement);

      const movementDateInput = (formData.get("movementDate") as string) || "";
      const movementDate = movementDateInput ? new Date(movementDateInput).toISOString() : undefined;

      const updatedTransaction: TransactionDto = {
        fromFinancialAccountId: formData.get("fromFinancialAccountId") as string,
        toFinancialAccountId: formData.get("toFinancialAccountId") as string,
        movementDate: movementDate || new Date().toISOString(),
        amount: parseFloat(formData.get("amount") as string),
        type: formData.get("type") as Transaction["type"],
        referenceNumber: formData.get("referenceNumber") as string,
        description: formData.get("description") as string,
        notes: formData.get("notes") as string || undefined,
        fees: parseFloat(formData.get("fees") as string),
      };

      await updateTransaction(
        { ...editRow, ...updatedTransaction },
        () => {
          toast({
            title: "Transaction Management",
            description: "Transaction successfully updated.",
            className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
          });
          fetchTransactions(null, currentPage);
          setedit(false);
        },
        () => {
          toast({
            title: "Transaction Management",
            variant: "destructive",
            description: "An error occurred. Transaction couldn't be updated.",
          });
        }
      );
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(
      id,
      () => {
        toast({
          title: "Transaction Management",
          description: "Transaction successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchTransactions(null, currentPage);
      },
      () => {
        toast({
          title: "Transaction Management",
          variant: "destructive",
          description: "An error occurred. Transaction couldn't be deleted.",
        });
        fetchTransactions(null, currentPage);
      }
    );
  };

  const CheckIfBusinessDayisOpen = async (): Promise<boolean> => {
    const response = await api.get('/CashReconciliations/is-today-open')
    return response.data.isOpen as boolean
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isOpen = CheckIfBusinessDayisOpen()
    if (!isOpen) {
      toast({
        title: "Transaction Management",
        variant: "destructive",
        description: "Cannot add transaction. Business day is not open.",
      });
      return
    }

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const movementDateInput = (formData.get("movementDate") as string) || "";
    const movementDate = movementDateInput ? new Date(movementDateInput).toISOString() : undefined;

    const data: TransactionDto = {
      fromFinancialAccountId: formData.get("fromFinancialAccountId") as string,
      toFinancialAccountId: formData.get("toFinancialAccountId") as string,
      movementDate: movementDate || new Date().toISOString(),
      amount: parseFloat(formData.get("amount") as string),
      type: formData.get("type") as Transaction["type"],
      referenceNumber: formData.get("referenceNumber") as string,
      description: formData.get("description") as string,
      notes: formData.get("notes") as string || undefined,
      fees: parseFloat(formData.get("fees") as string),
    };

    createTransaction(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "Transaction Management",
          description: "Transaction successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchTransactions(null, currentPage);
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "Transaction Management",
          variant: "destructive",
          description: "An error occurred. Transaction couldn't be added.",
        });
      }
    );
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold mb-4 dark:text-white text-gray-900">Manage Transactions</h2>

        <div className="space-x-4">
          <Button
            onClick={() => {
              setEditRow(null);
              setedit(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>Add
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-print mr-2"></i>Print
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-file-excel mr-2"></i>Export To Excel
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-4 mb-4 dark:bg-gray-800 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TextField
            label="Search"
            placeholder="Search transactions..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          />

          <TextField
            select
            label="From Account"
            value={filters.fromAccountId}
            onChange={(e) => setFilters({ ...filters, fromAccountId: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          >
            <MenuItem value="">All Accounts</MenuItem>
            {financialAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.accountName} - {account.bankName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="To Account"
            value={filters.toAccountId}
            onChange={(e) => setFilters({ ...filters, toAccountId: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          >
            <MenuItem value="">All Accounts</MenuItem>
            {financialAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.accountName} - {account.bankName}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Type"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="TRANSFER">Transfer</MenuItem>
            <MenuItem value="DEPOSIT">Deposit</MenuItem>
            <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
            <MenuItem value="PAYMENT">Payment</MenuItem>
            <MenuItem value="REFUND">Refund</MenuItem>
            <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: "100%" }}
          />

          <TextField
            type="date"
            label="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: "100%" }}
          />

          <TextField
            type="number"
            label="Min Amount"
            placeholder="0"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          />

          <TextField
            type="number"
            label="Max Amount"
            placeholder="0"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
            size="small"
            sx={{ width: "100%" }}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={clearFilters}
            className="dark:bg-gray-700"
          >
            <i className="fas fa-times mr-2"></i>Clear Filters
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center flex-col h-80 w-full">
          <CircularProgress />
          <h3 className="mt-4 dark:text-gray-300 text-gray-700">Loading Transactions...</h3>
        </div>
      ) : (
        <div className="flex flex-col h-[80%] justify-between items-end">
          <div className="dark:bg-gray-800 bg-white rounded-lg border dark:border-gray-700 border-gray-200 w-full">
            <Table>
              <TableHeader>
                <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                  <TableHead className="dark:text-gray-300 text-gray-700">Reference #</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Type</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Amount</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Fees</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Status</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Description</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Date</TableHead>
                  <TableHead className="dark:text-gray-300 text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((row) => (
                  <TableRow key={row.id} className="dark:hover:bg-gray-700/30 hover:bg-gray-50">
                    <TableCell className="dark:text-gray-200 text-gray-900 font-medium">{row.referenceNumber}</TableCell>
                    <TableCell className="dark:text-gray-300 text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                          row.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                            row.type === 'WITHDRAWAL' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                              row.type === 'PAYMENT' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                row.type === 'REFUND' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
                                  'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                        }`}>
                        {row.type}
                      </span>
                    </TableCell>
                    <TableCell className="dark:text-gray-300 text-gray-700 font-semibold">{formatCurrency(row.amount)}</TableCell>
                    <TableCell className="dark:text-gray-300 text-gray-700">{formatCurrency(row.fees)}</TableCell>
                    <TableCell className="dark:text-gray-300 text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          row.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                            'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                        {row.status || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="dark:text-gray-300 text-gray-700">{row.description}</TableCell>
                    <TableCell className="dark:text-gray-300 text-gray-700">{formatDate(row.movementDate || row.addedAt || "")}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={"secondary"}
                          onClick={() => handleEdit(row.id)}
                        >
                          Edit
                        </Button>
                        <Dialog
                          heading="Delete Transaction"
                          description={`This will delete transaction ${row.referenceNumber} from the database?`}
                          continueButtonText="Delete"
                          cancelButtonText="Cancel"
                          triggerComponent={
                            <Button size="sm" variant="destructive">
                              Delete
                            </Button>
                          }
                          onContinue={() => handleDelete(row.id)}
                          onCancel={() => { }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            count={pagination?.pages}
            variant="outlined"
            color="secondary"
            page={currentPage}
            hideNextButton={pagination?.next == null}
            hidePrevButton={pagination?.previous == null}
            onChange={async (event, page) => {
              setCurrentPage(page);
            }}
            sx={{ marginTop: 3 }}
          />
        </div>
      )}

      <Edit
        open={edit}
        Heading={editRow ? "UPDATE TRANSACTION" : "ADD TRANSACTION"}
        onSubmit={editRow ? editTransaction : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
