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
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Book
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
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
                                <TableCell className="font-medium">{book.title}</TableCell>
                                <TableCell>{book.author.name}</TableCell>
                                <TableCell>{book.isbn}</TableCell>
                                <TableCell>{book.copies || book.inventory?.length || 0}</TableCell>
                                <TableCell>{book.isAvailable ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                    <Button variant="ghost" size="sm">Inventory</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
