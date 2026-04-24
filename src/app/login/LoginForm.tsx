'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
})

const resetSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

type LoginData = z.infer<typeof loginSchema>
type ResetData = z.infer<typeof resetSchema>

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'reset' | 'reset-sent'>('login')
  const [loading, setLoading] = useState(false)

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  })

  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
  })

  async function handleLogin(data: LoginData) {
    setLoading(true)
    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Determine where to redirect based on role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    router.push(profile?.role === 'admin' ? '/dashboard' : '/me')
    router.refresh()
  }

  async function handleReset(data: ResetData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/me`,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setMode('reset-sent')
  }

  if (mode === 'reset-sent') {
    return (
      <div className="text-center space-y-4">
        <p className="text-[15px] font-medium text-[#0E0E0E]">Check your inbox</p>
        <p className="text-[13px] text-[#6B6B6B]">
          We sent a password reset link to {resetForm.getValues('email')}.
        </p>
        <button
          onClick={() => setMode('login')}
          className="text-[13px] text-[#1FA6F5] hover:underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
        <div className="mb-2">
          <p className="text-[16px] font-semibold text-[#0E0E0E]">Reset password</p>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[#0E0E0E]">Email</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@socialworkspro.com"
            {...resetForm.register('email')}
            className="w-full h-10 px-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors"
          />
          {resetForm.formState.errors.email && (
            <p className="text-[12px] text-[#DC2626]">{resetForm.formState.errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-[#1FA6F5] hover:bg-[#1890D8] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
        </button>

        <button
          type="button"
          onClick={() => setMode('login')}
          className="w-full text-center text-[13px] text-[#6B6B6B] hover:text-[#0E0E0E] transition-colors"
        >
          Back to sign in
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
      <div className="mb-2">
        <p className="text-[16px] font-semibold text-[#0E0E0E]">Sign in</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0E0E0E]">Email</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@socialworkspro.com"
          {...loginForm.register('email')}
          className="w-full h-10 px-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors"
        />
        {loginForm.formState.errors.email && (
          <p className="text-[12px] text-[#DC2626]">{loginForm.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[#0E0E0E]">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...loginForm.register('password')}
          className="w-full h-10 px-3 border border-[#E8E8E8] rounded-lg text-[14px] text-[#0E0E0E] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors"
        />
        {loginForm.formState.errors.password && (
          <p className="text-[12px] text-[#DC2626]">{loginForm.formState.errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rememberMe"
          {...loginForm.register('rememberMe')}
          className="h-4 w-4 rounded border-[#E8E8E8] text-[#1FA6F5] focus:ring-[#1FA6F5]"
        />
        <label htmlFor="rememberMe" className="text-[13px] text-[#6B6B6B]">
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-[#1FA6F5] hover:bg-[#1890D8] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log in'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('reset')}
          className="text-[13px] text-[#6B6B6B] hover:text-[#1FA6F5] transition-colors"
        >
          Forgot password?
        </button>
      </div>
    </form>
  )
}
