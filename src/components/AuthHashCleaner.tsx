'use client'

import { useEffect } from 'react'

// Strips Supabase error hash params from the URL (e.g. #error=access_denied)
// These land here when someone clicks an expired invite link while already logged in.
export function AuthHashCleaner() {
  useEffect(() => {
    if (window.location.hash.includes('error=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  return null
}
