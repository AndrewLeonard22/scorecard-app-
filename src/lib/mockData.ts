import type { Profile, KpiDefinition, MonthlySubmission, BonusRate } from './types/database'

export const MOCK_PROFILES: Profile[] = [
  { id: 'admin-1', full_name: 'Andrew Leonard', role: 'admin', active: true, created_at: '2024-01-01' },
  { id: 'csm-1', full_name: 'Rory Sullivan', role: 'csm', active: true, created_at: '2024-01-01' },
  { id: 'mb-1', full_name: 'Jez', role: 'media_buyer', active: true, created_at: '2024-01-01' },
  { id: 'csr-1', full_name: 'Alula Bekele', role: 'csr', active: true, created_at: '2024-01-01' },
]

export const MOCK_KPI_DEFINITIONS: KpiDefinition[] = [
  // CSM
  { id: 'k1', role: 'csm', key: 'churn_rate', label: 'Churn Rate', unit: 'percent', target_monthly: 8, direction: 'lower_is_better', green_threshold: 8, yellow_threshold: 10, display_order: 1, active: true },
  { id: 'k2', role: 'csm', key: 'onboarding_to_launch_days', label: 'Onboarding → Launch', unit: 'duration_days', target_monthly: 10, direction: 'lower_is_better', green_threshold: 10, yellow_threshold: 14, display_order: 2, active: true },
  { id: 'k3', role: 'csm', key: 'websites_sold', label: 'Websites Sold', unit: 'number', target_monthly: 2, direction: 'higher_is_better', green_threshold: 2, yellow_threshold: 1, display_order: 3, active: true },
  { id: 'k4', role: 'csm', key: 'reviews_collected', label: 'Reviews Collected', unit: 'number', target_monthly: 3, direction: 'higher_is_better', green_threshold: 3, yellow_threshold: 2, display_order: 4, active: true },
  { id: 'k5', role: 'csm', key: 'video_interviews', label: 'Video Interviews', unit: 'number', target_monthly: 2, direction: 'higher_is_better', green_threshold: 2, yellow_threshold: 1, display_order: 5, active: true },
  { id: 'k6', role: 'csm', key: 'closed_referrals', label: 'Closed Referrals', unit: 'number', target_monthly: 2, direction: 'higher_is_better', green_threshold: 2, yellow_threshold: 1, display_order: 6, active: true },
  { id: 'k6b', role: 'csm', key: 'contracts_extended', label: 'Clients on longer-term contracts', unit: 'number', target_monthly: 1, direction: 'higher_is_better', green_threshold: 1, yellow_threshold: 0, display_order: 7, active: true },
  // Media Buyer
  { id: 'k7', role: 'media_buyer', key: 'cpa_dfy', label: 'CPA (DFY)', unit: 'currency', target_monthly: null, direction: 'lower_is_better', green_threshold: 180, yellow_threshold: 240, display_order: 1, active: true },
  { id: 'k8', role: 'media_buyer', key: 'cpl_dwy', label: 'CPL (DWY)', unit: 'currency', target_monthly: null, direction: 'lower_is_better', green_threshold: 35, yellow_threshold: 55, display_order: 2, active: true },
  { id: 'k9', role: 'media_buyer', key: 'new_creatives_tested', label: 'New Creatives Tested', unit: 'number', target_monthly: 12, direction: 'higher_is_better', green_threshold: 12, yellow_threshold: 8, display_order: 3, active: true },
  { id: 'k10', role: 'media_buyer', key: 'onboarding_to_launch_days', label: 'Onboarding → Launch', unit: 'duration_days', target_monthly: 10, direction: 'lower_is_better', green_threshold: 10, yellow_threshold: 14, display_order: 4, active: true },
  // CSR
  { id: 'k11', role: 'csr', key: 'dials', label: 'Dials', unit: 'number', target_monthly: 1600, direction: 'higher_is_better', green_threshold: 1600, yellow_threshold: 1120, display_order: 1, active: true },
  { id: 'k12', role: 'csr', key: 'conversations', label: 'Conversations', unit: 'number', target_monthly: 240, direction: 'higher_is_better', green_threshold: 240, yellow_threshold: 168, display_order: 2, active: true },
  { id: 'k13', role: 'csr', key: 'appointments_booked', label: 'Appointments Booked', unit: 'number', target_monthly: 48, direction: 'higher_is_better', green_threshold: 48, yellow_threshold: 34, display_order: 3, active: true },
]

export const MOCK_SUBMISSIONS: MonthlySubmission[] = [
  {
    id: 'sub-csm-1',
    user_id: 'csm-1',
    month: '2026-04',
    data: {
      clients_active_start: 29,
      clients_active_end: 32,
      clients_lost: 2,
      websites_sold: 1,
      reviews_collected: 3,
      video_interviews: 1,
      closed_referrals: 2,
      ad_spend_upsell_per_day: 50,
      onboarding_to_launch_days: 8.5,
      contract_extension_value: 3000,
      contracts_extended: 1,
    },
    notes: 'Great month overall. One client churn was expected (contract end).',
    last_saved_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    locked: false,
    created_at: '2026-04-01',
  },
  {
    id: 'sub-mb-1',
    user_id: 'mb-1',
    month: '2026-04',
    data: {
      cpa_dfy: 168,
      cpl_dwy: 42,
      total_ad_spend: 54000,
      new_creatives_tested: 9,
    },
    notes: null,
    last_saved_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    locked: false,
    created_at: '2026-04-01',
  },
  {
    id: 'sub-csr-1',
    user_id: 'csr-1',
    month: '2026-04',
    data: {
      dials: 287,
      conversations: 42,
      appointments_booked: 6,
      shows_completed: 4,
    },
    notes: null,
    last_saved_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    locked: false,
    created_at: '2026-04-01',
  },
]

export const MOCK_BONUS_RATES: BonusRate[] = [
  { id: 'br1', role: 'csm', key: 'websites_sold', label: 'Website sold', rate_type: 'flat_per_occurrence', rate_value: 200, active: true, display_order: 1 },
  { id: 'br2', role: 'csm', key: 'reviews_collected', label: 'Review (Google + Trustpilot)', rate_type: 'flat_per_occurrence', rate_value: 50, active: true, display_order: 2 },
  { id: 'br3', role: 'csm', key: 'video_interviews', label: 'Video interview', rate_type: 'flat_per_occurrence', rate_value: 200, active: true, display_order: 3 },
  { id: 'br4', role: 'csm', key: 'closed_referrals', label: 'Closed referral', rate_type: 'flat_per_occurrence', rate_value: 200, active: true, display_order: 4 },
  { id: 'br5', role: 'csm', key: 'ad_spend_upsell', label: 'Ad spend upsell', rate_type: 'percent_of_value', rate_value: 5, active: true, display_order: 5 },
  { id: 'br7', role: 'csm', key: 'contract_extension_value', label: 'Contract extension', rate_type: 'percent_of_value', rate_value: 10, active: true, display_order: 6 },
  { id: 'br6', role: 'csr', key: 'shows_completed', label: 'Shows completed', rate_type: 'flat_per_occurrence', rate_value: 50, active: true, display_order: 1 },
]
