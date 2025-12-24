import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RequestDialog } from '@/components/requests/request-dialog';

interface Book {
    id: string;
    title: string;
    author: { name: string };
    isAvailable: boolean;
    copies: number;
    inventoryItems?: any[];
    coverUrl?: string;
}

interface BookCardProps {
    book: Book;
}

export function BookCard({ book }: BookCardProps) {
    const availableCount = book.inventoryItems ? book.inventoryItems.filter((i: any) => i.status === 'AVAILABLE').length : 0;

    return (
        <Card className="flex flex-col h-full overflow-hidden">
            <div className="aspect-[2/3] w-full bg-muted relative">
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl.startsWith('http') ? book.coverUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}${book.coverUrl}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <span className="text-xl font-bold opacity-20">No Cover</span>
                    </div>
                )}
            </div>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                        <CardDescription>{book.author.name}</CardDescription>
                    </div>
                    <Badge variant={book.isAvailable ? 'default' : 'secondary'}>
                        {availableCount > 0 ? 'Available' : 'Out of Stock'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                    {availableCount} available / {book.copies} copies in library
                </p>
            </CardContent>
            <CardFooter>
                <RequestDialog
                    bookId={book.id}
                    bookTitle={book.title}
                    trigger={<Button className="w-full" disabled={!book.isAvailable}>Request</Button>}
                />
            </CardFooter>
        </Card>
    );
}
