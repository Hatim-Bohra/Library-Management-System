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

export default function AdminAuditPage() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const { data } = await api.get('/audit');
            return data;
        }
    });

    const formatDetails = (log: any) => {
        try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            if (!details) return '-';

            if (log.action === 'BOOK_OVERRIDE' && details.field === 'isAvailable') {
                return `Manually changed availability from ${details.oldValue ? 'Available' : 'Unavailable'} to ${details.newValue ? 'Available' : 'Unavailable'}. Reason: ${details.reason}`;
            }

            // Generic fallback for other updates
            if (details.field && details.oldValue !== undefined && details.newValue !== undefined) {
                return `Changed ${details.field} from "${details.oldValue}" to "${details.newValue}"`;
            }

            // If it's just a reason string or object
            if (details.reason) return `Reason: ${details.reason}`;

            // Fallback to formatted JSON if structural
            return JSON.stringify(details, null, 2);
        } catch (e) {
            return String(log.details);
        }
    };

    if (isLoading) return <div>Loading logs...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">System Audit Logs</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs?.map((log: any) => (
                            <TableRow key={log.id}>
                                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                <TableCell>{log.user?.email || log.performedBy}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>{log.entityType} ({log.entityId})</TableCell>
                                <TableCell className="max-w-md whitespace-pre-wrap text-sm">
                                    {formatDetails(log)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
