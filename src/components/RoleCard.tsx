import { cn } from '@/lib/utils'
import { KpiProgressRow } from './KpiProgressRow'
import { getKpiStatus } from '@/lib/utils/kpiUtils'
import { getStalenessColor, getStalenessLabel } from '@/lib/utils/monthUtils'
import type { Profile, KpiDefinition } from '@/lib/types/database'

const ROLE_LABELS: Record<string, string> = {
  csm: 'CSM',
  media_buyer: 'Media Buyer',
  csr: 'CSR / Setter',
  admin: 'Admin',
}

interface RoleCardKpi {
  kpi: KpiDefinition
  value: number | null | undefined
  targetLabel?: string
}

interface RoleCardProps {
  profile: Profile
  kpis: RoleCardKpi[]
  lastSavedAt: string | null
  className?: string
}

export function RoleCard({ profile, kpis, lastSavedAt, className }: RoleCardProps) {
  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const statuses = kpis.map(({ kpi, value }) => getKpiStatus(value, kpi))
  const onTrack = statuses.filter(s => s === 'green').length
  const allGreen = onTrack === statuses.length
  const stalenessColor = getStalenessColor(lastSavedAt)
  const stalenessLabel = getStalenessLabel(lastSavedAt)

  return (
    <div className={cn('bg-white border border-[#E8E8E8] rounded-xl p-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#EBF6FE] flex items-center justify-center flex-shrink-0">
            <span className="text-[13px] font-semibold text-[#1FA6F5]">{initials}</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#0E0E0E] leading-tight">
              {profile.full_name}
            </p>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 pt-0.5">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
              allGreen
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            )}
          >
            {onTrack}/{statuses.length} on track
          </span>
          {lastSavedAt !== undefined && stalenessLabel && (
            <p className="text-[11px]" style={{ color: stalenessColor ?? '#9B9B9B' }}>
              {stalenessLabel}
            </p>
          )}
        </div>
      </div>

      {/* KPI rows */}
      <div className="space-y-[14px]">
        {kpis.map(({ kpi, value, targetLabel }) => {
          const status = getKpiStatus(value, kpi)
          return (
            <KpiProgressRow
              key={kpi.id}
              label={kpi.label}
              value={value}
              unit={kpi.unit}
              target={kpi.target_monthly}
              direction={kpi.direction}
              status={status}
              targetLabel={targetLabel}
            />
          )
        })}
      </div>
    </div>
  )
}
