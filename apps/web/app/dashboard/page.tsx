"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Book, Users, Repeat, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Map icon names to components
const iconMap: any = {
    Book,
    Users,
    Repeat,
    AlertCircle,
    CheckCircle,
    DollarSign
};

import { useAuth } from "@/components/providers/auth-provider";
import { BookCard } from "@/components/book-card";
import { BookCarousel } from "@/components/book-carousel";
import { FeaturedHero } from '@/components/featured-hero';
import { CategoryPills } from '@/components/category-pills';
import { InventoryStatsCards } from "@/components/inventory/inventory-stats-cards";

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoanCountdown } from "@/components/circulation/loan-countdown";
import { FineBreakdown } from "@/components/fines/fine-breakdown";

export default function DashboardPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            // Fetch stats for everyone (Member will get their specific 4 stats)
            const { data } = await api.get('/dashboard/stats');
            return data;
        },
    });

    // Fetch Categories
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        },
        enabled: !!user && user.role === 'MEMBER'
    });

    const [page, setPage] = useState(1);
    const pageSize = 12;

    const { data: booksData, isLoading: booksLoading } = useQuery({
        queryKey: ['dashboard-books', debouncedSearch, selectedCategory, page],
        queryFn: async () => {
            const params: any = { page, limit: pageSize };
            if (debouncedSearch) params.q = debouncedSearch;
            if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;

            const { data } = await api.get('/books', { params });
            return data;
        },
        enabled: !!user && user.role === 'MEMBER',
        placeholderData: (previousData) => previousData,
    });

    const books = booksData?.data || [];
    const meta = booksData?.meta;

    if (statsLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="space-y-8">
            {/* Header / Greeting */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    {getGreeting()}, {user?.name?.split(' ')[0] || 'Member'}.
                </h1>
                <p className="text-muted-foreground">
                    Here is what&apos;s happening in your library today.
                </p>
            </div>

            {/* Inventory Stats (Admin/Librarian) */}
            {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">Inventory Overview</h2>
                    <InventoryStatsCards />
                </div>
            )}

            {/* Business Critical: Loans & Fines (Members) */}
            {user?.role === 'MEMBER' && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <ActiveLoans />
                    <FineBreakdown />
                </div>
            )}

            {/* General Stats Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.isArray(stats) && stats.map((stat: any, index: number) => {
                    const Icon = iconMap[stat.icon] || Book;
                    return (
                        <Link href={stat.link} key={index}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-none shadow-md bg-gradient-to-br from-background to-muted/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Featured & Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    {/* Trending Carousel */}
                    {books && books.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 tracking-tight">Trending Now</h2>
                            <BookCarousel title="" books={books.slice(0, 8)} />
                        </div>
                    )}
                </div>

                {/* Compact Featured Book / Recommendation */}
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold mb-4 tracking-tight">Suggested for You</h2>
                    <FeaturedHero variant="compact" book={books?.[1]} />
                </div>
            </div>

            {/* Book Catalog Section (Members Only) */}
            {user?.role === 'MEMBER' && (
                <div className="space-y-6 pt-6 border-t">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold tracking-tight">Browse Collection</h2>

                            <div className="flex gap-2 w-full md:w-auto">
                                {/* Search */}
                                <div className="flex w-full md:w-[250px] items-center space-x-2">
                                    <Input
                                        type="search"
                                        placeholder="Search title..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="bg-background"
                                    />
                                    <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
                                </div>

                                {/* Genre Dropdown */}
                                <Select value={selectedCategory} onValueChange={(val) => {
                                    setSelectedCategory(val);
                                    setPage(1);
                                }}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {Array.isArray(categories) && categories.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {booksLoading ? (
                        <div>Loading Catalog...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                                {books?.map((book: any) => (
                                    <BookCard key={book.id} book={book} hideGenre={true} />
                                ))}
                            </div>
                            {books?.length === 0 && <p className="text-center py-10 text-muted-foreground">No books found matching your criteria.</p>}

                            {/* Pagination Controls */}
                            {meta && (
                                <div className="flex items-center justify-center gap-4 mt-8 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium">
                                        Page {meta.page} of {meta.lastPage}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= meta.lastPage}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function ActiveLoans() {
    const { data: loans } = useQuery({
        queryKey: ['my-loans'],
        queryFn: async () => {
            const res = await api.get('/circulation/loans');
            return res.data;
        }
    });

    const activeLoans = Array.isArray(loans) ? loans.filter((l: any) => l.status === 'ACTIVE') : [];

    if (!activeLoans.length) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Active Loans</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeLoans.map((loan: any) => (
                    <Card key={loan.id} className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{loan.book.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">{loan.book.author}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Due Date:</span>
                                    <span>{new Date(loan.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t">
                                    <LoanCountdown dueDate={loan.dueDate} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
