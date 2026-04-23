'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BonusCalculation, Profile } from '@/lib/types/database'
import { DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BonusDisplayProps {
  profile: Profile
  bonusCalcs: BonusCalculation[]
}

export function BonusDisplay({ profile, bonusCalcs }: BonusDisplayProps) {
  const latest = bonusCalcs[0]

  const attainmentPct = latest
    ? profile.weekly_bonus_target
      ? (latest.total_earned / (profile.weekly_bonus_target * 4)) * 100
      : 0
    : null

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Bonus Attainment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  ${latest.total_earned.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {latest.period} · {latest.period_type}
                </p>
              </div>
              {attainmentPct !== null && (
                <Badge
                  className={cn(
                    'text-sm font-semibold',
                    attainmentPct >= 100
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : attainmentPct >= 70
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  )}
                  variant="outline"
                >
                  {attainmentPct.toFixed(0)}%
                </Badge>
              )}
            </div>

            {profile.weekly_bonus_target && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress to target</span>
                  <span>
                    ${latest.total_earned.toFixed(0)} / ${(profile.weekly_bonus_target * 4).toFixed(0)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (attainmentPct ?? 0) >= 100
                        ? 'bg-emerald-500'
                        : (attainmentPct ?? 0) >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(attainmentPct ?? 0, 150)}%` }}
                  />
                </div>
              </div>
            )}

            {Object.entries(latest.breakdown).length > 0 && (
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Breakdown</p>
                {Object.entries(latest.breakdown).map(([key, item]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className={cn(
                      'font-medium',
                      item.attainment_pct >= 100 ? 'text-emerald-400' :
                      item.attainment_pct >= 70 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {item.attainment_pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No bonus data yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Calculated Thursday after each week
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
