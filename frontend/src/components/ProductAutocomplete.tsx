import React, { useState } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'

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
  value: Product | null
  onChange: (product: Product | null) => void
  products: Product[]
  label?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  inputRef?: React.Ref<HTMLInputElement>
}

export const ProductAutocomplete: React.FC<ProductAutocompleteProps> = ({
  value,
  onChange,
  products,
  label = 'Product',
  required = false,
  fullWidth = true,
  size = 'medium',
  inputRef,
}) => {
  const [inputValue, setInputValue] = useState('')

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={products.filter(p => p.id)}
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
        />
      )}
    />
  )
}
