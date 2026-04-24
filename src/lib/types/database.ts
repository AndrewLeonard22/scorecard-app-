export type Role = 'admin' | 'csm' | 'media_buyer' | 'csr'
export type Unit = 'number' | 'currency' | 'percent' | 'duration_days'
export type Direction = 'higher_is_better' | 'lower_is_better'
export type RateType = 'flat_per_occurrence' | 'percent_of_value'

export interface Profile {
  id: string
  full_name: string
  role: Role
  active: boolean
  created_at: string
  // Legacy columns kept for backward compat — not used in new UI
  weekly_bonus_target?: number | null
  ramp_end_date?: string | null
}

export interface KpiDefinition {
  id: string
  role: Role
  key: string
  label: string
  unit: Unit
  target_monthly: number | null
  direction: Direction
  green_threshold: number | null
  yellow_threshold: number | null
  display_order: number
  active: boolean
}

export interface MonthlySubmission {
  id: string
  user_id: string
  month: string // 'YYYY-MM'
  data: Record<string, number | null>
  notes: string | null
  last_saved_at: string
  locked: boolean
  created_at: string
}

export interface BonusRate {
  id: string
  role: Role
  key: string
  label: string
  rate_type: RateType
  rate_value: number
  active: boolean
  display_order: number
}

export interface Setting {
  key: string
  value: unknown
  updated_at: string
}

// Role-specific JSONB data shapes stored in monthly_submissions.data
export interface CsmData {
  clients_active_start?: number | null
  clients_active_end?: number | null
  clients_lost?: number | null
  websites_sold?: number | null
  reviews_collected?: number | null
  video_interviews?: number | null
  closed_referrals?: number | null
  ad_spend_upsell_per_day?: number | null
  onboarding_to_launch_days?: number | null
  contract_extension_value?: number | null
  contracts_extended?: number | null
}

export interface MediaBuyerData {
  cpa_dfy?: number | null
  cpl_dwy?: number | null
  total_ad_spend?: number | null
  new_creatives_tested?: number | null
}

export interface CsrData {
  dials?: number | null
  conversations?: number | null
  appointments_booked?: number | null
  shows_completed?: number | null
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
      monthly_submissions: {
        Row: MonthlySubmission
        Insert: Omit<MonthlySubmission, 'id' | 'created_at' | 'last_saved_at'>
        Update: Partial<Omit<MonthlySubmission, 'id' | 'user_id' | 'created_at'>>
      }
      bonus_rates: {
        Row: BonusRate
        Insert: Omit<BonusRate, 'id'>
        Update: Partial<Omit<BonusRate, 'id'>>
      }
      settings: {
        Row: Setting
        Insert: Setting
        Update: Partial<Omit<Setting, 'key'>>
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
