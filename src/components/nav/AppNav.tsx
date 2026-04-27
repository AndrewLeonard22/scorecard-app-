'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Settings } from 'lucide-react'
import { MonthPicker } from '@/components/MonthPicker'
import { getCurrentMonth } from '@/lib/utils/monthUtils'
import type { Role } from '@/lib/types/database'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  csm: 'CSM',
  media_buyer: 'Media Buyer',
  csr: 'CSR',
}

interface AppNavProps {
  fullName: string
  role: Role
  monthsWithData?: string[]
}

export function AppNav({ fullName, role, monthsWithData = [] }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const selectedMonth = searchParams.get('month') ?? getCurrentMonth()

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isOnDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard')
  const isOnMe = pathname === '/me' || pathname.startsWith('/me')

  return (
    <header className="border-b border-[#E8E8E8] bg-white sticky top-0 z-50 h-14">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

        {/* Left: Wordmark + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold text-[#0E0E0E] tracking-tight">
              SocialWorks
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#1FA6F5] mt-0.5" />
          </Link>

          <nav className="flex items-center gap-0.5">
            <Link
              href="/dashboard"
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                isOnDashboard
                  ? 'bg-[#EBF6FE] text-[#1FA6F5] font-medium'
                  : 'text-[#6B6B6B] hover:text-[#0E0E0E] hover:bg-[#FAFAFA]'
              )}
            >
              Dashboard
            </Link>
            {role !== 'admin' && (
              <Link
                href="/me"
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  isOnMe
                    ? 'bg-[#EBF6FE] text-[#1FA6F5] font-medium'
                    : 'text-[#6B6B6B] hover:text-[#0E0E0E] hover:bg-[#FAFAFA]'
                )}
              >
                My Scorecard
              </Link>
            )}
            {role === 'admin' && (
              <Link
                href="/admin"
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-[#EBF6FE] text-[#1FA6F5] font-medium'
                    : 'text-[#6B6B6B] hover:text-[#0E0E0E] hover:bg-[#FAFAFA]'
                )}
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Month picker + Avatar */}
        <div className="flex items-center gap-3">
          <MonthPicker selected={selectedMonth} monthsWithData={monthsWithData} />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-[#FAFAFA] transition-colors focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] bg-[#EBF6FE] text-[#1FA6F5] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-[#0E0E0E] hidden sm:block">{fullName || 'User'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[#0E0E0E]">{fullName}</p>
                <p className="text-xs text-[#6B6B6B]">{ROLE_LABELS[role]}</p>
              </div>
              <DropdownMenuSeparator />
              {role === 'admin' ? (
                <DropdownMenuItem onClick={() => {}} className="cursor-pointer p-0">
                  <Link href="/admin" className="flex items-center w-full px-2 py-1.5">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => {}} className="cursor-pointer p-0">
                  <Link href="/me" className="flex items-center w-full px-2 py-1.5">
                    <User className="mr-2 h-4 w-4" />
                    My Scorecard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-[#DC2626] cursor-pointer focus:text-[#DC2626]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
