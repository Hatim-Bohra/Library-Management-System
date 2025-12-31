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

            // Override specific fields
            if (log.action === 'BOOK_OVERRIDE' && details.field === 'isAvailable') {
                return `Manually changed availability from ${details.oldValue ? 'Available' : 'Unavailable'} to ${details.newValue ? 'Available' : 'Unavailable'}. Reason: ${details.reason}`;
            }

            // General updates
            if (details.field && details.oldValue !== undefined && details.newValue !== undefined) {
                return `Changed ${details.field} from "${details.oldValue}" to "${details.newValue}"`;
            }

            // Object with keys
            if (typeof details === 'object' && !Array.isArray(details)) {
                // If it looks like a simple key-value pair update
                const keys = Object.keys(details).filter(k => k !== 'reason');
                if (keys.length > 0 && keys.every(k => typeof details[k] !== 'object')) {
                    const changes = keys.map(k => `${k}: ${details[k]}`).join(', ');
                    return details.reason ? `${changes} (Reason: ${details.reason})` : changes;
                }
            }

            // Fallback to formatted JSON
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
