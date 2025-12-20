'use client';

import { useQuery } from '@tanstack/react-query';
import { getBooks, Book } from '@/lib/books';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function BooksPage() {
    const { data, isLoading, error } = useQuery<Book[]>({
        queryKey: ['books'],
        queryFn: getBooks,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading books</div>;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Books</h2>
                <Button asChild>
                    <Link href="/dashboard/books/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Book
                    </Link>
                </Button>
            </div>
            <DataTable columns={columns} data={data || []} />
        </div>
    );
}
