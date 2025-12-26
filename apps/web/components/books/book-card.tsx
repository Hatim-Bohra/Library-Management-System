import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { RequestDialog } from '@/components/requests/request-dialog';

interface Book {
    id: string;
    title: string;
    author: { name: string };
    isAvailable: boolean;
    copies: number;
    inventoryItems?: any[];
    coverUrl?: string;
    rentalPrice?: number | string;
}

interface BookCardProps {
    book: Book;
}

export function BookCard({ book }: BookCardProps) {
    const availableCount = book.inventoryItems ? book.inventoryItems.filter((i: any) => i.status === 'AVAILABLE').length : 0;

    return (
        <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg border-0 bg-card/50">
            <div className="aspect-[2/3] w-full bg-muted relative flex items-center justify-center overflow-hidden rounded-t-xl group">
                {book.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={book.coverUrl.startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
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
                    <Badge variant={book.isAvailable ? 'secondary' : 'destructive'} className={book.isAvailable ? "bg-green-500/90 text-white shadow-sm backdrop-blur-sm" : "shadow-sm"}>
                        {availableCount > 0 ? 'Available' : 'Out of Stock'}
                    </Badge>
                    {Number(book.rentalPrice) > 0 && (
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-green-700 border-green-200">
                            Rent: ${Number(book.rentalPrice).toFixed(2)}
                        </Badge>
                    )}
                </div>
            </div>

            <CardHeader className="p-3 pb-0 space-y-1">
                <CardTitle className="line-clamp-1 text-base font-semibold" title={book.title}>
                    {book.title}
                </CardTitle>
                <CardDescription className="line-clamp-1 text-xs">
                    {book.author.name}
                </CardDescription>
            </CardHeader>

            <CardContent className="p-3 pt-1 flex-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>{book.copies} copies</span>
                    <span>{availableCount} left</span>
                </div>
            </CardContent>

            <CardFooter className="p-3 pt-0">
                <RequestDialog
                    bookId={book.id}
                    bookTitle={book.title}
                    rentalPrice={Number(book.rentalPrice || 0)}
                    trigger={<Button className="w-full h-8 text-xs" disabled={!book.isAvailable}>Request</Button>}
                />
            </CardFooter>
        </Card>
    );
}
