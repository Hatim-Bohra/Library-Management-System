'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AuthorDialog } from '@/components/authors/author-dialog';
import { getAuthors } from '@/lib/authors';

export default function AdminAuthorsPage() {
    const { data: authors, isLoading } = useQuery({
        queryKey: ['authors'],
        queryFn: getAuthors,
    });

    if (isLoading) return <div>Loading authors...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Manage Authors</h2>
                <AuthorDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Bio</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {authors?.map((author) => (
                            <TableRow key={author.id}>
                                <TableCell className="font-medium">{author.name}</TableCell>
                                <TableCell>{author.bio || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
