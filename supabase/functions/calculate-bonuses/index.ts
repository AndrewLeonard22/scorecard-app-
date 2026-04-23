import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  try {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get all active non-admin profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('active', true)
      .neq('role', 'admin')

    if (profilesError) throw profilesError

    // Get all KPI definitions
    const { data: kpis, error: kpisError } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('active', true)

    if (kpisError) throw kpisError

    const results: { userId: string; weekPeriod: string; earned: number }[] = []

    for (const profile of profiles ?? []) {
      const profileKpis = (kpis ?? []).filter(k => k.role === profile.role && k.weight > 0 && k.target_weekly)

      // Get all submissions for this month
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, submission_values(*)')
        .eq('user_id', profile.id)
        .gte('week_start', monthStart)
        .eq('locked', true)

      if (!submissions || submissions.length === 0) continue

      let monthlyEarned = 0

      for (const sub of submissions) {
        const weekKey = sub.week_start.replace(/-/g, 'W').substring(0, 7)
        const valueMap: Record<string, number> = Object.fromEntries(
          sub.submission_values.map((v: { kpi_id: string; value: number }) => [v.kpi_id, v.value])
        )

        const breakdown: Record<string, { actual: number; target: number; attainment_pct: number; weighted_contribution: number }> = {}
        let weekAttainment = 0

        for (const kpi of profileKpis) {
          const actual = valueMap[kpi.id] ?? 0
          const target = kpi.target_weekly!

          let attainment: number
          if (kpi.direction === 'higher_is_better') {
            attainment = Math.min(actual / target, 1.5)
          } else {
            attainment = actual > 0 ? Math.min(target / actual, 1.5) : 1.5
          }

          const weighted = attainment * kpi.weight
          weekAttainment += weighted

          breakdown[kpi.key] = {
            actual,
            target,
            attainment_pct: attainment * 100,
            weighted_contribution: weighted,
          }
        }

        const inRamp = profile.ramp_end_date
          ? now <= new Date(profile.ramp_end_date)
          : false

        let weekEarned: number
        if (weekAttainment < 0.7 && !inRamp) {
          weekEarned = (profile.weekly_bonus_target ?? 0) * weekAttainment * 0.5
        } else {
          weekEarned = (profile.weekly_bonus_target ?? 0) * weekAttainment
        }

        monthlyEarned += weekEarned

        // Store weekly calc
        await supabase.from('bonus_calculations').upsert({
          user_id: profile.id,
          period: sub.week_start,
          period_type: 'weekly',
          total_earned: weekEarned,
          breakdown,
        }, { onConflict: 'user_id,period,period_type' })

        results.push({ userId: profile.id, weekPeriod: sub.week_start, earned: weekEarned })
      }

      // Store monthly calc
      await supabase.from('bonus_calculations').upsert({
        user_id: profile.id,
        period: monthKey,
        period_type: 'monthly',
        total_earned: monthlyEarned,
        breakdown: {},
      }, { onConflict: 'user_id,period,period_type' })
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
