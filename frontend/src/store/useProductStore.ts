import { create } from 'zustand'
import { Product } from '../types/productTypes'
import api from '../Utils/Request'

interface ProductState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  addProduct: (product: Product, onSuccess: () => void, onError: (error: any) => void) => Promise<void>
  fetchProductById: (id: string ) => Promise<Product>
  updateProduct: (product: Product, onSuccess: () => void, onError: (error: any) => void) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/Products')
      set({ products: res.data.products, loading: false })
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