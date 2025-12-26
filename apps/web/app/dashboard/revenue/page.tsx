'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Calendar as CalendarIcon, Filter, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

import api from '@/lib/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RevenuePage() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const { data, isLoading } = useQuery({
        queryKey: ['revenue-analytics', period, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ period });
            if (startDate) params.append('startDate', startDate.toISOString());
            if (endDate) params.append('endDate', endDate.toISOString());

            const res = await api.get(`/revenue/analytics?${params}`);
            return res.data;
        }
    });

    if (isLoading) {
        return <div className="p-8">Loading analytics...</div>;
    }

    const { totalRevenue, breakdown, chartData } = data || { totalRevenue: 0, breakdown: {}, chartData: [] };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
                    <p className="text-muted-foreground">Track financial performance, rentals, and fines.</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
                        <Input
                            type="date"
                            className="w-auto h-8 border-0 bg-transparent"
                            onChange={(e) => setStartDate(e.target.valueAsDate || undefined)}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                            type="date"
                            className="w-auto h-8 border-0 bg-transparent"
                            onChange={(e) => setEndDate(e.target.valueAsDate || undefined)}
                        />
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            For selected period
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rental Income</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(breakdown.RENTAL || 0).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            From book rentals
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fines Collected</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(breakdown.FINE_PAYMENT || 0).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            From paid fines
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Over Time</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                                        formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, 'Revenue']}
                                    />
                                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue Distribution</CardTitle>
                        <CardDescription>Breakdown by source</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Rentals</p>
                                    <p className="text-sm text-muted-foreground">
                                        Income from book loans
                                    </p>
                                </div>
                                <div className="font-medium">
                                    ${(breakdown.RENTAL || 0).toFixed(2)}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Fines</p>
                                    <p className="text-sm text-muted-foreground">
                                        Income from late penalties
                                    </p>
                                </div>
                                <div className="font-medium">
                                    ${(breakdown.FINE_PAYMENT || 0).toFixed(2)}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold text-xl">${totalRevenue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
