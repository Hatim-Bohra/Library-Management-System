'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookCard } from '@/components/book-card';
import { RequestDialog } from '@/components/requests/request-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
    const { data: wishlist, isLoading, error } = useQuery({
        queryKey: ['my-wishlist'],
        queryFn: async () => {
            const { data } = await api.get('/wishlist');
            return data; // Returns array of Wishlist items { book: ... }
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
                    <p className="text-muted-foreground">Books you want to read later.</p>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return <div>Error loading wishlist. Please try again.</div>;
    }

    const hasItems = wishlist && wishlist.length > 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
                <p className="text-muted-foreground">
                    {hasItems
                        ? `You have ${wishlist.length} book${wishlist.length === 1 ? '' : 's'} saved.`
                        : 'Start saving books you love.'}
                </p>
            </div>

            {hasItems ? (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                    {wishlist.map((item: any) => (
                        <BookCard
                            key={item.book.id}
                            book={item.book}
                            hideGenre={true}
                            action={
                                <RequestDialog
                                    bookId={item.book.id}
                                    bookTitle={item.book.title}
                                    rentalPrice={Number(item.book.rentalPrice || 0)}
                                    trigger={<Button className="w-full h-9 text-xs" disabled={!item.book.isAvailable}>Request</Button>}
                                />
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/10 dashed border-muted-foreground/25">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Heart className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                        Browse our collection and tap the heart icon to save books for later.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/books">Browse Books</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
