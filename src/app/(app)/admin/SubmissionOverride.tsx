'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { overrideSubmissionValue, setSubmissionLocked } from './actions'
import type { KpiDefinition, Submission, SubmissionValue, Profile } from '@/lib/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatWeekLabel } from '@/lib/utils/weekUtils'
import { Lock, Unlock, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubmissionWithProfile extends Submission {
  submission_values: SubmissionValue[]
  profiles: Pick<Profile, 'full_name' | 'role'> | null
}

interface SubmissionOverrideProps {
  submissions: SubmissionWithProfile[]
  kpis: KpiDefinition[]
  profiles: Profile[]
}

export function SubmissionOverride({ submissions, kpis, profiles }: SubmissionOverrideProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState<string>('all')
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [locking, setLocking] = useState<Record<string, boolean>>({})

  const weeks = Array.from(new Set(submissions.map(s => s.week_start))).sort().reverse()
  const nonAdminProfiles = profiles.filter(p => p.role !== 'admin')

  const filtered = submissions.filter(s =>
    (selectedUserId === 'all' || s.user_id === selectedUserId) &&
    (selectedWeek === 'all' || s.week_start === selectedWeek)
  )

  async function handleValueSave(submissionId: string, kpiId: string) {
    const key = `${submissionId}:${kpiId}`
    const val = overrides[key]
    if (val === undefined || val === '') return
    setSaving(p => ({ ...p, [key]: true }))
    const result = await overrideSubmissionValue(submissionId, kpiId, parseFloat(val))
    setSaving(p => ({ ...p, [key]: false }))
    if (result.error) { toast.error(result.error); return }
    toast.success('Value overridden')
    setOverrides(p => { const n = { ...p }; delete n[key]; return n })
  }

  async function toggleLock(sub: SubmissionWithProfile) {
    setLocking(p => ({ ...p, [sub.id]: true }))
    const result = await setSubmissionLocked(sub.id, !sub.locked)
    setLocking(p => ({ ...p, [sub.id]: false }))
    if (result.error) { toast.error(result.error); return }
    toast.success(sub.locked ? 'Submission unlocked' : 'Submission locked')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={selectedUserId} onValueChange={v => setSelectedUserId(v ?? 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {nonAdminProfiles.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedWeek} onValueChange={v => setSelectedWeek(v ?? 'all')}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All weeks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {weeks.map(w => (
              <SelectItem key={w} value={w}>{formatWeekLabel(w)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No submissions match the filter</p>
      )}

      <div className="space-y-3">
        {filtered.map(sub => {
          const subKpis = kpis.filter(k => k.role === sub.profiles?.role && k.active)
          const valueMap = Object.fromEntries(sub.submission_values.map(v => [v.kpi_id, v.value]))

          return (
            <div key={sub.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-sm">{sub.profiles?.full_name ?? 'Unknown'}</span>
                  <span className="text-muted-foreground text-xs ml-2">{formatWeekLabel(sub.week_start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', sub.locked
                      ? 'text-red-400 border-red-500/30'
                      : 'text-emerald-400 border-emerald-500/30'
                    )}
                  >
                    {sub.locked ? 'Locked' : 'Editable'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleLock(sub)}
                    disabled={locking[sub.id]}
                  >
                    {locking[sub.id]
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : sub.locked
                      ? <Unlock className="h-3 w-3" />
                      : <Lock className="h-3 w-3" />
                    }
                    {sub.locked ? 'Unlock' : 'Lock'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {subKpis.map(kpi => {
                  const current = valueMap[kpi.id] ?? null
                  const overrideKey = `${sub.id}:${kpi.id}`
                  const isDirty = overrides[overrideKey] !== undefined

                  return (
                    <div key={kpi.id} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="any"
                          className={cn('h-7 text-xs', isDirty && 'border-primary')}
                          value={overrides[overrideKey] ?? (current !== null ? String(current) : '')}
                          placeholder="—"
                          onChange={e => setOverrides(p => ({ ...p, [overrideKey]: e.target.value }))}
                        />
                        {isDirty && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleValueSave(sub.id, kpi.id)}
                            disabled={saving[overrideKey]}
                          >
                            {saving[overrideKey]
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Save className="h-3 w-3 text-primary" />
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {sub.notes && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border italic">
                  {sub.notes}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
