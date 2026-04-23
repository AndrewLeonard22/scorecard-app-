import type { Direction, Unit } from '@/lib/types/database'

export function calcAttainmentPct(
  actual: number,
  target: number,
  direction: Direction
): number {
  if (!target || target === 0) return 0
  if (direction === 'higher_is_better') {
    return Math.min((actual / target) * 100, 150)
  } else {
    if (actual === 0) return 150
    return Math.min((target / actual) * 100, 150)
  }
}

export function getAttainmentColor(pct: number): string {
  if (pct >= 100) return 'text-emerald-400'
  if (pct >= 70) return 'text-yellow-400'
  return 'text-red-400'
}

export function getAttainmentBgColor(pct: number): string {
  if (pct >= 100) return 'bg-emerald-500'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function getInputBorderColor(pct: number | null): string {
  if (pct === null) return ''
  if (pct >= 100) return 'border-emerald-500 focus-visible:ring-emerald-500'
  if (pct >= 70) return 'border-yellow-500 focus-visible:ring-yellow-500'
  return 'border-red-500 focus-visible:ring-red-500'
}

export function formatValue(value: number, unit: Unit): string {
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'duration_days':
      return `${value.toFixed(1)}d`
    default:
      return value.toLocaleString()
  }
}

export function formatTarget(target: number | null, unit: Unit): string {
  if (target === null || target === 0) return 'No target set'
  return formatValue(target, unit)
}
