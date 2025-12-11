import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import api from '@/Utils/Request'

export interface ProductVariation {
  id: string
  productId: string
  name: string
  unitSize: number
  retailPrice: number
  wholeSalePrice: number
  discount: number
  unitofMeasure: string
  isActive: boolean
  isMain: boolean
  addedAt: string
  addedBy: number
  updatedAt: string
  lastUpdatedBy: number
  deletedAt: string | null
  storages?: { [key: string]: { quantity: number; storeId: string } }
}

// Legacy Product interface for backward compatibility
export interface Product {
  id: string
  name: string
  baseCostPrice?: number
  baseSellingPrice?: number
  baseWholeSalePrice?: number
  inventory?: number
  stores?: { [key: string]: number }
}

interface ProductAutocompleteProps {
  value: ProductVariation | null
  onChange: (product: ProductVariation | null) => void
  label?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  inputRef?: React.Ref<HTMLInputElement>
}

export const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  value,
  onChange,
  label = 'Product',
  required = false,
  fullWidth = true,
  size = 'medium',
  inputRef,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<ProductVariation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    const fetchProductVariations = async () => {
      setLoading(true)
      try {
        const response = await api.get('/ProductVariations')
        if (active) {
          const activeVariations = (response.data || []).filter(
            (v: ProductVariation) => v.isActive && !v.deletedAt
          )
          
          // Fetch storage locations for each product variation
          const variationsWithStorages = await Promise.all(
            activeVariations.map(async (variation: ProductVariation) => {
              try {
                const storageResponse = await api.get(`/ProductStorages/ByProductVariation/${variation.id}`)
                const storages: { [key: string]: { quantity: number; storeId: string } } = {}
                
                // Aggregate quantities by storage location
                if (Array.isArray(storageResponse.data)) {
                  storageResponse.data.forEach((storage: any) => {
                    const storeName = storage.store?.name || 'Unknown'
                    const storeId = storage.store?.id || storage.storageId || ''
                    
                    if (storages[storeName]) {
                      storages[storeName].quantity += storage.quantity
                    } else {
                      storages[storeName] = {
                        quantity: storage.quantity,
                        storeId: storeId
                      }
                    }
                  })
                }
                
                return {
                  ...variation,
                  storages
                }
              } catch (error) {
                console.error(`Error fetching storages for ${variation.name}:`, error)
                return {
                  ...variation,
                  storages: {}
                }
              }
            })
          )
          
          setOptions(variationsWithStorages)
        }
      } catch (error) {
        console.error('Error fetching product variations:', error)
        if (active) {
          setOptions([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchProductVariations()

    return () => {
      active = false
    }
  }, [])

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option.name || ''}
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'input') {
          setInputValue(newInputValue)
        } else if (reason === 'reset') {
          setInputValue(value?.name || '')
        }
      }}
      onChange={(_, newValue) => {
        onChange(newValue)
        setInputValue(newValue?.name || '')
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          variant="outlined"
          inputRef={inputRef}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
