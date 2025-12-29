'use client';

import { BookCard } from '@/components/book-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface BookCarouselProps {
    title: string;
    books: any[];
    loading?: boolean;
}

export function BookCarousel({ title, books, loading }: BookCarouselProps) {
    if (!loading && (!books || books.length === 0)) return null;

    return (
        <section className="w-full py-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    {title && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="#catalog" className="flex items-center gap-1">
                                See All <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap rounded-md">
                        <div className="flex w-max space-x-4 pb-4 px-1">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="w-[180px] h-[280px] bg-muted rounded-xl animate-pulse" />
                                ))
                            ) : (
                                books.map((book) => (
                                    <div key={book.id} className="w-[140px] sm:w-[160px] md:w-[180px]">
                                        <BookCard book={book} className="h-full" />
                                    </div>
                                ))
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        </section>
    );
}
