import { create } from 'zustand'
import api from '../Utils/Request'
import { ProductGeneric } from '../types/productTypes'

interface GenericState {
  generics: ProductGeneric[]
  loading: boolean
  error: string | null
  fetchGenerics: (productId?: string) => Promise<void>
  addGeneric: (generic: ProductGeneric) => Promise<void>
  updateGeneric: (generic: ProductGeneric) => Promise<void>
  deleteGeneric: (id: string) => Promise<void>
}

export const useGenericStore = create<GenericState>((set, get) => ({
  generics: [],
  loading: false,
  error: null,
  fetchGenerics: async (productId) => {
    set({ loading: true, error: null })
    try {
      let url = '/ProductGenerics'
      if (productId) url += `?productId=${productId}`
      const res = await api.get(url)
      set({ generics: res.data, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addGeneric: async (generic) => {
    set({ loading: true, error: null })
    try {
      await api.post('/ProductGenerics', generic)
      await get().fetchGenerics(generic.productId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  updateGeneric: async (generic) => {
    set({ loading: true, error: null })
    try {
      await api.put(`/ProductGenerics/${generic.id}`, generic)
      await get().fetchGenerics(generic.productId)
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  deleteGeneric: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.delete(`/ProductGenerics/${id}`)
      await get().fetchGenerics()
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
}))