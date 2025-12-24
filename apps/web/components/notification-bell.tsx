"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";

export function NotificationBell() {
    const { user } = useAuth();

    // Only fetch for Admin or Librarian
    const isAuthorized = user && (user.role === "ADMIN" || user.role === "LIBRARIAN");

    const { data } = useQuery({
        queryKey: ["pending-requests-count"],
        queryFn: async () => {
            const res = await api.get("/requests/pending-count");
            return res.data;
        },
        enabled: !!isAuthorized,
        refetchInterval: 30000, // Poll every 30s
        retry: false,
    });

    if (!isAuthorized) return null;

    const count = data?.count || 0;

    return (
        <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/dashboard/admin/requests">
                <Bell className="h-5 w-5" />
                {count > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px]"
                    >
                        {count > 99 ? "99+" : count}
                    </Badge>
                )}
                <span className="sr-only">Notifications</span>
            </Link>
        </Button>
    );
}
