'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Check role to decide where to send them
    const { data: { user } } = await supabase.auth.getUser()
    const role = user?.user_metadata?.role
    router.push(role === 'admin' ? '/admin' : '/me')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-2">
        <p className="text-[16px] font-semibold text-[#0E0E0E]">Set your password</p>
        <p className="text-[13px] text-[#6B6B6B] mt-1">
          Choose a password to secure your account.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0E0E0E]">Password</label>
        <input
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full h-10 px-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0E0E0E]">Confirm password</label>
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          className="w-full h-10 px-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors"
        />
      </div>

      {error && (
        <p className="text-[12px] text-[#DC2626]">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-[#1FA6F5] hover:bg-[#1890D8] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set password & continue'}
      </button>
    </form>
  )
}
