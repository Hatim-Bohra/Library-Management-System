'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
    book: any;
}

export function BookCard({ book }: BookCardProps) {
    const isAvailable = book.isAvailable;

    return (
        <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg border-0 bg-card/50">
            <div className="aspect-[2/3] w-full bg-muted relative flex items-center justify-center overflow-hidden rounded-t-xl group">
                {book.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={(book.coverUrl || '').startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
                        alt={book.title}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <span className="text-4xl font-bold opacity-20">Book</span>
                    </div>
                )}

                {/* Overlay Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {!isAvailable && (
                        <Badge variant="destructive" className="shadow-sm">Unavailable</Badge>
                    )}
                    {isAvailable && (
                        <Badge variant="secondary" className="bg-green-500/90 text-white shadow-sm backdrop-blur-sm">Available</Badge>
                    )}
                </div>
            </div>

            <CardHeader className="p-3 pb-0 space-y-1">
                <CardTitle className="line-clamp-1 text-base font-semibold" title={book.title}>
                    {book.title}
                </CardTitle>
                <CardDescription className="line-clamp-1 text-xs">
                    {book.author?.name || 'Unknown Author'}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3 pt-1 flex-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{book.category?.name || 'General'}</span>
                    {book.rentalPrice > 0 && (
                        <span className="font-medium text-primary">${Number(book.rentalPrice).toFixed(2)}</span>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-0">
                <Button className="w-full h-8 text-xs" variant={isAvailable ? "default" : "outline"} disabled={!isAvailable} asChild={isAvailable}>
                    {isAvailable ? (
                        <Link href={`/books/${book.id}`}>
                            Rent Now
                        </Link>
                    ) : (
                        <span>Waitlist</span>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
