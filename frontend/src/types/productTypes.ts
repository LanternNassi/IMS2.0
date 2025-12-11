// Product Management Types

export type Product = {
  id: string
  productName: string
  barCode?: string
  description?: string
  baseCostPrice: number
  baseRetailPrice: number
  baseWholeSalePrice: number
  baseDiscount?: number
  stackSize: number
  basicUnitofMeasure: string
  reorderLevel: number
  isTaxable: boolean
  taxRate?: number
  isActive: boolean
  variations: ProductVariation[]
  generics: ProductGeneric[]
  storages: ProductStorage[]
}

export type ProductVariation = {
  id: string
  productId?: string
  name: string
  unitSize: number
  retailPrice: number
  wholeSalePrice: number
  costPrice: number
  discount?: number
  unitofMeasure?: string
  isActive: boolean
  isMain: boolean
}

export type ProductGeneric = {
  id: string
  productId: string
  expiryDate: Date
  manufactureDate: Date
  batchNumber?: string
  supplierId: string
  supplierName?: string
  productStorages: ProductStorage[]
  supplier?: Supplier
}

export type ProductStorage = {
  id: string
  productGenericId: string
  productVariationId: string
  quantity: number
  storageId: string
  storageName?: string
  reorderLevel: number
  store?: Store
  productVariation?: ProductVariation
}

export type Supplier = {
  id: string
  companyName: string
}

export type Store = {
  id: string
  name: string
}
