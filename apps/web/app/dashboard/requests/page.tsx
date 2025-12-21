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

export default function RequestsPage() {
    const { data: requests, isLoading } = useQuery({
        queryKey: ['requests'],
        queryFn: async () => {
            const { data } = await api.get('/requests');
            return data;
        }
    });

    if (isLoading) return <div>Loading requests...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">My Requests</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests?.map((req: any) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.book.title}</TableCell>
                                <TableCell>{req.type}</TableCell>
                                <TableCell>
                                    <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                        {requests?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">No requests found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
