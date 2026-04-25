'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BonusRate, Role } from '@/lib/types/database'

const ROLES: { value: Role; label: string }[] = [
  { value: 'csm', label: 'CSM' },
  { value: 'media_buyer', label: 'Media Buyer' },
  { value: 'csr', label: 'CSR / Setter' },
]

interface BonusRatesTabProps {
  bonusRates: BonusRate[]
}

const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true'

export function BonusRatesTab({ bonusRates: initialRates }: BonusRatesTabProps) {
  const supabase = createClient()
  const [selectedRole, setSelectedRole] = useState<Role>('csm')
  const [rates, setRates] = useState(initialRates)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const filtered = rates
    .filter(r => r.role === selectedRole)
    .sort((a, b) => a.display_order - b.display_order)

  function updateRate(id: string, field: keyof BonusRate, value: unknown) {
    setRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  async function saveRate(rate: BonusRate) {
    setSaving(prev => ({ ...prev, [rate.id]: true }))
    if (PREVIEW) {
      setSaving(prev => ({ ...prev, [rate.id]: false }))
      setSaved(prev => ({ ...prev, [rate.id]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [rate.id]: false })), 1500)
      return
    }
    const { error } = await supabase
      .from('bonus_rates')
      .update({ rate_value: rate.rate_value, active: rate.active })
      .eq('id', rate.id)

    setSaving(prev => ({ ...prev, [rate.id]: false }))
    if (error) { toast.error('Failed to save'); return }
    setSaved(prev => ({ ...prev, [rate.id]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [rate.id]: false })), 1500)
  }

  async function toggleActive(rate: BonusRate) {
    const updated = { ...rate, active: !rate.active }
    setRates(prev => prev.map(r => r.id === rate.id ? updated : r))
    if (PREVIEW) return
    const { error } = await supabase
      .from('bonus_rates')
      .update({ active: updated.active })
      .eq('id', rate.id)
    if (error) {
      toast.error('Failed to update')
      setRates(prev => prev.map(r => r.id === rate.id ? rate : r))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {ROLES.map(r => (
          <button key={r.value} onClick={() => setSelectedRole(r.value as Role)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-[13px] font-medium border transition-colors',
              selectedRole === r.value
                ? 'bg-[#1FA6F5] text-white border-[#1FA6F5]'
                : 'bg-white text-[#6B6B6B] border-[#E8E8E8] hover:text-[#0E0E0E]'
            )}
          >{r.label}</button>
        ))}
      </div>

      {selectedRole === 'media_buyer' ? (
        <div className="border border-[#E8E8E8] rounded-xl p-8 text-center">
          <p className="text-[15px] font-medium text-[#0E0E0E]">Not yet configured</p>
          <p className="text-[13px] text-[#9B9B9B] mt-1">Bonus structure for Media Buyer is pending.</p>
        </div>
      ) : (
      <div className="border border-[#E8E8E8] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#E8E8E8]">
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Bonus Item</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Rate</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E8E8]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#9B9B9B]">
                  No bonus rates configured for this role.
                </td>
              </tr>
            )}
            {filtered.map(rate => (
              <tr key={rate.id} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="px-4 py-3 text-[14px] font-medium text-[#0E0E0E]">{rate.label}</td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-[#6B6B6B]">
                    {rate.rate_type === 'flat_per_occurrence' ? 'Flat per occurrence' : '% of value'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {rate.rate_type === 'flat_per_occurrence' && (
                      <span className="text-[13px] text-[#6B6B6B]">$</span>
                    )}
                    <input
                      type="number"
                      value={rate.rate_value}
                      onChange={e => updateRate(rate.id, 'rate_value', parseFloat(e.target.value) || 0)}
                      className="w-20 h-8 px-2 border border-[#E8E8E8] rounded-lg text-[13px] text-[#0E0E0E] tabular-nums focus:outline-none focus:border-[#1FA6F5] focus:ring-1 focus:ring-[#1FA6F5] transition-colors"
                    />
                    {rate.rate_type === 'percent_of_value' && (
                      <span className="text-[13px] text-[#6B6B6B]">%</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(rate)}
                    className={cn(
                      'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                      rate.active ? 'bg-[#1FA6F5]' : 'bg-[#E8E8E8]'
                    )}
                    aria-label={rate.active ? 'Deactivate' : 'Activate'}
                  >
                    <span className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm',
                      rate.active ? 'translate-x-4' : 'translate-x-1'
                    )} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => saveRate(rate)}
                    disabled={saving[rate.id]}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors',
                      saved[rate.id]
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-white text-[#0E0E0E] border-[#E8E8E8] hover:border-[#0E0E0E]'
                    )}
                  >
                    {saved[rate.id] ? <><Check className="h-3 w-3" /> Saved</> : saving[rate.id] ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}
