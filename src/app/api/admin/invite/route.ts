import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

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

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name, role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/me`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Create profile record
  await serviceClient.from('profiles').upsert({
    id: data.user.id,
    full_name: name,
    role,
    active: true,
  })

  return NextResponse.json({ success: true })
}
