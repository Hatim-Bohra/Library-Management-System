"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Loan, checkInBook } from "@/lib/circulation"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<Loan>[] = [
    {
        accessorKey: "book.title",
        header: "Book",
    },
    {
        accessorKey: "user.email",
        header: "Member",
    },
    {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
            return new Date(row.original.dueDate).toLocaleDateString()
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.original.status;
            return <Badge variant={status === 'RETURNED' ? "secondary" : "default"}>{status}</Badge>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const loan = row.original;
            const queryClient = useQueryClient();

            const mutation = useMutation({
                mutationFn: checkInBook,
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['loans'] });
                }
            });

            if (loan.status === 'RETURNED') return null;

            return (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutation.mutate(loan.id)}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending ? 'Returning...' : 'Return'}
                </Button>
            )
        },
    },
]
