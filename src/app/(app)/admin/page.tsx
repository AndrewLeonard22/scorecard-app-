import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: profiles }, { data: kpis }, { data: submissions }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('kpi_definitions').select('*').order('role').order('display_order'),
    supabase
      .from('submissions')
      .select('*, submission_values(*), profiles(full_name, role)')
      .order('week_start', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage users, KPI targets, and submissions</p>
      </div>
      <AdminClient
        profiles={profiles ?? []}
        kpis={kpis ?? []}
        submissions={submissions ?? []}
      />
    </div>
  )
}
