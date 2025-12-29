'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface FeaturedHeroProps {
    variant?: 'default' | 'compact';
    book?: any; // Ideally this should be a proper type
}

export function FeaturedHero({ variant = 'default', book }: FeaturedHeroProps) {
    // Fallback if no book provided yet (loading state or empty)
    const displayBook = book || {
        id: 'the-great-gatsby',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: "Uncover the secrets of the Jazz Age. A story of obsession, wealth, and tragedy that defines the American Dream. Must read for every literature enthusiast.",
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2730&auto=format&fit=crop'
    };

    if (variant === 'compact') {
        return (
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
                <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-indigo-100">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Book of the Day</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold leading-tight line-clamp-1">{displayBook.title}</h3>
                        <p className="mt-1 text-sm text-indigo-100 line-clamp-2">
                            {displayBook.description || `Experience the masterpiece by ${displayBook.author}.`}
                        </p>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full sm:w-auto" asChild>
                        <Link href={`/books/${displayBook.id}`}>
                            View Details <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
                {/* Decorative Pattern - Adjusted to be less aggressive */}
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-32 w-32 rounded-full bg-indigo-900/20 blur-2xl pointer-events-none" />
            </div>
        );
    }

    // access consistently
    const coverUrl = displayBook.coverUrl || displayBook.coverImage;

    // Fallback logic for hero background too
    let finalHeroUrl = coverUrl;
    if ((!finalHeroUrl || finalHeroUrl.includes('goodreads.com/book/show/')) && displayBook.isbn && displayBook.isbn.length > 5 && !displayBook.isbn.startsWith('AUTO')) {
        finalHeroUrl = `https://covers.openlibrary.org/b/isbn/${displayBook.isbn}-L.jpg`;
    }
    // Final safety fallback
    finalHeroUrl = finalHeroUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2730&auto=format&fit=crop';

    return (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl isolate">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 -z-10 bg-cover bg-center"
                style={{ backgroundImage: `url('${finalHeroUrl}')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/30" />
            </div>

            <div className="grid gap-8 p-8 md:p-12 lg:grid-cols-2 lg:gap-16">
                <div className="flex flex-col justify-center gap-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20 w-fit">
                        <Sparkles className="h-4 w-4" />
                        <span>Book of the Day</span>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            {displayBook.title}
                        </h2>
                        <p className="text-lg leading-8 text-gray-300 line-clamp-3">
                            {displayBook.description || `A masterpiece by ${displayBook.author}. Read it now on Lumina Library.`}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500" asChild>
                            <Link href={`/books/${displayBook.id}`}>
                                Read Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="border-indigo-200/20 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20 hover:text-white" asChild>
                            <Link href="/dashboard/books">
                                View Collections
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
