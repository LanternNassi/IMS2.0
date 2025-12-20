import { create } from "zustand";
import api from "@/Utils/Request";

export interface FixedAsset {
  id: string;
  name: string;
  type: "EQUIPMENT" | "VEHICLE" | "BUILDING" | "FURNITURE" | "COMPUTER" | "OTHER";
  purchasePrice: number;
  purchaseDate: string;
  depreciationRate: number;
  linkedFinancialAccountId?: string;
  usefulLifeYears: number;
  serialNumber: string;
  manufacturer: string;
  description: string;
  addedAt?: string;
  addedBy?: string;
}

export interface FixedAssetDto {
  name: string;
  type: "EQUIPMENT" | "VEHICLE" | "BUILDING" | "FURNITURE" | "COMPUTER" | "OTHER";
  purchasePrice: number;
  purchaseDate: string;
  depreciationRate: number;
  linkedFinancialAccountId?: string;
  usefulLifeYears: number;
  serialNumber: string;
  manufacturer: string;
  description: string;
}

interface FixedAssetStore {
  fixedAssets: FixedAsset[];
  isLoading: boolean;
  error: string | null;
  fetchFixedAssets: (params: any) => Promise<void>;
  getFixedAssetById: (id: string) => Promise<FixedAsset | null>;
  createFixedAsset: (
    data: FixedAssetDto,
    onSuccess: () => void,
    onError: () => void
  ) => Promise<void>;
  updateFixedAsset: (
    asset: FixedAsset,
    onSuccess: () => void,
    onError: () => void
  ) => Promise<void>;
  deleteFixedAsset: (
    id: string,
    onSuccess: () => void,
    onError: () => void
  ) => Promise<void>;
}

export const useFixedAssetStore = create<FixedAssetStore>((set) => ({
  fixedAssets: [],
  isLoading: false,
  error: null,

  fetchFixedAssets: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/FixedAssets", { params });
      set({ fixedAssets: response.data.fixedAssets || response.data || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch fixed assets",
        isLoading: false,
      });
    }
  },

  getFixedAssetById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/FixedAssets/${id}`);
      set({ isLoading: false });
      return response.data.asset;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch fixed asset",
        isLoading: false,
      });
      return null;
    }
  },

  createFixedAsset: async (data: FixedAssetDto, onSuccess, onError) => {
    set({ isLoading: true, error: null });
    try {
      await api.post("/FixedAssets", data);
      set({ isLoading: false });
      onSuccess();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create fixed asset",
        isLoading: false,
      });
      onError();
    }
  },

  updateFixedAsset: async (asset: FixedAsset, onSuccess, onError) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/FixedAssets/${asset.id}`, asset);
      set({ isLoading: false });
      onSuccess();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update fixed asset",
        isLoading: false,
      });
      onError();
    }
  },

  deleteFixedAsset: async (id: string, onSuccess, onError) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/FixedAssets/${id}`);
      set({ isLoading: false });
      onSuccess();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete fixed asset",
        isLoading: false,
      });
      onError();
    }
  },
}));
