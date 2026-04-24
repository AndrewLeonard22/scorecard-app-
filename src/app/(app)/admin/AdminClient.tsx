'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { KpiTargetsTab } from './KpiTargetsTab'
import { BonusRatesTab } from './BonusRatesTab'
import { TeamMembersTab } from './TeamMembersTab'
import type { Profile, KpiDefinition, BonusRate } from '@/lib/types/database'

const TABS = [
  { id: 'team-members', label: 'Team Members' },
  { id: 'kpi-targets', label: 'KPI Targets' },
  { id: 'bonus-rates', label: 'Bonus Rates' },
] as const

type TabId = typeof TABS[number]['id']

interface AdminClientProps {
  currentUserId: string
  profiles: Profile[]
  kpis: KpiDefinition[]
  bonusRates: BonusRate[]
}

export function AdminClient({ currentUserId, profiles, kpis, bonusRates }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('team-members')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[#E8E8E8] mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-[#1FA6F5] text-[#1FA6F5]'
                : 'border-transparent text-[#6B6B6B] hover:text-[#0E0E0E]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'kpi-targets' && <KpiTargetsTab kpis={kpis} />}
      {activeTab === 'bonus-rates' && <BonusRatesTab bonusRates={bonusRates} />}
      {activeTab === 'team-members' && <TeamMembersTab profiles={profiles} currentUserId={currentUserId} />}
    </div>
  )
}
