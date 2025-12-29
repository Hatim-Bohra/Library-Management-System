"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function NotificationBell() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications');
            return res.data;
        },
        refetchInterval: 60000, // Poll every minute
    });

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications-unread'],
        queryFn: async () => {
            const res = await api.get('/notifications/unread-count');
            return res.data;
        },
        refetchInterval: 60000,
    });

    // Fetch Pending Requests Count (Admin/Librarian Only)
    const { data: pendingRequests } = useQuery({
        queryKey: ['pending-requests-count'],
        queryFn: async () => {
            const res = await api.get('/requests/pending-count');
            return res.data;
        },
        enabled: !!isAdminOrLibrarian,
        refetchInterval: 60000,
    });

    const pendingCount = pendingRequests?.count || 0;
    const totalCount = unreadCount + (isAdminOrLibrarian ? pendingCount : 0);

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
        }
    });

    const handleMarkRead = (id: string, read: boolean) => {
        if (!read) {
            markReadMutation.mutate(id);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {totalCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border border-white flex items-center justify-center text-[8px] text-white">
                            {/* Optional: Show number if space permits, or just dot */}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Pending Requests Alert */}
                {isAdminOrLibrarian && pendingCount > 0 && (
                    <>
                        <DropdownMenuItem asChild className="cursor-pointer bg-indigo-50 dark:bg-indigo-950/30 focus:bg-indigo-100 dark:focus:bg-indigo-900/50">
                            <Link href="/dashboard/admin/requests" className="flex w-full items-center justify-between p-3 font-medium text-indigo-700 dark:text-indigo-300">
                                <span>{pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                <ScrollArea className="h-[300px]">
                    {notifications?.length === 0 && (!pendingCount || pendingCount === 0) ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications?.map((notif: any) => (
                            <DropdownMenuItem
                                key={notif.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                                    !notif.read && "bg-muted/50"
                                )}
                                onClick={() => handleMarkRead(notif.id, notif.read)}
                            >
                                <div className="flex w-full justify-between items-start">
                                    <span className={cn("font-medium text-sm",
                                        notif.type === 'ERROR' ? "text-red-500" :
                                            notif.type === 'WARNING' ? "text-amber-500" : ""
                                    )}>
                                        {notif.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(notif.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm">{notif.message}</p>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
