import { create } from 'zustand'
import api from '../Utils/Request'
import { ProductVariation } from '../types/productTypes'

interface VariationState {
  variations: ProductVariation[]
  loading: boolean
  error: string | null
  fetchVariations: (productId?: string) => Promise<void>
  addVariation: (variation: ProductVariation) => Promise<void>
  updateVariation: (variation: ProductVariation) => Promise<void>
  deleteVariation: (id: string) => Promise<void>
}

export const useVariationStore = create<VariationState>((set, get) => ({
  variations: [],
  loading: false,
  error: null,
  fetchVariations: async (productId) => {
    set({ loading: true, error: null })
    try {
      let url = '/ProductVariations'
      if (productId) url += `?productId=${productId}`
      const res = await api.get(url)
      set({ variations: res.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addVariation: async (variation) => {
    set({ loading: true, error: null })
    try {
      await api.post('/ProductVariations', variation)
      await get().fetchVariations(variation.productId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  updateVariation: async (variation) => {
    set({ loading: true, error: null })
    try {
      await api.put(`/ProductVariations/${variation.id}`, variation)
      await get().fetchVariations(variation.productId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  deleteVariation: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.delete(`/ProductVariations/${id}`)
      await get().fetchVariations()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))