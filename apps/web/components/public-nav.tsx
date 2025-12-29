'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Book, LayoutDashboard, User } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <User className="h-5 w-5" />
                                        <span className="sr-only">Toggle user menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard">Dashboard</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/profile">Profile</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => window.location.href = '/login'}>
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
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
