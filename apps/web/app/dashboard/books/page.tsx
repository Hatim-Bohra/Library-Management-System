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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
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

    const { data: books, isLoading, error } = useQuery({
        queryKey: ['books', debouncedSearch, selectedCategory],
        queryFn: async () => {
            const params: any = { limit: 50 };
            if (debouncedSearch) params.q = debouncedSearch;
            if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;

            const { data } = await api.get('/books', { params });
            return data;
        }
    });

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
                <div className="w-full overflow-x-auto pb-2 min-w-0">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 min-w-[300px]">
                        <h2 className="text-2xl font-bold tracking-tight">Curated Collection</h2>

                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="flex w-full md:w-[250px] items-center space-x-2">
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 text-xs"
                                />
                                <Button size="icon" className="h-8 w-8"><Search className="h-3 w-3" /></Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="w-full overflow-x-auto pb-2">
                    <CategoryPills
                        categories={categories || []}
                        selectedId={selectedCategory}
                        onSelect={setSelectedCategory}
                    />
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
                    {books?.length === 0 && <p className="text-muted-foreground">No books found matching your criteria.</p>}
                </>
            )}
        </div>
    );
}
