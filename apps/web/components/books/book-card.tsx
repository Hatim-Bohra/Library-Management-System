import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
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
        <Card className="flex flex-col h-full overflow-hidden group">
            <div className="aspect-[2/3] w-full bg-muted relative overflow-hidden">
                {book.coverUrl ? (
                    <Image
                        src={book.coverUrl.startsWith('http') ? book.coverUrl : book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/50">
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
                    <div className="flex flex-col gap-2 items-end">
                        <Badge variant={book.isAvailable ? 'default' : 'secondary'}>
                            {availableCount > 0 ? 'Available' : 'Out of Stock'}
                        </Badge>
                        {Number(book.rentalPrice) > 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                                Rent: ${Number(book.rentalPrice).toFixed(2)}
                            </Badge>
                        )}
                    </div>
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
                    rentalPrice={Number(book.rentalPrice || 0)}
                    trigger={<Button className="w-full" disabled={!book.isAvailable}>Request</Button>}
                />
            </CardFooter>
        </Card>
    );
}
