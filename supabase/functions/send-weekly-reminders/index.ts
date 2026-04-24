import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://scorecard.socialworkspro.com'

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check reminders enabled setting
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'reminders_enabled')
    .single()

  if (setting?.value !== true) {
    return new Response('Reminders disabled', { status: 200 })
  }

  // Get current month and check not locked
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Get all active non-admin users with their email from auth
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('active', true)
    .neq('role', 'admin')

  if (!profiles || profiles.length === 0) {
    return new Response('No active users', { status: 200 })
  }

  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const results: string[] = []

  for (const profile of profiles) {
    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
    const email = authUser.user?.email
    if (!email) continue

    const firstName = profile.full_name.split(' ')[0]

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #FAFAFA; margin: 0; padding: 40px 20px; }
    .card { background: white; border: 1px solid #E8E8E8; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 32px; }
    .wordmark { display: flex; align-items: center; gap: 6px; margin-bottom: 24px; }
    .wordmark-text { font-size: 16px; font-weight: 600; color: #0E0E0E; }
    .wordmark-dot { width: 6px; height: 6px; border-radius: 50%; background: #1FA6F5; margin-top: 2px; }
    h1 { font-size: 18px; font-weight: 600; color: #0E0E0E; margin: 0 0 8px; }
    p { font-size: 14px; color: #6B6B6B; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #1FA6F5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; }
    .footer { margin-top: 24px; font-size: 12px; color: #9B9B9B; }
  </style>
</head>
<body>
  <div class="card">
    <div class="wordmark">
      <span class="wordmark-text">SocialWorks</span>
      <span class="wordmark-dot"></span>
    </div>
    <h1>Update your ${monthName} numbers</h1>
    <p>Hey ${firstName}, it's Monday — take 2 minutes to update your scorecard so the team stays in sync.</p>
    <a href="${APP_URL}/me" class="btn">Open my scorecard →</a>
    <p class="footer">You're receiving this because reminders are enabled. Contact your admin to unsubscribe.</p>
  </div>
</body>
</html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SocialWorks Scorecard <scorecard@socialworkspro.com>',
        to: email,
        subject: `Update your ${monthName} numbers`,
        html,
      }),
    })

    results.push(`${email}: ${emailRes.ok ? 'sent' : 'failed'}`)
  }

  return new Response(JSON.stringify({ sent: results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
