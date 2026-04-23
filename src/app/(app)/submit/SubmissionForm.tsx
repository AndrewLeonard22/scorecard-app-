'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { isSubmitWindowOpen } from '@/lib/utils/weekUtils'
import { calcAttainmentPct, getInputBorderColor, formatTarget } from '@/lib/utils/kpiUtils'
import type { Profile, KpiDefinition, Submission, SubmissionValue } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Lock, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubmissionWithValues extends Submission {
  submission_values: SubmissionValue[]
}

interface Props {
  profile: Profile
  kpis: KpiDefinition[]
  weekStart: string
  existingSubmission: SubmissionWithValues | null
}

export function SubmissionForm({ profile, kpis, weekStart, existingSubmission }: Props) {
  const supabase = createClient()
  const isLocked = existingSubmission?.locked ?? false
  const weekDate = new Date(weekStart + 'T12:00:00')
  const windowOpen = isSubmitWindowOpen(weekDate)

  const initialValues = Object.fromEntries(
    kpis.map(kpi => {
      const existing = existingSubmission?.submission_values?.find(v => v.kpi_id === kpi.id)
      return [kpi.id, existing ? String(existing.value) : '']
    })
  )

  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [notes, setNotes] = useState(existingSubmission?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingSubmission)

  const isDisabled = isLocked || !windowOpen

  function handleChange(kpiId: string, val: string) {
    setValues(prev => ({ ...prev, [kpiId]: val }))
  }

  function getAttainmentForKpi(kpi: KpiDefinition): number | null {
    const raw = values[kpi.id]
    if (!raw || raw === '') return null
    const num = parseFloat(raw)
    if (isNaN(num) || !kpi.target_weekly) return null
    return calcAttainmentPct(num, kpi.target_weekly, kpi.direction)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDisabled) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    // Upsert submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .upsert(
        { user_id: user.id, week_start: weekStart, notes: notes || null },
        { onConflict: 'user_id,week_start' }
      )
      .select()
      .single()

    if (subError || !submission) {
      toast.error('Failed to save submission: ' + subError?.message)
      setLoading(false)
      return
    }

    // Upsert all values
    const valueRows = kpis
      .filter(kpi => values[kpi.id] !== '' && !isNaN(parseFloat(values[kpi.id])))
      .map(kpi => ({
        submission_id: submission.id,
        kpi_id: kpi.id,
        value: parseFloat(values[kpi.id]),
      }))

    if (valueRows.length > 0) {
      const { error: valError } = await supabase
        .from('submission_values')
        .upsert(valueRows, { onConflict: 'submission_id,kpi_id' })

      if (valError) {
        toast.error('Failed to save KPI values: ' + valError.message)
        setLoading(false)
        return
      }
    }

    toast.success('KPIs submitted successfully!')
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <Card className="border-border">
      <form onSubmit={handleSubmit}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              {profile.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} KPIs
            </CardTitle>
            {isLocked && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Lock className="h-3 w-3" /> Locked
              </Badge>
            )}
            {submitted && !isLocked && (
              <Badge variant="secondary" className="gap-1 text-xs text-emerald-400 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" /> Submitted
              </Badge>
            )}
            {!windowOpen && !isLocked && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                Window not open
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {kpis.map(kpi => {
            const attPct = getAttainmentForKpi(kpi)
            const borderColor = getInputBorderColor(attPct)

            return (
              <div key={kpi.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor={kpi.id} className="text-sm font-medium">
                    {kpi.label}
                  </Label>
                  {attPct !== null && kpi.weight > 0 && (
                    <span className={cn(
                      'text-xs font-semibold',
                      attPct >= 100 ? 'text-emerald-400' : attPct >= 70 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {attPct.toFixed(0)}%
                    </span>
                  )}
                </div>
                <Input
                  id={kpi.id}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={values[kpi.id]}
                  onChange={e => handleChange(kpi.id, e.target.value)}
                  disabled={isDisabled}
                  className={cn('transition-colors', attPct !== null && borderColor)}
                />
                <p className="text-xs text-muted-foreground">
                  Target: {formatTarget(kpi.target_weekly, kpi.unit)}/week
                  {kpi.weight === 0 && ' · Tracking only'}
                </p>
              </div>
            )
          })}

          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Any context, wins, or blockers for this week..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isDisabled}
              className="resize-none"
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            disabled={isDisabled || loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLocked ? 'Locked' : submitted ? 'Update Submission' : 'Submit KPIs'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
