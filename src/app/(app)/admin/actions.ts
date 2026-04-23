'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteUser(email: string, fullName: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: adminProfileData } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  const adminProfile = adminProfileData as { role: string } | null
  if (adminProfile?.role !== 'admin') return { error: 'Unauthorized' }

  // Create user with Supabase admin API via service role
  // Note: requires SUPABASE_SERVICE_ROLE_KEY in env and admin.createUser endpoint
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
        password: Math.random().toString(36).slice(-12) + 'A1!', // temp password
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return { error: err.message ?? 'Failed to create user' }
  }

  const newUser = await res.json()

  // Upsert profile row (trigger may have already created it)
  await supabase.from('profiles').upsert({
    id: newUser.id,
    full_name: fullName,
    role,
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateProfile(
  id: string,
  updates: { full_name?: string; role?: string; weekly_bonus_target?: number; ramp_end_date?: string | null; active?: boolean }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateKpiDefinition(
  id: string,
  updates: {
    target_weekly?: number | null
    target_monthly?: number | null
    weight?: number
    active?: boolean
    label?: string
  }
) {
  const supabase = await createClient()
  const { error } = await supabase.from('kpi_definitions').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function overrideSubmissionValue(
  submissionId: string,
  kpiId: string,
  value: number
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('submission_values')
    .upsert(
      { submission_id: submissionId, kpi_id: kpiId, value },
      { onConflict: 'submission_id,kpi_id' }
    )
  if (error) return { error: error.message }
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function setSubmissionLocked(submissionId: string, locked: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('submissions')
    .update({ locked })
    .eq('id', submissionId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function triggerBonusCalculation() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calculate-bonuses`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.message ?? 'Failed to trigger calculation' }
  }
  revalidatePath('/dashboard')
  return { success: true }
}
