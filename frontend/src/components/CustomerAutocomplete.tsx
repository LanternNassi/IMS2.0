import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import { useCustomerStore, customer } from '../store/useCustomerStore'

interface CustomerAutocompleteProps {
  value: customer | null
  onChange: (customer: customer | null) => void
  label?: string
  required?: boolean
  fullWidth?: boolean
  size?: 'small' | 'medium'
  inputRef?: React.Ref<HTMLInputElement>
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  value,
  onChange,
  label = 'Customer',
  required = false,
  fullWidth = true,
  size = 'medium',
  inputRef,
}) => {
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { fetchCustomers, customers } = useCustomerStore()

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      return
    }

    setLoading(true)
    try {
      await fetchCustomers(searchTerm, 1)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Autocomplete
      fullWidth={fullWidth}
      size={size}
      options={(customers || []).filter(c => c.id)}
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
