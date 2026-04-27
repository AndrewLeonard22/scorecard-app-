import type { Direction, KpiDefinition, Unit } from '@/lib/types/database'

export type KpiStatus = 'green' | 'yellow' | 'red'

// Pace-projection applies only to cumulative count KPIs (dials, shows, etc.)
// Rate/average KPIs (CPA, CPL, churn rate, launch days) compare raw values.
export function isPacedKpi(kpi: Pick<KpiDefinition, 'unit' | 'direction'>): boolean {
  return kpi.unit === 'number' && kpi.direction === 'higher_is_better'
}

// Project current value to month-end run rate
export function getPaceRunRate(value: number, daysElapsed: number, daysInMonth: number): number {
  if (daysElapsed <= 0) return 0
  return (value / daysElapsed) * daysInMonth
}

// Status using pace-projected run rate for cumulative KPIs, raw for everything else.
// Automatically reflects any threshold changes made in the admin panel.
export function getKpiStatusPaced(
  value: number | null | undefined,
  kpi: Pick<KpiDefinition, 'direction' | 'green_threshold' | 'yellow_threshold' | 'target_monthly' | 'unit'>,
  daysElapsed: number,
  daysInMonth: number,
): KpiStatus {
  if (value === null || value === undefined) return 'red'
  if (isPacedKpi(kpi) && daysElapsed > 0 && daysElapsed < daysInMonth) {
    return getKpiStatus(getPaceRunRate(value, daysElapsed, daysInMonth), kpi)
  }
  return getKpiStatus(value, kpi)
}

// Attainment % for the progress bar, pace-adjusted for cumulative KPIs
export function getAttainmentPctPaced(
  value: number | null | undefined,
  kpi: Pick<KpiDefinition, 'direction' | 'target_monthly' | 'unit'>,
  daysElapsed: number,
  daysInMonth: number,
): number {
  if (isPacedKpi(kpi) && daysElapsed > 0 && daysElapsed < daysInMonth) {
    return getAttainmentPct(getPaceRunRate(value ?? 0, daysElapsed, daysInMonth), kpi.target_monthly, kpi.direction)
  }
  return getAttainmentPct(value, kpi.target_monthly, kpi.direction)
}

// Human-readable hint shown under input fields, e.g. "On pace for 2,850 · Target 2,000 (day 2 of 30)"
// Returns null for non-paced KPIs, historical months, or missing values.
export function formatPaceHint(
  value: number | null | undefined,
  kpi: Pick<KpiDefinition, 'unit' | 'direction' | 'target_monthly'>,
  daysElapsed: number,
  daysInMonth: number,
): string | null {
  if (!isPacedKpi(kpi) || value === null || value === undefined || daysElapsed <= 0 || daysElapsed >= daysInMonth) {
    return null
  }
  const runRate = Math.round(getPaceRunRate(value, daysElapsed, daysInMonth))
  const targetStr = kpi.target_monthly !== null
    ? ` · Target ${kpi.target_monthly.toLocaleString()}`
    : ''
  return `On pace for ${runRate.toLocaleString()}${targetStr} (day ${daysElapsed} of ${daysInMonth})`
}

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
