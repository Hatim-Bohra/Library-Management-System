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
        <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg">
            <div className="aspect-[2/3] w-full bg-muted relative">
                {/* Placeholder for now. Ideally <Image /> */}
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl.startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-100 dark:bg-gray-800">
                        <span className="text-4xl font-bold opacity-20">Book</span>
                    </div>
                )}
                {!isAvailable && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="destructive">Unavailable</Badge>
                    </div>
                )}
            </div>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="line-clamp-2 text-lg">{book.title}</CardTitle>
                </div>
                <CardDescription className="line-clamp-1">by {book.author?.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                    {book.category && (
                        <Badge variant="secondary" className="text-xs">
                            {book.category.name}
                        </Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/20">
                <Button className="w-full" variant={isAvailable ? "default" : "secondary"} asChild>
                    <Link href="/login">
                        {isAvailable ? "Rent Book" : "Check Availability"}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
