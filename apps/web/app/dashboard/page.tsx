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
import { BookCard } from "@/components/books/book-card";

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

    const { data: books, isLoading: booksLoading } = useQuery({
        queryKey: ['dashboard-books', debouncedSearch, selectedCategory],
        queryFn: async () => {
            const params: any = {};
            if (debouncedSearch) params.q = debouncedSearch;
            if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;

            const { data } = await api.get('/books', { params });
            return data;
        },
        enabled: !!user && user.role === 'MEMBER'
    });

    if (statsLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array.isArray(stats) && stats.map((stat: any, index: number) => {
                    const Icon = iconMap[stat.icon] || Book;
                    return (
                        <Link href={stat.link} key={index}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Click to view details
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Book Catalog Section (Members Only) */}
            {user?.role === 'MEMBER' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <h2 className="text-3xl font-bold tracking-tight">Library Catalog</h2>
                        {/* ... existing catalog header ... */}
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            {/* Filter */}
                            <div className="w-full md:w-[200px]">
                                <Select onValueChange={setSelectedCategory} defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Genres" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Genres</SelectItem>
                                        {categories?.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search */}
                            <div className="flex w-full md:w-[300px] items-center space-x-2">
                                <Input
                                    type="search"
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button size="icon"><Search className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>

                    <FineBreakdown />
                    <ActiveLoans />

                    {booksLoading ? (
                        <div>Loading Catalog...</div>
                    ) : (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {books?.map((book: any) => (
                                    <BookCard key={book.id} book={book} />
                                ))}
                            </div>
                            {books?.length === 0 && <p>No books found matching your criteria.</p>}
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
