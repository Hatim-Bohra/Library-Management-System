import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value;
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');

    if (isDashboard && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isDashboard && token) {
        try {
            // Simple payload decode for routing check (not security verification - that's backend job)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            const role = payload.role;
            const path = request.nextUrl.pathname;

            // Admin Routes Protection
            if (path.startsWith('/dashboard/admin')) {
                // Fines/Audit - Admin Only
                if ((path.includes('/fines') || path.includes('/audit')) && role !== 'ADMIN') {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }

                // Other Admin routes - Admin & Librarian
                if (role === 'MEMBER') {
                    return NextResponse.redirect(new URL('/dashboard', request.url));
                }
            }
        } catch (e) {
            // If token invalid, redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};
