import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const reservedRoutes = ['login', 'register', 'admin', 'auth', 'api', '_next', 'static', 'public', 'favicon.ico', 'onboarding']

export async function middleware(req: NextRequest) {
    // 1. Run Supabase auth check (refreshes session)
    const { response, supabase, user } = await updateSession(req)
    const session = user ? { user } : null

    const path = req.nextUrl.pathname

    // Public Routes (Allow access without session)
    if (path === '/' || path === '/login' || path === '/register' || path.startsWith('/auth') || path.startsWith('/api')) {
        return response
    }

    if (path === '/onboarding' && !session) {
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('next', '/onboarding')
        return NextResponse.redirect(redirectUrl)
    }

    const segments = path.split('/').filter(Boolean);
    const firstSegment = segments[0];

    // Super Admin Routes
    if (path.startsWith('/super-admin')) {
        if (!session) {
            const redirectUrl = new URL('/login', req.url)
            redirectUrl.searchParams.set('next', path)
            return NextResponse.redirect(redirectUrl)
        }

        const { data: isSuperAdmin } = await supabase
            .from('super_admins')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

        if (!isSuperAdmin) {
            return NextResponse.redirect(new URL('/', req.url))
        }
        return response
    }

    // Organization Routes
    if (firstSegment && !reservedRoutes.includes(firstSegment)) {
        const orgSlug = firstSegment;

        // Admin Routes protection
        if (path.includes('/admin')) {
            if (!session) {
                const redirectUrl = new URL('/login', req.url)
                redirectUrl.searchParams.set('next', path)
                return NextResponse.redirect(redirectUrl)
            }
            return response;
        }

        // Staff Scanner Routes protection
        if (path.includes('/scanner') || path.includes('/gate-scanner')) {
            if (!session) {
                const redirectUrl = new URL('/login', req.url)
                redirectUrl.searchParams.set('next', path)
                return NextResponse.redirect(redirectUrl)
            }
            return response;
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
