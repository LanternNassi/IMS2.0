
import { create } from "zustand";
import api from "@/Utils/Request";

export interface Transaction {
  id: string;
  fromFinancialAccountId: string;
  toFinancialAccountId: string;
  movementDate?: string;
  amount: number;
  type: "TRANSFER" | "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND" | "ADJUSTMENT";
  status?: "COMPLETED" | "PENDING" | "FAILED";
  currency?: string;
  referenceNumber: string;
  description: string;
  notes?: string;
  exchangeRate?: number | null;
  fees: number;
  fromFinancialAccount?: any;
  toFinancialAccount?: any;
  addedAt?: string;
  addedBy?: number;
  updatedAt?: string;
  lastUpdatedBy?: number;
  deletedAt?: string | null;
}

export interface TransactionDto {
  fromFinancialAccountId: string;
  toFinancialAccountId: string;
  movementDate: string;
  amount: number;
  type: "TRANSFER" | "DEPOSIT" | "WITHDRAWAL" | "PAYMENT" | "REFUND" | "ADJUSTMENT";
  referenceNumber: string;
  description: string;
  notes?: string;
  fees: number;
}

interface Pagination {
  pages: number;
  next: string | null;
  previous: string | null;
}

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;
  fetchTransactions: (params: any, page?: number) => Promise<void>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  createTransaction: (
    data: TransactionDto,
    onSuccess: () => void,
    onError: () => void
  ) => Promise<void>;
  updateTransaction: (
    transaction: Transaction,
    onSuccess: () => void,
    onError: () => void
  ) => Promise<void>;
  deleteTransaction: (
    id: string,
    onSuccess: () => void,
    onError: () => void
  ) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,
  pagination: null,

  fetchTransactions: async (params, page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const safeParams = params ?? {};
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: "50",
        ...safeParams,
      });
      const response = await api.get(`/Transactions?${queryParams.toString()}`);
      set({ 
        transactions: response.data.transactions || [], 
        pagination: response.data.pagination || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch transactions",
        isLoading: false,
      });
    }
  },

  getTransactionById: async (id: string) => {
    try {
      const response = await api.get(`/Transactions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  },

  createTransaction: async (data, onSuccess, onError) => {
    try {
      await api.post("/Transactions", data);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      onError();
    }
  },

  updateTransaction: async (transaction, onSuccess, onError) => {
    try {
      const updateData: TransactionDto = {
        fromFinancialAccountId: transaction.fromFinancialAccountId,
        toFinancialAccountId: transaction.toFinancialAccountId,
        movementDate: transaction.movementDate || new Date().toISOString(),
        amount: transaction.amount,
        type: transaction.type,
        referenceNumber: transaction.referenceNumber,
        description: transaction.description,
        notes: transaction.notes,
        fees: transaction.fees,
      };
      await api.put(`/Transactions/${transaction.id}`, updateData);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      onError();
    }
  },

  deleteTransaction: async (id, onSuccess, onError) => {
    try {
      await api.delete(`/Transactions/${id}`);
      onSuccess();
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      onError();
    }
  },
}));
