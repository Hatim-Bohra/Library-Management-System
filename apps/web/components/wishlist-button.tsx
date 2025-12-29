'use client';

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner"; // Assuming sonner is used, or maybe useToast

interface WishlistButtonProps {
    bookId: string;
    variant?: 'default' | 'icon';
    className?: string;
}

export function WishlistButton({ bookId, variant = 'icon', className }: WishlistButtonProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Check status
    const { data: status } = useQuery({
        queryKey: ['wishlist-status', bookId],
        queryFn: async () => {
            if (!user) return { isWishlisted: false };
            const { data } = await api.get(`/wishlist/${bookId}/status`);
            return data;
        },
        enabled: !!user
    });

    const isWishlisted = status?.isWishlisted || false;

    // Toggle mutation
    const mutation = useMutation({
        mutationFn: async () => {
            if (isWishlisted) {
                await api.delete(`/wishlist/${bookId}`);
            } else {
                await api.post(`/wishlist/${bookId}`);
            }
        },
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['wishlist-status', bookId] });

            // Snapshot previous value
            const previousStatus = queryClient.getQueryData(['wishlist-status', bookId]);

            // Optimistically update
            queryClient.setQueryData(['wishlist-status', bookId], (old: any) => ({
                isWishlisted: !old?.isWishlisted
            }));

            // Also invalidate wishlist list
            // queryClient.invalidateQueries({ queryKey: ['my-wishlist'] }); // Do this onSettled

            return { previousStatus };
        },
        onError: (err, newTodo, context: any) => {
            queryClient.setQueryData(['wishlist-status', bookId], context.previousStatus);
            toast.error("Failed to update wishlist");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist-status', bookId] });
            queryClient.invalidateQueries({ queryKey: ['my-wishlist'] });
        }
    });

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link click if inside a card
        e.stopPropagation();
        if (!user) return; // Or show login required
        mutation.mutate();
    };

    if (!user || user.role !== 'MEMBER') return null;

    if (variant === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-sm transition-all", isWishlisted && "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600", className)}
                onClick={handleToggle}
            >
                <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                <span className="sr-only">Toggle Wishlist</span>
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            className={cn("gap-2", isWishlisted && "text-red-500 border-red-200 bg-red-50", className)}
            onClick={handleToggle}
        >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
            {isWishlisted ? 'Saved' : 'Add to Wishlist'}
        </Button>
    );
}
