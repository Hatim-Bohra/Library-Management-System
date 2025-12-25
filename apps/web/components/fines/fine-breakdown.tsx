"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

export function FineBreakdown() {
    const { data: fines, isLoading } = useQuery({
        queryKey: ['my-fines'],
        queryFn: async () => {
            const res = await api.get('/fines');
            return res.data;
        }
    });

    if (isLoading) return <div>Loading fines...</div>;

    const activeFines = Array.isArray(fines) ? fines.filter((f: any) => !f.paidAt) : [];
    const totalDue = activeFines.reduce((sum: number, f: any) => sum + Number(f.amount), 0);

    if (activeFines.length === 0) return null;

    return (
        <Card className="border-red-200">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-red-600 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Outstanding Fines
                    </CardTitle>
                    <Badge variant="destructive" className="text-base px-3 py-1">
                        Total Due: ${totalDue.toFixed(2)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Book</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeFines.map((fine: any) => (
                            <TableRow key={fine.id}>
                                <TableCell className="font-medium">
                                    {fine.loan?.book?.title || 'Unknown Book'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{fine.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(fine.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right font-bold text-red-600">
                                    ${Number(fine.amount).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
