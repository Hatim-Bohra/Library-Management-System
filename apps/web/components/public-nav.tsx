'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

export function PublicNav() {
    const { isAuthenticated, user } = useAuth();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-14 items-center px-4">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Book className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">
                            Lumina Library
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                            Home
                        </Link>
                        <Link href={isAuthenticated ? "/dashboard/books" : "/#catalog"} className="transition-colors hover:text-foreground/80 text-foreground/60">
                            Catalog
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Expanded search could go here */}
                    </div>
                    <nav className="flex items-center space-x-2">
                        {isAuthenticated ? (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </Button>
                                <Button variant="outline" size="icon" asChild>
                                    <Link href="/dashboard/profile">
                                        <User className="h-4 w-4" />
                                        <span className="sr-only">Profile</span>
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild>
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
