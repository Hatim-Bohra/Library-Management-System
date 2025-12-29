'use client';

import { useState, useEffect } from 'react';

import { cn } from "@/lib/utils";
import { Book } from "@/lib/books";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MoreHorizontal, BookOpen } from 'lucide-react';

interface BookCardProps {
    book: Book;
    variant?: 'default' | 'compact';
    hideAvailability?: boolean;
    hideGenre?: boolean;
    action?: React.ReactNode;
    className?: string;
}

export function BookCard({ book, variant = 'default', hideAvailability = false, hideGenre = false, action, className }: BookCardProps) {
    const [imgError, setImgError] = useState(false);
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    // Calculate availability
    const availableCount = book.inventoryItems ? book.inventoryItems.filter((i: any) => i.status === 'AVAILABLE').length : (book.copies || 0);
    const isAvailable = book.isAvailable ?? (availableCount > 0);

    // Fallback data
    const authorName = book.author?.name || book.authorName || 'Unknown Author';
    const rentalPrice = Number(book.rentalPrice || 0);

    // Effect to resolve goodreads URLs
    useEffect(() => {
        if (book.coverUrl && book.coverUrl.includes('goodreads.com/book/show/')) {
            setIsResolving(true);
            // Try to use the API to resolve the image
            fetch(`/api/books/${book.id}/resolve-cover`)
                .then(res => res.json())
                .then(data => {
                    if (data.url && data.url !== book.coverUrl) {
                        setResolvedUrl(data.url);
                    }
                })
                .catch(err => {
                    console.error('Failed to resolve cover', err);
                })
                .finally(() => setIsResolving(false));
        }
    }, [book.coverUrl, book.id]);

    // Determine final image URL
    // 1. Resolved URL from API
    // 2. Original URL if it looks like an image (http/s or relative) AND isn't strictly a "page" URL that we know fails directly in <img> tags
    //    (though some goodreads URLs are images, usually they are hosted on distinct domains. We'll trust the component logic largely but be more permissive on fallback)

    const isProbableImageUrl = (url?: string) => {
        if (!url) return false;
        if (url.startsWith('/')) return true; // Local
        if (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) return true; // Explicit image extension
        if (url.includes('images-na.ssl-images-amazon.com')) return true; // Amazon images
        if (url.includes('gr-assets.com')) return true; // Goodreads assets
        return false;
    };

    const originalUrlIsValid = book.coverUrl && (book.coverUrl.startsWith('http') || book.coverUrl.startsWith('/'));

    // Logic: Use resolved if available. Else, if original looks like an image, use it. 
    // If original is a goodreads PAGE url, we try to use it as a fallback only if resolved failed, but it likely won't work in <img>.
    // So we basically stick to: Resolved -> Strong Candidate Original -> Fallback.
    let finalCoverUrl: string | null = resolvedUrl;
    if (!finalCoverUrl && originalUrlIsValid) {
        if (!book.coverUrl!.includes('goodreads.com/book/show/') || isProbableImageUrl(book.coverUrl)) {
            finalCoverUrl = book.coverUrl!.startsWith('http') ? book.coverUrl || null : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`;
        }
    }

    return (
        <div className={cn("group flex flex-col gap-3 h-full max-w-[200px] mx-auto sm:mx-0", className)}>
            {/* Kindle-style Card: Just the Cover Image with simple shadow */}
            <div className="relative aspect-[2/3] w-full rounded-md shadow-sm transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:-translate-y-1 group-hover:scale-[1.02] bg-muted overflow-hidden">
                {finalCoverUrl && !imgError ? (
                    <Image
                        src={finalCoverUrl}
                        alt={book.title}
                        fill
                        className="object-cover w-full h-full"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        priority={false}
                        unoptimized
                        onError={() => setImgError(true)}
                    />
                ) : (
                    // Elegant Fallback
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-background/50 flex items-center justify-center mb-3 text-muted-foreground">
                            <BookOpen className="h-6 w-6 opacity-50" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider line-clamp-2">
                            {book.title}
                        </span>
                    </div>
                )}

                {/* Overlay Gradient on Hover for Actions (if needed) - Keeping it reliable/clean for now */}
                {/* Availability Badge - Small & Floating */}
                {!hideAvailability && (
                    <div className="absolute top-2 right-2">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "h-5 px-1.5 text-[10px] font-medium backdrop-blur-md border-0 shadow-sm",
                                isAvailable
                                    ? "bg-emerald-500/90 text-white hover:bg-emerald-600"
                                    : "bg-rose-500/90 text-white hover:bg-rose-600"
                            )}
                        >
                            {availableCount > 0 ? 'In Stock' : 'Out'}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Verification/Info Area - Minimal */}
            <div className="space-y-1 px-1">
                <Link href={`/books/${book.id}`} className="block focus:outline-none">
                    <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2" title={book.title}>
                        {book.title}
                    </h3>
                </Link>
                <p className="text-xs text-muted-foreground line-clamp-1">
                    {authorName}
                </p>

                {/* Optional Price or Action - kept very minimal */}
                {action ? (
                    <div className="pt-2">
                        {action}
                    </div>
                ) : (
                    <div className="pt-1 flex items-center justify-between">
                        <Link href={`/books/${book.id}`} className="text-xs font-medium text-primary hover:underline decoration-primary/30 underline-offset-4">
                            Details
                        </Link>
                        {rentalPrice > 0 && (
                            <span className="text-xs font-mono text-muted-foreground">${rentalPrice.toFixed(2)}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
