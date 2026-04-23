'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { triggerBonusCalculation } from './actions'
import { UserManagement } from './UserManagement'
import { KpiManagement } from './KpiManagement'
import { SubmissionOverride } from './SubmissionOverride'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Calculator, Loader2 } from 'lucide-react'
import type { Profile, KpiDefinition, Submission, SubmissionValue } from '@/lib/types/database'

interface SubmissionWithProfile extends Submission {
  submission_values: SubmissionValue[]
  profiles: Pick<Profile, 'full_name' | 'role'> | null
}

interface AdminClientProps {
  profiles: Profile[]
  kpis: KpiDefinition[]
  submissions: SubmissionWithProfile[]
}

export function AdminClient({ profiles, kpis, submissions }: AdminClientProps) {
  const [isPending, startTransition] = useTransition()

  function handleTriggerBonus() {
    startTransition(async () => {
      const result = await triggerBonusCalculation()
      if (result.error) { toast.error(result.error); return }
      toast.success('Bonus calculation triggered')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-primary border-primary/30"
          onClick={handleTriggerBonus}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
          Run Bonus Calculation
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="kpis">KPI Targets</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserManagement profiles={profiles} />
        </TabsContent>

        <TabsContent value="kpis" className="mt-4">
          <KpiManagement kpis={kpis} />
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <SubmissionOverride submissions={submissions} kpis={kpis} profiles={profiles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
