'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookCard } from '@/components/books/book-card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function BooksPage() {
    const [search, setSearch] = useState('');

    // TODO: Ideally we separate Admin vs Member views. 
    // For this task we are focusing on "User-facing UI", so we'll default to the catalog view.
    // Real app might need separate routes or role checks here.

    const { data: books, isLoading, error } = useQuery({
        queryKey: ['books', search],
        queryFn: async () => {
            const { data } = await api.get('/books', { params: { search } });
            return data;
        }
    });

    if (isLoading) return <div>Loading books...</div>;
    if (error) return <div>Error loading books: {(error as any).message}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Library Catalog</h2>
                <div className="w-1/3">
                    <Input
                        placeholder="Search books..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books?.map((book: any) => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
            {books?.length === 0 && <p className="text-muted-foreground">No books found.</p>}
        </div>
    );
}
