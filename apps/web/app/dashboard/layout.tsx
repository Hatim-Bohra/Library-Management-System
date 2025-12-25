'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Book, Users, Repeat, LayoutDashboard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';
import { NotificationBell } from '@/components/notifications/notification-bell';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth(); // Use logout and user from context

    // ... logic ...

    const allNavItems = [
        // Common
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN', 'LIBRARIAN', 'MEMBER'] },
        { href: '/dashboard/books', label: 'Books', icon: Book, roles: ['ADMIN', 'LIBRARIAN', 'MEMBER'] },
        { href: '/dashboard/requests', label: 'My Requests', icon: Repeat, roles: ['MEMBER'] },
        { href: '/dashboard/my-loans', label: 'My Loans', icon: Users, roles: ['MEMBER'] },

        // Admin/Librarian
        { href: '/dashboard/admin/books', label: 'Manage Books', icon: Book, roles: ['ADMIN', 'LIBRARIAN'] },
        { href: '/dashboard/admin/requests', label: 'Manage Requests', icon: Repeat, roles: ['ADMIN', 'LIBRARIAN'] },

        // Admin Only
        { href: '/dashboard/admin/fines', label: 'Fine Rules', icon: Users, roles: ['ADMIN'] },
        { href: '/dashboard/admin/audit', label: 'Audit Logs', icon: Users, roles: ['ADMIN'] },
    ];

    // Always append Profile for everyone
    const profileItem = { href: '/dashboard/profile', label: 'My Profile', icon: Users, roles: ['ADMIN', 'LIBRARIAN', 'MEMBER'] };

    const navItems = [
        ...allNavItems.filter(item => user && item.roles.includes(user.role)),
        profileItem
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-6">
                        <Link className="flex items-center gap-2 font-semibold" href="/">
                            <span className="">Acmei Library</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                        <nav className="grid items-start px-4 text-sm font-medium">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                        pathname === item.href
                                            ? "bg-gray-100 text-primary dark:bg-gray-800"
                                            : "text-gray-500 dark:text-gray-400"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-auto p-4">
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
                    <div className="flex w-full items-center justify-between">
                        <h1 className="text-lg font-semibold">Dashboard</h1>
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
