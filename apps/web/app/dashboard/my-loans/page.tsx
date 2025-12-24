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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRequest, BookRequestType } from '@/lib/requests';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

function ReturnButton({ bookId }: { bookId: string }) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: () => createRequest({ bookId, type: BookRequestType.RETURN }),
        onSuccess: () => {
            toast.success('Return request submitted');
            queryClient.invalidateQueries({ queryKey: ['loans'] }); // Re-fetch loans if desired, though request is separate
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to submit return request');
        }
    });

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
        >
            {mutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Return
        </Button>
    );
}

export default function LoansPage() {
    // Determine the user's loans. The API endpoint GET /circulation/loans needs to handle member role automatically.
    // Assuming GET /circulation/loans returns filtered list for member.
    const { data: loans, isLoading } = useQuery({
        queryKey: ['loans'],
        queryFn: async () => {
            const { data } = await api.get('/circulation/loans');
            return data;
        }
    });

    // Mock fine calculation if not returned directly (Though backend handles it ideally)
    // Actually the fine engine is in backend. We can fetch fines or just show if status is overdue.
    // For now assuming the loan object includes status and due date.

    if (isLoading) return <div>Loading loans...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">My Loans</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Borrowed Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Fines</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loans?.map((loan: any) => (
                            <TableRow key={loan.id}>
                                <TableCell className="font-medium">{loan.book.title}</TableCell>
                                <TableCell>{format(new Date(loan.borrowedAt), 'PP')}</TableCell>
                                <TableCell>{format(new Date(loan.dueDate), 'PP')}</TableCell>
                                <TableCell>
                                    <Badge variant={loan.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                                        {loan.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {loan.fines?.reduce((acc: number, fine: any) => acc + Number(fine.amount), 0) || 0}
                                </TableCell>
                                <TableCell>
                                    {loan.status === 'ACTIVE' && (
                                        <ReturnButton bookId={loan.bookId} />
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {loans?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No active loans</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
