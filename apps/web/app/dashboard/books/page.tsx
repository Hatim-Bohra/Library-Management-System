'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookCard } from '@/components/book-card';
import { RequestDialog } from '@/components/requests/request-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeaturedHero } from '@/components/featured-hero';
import { BookCarousel } from "@/components/book-carousel";
import { CategoryPills } from '@/components/category-pills';

export default function BooksPage() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 24;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch Categories
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        },
    });

    const { data: booksData, isLoading, error } = useQuery({
        queryKey: ['books', debouncedSearch, selectedCategory, page],
        queryFn: async () => {
            const params: any = { limit: pageSize, page };
            if (debouncedSearch) params.q = debouncedSearch;
            if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;

            const { data } = await api.get('/books', { params });
            return data;
        },
        placeholderData: (previousData) => previousData, // keep previous data while fetching new
    });

    // Handle simple array response from API (if API doesn't return count, we just check if full page returned)
    const books = Array.isArray(booksData) ? booksData : [];
    // If API doesn't return total, we guess: if we got full pageSize, next page might exist.
    const hasMore = books.length === pageSize;

    return (
        <div className="space-y-4">
            {/* 1. Featured Hero */}
            <div className="mb-8">
                <FeaturedHero book={books?.[1]} />
            </div>

            {/* 2. Trending Carousel */}
            {books && books.length > 0 && (
                <div className="mb-4">
                    <BookCarousel title="Trending Now" books={books.slice(0, 8)} />
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-6">
                <div className="w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold tracking-tight">Curated Collection</h2>

                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="flex w-full md:w-[250px] items-center space-x-2">
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9"
                                />
                                <Button size="icon" className="h-9 w-9"><Search className="h-4 w-4" /></Button>
                            </div>

                            {/* Category Filter (Dropdown) */}
                            <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setPage(1); }}>
                                <SelectTrigger className="w-full md:w-[200px] h-9">
                                    <SelectValue placeholder="Select Genre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Genres</SelectItem>
                                    {categories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div>Loading books...</div>
            ) : error ? (
                <div>Error loading books: {(error as any).message}</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {books?.map((book: any) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                hideGenre={true}
                                action={
                                    <RequestDialog
                                        bookId={book.id}
                                        bookTitle={book.title}
                                        rentalPrice={Number(book.rentalPrice || 0)}
                                        trigger={<Button className="w-full h-9 text-xs" disabled={!book.isAvailable}>Request</Button>}
                                    />
                                }
                            />
                        ))}
                    </div>
                    {books?.length === 0 && <p className="text-muted-foreground text-center py-10">No books found matching your criteria.</p>}

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-center gap-2 mt-8 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-medium mx-2">Page {page}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={!hasMore || books.length === 0}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
