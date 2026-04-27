import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  const { pathname } = request.nextUrl

  // PREVIEW MODE: auth bypassed — remove this block once Supabase is connected
  if (process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true') {
    return supabaseResponse
  }

  // Public routes — no auth required
  const publicPaths = ['/login', '/auth/callback', '/update-password', '/accept-invite']
  if (publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    // Logged-in user hitting /login → send them home
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Unauthenticated → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Legacy /submit route → /me
  if (pathname === '/submit' || pathname.startsWith('/submit/')) {
    return NextResponse.redirect(new URL('/me', request.url))
  }

  // Admin-only route guard
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
