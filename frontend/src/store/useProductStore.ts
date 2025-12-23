import { create } from 'zustand'
import { Product, Pagination } from '../types/productTypes'
import api from '../Utils/Request'

interface ProductState {
  products: Product[]
  pagination: Pagination | null
  loading: boolean
  error: string | null
  fetchProducts: (page?: number, keyword?: string) => Promise<void>
  addProduct: (product: Product, onSuccess: () => void, onError: (error: any) => void) => Promise<void>
  fetchProductById: (id: string ) => Promise<Product>
  updateProduct: (product: Product, onSuccess: () => void, onError: (error: any) => void) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  pagination: null,
  loading: false,
  error: null,
  fetchProducts: async (page = 1, keyword = "") => {
    set({ loading: true, error: null })
    try {
      const res = await api.get(`/Products?page=${page}&keywords=${keyword}`)
      set({ products: res.data.products, loading: false, pagination: res.data.pagination })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  fetchProductById: async (id: string) => {
    try {
      const res = await api.get(`/Products/${id}`)
      return res.data
    } catch (error: any) {
      set({ error: error.message, loading: false })
      throw error
    }
  },
  addProduct: async (product, onSuccess, onError) => {
    try {
      await api.post('/Products', product)
      await get().fetchProducts()
      onSuccess()
    } catch (error: any) {
      set({ error: error.message })
      onError(error)
    }
  },
  updateProduct: async (product, onSuccess, onError) => {
    set({ loading: true, error: null })
    try {
      await api.put(`/Products/${product.id}`, product)
      await get().fetchProducts()
      onSuccess()
    } catch (error: any) {
      set({ error: error.message, loading: false })
      onError(error)
    }
  },
  deleteProduct: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.delete(`/Products/${id}`)
      await get().fetchProducts()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))