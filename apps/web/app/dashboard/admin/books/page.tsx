'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';


import { BookDialog } from '@/components/books/book-dialog';
import { InventoryDialog } from '@/components/books/inventory-dialog';
import { ImportBookDialog } from '@/components/books/import-book-dialog';

export default function AdminBooksPage() {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data, isLoading } = useQuery({
        queryKey: ['admin-books', page],
        queryFn: async () => {
            const { data } = await api.get('/books', { params: { page, limit: pageSize } });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });

    const books = data?.data || [];
    const meta = data?.meta;

    if (isLoading) return <div>Loading books...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Books</h2>
                <div className="flex gap-2">
                    <ImportBookDialog />
                    <BookDialog />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Cover</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>ISBN</TableHead>
                            <TableHead>Total Copies</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {books.map((book: any) => (
                            <TableRow key={book.id}>
                                <TableCell>
                                    {book.coverUrl ? (
                                        <div className="relative h-10 w-8">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={book.coverUrl.startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
                                                alt="Cover"
                                                className="object-cover w-full h-full rounded shadow-sm"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-8 bg-muted rounded flex items-center justify-center text-[8px] text-muted-foreground">
                                            No
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{book.title}</TableCell>
                                <TableCell>{book.author.name}</TableCell>
                                <TableCell>{book.isbn}</TableCell>
                                <TableCell>{book.copies || book.inventory?.length || 0}</TableCell>
                                <TableCell>{book.isAvailable ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <BookDialog initialData={book} />
                                    <InventoryDialog bookId={book.id} bookTitle={book.title} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Page {meta.page} of {meta.lastPage} ({meta.total} total books)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= meta.lastPage}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div >
    );
}
