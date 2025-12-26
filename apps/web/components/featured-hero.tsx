'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

export function FeaturedHero() {
    return (
        <section className="w-full py-12 md:py-24 bg-muted border-b">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="inline-flex items-center rounded-lg bg-background px-3 py-1 text-sm font-medium shadow-sm w-fit gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>Book of the Month</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                            The Great Gatsby
                        </h1>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl">
                            Dive into the Roaring Twenties with F. Scott Fitzgerald&apos;s masterpiece.
                            A story of ambition, love, and the American Dream that resonates to this day.
                        </p>
                        <div className="flex flex-col gap-2 min-[400px]:flex-row">
                            <Button size="lg" asChild>
                                <Link href="/dashboard/books">
                                    Explore Library
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/dashboard/books">
                                    Browse Collection
                                </Link>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            *Available for instant digital rental.
                        </p>
                    </div>
                    <div className="flex justify-center items-center">
                        <div className="relative aspect-[2/3] w-[250px] md:w-[350px] rounded-xl overflow-hidden shadow-2xl transition-transform hover:scale-105 duration-500">
                            {/* Placeholder generic cover if no specific one */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://covers.openlibrary.org/b/id/8406786-L.jpg"
                                alt="The Great Gatsby Cover"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
