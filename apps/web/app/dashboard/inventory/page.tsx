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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { InventoryDialog } from '@/components/books/inventory-dialog';

export default function InventoryDashboard() {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useQuery({
        queryKey: ['inventory-stats', debouncedSearch],
        queryFn: async () => {
            const params: any = { limit: 50 };
            if (debouncedSearch) params.search = debouncedSearch;
            const res = await api.get('/inventory/stats', { params });
            return res.data;
        }
    });

    const books = data?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
                <div className="flex w-full md:w-[300px] items-center space-x-2">
                    <Input
                        placeholder="Search usage..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Book</TableHead>
                            <TableHead>Total Copies</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead>Issued</TableHead>
                            <TableHead>Reserved</TableHead>
                            <TableHead>Lost/Damaged</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">Loading inventory...</TableCell>
                            </TableRow>
                        ) : books.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10">No books found.</TableCell>
                            </TableRow>
                        ) : (
                            books.map((book: any) => (
                                <TableRow key={book.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{book.title}</span>
                                            <span className="text-xs text-muted-foreground">{book.isbn}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{book.stats.total}</TableCell>
                                    <TableCell>
                                        <Badge variant={book.stats.available > 0 ? "default" : "secondary"}>
                                            {book.stats.available} Available
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{book.stats.issued}</TableCell>
                                    <TableCell>{book.stats.reserved}</TableCell>
                                    <TableCell>
                                        {(book.stats.lost + book.stats.damaged) > 0 ? (
                                            <span className="text-destructive">
                                                {book.stats.lost + book.stats.damaged}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <InventoryDialog bookId={book.id} bookTitle={book.title} trigger={<Button variant="outline" size="sm">Manage</Button>} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
