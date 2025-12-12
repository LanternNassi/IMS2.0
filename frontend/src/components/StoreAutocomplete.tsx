import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import { useStoresStore } from '../store/useStoresStore'
import { Store } from '../types/productTypes'

interface StoreAutocompleteProps {
  value: Store | null
  onChange: (store: Store | null) => void
  label?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
}

export const StoreAutocomplete: React.FC<StoreAutocompleteProps> = ({
  value,
  onChange,
  label = 'Store',
  required = false,
  fullWidth = true,
  size = 'medium',
}) => {
  const [options, setOptions] = useState<Store[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { fetchStores } = useStoresStore()

  
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      return
    }

    setLoading(true)
    try {
      const results = await fetchStores(searchTerm)
      setOptions(Array.isArray(results) ? results : [])
    } catch (error) {
      console.error('Error fetching stores:', error)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={options.filter(s => s.id)}
      getOptionLabel={(option) => option.name || ''}
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
          setInputValue(value?.name || '')
        }
      }}
      onChange={(_, newValue) => {
        onChange(newValue)
        setInputValue(newValue?.name || '')
      }}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          variant="outlined"
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
