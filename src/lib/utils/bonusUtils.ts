import type { KpiDefinition, SubmissionValue, Profile, BonusBreakdown } from '@/lib/types/database'

export interface WeekBonusResult {
  week_attainment: number
  week_earned: number
  breakdown: BonusBreakdown
}

export function calcWeekBonus(
  profile: Pick<Profile, 'weekly_bonus_target' | 'ramp_end_date'>,
  kpis: KpiDefinition[],
  values: SubmissionValue[],
  today: Date = new Date()
): WeekBonusResult {
  const valueMap = Object.fromEntries(values.map(v => [v.kpi_id, v.value]))
  const scoredKpis = kpis.filter(k => k.weight > 0 && k.target_weekly && k.target_weekly > 0)

  const breakdown: BonusBreakdown = {}
  let week_attainment = 0

  for (const kpi of scoredKpis) {
    const actual = valueMap[kpi.id] ?? 0
    const target = kpi.target_weekly!

    let attainment: number
    if (kpi.direction === 'higher_is_better') {
      attainment = Math.min(actual / target, 1.5)
    } else {
      attainment = actual > 0 ? Math.min(target / actual, 1.5) : 1.5
    }

    const weighted = attainment * kpi.weight
    week_attainment += weighted

    breakdown[kpi.key] = {
      actual,
      target,
      attainment_pct: attainment * 100,
      weighted_contribution: weighted,
    }
  }

  const bonusTarget = profile.weekly_bonus_target ?? 0
  const inRamp = profile.ramp_end_date ? today <= new Date(profile.ramp_end_date) : false

  let week_earned: number
  if (week_attainment < 0.7 && !inRamp) {
    week_earned = bonusTarget * week_attainment * 0.5
  } else {
    week_earned = bonusTarget * week_attainment
  }

  return { week_attainment, week_earned, breakdown }
}
