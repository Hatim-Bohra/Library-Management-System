'use client';

import { useQuery } from '@tanstack/react-query';
import { getLoans, Loan } from '@/lib/circulation';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function CirculationPage() {
    const { data, isLoading, error } = useQuery<Loan[]>({
        queryKey: ['loans'],
        queryFn: getLoans,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading loans</div>;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Circulation</h2>
                <Button asChild>
                    <Link href="/dashboard/circulation/new">
                        <Plus className="mr-2 h-4 w-4" /> Check Out
                    </Link>
                </Button>
            </div>
            <DataTable columns={columns} data={data || []} />
        </div>
    );
}
