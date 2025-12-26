'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail } from 'lucide-react';

export default function AdminRequestsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('pending');

    const getStatusFilter = (tab: string) => {
        switch (tab) {
            case 'pending': return 'PENDING';
            case 'approved': return 'APPROVED,OUT_FOR_DELIVERY'; // Processing
            case 'rejected': return 'REJECTED,CANCELLED,DELIVERY_FAILED';
            case 'completed': return 'FULFILLED';
            default: return 'PENDING';
        }
    };

    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin-requests', activeTab],
        queryFn: async () => {
            const status = getStatusFilter(activeTab);
            const { data } = await api.get('/requests', { params: { status } });
            return data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => api.patch(`/requests/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            // Refresh counts if we had them
            queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
            toast.success('Request approved');
        },
        onError: () => toast.error('Failed to approve request')
    });

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => api.patch(`/requests/${id}/reject`, { reason: 'Admin rejected' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
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

    const fulfillMutation = useMutation({
        mutationFn: async ({ id, type }: { id: string, type: string }) => {
            if (type === 'DELIVERY') return api.patch(`/requests/${id}/deliver`);
            return api.patch(`/requests/${id}/collect`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            queryClient.invalidateQueries({ queryKey: ['revenue-analytics'] }); // Update revenue!
            toast.success('Request fulfilled');
        },
        onError: () => toast.error('Failed to fulfill request')
    });

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Manage Requests</h2>

            <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Processing</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Book</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : requests?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No requests found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests?.map((req: any) => (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{req.user.firstName?.[0] || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{req.user.firstName} {req.user.lastName}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {req.user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{req.book.title}</span>
                                                    <span className="text-xs text-muted-foreground">ISBN: {req.book.isbn}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{req.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        req.status === 'PENDING' ? 'default' :
                                                            req.status === 'REJECTED' ? 'destructive' :
                                                                req.status === 'FULFILLED' ? 'secondary' : 'outline'
                                                    }
                                                >
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {/* Pending Actions */}
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(req.id)}>Reject</Button>
                                                        <Button size="sm" onClick={() => approveMutation.mutate(req.id)}>Approve</Button>
                                                    </>
                                                )}

                                                {/* Processing Actions */}
                                                {req.status === 'APPROVED' && req.type === 'DELIVERY' && (
                                                    <Button size="sm" onClick={() => dispatchMutation.mutate(req.id)}>Dispatch</Button>
                                                )}
                                                {req.status === 'APPROVED' && req.type === 'PICKUP' && (
                                                    <Button size="sm" onClick={() => fulfillMutation.mutate({ id: req.id, type: 'PICKUP' })}>Mark Collected</Button>
                                                )}
                                                {req.status === 'OUT_FOR_DELIVERY' && (
                                                    <Button size="sm" onClick={() => fulfillMutation.mutate({ id: req.id, type: 'DELIVERY' })}>Confirm Delivery</Button>
                                                )}

                                                {/* View Only for Completed/Rejected */}
                                                {(activeTab === 'completed' || activeTab === 'rejected') && (
                                                    <span className="text-sm text-muted-foreground">No actions</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
