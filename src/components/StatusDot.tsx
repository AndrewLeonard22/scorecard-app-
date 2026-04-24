import { cn } from '@/lib/utils'
import { STATUS_COLORS, type KpiStatus } from '@/lib/utils/kpiUtils'

interface StatusDotProps {
  status: KpiStatus
  size?: 'sm' | 'md'
  className?: string
}

export function StatusDot({ status, size = 'sm', className }: StatusDotProps) {
  const color = STATUS_COLORS[status]
  const sizeClass = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
  return (
    <span
      className={cn('inline-block rounded-full flex-shrink-0', sizeClass, className)}
      style={{ backgroundColor: color }}
      aria-label={`Status: ${status}`}
    />
  )
}
