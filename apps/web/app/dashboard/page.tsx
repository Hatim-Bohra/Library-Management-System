"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Book, Users, Repeat, AlertCircle } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// Map icon names to components
const iconMap: any = {
    Book,
    Users,
    Repeat,
    AlertCircle
};

export default function DashboardPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stats');
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.isArray(stats) && stats.map((stat: any, index: number) => {
                const Icon = iconMap[stat.icon] || Book;
                return (
                    <Link href={stat.link} key={index}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    Click to view details
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}
