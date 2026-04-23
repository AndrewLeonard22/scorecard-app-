'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { KpiDot } from './KpiDot'
import { calcAttainmentPct, formatValue } from '@/lib/utils/kpiUtils'
import type { Profile, KpiDefinition, Submission, SubmissionValue } from '@/lib/types/database'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  csm: 'CSM',
  media_buyer: 'Media Buyer',
  csr: 'CSR',
  admin: 'Admin',
}

interface TeamCardProps {
  profile: Profile
  submission: (Submission & { submission_values: SubmissionValue[] }) | null
  kpis: KpiDefinition[]
  label?: string // reserved for MTD variant
}

export function TeamCard({ profile, submission, kpis }: TeamCardProps) {
  const [expanded, setExpanded] = useState(false)

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const scoredKpis = kpis.filter(k => k.role === profile.role && k.weight > 0)
  const valueMap = Object.fromEntries(
    (submission?.submission_values ?? []).map(v => [v.kpi_id, v.value])
  )

  const hasSubmission = !!submission

  return (
    <Card
      className={cn(
        'border-border bg-card cursor-pointer hover:border-primary/50 transition-all',
        expanded && 'border-primary/30'
      )}
      onClick={() => setExpanded(e => !e)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>

        {!hasSubmission ? (
          <p className="text-xs text-muted-foreground italic">Not submitted</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {scoredKpis.length === 0 ? (
                <span className="text-xs text-muted-foreground">No scored KPIs</span>
              ) : (
                scoredKpis.map(kpi => {
                  const actual = valueMap[kpi.id] ?? null
                  const pct = actual !== null && kpi.target_weekly
                    ? calcAttainmentPct(actual, kpi.target_weekly, kpi.direction)
                    : null
                  return (
                    <KpiDot
                      key={kpi.id}
                      label={kpi.label}
                      attainmentPct={pct}
                      actual={actual}
                      target={kpi.target_weekly}
                      unit={kpi.unit}
                    />
                  )
                })
              )}
            </div>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                {kpis.filter(k => k.role === profile.role && k.active).map(kpi => {
                  const actual = valueMap[kpi.id] ?? null
                  const pct = actual !== null && kpi.target_weekly
                    ? calcAttainmentPct(actual, kpi.target_weekly, kpi.direction)
                    : null
                  return (
                    <div key={kpi.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{kpi.label}</span>
                      <span className={cn(
                        'font-medium',
                        pct === null ? 'text-muted-foreground' :
                        pct >= 100 ? 'text-emerald-400' :
                        pct >= 70 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {actual !== null ? formatValue(actual, kpi.unit) : '—'}
                      </span>
                    </div>
                  )
                })}
                {submission?.notes && (
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border italic">
                    {submission.notes}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
