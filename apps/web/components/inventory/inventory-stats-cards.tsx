'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, Clock, AlertTriangle, XCircle, ArrowRightLeft } from 'lucide-react';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

export function InventoryStatsCards() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['inventory-global-stats'],
        queryFn: async () => {
            const { data } = await api.get('/inventory/global-stats');
            return data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }

    const items = [
        {
            title: 'Total Items',
            value: stats?.total || 0,
            icon: BookOpen,
            color: 'text-primary',
            desc: 'Physical copies'
        },
        {
            title: 'Available',
            value: stats?.available || 0,
            icon: CheckCircle,
            color: 'text-green-500',
            desc: 'On shelves'
        },
        {
            title: 'Issued',
            value: stats?.issued || 0,
            icon: ArrowRightLeft,
            color: 'text-blue-500',
            desc: 'Currently loaned'
        },
        {
            title: 'Reserved',
            value: stats?.reserved || 0,
            icon: Clock,
            color: 'text-orange-500',
            desc: 'Awaiting pickup'
        },
        {
            title: 'Lost/Damaged',
            value: (stats?.lost || 0) + (stats?.damaged || 0),
            icon: AlertTriangle,
            color: 'text-red-500',
            desc: 'Requires attention'
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {items.map((item, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {item.title}
                        </CardTitle>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground capitalize">
                            {item.desc}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
