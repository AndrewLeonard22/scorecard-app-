'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, ClipboardList, Settings, LogOut, ChevronDown } from 'lucide-react'
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
}

export function AppNav({ fullName, role }: AppNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(role !== 'admin' ? [{ href: '/submit', label: 'Submit KPIs', icon: ClipboardList }] : []),
    ...(role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ]

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-primary text-sm tracking-tight">
            SW Scorecard
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-muted transition-colors focus:outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">
              {fullName || 'User'}
            </span>
            <Badge variant="secondary" className="text-xs hidden sm:block">
              {ROLE_LABELS[role]}
            </Badge>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
