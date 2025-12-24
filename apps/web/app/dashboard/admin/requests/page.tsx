'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';

export default function AdminRequestsPage() {
    const queryClient = useQueryClient();
    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin-requests'],
        queryFn: async () => {
            // Ideally fetch pending/processing only or sort
            const { data } = await api.get('/requests');
            return data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => api.patch(`/requests/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            toast.success('Request approved');
        },
        onError: () => toast.error('Failed to approve request')
    });

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => api.patch(`/requests/${id}/reject`, { reason: 'Admin rejected' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            toast.success('Request rejected');
        },
        onError: () => toast.error('Failed to reject request')
    });

    const dispatchMutation = useMutation({
        mutationFn: async (id: string) => api.patch(`/requests/${id}/dispatch`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            toast.success('Request dispatched');
        },
        onError: () => toast.error('Failed to dispatch request')
    });

    // Pickup: Collect, Delivery: Confirm Delivery
    const fulfillMutation = useMutation({
        mutationFn: async ({ id, type }: { id: string, type: string }) => {
            if (type === 'DELIVERY') return api.patch(`/requests/${id}/deliver`);
            return api.patch(`/requests/${id}/collect`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            toast.success('Request fulfilled');
        },
        onError: () => toast.error('Failed to fulfill request')
    });

    if (isLoading) return <div>Loading requests...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Manage Requests</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Book</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests?.map((req: any) => (
                            <TableRow key={req.id}>
                                <TableCell>User {req.userId.slice(0, 4)}...</TableCell>
                                <TableCell>{req.book.title}</TableCell>
                                <TableCell>{req.type}</TableCell>
                                <TableCell>
                                    <Badge>{req.status}</Badge>
                                </TableCell>
                                <TableCell className="space-x-2">
                                    {req.status === 'PENDING' && (
                                        <>
                                            <Button size="sm" onClick={() => approveMutation.mutate(req.id)}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(req.id)}>Reject</Button>
                                        </>
                                    )}
                                    {req.status === 'APPROVED' && req.type === 'DELIVERY' && (
                                        <Button size="sm" onClick={() => dispatchMutation.mutate(req.id)}>Dispatch</Button>
                                    )}
                                    {req.status === 'APPROVED' && req.type === 'PICKUP' && (
                                        <Button size="sm" onClick={() => fulfillMutation.mutate({ id: req.id, type: 'PICKUP' })}>Mark Collected</Button>
                                    )}
                                    {req.status === 'OUT_FOR_DELIVERY' && (
                                        <Button size="sm" onClick={() => fulfillMutation.mutate({ id: req.id, type: 'DELIVERY' })}>Confirm Delivery</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
