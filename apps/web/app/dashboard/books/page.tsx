'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookCard } from '@/components/books/book-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
            const params: any = {};
            if (debouncedSearch) params.q = debouncedSearch;
            if (selectedCategory && selectedCategory !== 'all') params.categoryId = selectedCategory;

            const { data } = await api.get('/books', { params });
            return data;
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Library Catalog</h2>

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
                            placeholder="Search books..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button size="icon"><Search className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div>Loading books...</div>
            ) : error ? (
                <div>Error loading books: {(error as any).message}</div>
            ) : (
                <>
                    <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {books?.map((book: any) => (
                            <div key={book.id} className="h-[320px]">
                                <BookCard book={book} />
                            </div>
                        ))}
                    </div>
                    {books?.length === 0 && <p className="text-muted-foreground">No books found matching your criteria.</p>}
                </>
            )}
        </div>
    );
}
