import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/nav/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav
        fullName={profile?.full_name ?? user.email ?? ''}
        role={profile?.role ?? 'csr'}
      />
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
