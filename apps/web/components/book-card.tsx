'use client';

import { useState, useEffect } from 'react';

import { cn } from "@/lib/utils";
import { Book } from "@/lib/books";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MoreHorizontal, BookOpen } from 'lucide-react';
import { WishlistButton } from "./wishlist-button";

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
    const isProbableImageUrl = (url?: string) => {
        if (!url) return false;
        if (url.startsWith('/')) return true; // Local
        if (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) return true; // Explicit image extension
        if (url.includes('images-na.ssl-images-amazon.com')) return true; // Amazon images
        if (url.includes('gr-assets.com')) return true; // Goodreads assets
        return false;
    };

    const originalUrlIsValid = book.coverUrl && (book.coverUrl.startsWith('http') || book.coverUrl.startsWith('/'));

    let finalCoverUrl: string | null = resolvedUrl;

    if (!finalCoverUrl && originalUrlIsValid) {
        if (!book.coverUrl!.includes('goodreads.com/book/show/') || isProbableImageUrl(book.coverUrl)) {
            finalCoverUrl = book.coverUrl!.startsWith('http') ? book.coverUrl || null : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`;
        }
    }

    // New OpenLibrary Fallback
    if (!finalCoverUrl && book.isbn && book.isbn.length > 5 && !book.isbn.startsWith('AUTO')) {
        finalCoverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
    }

    return (
        <div className={cn("group relative flex flex-col gap-3 h-full max-w-[200px] mx-auto sm:mx-0", className)}>
            {/* Absolute Link covering the entire card */}
            <Link href={`/books/${book.id}`} className="absolute inset-0 z-0 rounded-md" aria-label={`View details for ${book.title}`} />

            {/* Kindle-style Card: Just the Cover Image with simple shadow */}
            <div className="relative aspect-[2/3] w-full rounded-md shadow-sm transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:-translate-y-1 group-hover:scale-[1.02] bg-muted overflow-hidden pointer-events-none">

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
            </div>

            {/* Interactive Elements on top of the image need pointer-events-auto */}
            <div className="absolute top-2 left-2 z-10 pointer-events-auto">
                <WishlistButton bookId={book.id} />
            </div>
            {!hideAvailability && (
                <div className="absolute top-2 right-2 z-10 pointer-events-auto">
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

            {/* Verification/Info Area - Fixed heights for consistency */}
            {/* We make this relative so the text is visible, but clicks fall through to the link behind unless specified otherwise? 
                Actually, text selection might be an issue if covered by link. 
                Standard pattern: The link covers everything. If we want text selection, we need careful z-indexing. 
                But 'Clickable Card' usually implies the whole thing is a link.
            */}
            <div className="flex flex-col flex-grow px-1 pointer-events-none">
                {/* Fixed height for title - always 2 lines worth of space */}
                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]" title={book.title}>
                    {book.title}
                </h3>

                {/* Fixed height for author - always 1 line */}
                <p className="text-xs text-muted-foreground line-clamp-1 min-h-[1.25rem] mb-2">
                    {authorName}
                </p>

                {/* Action area - pushed to bottom with mt-auto */}
                {/* Actions need to be clickable, so pointer-events-auto */}
                {action ? (
                    <div className="mt-auto pointer-events-auto relative z-10">
                        {action}
                    </div>
                ) : (
                    <div className="mt-auto flex items-center justify-between">
                        {/* These are just text/visuals now, the whole card is the link. duplicate link is fine or remove it. 
                             Let's keep the visual 'Details' but strictly it's part of the card link now. 
                         */}
                        <span className="text-xs font-medium text-primary decoration-primary/30 underline-offset-4 group-hover:underline">
                            Details
                        </span>
                        {rentalPrice > 0 && (
                            <span className="text-xs font-mono text-muted-foreground">${rentalPrice.toFixed(2)}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
