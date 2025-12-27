import { create } from 'zustand'
import api from '../Utils/Request'

export type Contact = {
  id: string
  systemConfigId?: string
  email: string
  telephone: string
}

export type SystemConfig = {
  id?: string
  organisationName: string
  organisationDescription: string
  currency: string
  registeredBusinessName?: string
  registeredBusinessContact?: string
  registeredTINumber?: string
  registeredBusinessAddress?: string
  fiscalYearStart?: string
  fiscalYearEnd?: string
  imsKey?: string
  imsVersion?: string
  licenseValidTill?: string
  logo?: string
  taxCompliance?: boolean
  isVATRegistered?: boolean
  contacts?: Contact[]
}

interface SystemConfigState {
  config: SystemConfig | null
  isLoading: boolean
  error: string | null
  fetchSystemConfig: () => Promise<void>
  updateSystemConfig: (config: SystemConfig) => Promise<void>
  createSystemConfig: (config: SystemConfig) => Promise<void>
  saveSystemConfig: (config: SystemConfig) => Promise<void>
}

const defaultConfig: SystemConfig = {
  organisationName: "",
  organisationDescription: "",
  currency: "UGX", // UGX default
  registeredBusinessName: "",
  registeredBusinessContact: "",
  registeredTINumber: "",
  registeredBusinessAddress: "",
  fiscalYearStart: "",
  fiscalYearEnd: "",
  imsKey: "",
  imsVersion: "",
  licenseValidTill: "",
  logo: "",
  taxCompliance: false,
  contacts: [],
}

export const useSystemConfigStore = create<SystemConfigState>((set, get) => ({
  config: null,
  isLoading: false,
  error: null,

  fetchSystemConfig: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get("/SystemConfig")
      const data = response.data
      
      // Helper function to convert currency number to string
      const numberToCurrencyString = (num: number): string => {
        const numberMap: Record<number, string> = {
          0: 'Unknown',
          1: 'USD',
          2: 'EUR',
          3: 'GBP',
          4: 'JPY',
          5: 'AUD',
          6: 'CAD',
          7: 'CHF',
          8: 'CNY',
          9: 'INR',
          10: 'UGX',
        }
        return numberMap[num] ?? 'UGX'
      }
      
      // Map backend response to frontend format
      const mappedConfig: SystemConfig = {
        id: data.id,
        organisationName: data.orgnanisationName || "",
        organisationDescription: data.organisationDescription || "",
        currency: typeof data.currency === "number" 
          ? numberToCurrencyString(data.currency) 
          : (data.currency || "UGX"),
        registeredBusinessName: data.registeredBusinessName || "",
        registeredBusinessContact: data.registeredBusinessContact || "",
        registeredTINumber: data.registeredTINumber || "",
        registeredBusinessAddress: data.registeredBusinessAddress || "",
        fiscalYearStart: data.fiscalYearStart || "",
        fiscalYearEnd: data.fiscalYearEnd || "",
        imsKey: data.imsKey || "",
        imsVersion: data.imsVersion || "",
        licenseValidTill: data.licenseValidTill 
          ? new Date(data.licenseValidTill).toISOString().split("T")[0] 
          : "",
        logo: data.logo || "",
        taxCompliance: data.taxCompliance || false,
        isVATRegistered: data.isVATRegistered || false,
        contacts: data.contacts?.map((c: any) => ({
          id: c.id,
          systemConfigId: c.systemConfigId,
          email: c.email,
          telephone: c.telephone,
        })) || [],
      }

      set({ config: mappedConfig, isLoading: false })
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No config exists yet, use defaults
        set({ config: defaultConfig, isLoading: false })
      } else {
        console.error("Error fetching system config:", error)
        set({ 
          error: error.response?.data?.message || "Failed to load system configuration",
          isLoading: false 
        })
      }
    }
  },

  createSystemConfig: async (config: SystemConfig) => {
    set({ isLoading: true, error: null })
    try {
      // Prepare the data for API
      const configData = {
        id: config.id || crypto.randomUUID(),
        orgnanisationName: config.organisationName,
        organisationDescription: config.organisationDescription,
        currency: typeof config.currency === "string" 
          ? config.currency 
          : config.currency,
        registeredBusinessName: config.registeredBusinessName || null,
        registeredBusinessContact: config.registeredBusinessContact || null,
        registeredTINumber: config.registeredTINumber || null,
        registeredBusinessAddress: config.registeredBusinessAddress || null,
        fiscalYearStart: config.fiscalYearStart || null,
        fiscalYearEnd: config.fiscalYearEnd || null,
        imsKey: config.imsKey || null,
        imsVersion: config.imsVersion || null,
        licenseValidTill: config.licenseValidTill 
          ? new Date(config.licenseValidTill).toISOString() 
          : null,
        logo: config.logo || null,
        taxCompliance: config.taxCompliance || false,
        isVATRegistered: config.isVATRegistered || false,
        contacts: (config.contacts || []).map((c) => ({
          id: c.id || crypto.randomUUID(),
          systemConfigId: config.id || "",
          email: c.email,
          telephone: c.telephone,
        })),
      }

      const response = await api.post("/SystemConfig", configData)
      
      // Refresh the config after creation
      await get().fetchSystemConfig()
      
      set({ isLoading: false })
    } catch (error: any) {
      console.error("Error creating system config:", error)
      set({ 
        error: error.response?.data?.message || "Failed to create system configuration",
        isLoading: false 
      })
      throw error
    }
  },

  updateSystemConfig: async (config: SystemConfig) => {
    set({ isLoading: true, error: null })
    try {
      // Prepare the data for API (contacts are handled separately)
      const configData = {
        orgnanisationName: config.organisationName,
        organisationDescription: config.organisationDescription,
        currency: config.currency,
        registeredBusinessName: config.registeredBusinessName || null,
        registeredBusinessContact: config.registeredBusinessContact || null,
        registeredTINumber: config.registeredTINumber || null,
        registeredBusinessAddress: config.registeredBusinessAddress || null,
        fiscalYearStart: config.fiscalYearStart || null,
        fiscalYearEnd: config.fiscalYearEnd || null,
        imsKey: config.imsKey || null,
        imsVersion: config.imsVersion || null,
        licenseValidTill: config.licenseValidTill 
          ? new Date(config.licenseValidTill).toISOString() 
          : null,
        logo: config.logo || null,
        taxCompliance: config.taxCompliance || false,
        isVATRegistered: config.isVATRegistered || false,
      }

      // Use PUT without ID to update the first config
      await api.put("/SystemConfig", configData)
      
      // Refresh the config after update
      await get().fetchSystemConfig()
      
      set({ isLoading: false })
    } catch (error: any) {
      console.error("Error updating system config:", error)
      set({ 
        error: error.response?.data?.message || "Failed to update system configuration",
        isLoading: false 
      })
      throw error
    }
  },

  saveSystemConfig: async (config: SystemConfig) => {
    if (config.id) {
      await get().updateSystemConfig(config)
    } else {
      await get().createSystemConfig(config)
    }
  },
}))

// // Lazy initialization - only fetch when first accessed
// let isInitialized = false
// export const initializeSystemConfig = () => {
//   if (!isInitialized && typeof window !== 'undefined') {
//     isInitialized = true
//     // Use requestIdleCallback or setTimeout to avoid blocking render
//     if (typeof requestIdleCallback !== 'undefined') {
//       requestIdleCallback(() => {
//         useSystemConfigStore.getState().fetchSystemConfig()
//       }, { timeout: 1000 })
//     } else {
//       setTimeout(() => {
//         useSystemConfigStore.getState().fetchSystemConfig()
//       }, 500)
//     }
//   }
// }

