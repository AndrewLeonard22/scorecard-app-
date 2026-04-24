import type { Direction, KpiDefinition, Unit } from '@/lib/types/database'

export type KpiStatus = 'green' | 'yellow' | 'red'

export const STATUS_COLORS: Record<KpiStatus, string> = {
  green: '#16A34A',
  yellow: '#EAB308',
  red: '#DC2626',
}

export function getKpiStatus(
  value: number | null | undefined,
  kpi: Pick<KpiDefinition, 'direction' | 'green_threshold' | 'yellow_threshold' | 'target_monthly'>
): KpiStatus {
  if (value === null || value === undefined) return 'red'

  const { direction, green_threshold, yellow_threshold, target_monthly } = kpi

  if (direction === 'lower_is_better') {
    const greenMax = green_threshold ?? target_monthly
    const yellowMax = yellow_threshold
    if (greenMax !== null && value <= greenMax) return 'green'
    if (yellowMax !== null && value <= yellowMax) return 'yellow'
    return 'red'
  } else {
    // higher_is_better
    const greenMin = green_threshold ?? target_monthly
    const yellowMin = yellow_threshold
    if (greenMin !== null && value >= greenMin) return 'green'
    if (yellowMin !== null && value >= yellowMin) return 'yellow'
    return 'red'
  }
}

export function getAttainmentPct(
  value: number | null | undefined,
  target: number | null | undefined,
  direction: Direction
): number {
  if (value === null || value === undefined || target === null || target === undefined || target === 0) return 0
  if (direction === 'higher_is_better') {
    return Math.min(value / target, 1)
  } else {
    if (value === 0) return 1
    return Math.min(target / value, 1)
  }
}

export function formatValue(value: number | null | undefined, unit: Unit): string {
  if (value === null || value === undefined) return '—'
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'duration_days':
      return `${value.toFixed(1)}d`
    default:
      return value.toLocaleString()
  }
}

export function formatTarget(target: number | null, unit: Unit, direction?: Direction): string {
  if (target === null || target === 0) return 'No target'
  const formatted = formatValue(target, unit)
  if (direction === 'lower_is_better') return `≤${formatted}`
  if (direction === 'higher_is_better') return `≥${formatted}`
  return formatted
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
