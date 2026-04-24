import type { BonusRate, CsmData, CsrData } from '@/lib/types/database'
import { getDaysElapsed } from './monthUtils'

export interface BonusLineItem {
  key: string
  label: string
  count: string
  rateDisplay: string
  total: number
}

export function calcCsmBonus(
  data: CsmData,
  rates: BonusRate[],
  month: string
): BonusLineItem[] {
  const activeRates = rates.filter(r => r.active && r.role === 'csm')
  const items: BonusLineItem[] = []

  for (const rate of activeRates) {
    if (rate.key === 'ad_spend_upsell') {
      const perDay = data.ad_spend_upsell_per_day ?? 0
      const days = getDaysElapsed(month)
      const totalIncrease = perDay * days
      const earned = totalIncrease * (rate.rate_value / 100)
      items.push({
        key: rate.key,
        label: rate.label,
        count: `$${perDay.toLocaleString()}/day × ${days} days`,
        rateDisplay: `${rate.rate_value}%`,
        total: earned,
      })
    } else if (rate.key === 'contract_extension_value') {
      const value = data.contract_extension_value ?? 0
      const earned = value * (rate.rate_value / 100)
      items.push({
        key: rate.key,
        label: rate.label,
        count: `$${value.toLocaleString()} contract value`,
        rateDisplay: `${rate.rate_value}%`,
        total: earned,
      })
    } else {
      const fieldMap: Record<string, keyof CsmData> = {
        websites_sold: 'websites_sold',
        reviews_collected: 'reviews_collected',
        video_interviews: 'video_interviews',
        closed_referrals: 'closed_referrals',
      }
      const field = fieldMap[rate.key]
      if (!field) continue
      const count = (data[field] as number | null | undefined) ?? 0
      items.push({
        key: rate.key,
        label: rate.label,
        count: String(count),
        rateDisplay: `× $${rate.rate_value.toLocaleString()}`,
        total: count * rate.rate_value,
      })
    }
  }

  return items
}

export function calcCsrBonus(
  data: CsrData,
  rates: BonusRate[]
): BonusLineItem[] {
  const activeRates = rates.filter(r => r.active && r.role === 'csr')
  const items: BonusLineItem[] = []

  for (const rate of activeRates) {
    if (rate.key === 'shows_completed') {
      const count = data.shows_completed ?? 0
      items.push({
        key: rate.key,
        label: rate.label,
        count: String(count),
        rateDisplay: `× $${rate.rate_value.toLocaleString()}`,
        total: count * rate.rate_value,
      })
    }
  }

  return items
}

export function sumBonus(items: BonusLineItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0)
}

export function calcAdSpendPreview(
  perDay: number | null | undefined,
  ratePct: number,
  month: string
): { days: number; totalIncrease: number; earned: number } | null {
  if (!perDay) return null
  const days = getDaysElapsed(month)
  const totalIncrease = perDay * days
  const earned = totalIncrease * (ratePct / 100)
  return { days, totalIncrease, earned }
}
