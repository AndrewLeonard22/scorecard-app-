import { getAttainmentPct, formatValue, STATUS_COLORS, type KpiStatus } from '@/lib/utils/kpiUtils'
import type { Unit, Direction } from '@/lib/types/database'

interface KpiProgressRowProps {
  label: string
  value: number | null | undefined
  unit: Unit
  target: number | null | undefined
  direction: Direction
  status: KpiStatus
  targetLabel?: string
}

export function KpiProgressRow({
  label,
  value,
  unit,
  target,
  direction,
  status,
  targetLabel,
}: KpiProgressRowProps) {
  const pct = getAttainmentPct(value, target, direction)
  const fillColor = STATUS_COLORS[status]
  const displayValue = formatValue(value, unit)
  const displayTarget = target !== null && target !== undefined ? formatValue(target, unit) : null

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-[#6B6B6B] leading-tight">{label}</span>
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className="text-[14px] font-semibold tabular-nums text-[#0E0E0E]">
            {displayValue}
          </span>
          {displayTarget && (
            <span className="text-[12px] text-[#9B9B9B]">
              {targetLabel ?? `/ ${displayTarget}`}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar — always show track; fill reflects actual value */}
      <div className="h-[4px] w-full rounded-full overflow-hidden" style={{ backgroundColor: '#F1F1F1' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: value != null ? `${Math.round(pct * 100)}%` : '0%',
            backgroundColor: value != null ? fillColor : 'transparent',
          }}
        />
      </div>
    </div>
  )
}
