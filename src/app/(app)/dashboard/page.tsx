/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { getWeekStartString, getWeeksBack } from '@/lib/utils/weekUtils'
import { format, startOfMonth } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStartString()
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const last8Weeks = getWeeksBack(8)

  // Fetch all active profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .order('full_name')

  // Fetch current user profile
  const currentProfile = profiles?.find(p => p.id === user.id)

  // Fetch current week submissions + values for all users
  const { data: weekSubmissions } = await supabase
    .from('submissions')
    .select('*, submission_values(*), profiles(full_name, role)')
    .eq('week_start', weekStart)

  // Fetch MTD submissions
  const { data: mtdSubmissions } = await supabase
    .from('submissions')
    .select('*, submission_values(*)')
    .gte('week_start', monthStart)
    .lte('week_start', weekStart)

  // Fetch 8-week history for current user
  const { data: myHistory } = await supabase
    .from('submissions')
    .select('*, submission_values(*)')
    .eq('user_id', user.id)
    .in('week_start', last8Weeks)
    .order('week_start')

  // Fetch KPI definitions
  const { data: kpis } = await supabase
    .from('kpi_definitions')
    .select('*')
    .eq('active', true)
    .order('display_order')

  // Fetch bonus calculations for current user (and all if admin)
  const bonusQuery = supabase
    .from('bonus_calculations')
    .select('*')
    .eq('period_type', 'monthly')
    .order('period', { ascending: false })
    .limit(3)

  if (currentProfile?.role !== 'admin') {
    bonusQuery.eq('user_id', user.id)
  }
  const { data: bonusCalcs } = await bonusQuery

  // Fetch recent notes
  const { data: recentNotes } = await supabase
    .from('submissions')
    .select('notes, week_start, submitted_at, profiles(full_name, role)')
    .not('notes', 'is', null)
    .neq('notes', '')
    .order('submitted_at', { ascending: false })
    .limit(10)

  return (
    <DashboardClient
      currentUserId={user.id}
      currentProfile={currentProfile ?? null}
      profiles={profiles ?? []}
      weekStart={weekStart}
      weekSubmissions={weekSubmissions ?? []}
      mtdSubmissions={mtdSubmissions ?? []}
      myHistory={myHistory ?? []}
      kpis={kpis ?? []}
      bonusCalcs={bonusCalcs ?? []}
      recentNotes={(recentNotes as any[]) ?? []}
      last8Weeks={last8Weeks}
    />
  )
}
