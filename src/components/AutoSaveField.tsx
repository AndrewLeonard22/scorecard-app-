'use client'

import { useState, useRef, useCallback } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusDot } from './StatusDot'
import type { KpiStatus } from '@/lib/utils/kpiUtils'

interface AutoSaveFieldProps {
  label: string
  fieldKey: string
  value: number | null | undefined
  unit?: 'number' | 'currency'
  step?: number
  min?: number
  status?: KpiStatus | null
  disabled?: boolean
  hint?: string
  onChange: (key: string, value: number | null) => void
  onSave: (key: string, value: number | null) => Promise<void>
  className?: string
}

export function AutoSaveField({
  label,
  fieldKey,
  value,
  unit = 'number',
  step = 1,
  min = 0,
  status,
  disabled,
  hint,
  onChange,
  onSave,
  className,
}: AutoSaveFieldProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayValue = value !== null && value !== undefined ? String(value) : ''

  const showSaved = useCallback(() => {
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 2000)
  }, [])

  async function handleBlur() {
    if (disabled) return
    if (stepSaveTimer.current) clearTimeout(stepSaveTimer.current)
    setSaving(true)
    try {
      await onSave(fieldKey, value ?? null)
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  function handleChange(raw: string) {
    if (raw === '' || raw === '-') {
      onChange(fieldKey, null)
      return
    }
    const num = unit === 'currency' ? parseFloat(raw) : parseInt(raw, 10)
    if (!isNaN(num)) onChange(fieldKey, num)
  }

  function handleStep(dir: 1 | -1) {
    if (disabled) return
    const current = value ?? 0
    const next = Math.max(min, current + dir * step)
    onChange(fieldKey, next)
    if (stepSaveTimer.current) clearTimeout(stepSaveTimer.current)
    stepSaveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        await onSave(fieldKey, next)
        showSaved()
      } finally {
        setSaving(false)
      }
    }, 600)
  }

  const groupBorder = disabled
    ? 'border-[#E8E8E8]'
    : status === 'green'
      ? 'border-[#16A34A]'
      : status === 'yellow'
        ? 'border-[#EAB308]'
        : status === 'red'
          ? 'border-[#DC2626]'
          : 'border-[#E8E8E8]'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2 min-h-[18px]">
        <label className="text-[13px] font-medium text-[#0E0E0E]">{label}</label>
        {status && !disabled && <StatusDot status={status} />}
        {saved && (
          <span className="flex items-center gap-0.5 text-[11px] text-[#16A34A]">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
        {saving && <span className="text-[11px] text-[#9B9B9B]">Saving…</span>}
      </div>

      <div className={cn(
        'flex items-center rounded-lg border overflow-hidden transition-colors',
        'focus-within:ring-2 focus-within:ring-[#1FA6F5]/20 focus-within:border-[#1FA6F5]',
        groupBorder,
      )}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleStep(-1)}
          disabled={disabled}
          className={cn(
            'h-9 w-9 flex-shrink-0 flex items-center justify-center border-r border-[#E8E8E8] transition-colors',
            disabled
              ? 'bg-[#FAFAFA] text-[#D0D0D0] cursor-not-allowed'
              : 'bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#0E0E0E]'
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3 w-3" />
        </button>

        <input
          type="number"
          value={displayValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          step={step}
          min={min}
          className={cn(
            'flex-1 min-w-0 h-9 px-3 text-center text-[14px] tabular-nums font-medium',
            'border-0 outline-none focus:outline-none bg-transparent',
            disabled ? 'text-[#9B9B9B] cursor-not-allowed bg-[#FAFAFA]' : 'text-[#0E0E0E] bg-white',
          )}
          aria-label={label}
        />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleStep(1)}
          disabled={disabled}
          className={cn(
            'h-9 w-9 flex-shrink-0 flex items-center justify-center border-l border-[#E8E8E8] transition-colors',
            disabled
              ? 'bg-[#FAFAFA] text-[#D0D0D0] cursor-not-allowed'
              : 'bg-white text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#0E0E0E]'
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {hint && <p className="text-[12px] text-[#9B9B9B] leading-relaxed">{hint}</p>}
    </div>
  )
}
