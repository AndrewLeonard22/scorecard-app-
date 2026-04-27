import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  if (!token) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_invite`)
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Look up the token
  const { data: invite, error } = await serviceClient
    .from('invite_tokens')
    .select('user_id, email, used_at')
    .eq('token', token)
    .single()

  if (error || !invite) {
    return NextResponse.redirect(`${appUrl}/login?error=invalid_invite`)
  }

  if (invite.used_at) {
    // Already used — send them to login with a helpful message
    return NextResponse.redirect(`${appUrl}/login?error=invite_used`)
  }

  // Generate a fresh password-recovery link (valid for 24h from now — user is clicking it right now)
  const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
    type: 'recovery',
    email: invite.email,
    options: {
      redirectTo: `${appUrl}/auth/callback?next=/update-password`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    return NextResponse.redirect(`${appUrl}/login?error=invite_error`)
  }

  // Mark token as used
  await serviceClient
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)

  // Redirect through Supabase's auth flow
  return NextResponse.redirect(linkData.properties.action_link)
}
