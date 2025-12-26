'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import { PublicNav } from '@/components/public-nav';
import { useAuth } from '@/components/providers/auth-provider';
import { RequestDialog } from '@/components/requests/request-dialog';
import { useParams } from 'next/navigation';

export default function BookDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const { isAuthenticated } = useAuth();

    const { data: book, isLoading } = useQuery({
        queryKey: ['book', id],
        queryFn: async () => {
            const { data } = await api.get(`/books/${id}`);
            return data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <PublicNav />
                <div className="container mx-auto px-4 py-8 animate-pulse">
                    <div className="h-8 w-1/3 bg-muted rounded mb-8"></div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="col-span-1 h-[500px] bg-muted rounded-xl"></div>
                        <div className="col-span-2 space-y-4">
                            <div className="h-10 w-3/4 bg-muted rounded"></div>
                            <div className="h-6 w-1/4 bg-muted rounded"></div>
                            <div className="h-40 w-full bg-muted rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
                <Button asChild><Link href="/">Back to Home</Link></Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNav />
            <div className="container mx-auto px-4 py-8 md:py-12">
                <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:underline" asChild>
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog</Link>
                </Button>

                <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                    {/* Cover Column */}
                    <div className="col-span-1">
                        <div className="sticky top-24 aspect-[2/3] w-full max-w-[400px] mx-auto bg-muted rounded-xl overflow-hidden shadow-2xl border">
                            {book.coverUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={book.coverUrl.startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
                                    alt={book.title}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">No Cover</div>
                            )}
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <Badge variant="outline">{book.category?.name || 'General'}</Badge>
                                {book.isAvailable ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"><Check className="w-3 h-3 mr-1" /> Available</Badge>
                                ) : (
                                    <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Unavailable</Badge>
                                )}
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">{book.title}</h1>
                            <p className="text-xl text-muted-foreground mt-2">by {book.author?.name}</p>
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {book.description || "No description available for this title."}
                            </p>
                        </div>

                        <div className="border-t border-b py-6 my-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">ISBN</p>
                                <p className="font-mono">{book.isbn}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Published</p>
                                <p>{book.publishedYear}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Rental Price</p>
                                <p className="text-lg font-bold text-primary">${Number(book.rentalPrice || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Wait Time</p>
                                <p>{book.isAvailable ? 'Instant' : '~ 2 Weeks'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            {isAuthenticated && book.isAvailable ? (
                                <RequestDialog
                                    bookId={book.id}
                                    bookTitle={book.title}
                                    rentalPrice={Number(book.rentalPrice || 0)}
                                    trigger={<Button size="lg" className="w-full sm:w-auto px-8">Rent This Book</Button>}
                                />
                            ) : (
                                <Button size="lg" className="w-full sm:w-auto px-8" asChild disabled={!book.isAvailable}>
                                    <Link href={book.isAvailable ? `/login?redirect=/books/${id}` : '#'}>
                                        {book.isAvailable ? 'Login to Rent' : 'Join Waitlist'}
                                    </Link>
                                </Button>
                            )}
                            <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                Add to Wishlist
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
