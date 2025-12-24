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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {books.map((book) => (
                <BookCard key={book.id} book={book} />
            ))}
        </div>
    );
}
