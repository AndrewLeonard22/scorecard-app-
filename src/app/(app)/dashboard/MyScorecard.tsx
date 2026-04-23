'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SparklineChart } from './SparklineChart'
import { BonusDisplay } from './BonusDisplay'
import { calcAttainmentPct, formatValue, formatTarget } from '@/lib/utils/kpiUtils'
import { formatWeekLabel } from '@/lib/utils/weekUtils'
import type { Profile, KpiDefinition, Submission, SubmissionValue, BonusCalculation } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface SubmissionWithValues extends Submission {
  submission_values: SubmissionValue[]
}

interface MyScorecardProps {
  profile: Profile
  kpis: KpiDefinition[]
  myHistory: SubmissionWithValues[]
  currentWeekSubmission: SubmissionWithValues | null
  bonusCalcs: BonusCalculation[]
  last8Weeks: string[]
  isAdmin: boolean
}

export function MyScorecard({
  profile,
  kpis,
  myHistory,
  currentWeekSubmission,
  bonusCalcs,
  last8Weeks,
  isAdmin,
}: MyScorecardProps) {
  const myKpis = kpis.filter(k => k.role === profile.role && k.active)
  const currentValues = Object.fromEntries(
    (currentWeekSubmission?.submission_values ?? []).map(v => [v.kpi_id, v.value])
  )

  // Build sparkline data per KPI
  function getSparklineData(kpiId: string) {
    return last8Weeks.map(week => {
      const sub = myHistory.find(s => s.week_start === week)
      const val = sub?.submission_values?.find(v => v.kpi_id === kpiId)
      return {
        week: formatWeekLabel(week).split(' –')[0],
        value: val ? val.value : null,
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold">My Scorecard</h2>
        <Badge variant="secondary" className="text-xs">
          {profile.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </Badge>
      </div>

      <div className="grid gap-3">
        {myKpis.map(kpi => {
          const current = currentValues[kpi.id] ?? null
          const pct = current !== null && kpi.target_weekly
            ? calcAttainmentPct(current, kpi.target_weekly, kpi.direction)
            : null
          const sparkData = getSparklineData(kpi.id)

          return (
            <Card key={kpi.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{kpi.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Target: {formatTarget(kpi.target_weekly, kpi.unit)}/week
                      {kpi.weight === 0 && ' · Tracking only'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {current !== null ? formatValue(current, kpi.unit) : '—'}
                    </p>
                    {pct !== null && kpi.weight > 0 && (
                      <span className={cn(
                        'text-xs font-semibold',
                        pct >= 100 ? 'text-emerald-400' :
                        pct >= 70 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {pct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <SparklineChart
                  data={sparkData}
                  target={kpi.target_weekly ?? undefined}
                  color={pct === null ? '#4B5563' : pct >= 100 ? '#10b981' : pct >= 70 ? '#eab308' : '#ef4444'}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(isAdmin || true) && bonusCalcs.length > 0 && (
        <BonusDisplay profile={profile} bonusCalcs={bonusCalcs} />
      )}
    </div>
  )
}
