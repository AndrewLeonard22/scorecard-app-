'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { KpiDefinition, Role } from '@/lib/types/database'

const ROLES: { value: Role; label: string }[] = [
  { value: 'csm', label: 'CSM' },
  { value: 'media_buyer', label: 'Media Buyer' },
  { value: 'csr', label: 'CSR / Setter' },
]

interface KpiTargetsTabProps {
  kpis: KpiDefinition[]
}

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export function KpiTargetsTab({ kpis: initialKpis }: KpiTargetsTabProps) {
  const supabase = createClient()
  const [selectedRole, setSelectedRole] = useState<Role>('csm')
  const [kpis, setKpis] = useState(initialKpis)
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const filtered = kpis
    .filter(k => k.role === selectedRole)
    .sort((a, b) => a.display_order - b.display_order)

  function updateKpi(id: string, field: keyof KpiDefinition, value: number | null) {
    setKpis(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k))
  }

  async function saveKpi(kpi: KpiDefinition) {
    if (PREVIEW) {
      setSaved(prev => ({ ...prev, [kpi.id]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [kpi.id]: false })), 1500)
      return
    }
    const { error } = await supabase
      .from('kpi_definitions')
      .update({
        target_monthly: kpi.target_monthly,
        green_threshold: kpi.green_threshold,
        yellow_threshold: kpi.yellow_threshold,
      })
      .eq('id', kpi.id)

    if (error) {
      toast.error('Failed to save')
      return
    }
    setSaved(prev => ({ ...prev, [kpi.id]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [kpi.id]: false })), 1500)
  }

  return (
    <div className="space-y-5">
      {/* Role pills */}
      <div className="flex gap-2">
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setSelectedRole(r.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-[13px] font-medium border transition-colors',
              selectedRole === r.value
                ? 'bg-[#1FA6F5] text-white border-[#1FA6F5]'
                : 'bg-white text-[#6B6B6B] border-[#E8E8E8] hover:text-[#0E0E0E] hover:border-[#0E0E0E]'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E8E8E8]">
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide">KPI</th>
              <th className="text-left px-3 py-3 text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide">Target</th>
              <th className="text-left px-3 py-3 text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide">Green</th>
              <th className="text-left px-3 py-3 text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide">Yellow</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E8]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#9B9B9B]">
                  No KPIs configured for this role.
                </td>
              </tr>
            )}
            {filtered.map(kpi => (
              <tr key={kpi.id} className="hover:bg-[#FAFAFA]/60 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="text-[14px] font-medium text-[#0E0E0E] leading-tight">{kpi.label}</p>
                  <p className="text-[11px] text-[#9B9B9B] mt-0.5">
                    {kpi.direction === 'lower_is_better' ? '↓ lower is better' : '↑ higher is better'}
                  </p>
                </td>
                <td className="px-3 py-3.5">
                  <NumberInput
                    value={kpi.target_monthly}
                    onChange={v => updateKpi(kpi.id, 'target_monthly', v)}
                    onBlur={() => saveKpi(kpi)}
                  />
                </td>
                <td className="px-3 py-3.5">
                  <NumberInput
                    value={kpi.green_threshold}
                    onChange={v => updateKpi(kpi.id, 'green_threshold', v)}
                    onBlur={() => saveKpi(kpi)}
                  />
                </td>
                <td className="px-3 py-3.5">
                  <NumberInput
                    value={kpi.yellow_threshold}
                    onChange={v => updateKpi(kpi.id, 'yellow_threshold', v)}
                    onBlur={() => saveKpi(kpi)}
                  />
                </td>
                <td className="px-3 py-3.5 text-right">
                  {saved[kpi.id] && (
                    <span className="text-[11px] text-[#16A34A] font-medium">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-[#9B9B9B]">Changes save automatically when you leave a field.</p>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  onBlur,
}: {
  value: number | null
  onChange: (v: number | null) => void
  onBlur: () => void
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
      onBlur={onBlur}
      className="w-full h-8 px-2.5 border border-[#E8E8E8] rounded-lg text-[13px] text-[#0E0E0E] tabular-nums bg-white focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5]/20 transition-colors placeholder:text-[#9B9B9B]"
      placeholder="—"
    />
  )
}
