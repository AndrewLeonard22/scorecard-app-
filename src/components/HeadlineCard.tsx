import { cn } from '@/lib/utils'
import { StatusDot } from './StatusDot'
import type { KpiStatus } from '@/lib/utils/kpiUtils'

interface HeadlineCardProps {
  label: string
  value: string
  context?: string
  status?: KpiStatus | 'neutral'
  className?: string
}

export function HeadlineCard({ label, value, context, status, className }: HeadlineCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white border border-[#E8E8E8] rounded-xl p-5',
        className
      )}
    >
      {status && status !== 'neutral' && (
        <StatusDot status={status} className="absolute top-5 right-5" />
      )}
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B6B] mb-2">
        {label}
      </p>
      <p className="text-[28px] font-semibold tabular-nums leading-none text-[#0E0E0E]">
        {value}
      </p>
      {context && (
        <p className="text-[13px] text-[#9B9B9B] mt-1.5">{context}</p>
      )}
    </div>
  )
}
