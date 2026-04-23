export type Role = 'admin' | 'csm' | 'media_buyer' | 'csr'
export type Unit = 'number' | 'currency' | 'percent' | 'duration_days'
export type Direction = 'higher_is_better' | 'lower_is_better'
export type PeriodType = 'weekly' | 'monthly'

export interface Profile {
  id: string
  full_name: string
  role: Role
  weekly_bonus_target: number | null
  ramp_end_date: string | null
  active: boolean
  created_at: string
}

export interface KpiDefinition {
  id: string
  role: Role
  key: string
  label: string
  unit: Unit
  target_weekly: number | null
  target_monthly: number | null
  direction: Direction
  weight: number
  display_order: number
  active: boolean
}

export interface Submission {
  id: string
  user_id: string
  week_start: string
  submitted_at: string
  locked: boolean
  notes: string | null
}

export interface SubmissionValue {
  id: string
  submission_id: string
  kpi_id: string
  value: number
}

export interface BonusCalculation {
  id: string
  user_id: string
  period: string
  period_type: PeriodType
  total_earned: number
  breakdown: BonusBreakdown
  calculated_at: string
}

export interface BonusBreakdown {
  [kpi_key: string]: {
    actual: number
    target: number
    attainment_pct: number
    weighted_contribution: number
  }
}

export interface SubmissionWithValues extends Submission {
  submission_values: SubmissionValue[]
  profiles?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      kpi_definitions: {
        Row: KpiDefinition
        Insert: Omit<KpiDefinition, 'id'>
        Update: Partial<Omit<KpiDefinition, 'id'>>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, 'id' | 'submitted_at'>
        Update: Partial<Omit<Submission, 'id' | 'user_id'>>
      }
      submission_values: {
        Row: SubmissionValue
        Insert: Omit<SubmissionValue, 'id'>
        Update: Partial<Omit<SubmissionValue, 'id'>>
      }
      bonus_calculations: {
        Row: BonusCalculation
        Insert: Omit<BonusCalculation, 'id' | 'calculated_at'>
        Update: Partial<Omit<BonusCalculation, 'id'>>
      }
    }
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}
