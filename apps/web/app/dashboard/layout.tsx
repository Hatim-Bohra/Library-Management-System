'use client';

import * as React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Book, Users, Repeat, LayoutDashboard, LogOut, Menu, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
        { href: '/dashboard/wishlist', label: 'My Wishlist', icon: Heart, roles: ['MEMBER'] },

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

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    return (
        <div className={cn(
            "grid min-h-screen w-full transition-all duration-300 ease-in-out",
            isSidebarOpen ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-[0px_1fr]"
        )}>
            <div className="hidden border-r bg-muted/40 lg:block sticky top-0 h-screen overflow-hidden">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-6 justify-between">
                        <Link className="flex items-center gap-2 font-semibold" href="/">
                            <Book className="h-6 w-6" />
                            <span className="">Lumina Library</span>
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
                                            ? "bg-muted text-primary"
                                            : "text-muted-foreground hover:bg-muted/50"
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
            <div className="flex flex-col min-w-0">
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
                    <div className="flex items-center gap-4">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle navigation menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col">
                                <nav className="grid gap-2 text-lg font-medium">
                                    <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                                        <Book className="h-6 w-6" />
                                        <span className="sr-only">Lumina Library</span>
                                        Lumina Library
                                    </Link>
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground",
                                                pathname === item.href
                                                    ? "bg-muted text-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                    <Button variant="ghost" className="justify-start gap-4 px-3 mt-4 text-muted-foreground" onClick={handleLogout}>
                                        <LogOut className="h-5 w-5" />
                                        Logout
                                    </Button>
                                </nav>
                            </SheetContent>
                        </Sheet>
                        {/* Desktop Sidebar Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:flex"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Sidebar</span>
                        </Button>
                    </div>

                    <div className="flex w-full items-center justify-between">
                        <h1 className="text-lg font-semibold">
                            {(() => {
                                const routeTitles: Record<string, string> = {
                                    '/dashboard': 'Dashboard',
                                    '/dashboard/books': 'Books Collection',
                                    '/dashboard/requests': 'My Requests',
                                    '/dashboard/my-loans': 'My Loans',
                                    '/dashboard/wishlist': 'My Wishlist',
                                    '/dashboard/profile': 'My Profile',
                                    '/dashboard/admin/books': 'Manage Books',
                                    '/dashboard/admin/requests': 'Manage Requests',
                                    '/dashboard/admin/fines': 'Fine Rules',
                                    '/dashboard/admin/audit': 'Audit Logs',
                                };
                                return routeTitles[pathname] || 'Dashboard';
                            })()}
                        </h1>
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                        </div>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
