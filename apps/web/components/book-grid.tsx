'use client';

import { BookCard } from "./book-card";

interface BookGridProps {
    books: any[];
}

export function BookGrid({ books }: BookGridProps) {
    if (!books || books.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No books found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => (
                <div key={book.id} className="h-[320px]">
                    <BookCard book={book} />
                </div>
            ))}
        </div>
    );
}
