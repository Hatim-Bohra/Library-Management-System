'use client';

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
import Image from 'next/image';

import { BookDialog } from '@/components/books/book-dialog';
import { InventoryDialog } from '@/components/books/inventory-dialog';

export default function AdminBooksPage() {
    const { data: books, isLoading } = useQuery({
        queryKey: ['admin-books'],
        queryFn: async () => {
            const { data } = await api.get('/books');
            return data;
        }
    });

    if (isLoading) return <div>Loading books...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Books</h2>
                <BookDialog />
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
                        {books?.map((book: any) => (
                            <TableRow key={book.id}>
                                <TableCell>
                                    {book.coverUrl ? (
                                        <div className="relative h-10 w-8">
                                            <Image
                                                src={book.coverUrl.startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
                                                alt="Cover"
                                                fill
                                                className="object-cover rounded shadow-sm"
                                                sizes="32px"
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
        </div >
    );
}
