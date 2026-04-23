'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateKpiDefinition } from './actions'
import type { KpiDefinition } from '@/lib/types/database'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertTriangle, Save, Loader2 } from 'lucide-react'

interface KpiManagementProps {
  kpis: KpiDefinition[]
}

const ROLE_LABELS: Record<string, string> = {
  csm: 'CSM',
  media_buyer: 'Media Buyer',
  csr: 'CSR',
}

type KpiRow = KpiDefinition & { _dirty?: boolean }

export function KpiManagement({ kpis }: KpiManagementProps) {
  const [rows, setRows] = useState<KpiRow[]>(kpis)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  function update(id: string, field: keyof KpiDefinition, value: string | number | boolean) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value, _dirty: true } : r))
  }

  async function save(kpi: KpiRow) {
    setSaving(p => ({ ...p, [kpi.id]: true }))
    const result = await updateKpiDefinition(kpi.id, {
      target_weekly: kpi.target_weekly,
      target_monthly: kpi.target_monthly,
      weight: kpi.weight,
      active: kpi.active,
      label: kpi.label,
    })
    setSaving(p => ({ ...p, [kpi.id]: false }))
    if (result.error) { toast.error(result.error); return }
    toast.success(`${kpi.label} updated`)
    setRows(prev => prev.map(r => r.id === kpi.id ? { ...r, _dirty: false } : r))
  }

  const roles = ['csm', 'media_buyer', 'csr'] as const

  return (
    <div className="space-y-6">
      {roles.map(role => {
        const roleKpis = rows.filter(k => k.role === role)
        const scoredKpis = roleKpis.filter(k => k.weight > 0)
        const weightSum = scoredKpis.reduce((sum, k) => sum + k.weight, 0)
        const weightOk = Math.abs(weightSum - 1) < 0.01 || scoredKpis.length === 0

        return (
          <div key={role}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold">{ROLE_LABELS[role]}</h3>
              {!weightOk && (
                <Badge variant="outline" className="gap-1 text-xs text-yellow-400 border-yellow-500/30">
                  <AlertTriangle className="h-3 w-3" />
                  Weights sum to {(weightSum * 100).toFixed(0)}% (need 100%)
                </Badge>
              )}
              {weightOk && scoredKpis.length > 0 && (
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                  Weights OK ({(weightSum * 100).toFixed(0)}%)
                </Badge>
              )}
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">KPI</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Weekly Target</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Monthly Target</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Weight (0–1)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Active</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {roleKpis.map(kpi => (
                    <tr key={kpi.id} className={cn('border-b border-border last:border-0', kpi._dirty && 'bg-primary/5')}>
                      <td className="px-4 py-2.5">
                        <div>
                          <span className="font-medium">{kpi.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            · {kpi.direction === 'higher_is_better' ? '↑' : '↓'} {kpi.unit}
                            {kpi.weight === 0 && <span className="ml-1 text-muted-foreground/60">tracking only</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="h-8 w-28 text-xs"
                          value={kpi.target_weekly ?? ''}
                          placeholder="—"
                          onChange={e => update(kpi.id, 'target_weekly', e.target.value === '' ? null as unknown as number : parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          className="h-8 w-28 text-xs"
                          value={kpi.target_monthly ?? ''}
                          placeholder="—"
                          onChange={e => update(kpi.id, 'target_monthly', e.target.value === '' ? null as unknown as number : parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          className="h-8 w-24 text-xs"
                          value={kpi.weight}
                          onChange={e => update(kpi.id, 'weight', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={kpi.active}
                          onChange={e => update(kpi.id, 'active', e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        {kpi._dirty && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1 text-primary"
                            onClick={() => save(kpi)}
                            disabled={saving[kpi.id]}
                          >
                            {saving[kpi.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                            Save
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
