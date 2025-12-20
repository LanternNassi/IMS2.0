import { create } from 'zustand'
import api from '../Utils/Request'
import { ProductStorage } from '../types/productTypes'

interface StorageState {
  storages: ProductStorage[]
  loading: boolean
  error: string | null
  fetchStorages: (productGenericId?: string, variationId?: string, storageId?: string) => Promise<void>
  addStorage: (storage: ProductStorage) => Promise<void>
  updateStorage: (storage: ProductStorage) => Promise<void>
  deleteStorage: (id: string) => Promise<void>
}

export const useStorageStore = create<StorageState>((set, get) => ({
  storages: [],
  loading: false,
  error: null,
  fetchStorages: async (productGenericId, variationId, storageId) => {
    set({ loading: true, error: null })
    try {
      let url = '/ProductStorages?'
      if (productGenericId) url += `productGenericId=${productGenericId}&`
      if (variationId) url += `productVariationId=${variationId}&`
      if (storageId) url += `storageId=${storageId}`
      const res = await api.get(url)
      set({ storages: res.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addStorage: async (storage) => {
    set({ loading: true, error: null })
    try {
      await api.post('/ProductStorages', storage)
      await get().fetchStorages(storage.productGenericId, storage.productVariationId, storage.storageId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  updateStorage: async (storage) => {
    set({ loading: true, error: null })
    try {
      await api.put(`/ProductStorages/${storage.id}`, storage)
      await get().fetchStorages(storage.productGenericId, storage.productVariationId, storage.storageId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  deleteStorage: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.delete(`/ProductStorages/${id}`)
      await get().fetchStorages()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))