import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { formatValue } from '@/lib/utils/kpiUtils'
import type { Unit } from '@/lib/types/database'

interface KpiDotProps {
  label: string
  attainmentPct: number | null
  actual?: number | null
  target?: number | null
  unit?: Unit
}

export function KpiDot({ label, attainmentPct, actual, target, unit = 'number' }: KpiDotProps) {
  const color =
    attainmentPct === null
      ? 'bg-muted-foreground/30'
      : attainmentPct >= 100
      ? 'bg-emerald-500'
      : attainmentPct >= 70
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger className="inline-block h-2.5 w-2.5 rounded-full cursor-default p-0 border-0 bg-transparent focus:outline-none">
          <span className={cn('block h-2.5 w-2.5 rounded-full', color)} />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{label}</p>
          {attainmentPct !== null ? (
            <>
              <p className="text-muted-foreground">
                {actual !== null && actual !== undefined ? formatValue(actual, unit) : '—'}
                {target ? ` / ${formatValue(target, unit)}` : ''}
              </p>
              <p>{attainmentPct.toFixed(0)}% attainment</p>
            </>
          ) : (
            <p className="text-muted-foreground">Not submitted</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
