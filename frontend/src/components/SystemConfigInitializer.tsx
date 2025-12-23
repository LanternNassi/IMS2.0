"use client"

import { useEffect } from 'react'
import { initializeSystemConfig } from '@/store/useSystemConfigStore'

export function SystemConfigInitializer() {
  useEffect(() => {
    // Initialize system config after component mounts
    initializeSystemConfig()
  }, [])

  return null // This component doesn't render anything
}

