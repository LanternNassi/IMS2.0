import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import { useSupplierStore } from '../store/useSupplierStore'
import { Supplier } from '../types/productTypes'

interface SupplierAutocompleteProps {
  value: Supplier | null
  onChange: (supplier: Supplier | null) => void
  label?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  inputRef?: React.Ref<HTMLInputElement>
}

export const SupplierAutocomplete: React.FC<SupplierAutocompleteProps> = ({
  value,
  onChange,
  label = 'Supplier',
  required = false,
  fullWidth = true,
  size = 'medium',
  inputRef,
}) => {
  const [options, setOptions] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { fetchSuppliers } = useSupplierStore()

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOptions([])
      return
    }

    setLoading(true)
    try {
      const results = await fetchSuppliers(searchTerm, 1)
      setOptions(Array.isArray(results) ? results : [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={options.filter(s => s.id)}
      getOptionLabel={(option) => option.companyName || ''}
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
        // Only update input value if user is typing, not when selecting
        if (reason === 'input') {
          setInputValue(newInputValue)
          handleSearch(newInputValue)
        } else if (reason === 'reset') {
          setInputValue(value?.companyName || '')
        }
      }}
      onChange={(_, newValue) => {
        onChange(newValue)
        setInputValue(newValue?.companyName || '')
      }}
      loading={loading}
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