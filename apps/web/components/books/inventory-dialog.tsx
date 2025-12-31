'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

interface InventoryDialogProps {
    bookId: string;
    bookTitle: string;
    trigger?: React.ReactNode;
}

const addSchema = z.object({
    location: z.string().min(1, 'Location required').default('Main Stacks'),
});

export function InventoryDialog({ bookId, bookTitle, trigger }: InventoryDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: items, isLoading } = useQuery({
        queryKey: ['inventory', bookId],
        queryFn: async () => {
            const { data } = await api.get(`/books/${bookId}/inventory`);
            return data;
        },
        enabled: open,
    });

    const addMutation = useMutation({
        mutationFn: async (values: z.infer<typeof addSchema>) => {
            // Generate barcode logic or let backend handle? Backend expects barcode. 
            // InventoryService.addCopy generates one if payload requires it?
            // Controller DTO: AddInventoryDto { barcode: string; location?: string; }
            // Let's generate a simple barcode or ask user.
            const barcode = `INV-${bookId.slice(0, 4)}-${Date.now().toString().slice(-6)}`;
            return api.post(`/books/${bookId}/inventory`, {
                barcode,
                location: values.location
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', bookId] });
            queryClient.invalidateQueries({ queryKey: ['admin-books'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
            /* alert('Copy added'); */
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            return api.patch(`/inventory/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', bookId] });
            queryClient.invalidateQueries({ queryKey: ['admin-books'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
        }
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="ghost" size="sm">Inventory</Button>}
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Inventory: {bookTitle}</DialogTitle>
                    <DialogDescription>Manage physical copies.</DialogDescription>
                </DialogHeader>

                <div className="flex justify-end mb-4">
                    <Button onClick={() => addMutation.mutate({ location: 'Main Stacks' })} disabled={addMutation.isPending}>
                        {addMutation.isPending ? 'Adding...' : '+ Add Copy'}
                    </Button>
                </div>

                <div className="border rounded-md max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : items?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No copies found.</TableCell>
                                </TableRow>
                            ) : (
                                items?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.barcode}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.status === 'AVAILABLE' ? 'default' : 'destructive'}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.location}</TableCell>
                                        <TableCell>
                                            {item.status !== 'LOST' && item.status !== 'DAMAGED' && (
                                                <Select
                                                    defaultValue={item.status}
                                                    onValueChange={(value) => statusMutation.mutate({ id: item.id, status: value })}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AVAILABLE">Available</SelectItem>
                                                        <SelectItem value="ISSUED">Issued</SelectItem>
                                                        <SelectItem value="LOST">Lost</SelectItem>
                                                        <SelectItem value="DAMAGED">Damaged</SelectItem>
                                                        <SelectItem value="RESERVED">Reserved</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
