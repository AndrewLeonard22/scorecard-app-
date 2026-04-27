import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, email, role } = body

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  // Check if user already exists
  const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
  const existing = existingUsers?.users.find(u => u.email === email)
  let userId: string

  if (existing) {
    userId = existing.id
  } else {
    // Create the auth user with email confirmed — they'll set password via invite link
    const { data: created, error: createErr } = await serviceClient.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name, role },
    })
    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message ?? 'Failed to create user' }, { status: 400 })
    }
    userId = created.user.id
  }

  // Upsert profile row
  await serviceClient.from('profiles').upsert({
    id: userId,
    full_name: name,
    role,
    active: true,
  }, { onConflict: 'id' })

  // Create a permanent invite token (not time-limited)
  const { data: tokenRow, error: tokenErr } = await serviceClient
    .from('invite_tokens')
    .insert({ user_id: userId, email })
    .select('token')
    .single()

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: 'Failed to create invite token' }, { status: 500 })
  }

  const inviteLink = `${appUrl}/accept-invite?token=${tokenRow.token}`

  // Send invite email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailErr } = await resend.emails.send({
    from: 'SocialWorks <noreply@socialworkspro.com>',
    to: email,
    subject: "You're invited to SocialWorks Scorecard",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <p style="font-size:20px;font-weight:600;color:#0E0E0E;margin:0 0 8px;">
          You've been added to SocialWorks Scorecard
        </p>
        <p style="font-size:14px;color:#6B6B6B;margin:0 0 24px;line-height:1.6;">
          Hi ${name}, you've been set up as <strong>${role.replace('_', ' ')}</strong> on the team scorecard.
          Click below to set your password and get started.
        </p>
        <a href="${inviteLink}"
           style="display:inline-block;padding:12px 24px;background:#1FA6F5;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
          Set up my account
        </a>
        <p style="font-size:12px;color:#9B9B9B;margin:24px 0 0;line-height:1.6;">
          This link doesn't expire. If you didn't expect this email, you can ignore it.
        </p>
      </div>
    `,
  })

  if (emailErr) {
    // Token created but email failed — still return success so admin knows user exists
    console.error('Resend error:', emailErr)
    return NextResponse.json({ success: true, warning: 'User created but email failed to send' })
  }

  return NextResponse.json({ success: true })
}
