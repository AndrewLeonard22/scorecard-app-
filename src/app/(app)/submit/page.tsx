import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubmissionForm } from './SubmissionForm'
import { getCurrentSubmissionWeek, formatWeekLabel } from '@/lib/utils/weekUtils'
import { format } from 'date-fns'

export default async function SubmitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/dashboard')

  const weekStart = getCurrentSubmissionWeek()
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  const { data: kpis } = await supabase
    .from('kpi_definitions')
    .select('*')
    .eq('role', profile.role)
    .eq('active', true)
    .order('display_order')

  const { data: existingSubmission } = await supabase
    .from('submissions')
    .select('*, submission_values(*)')
    .eq('user_id', user.id)
    .eq('week_start', weekStartStr)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Submit KPIs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Week of {formatWeekLabel(weekStartStr)}
        </p>
      </div>
      <SubmissionForm
        profile={profile}
        kpis={kpis ?? []}
        weekStart={weekStartStr}
        existingSubmission={existingSubmission ?? null}
      />
    </div>
  )
}
