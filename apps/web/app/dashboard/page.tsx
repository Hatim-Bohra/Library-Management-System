import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Book, Users, Repeat, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
    // MOCK DATA - Connect to API later
    const stats = [
        { title: "Total Books", value: "1,234", icon: Book, color: "text-blue-500" },
        { title: "Active Members", value: "542", icon: Users, color: "text-green-500" },
        { title: "Active Loans", value: "89", icon: Repeat, color: "text-orange-500" },
        { title: "Overdue Books", value: "12", icon: AlertCircle, color: "text-red-500" },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
