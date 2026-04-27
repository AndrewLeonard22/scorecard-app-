'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handle() {
      const supabase = createClient()
      const next = searchParams.get('next') ?? '/me'

      // PKCE flow: Supabase sends ?code=xxx
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { router.replace('/login?error=link-expired'); return }
        router.replace(next)
        router.refresh()
        return
      }

      // Implicit flow: Supabase puts tokens in the URL hash (#access_token=xxx&...)
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) { router.replace('/login?error=link-expired'); return }
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        router.replace(next)
        router.refresh()
        return
      }

      // Nothing usable in the URL
      router.replace('/login?error=link-expired')
    }

    handle()
  }, [router, searchParams])

  return null
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1FA6F5] mx-auto mb-4" />
        <p className="text-[14px] text-[#6B6B6B]">Setting up your account…</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
