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
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {books.map((book) => (
                <BookCard key={book.id} book={book} />
            ))}
        </div>
    );
}
