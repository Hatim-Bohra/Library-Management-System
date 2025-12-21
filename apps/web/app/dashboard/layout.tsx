'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Book, Users, Repeat, LayoutDashboard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth(); // Use logout from context

    const handleLogout = () => {
        logout(); // Call context logout
    };

    const navItems = [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/dashboard/books', label: 'Books', icon: Book },
        { href: '/dashboard/members', label: 'Members', icon: Users },
        { href: '/dashboard/circulation', label: 'Circulation', icon: Repeat },
    ];

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
                    <div className="w-full flex-1">
                        <h1 className="text-lg font-semibold">Dashboard</h1>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
