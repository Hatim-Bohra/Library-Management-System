'use client';

import { useQuery } from '@tanstack/react-query';
import { getMembers, Member } from '@/lib/members';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';

export default function MembersPage() {
    const { data, isLoading, error } = useQuery<Member[]>({
        queryKey: ['members'],
        queryFn: getMembers,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading members</div>;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Members</h2>
            </div>
            <DataTable columns={columns} data={data || []} />
        </div>
    );
}
