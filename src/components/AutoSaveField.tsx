'use client'

import { useState, useRef } from 'react'
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayValue = value !== null && value !== undefined ? String(value) : ''

  async function handleBlur() {
    if (disabled) return
    setSaving(true)
    try {
      await onSave(fieldKey, value ?? null)
      setSaved(true)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaved(false), 2000)
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
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-2">
        <label className="text-[13px] font-medium text-[#0E0E0E]">{label}</label>
        {status && <StatusDot status={status} />}
        {saved && (
          <span className="flex items-center gap-0.5 text-[11px] text-[#16A34A]">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
        {saving && <span className="text-[11px] text-[#9B9B9B]">Saving…</span>}
      </div>

      <div className="flex items-center gap-0">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          disabled={disabled}
          className={cn(
            'h-9 w-9 flex items-center justify-center border border-[#E8E8E8] rounded-l-lg transition-colors',
            disabled
              ? 'bg-[#FAFAFA] text-[#E8E8E8] cursor-not-allowed'
              : 'bg-white text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#0E0E0E]'
          )}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3 w-3" />
        </button>

        <input
          type={unit === 'currency' ? 'number' : 'number'}
          value={displayValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          step={step}
          min={min}
          className={cn(
            'h-9 w-24 border-y border-[#E8E8E8] text-center text-[14px] tabular-nums font-medium text-[#0E0E0E]',
            'focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5]',
            'transition-colors',
            disabled && 'bg-[#FAFAFA] text-[#9B9B9B] cursor-not-allowed',
            status === 'green' && !disabled && 'border-y-[#16A34A]',
            status === 'yellow' && !disabled && 'border-y-[#EAB308]',
            status === 'red' && !disabled && 'border-y-[#DC2626]',
          )}
          aria-label={label}
        />

        <button
          type="button"
          onClick={() => handleStep(1)}
          disabled={disabled}
          className={cn(
            'h-9 w-9 flex items-center justify-center border border-[#E8E8E8] rounded-r-lg transition-colors',
            disabled
              ? 'bg-[#FAFAFA] text-[#E8E8E8] cursor-not-allowed'
              : 'bg-white text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#0E0E0E]'
          )}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {hint && <p className="text-[12px] text-[#9B9B9B]">{hint}</p>}
    </div>
  )
}
