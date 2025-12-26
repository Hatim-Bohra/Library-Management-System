'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ImportBookDialog() {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
    const queryClient = useQueryClient();

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = formData.get('file');

        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const { data } = await api.post('/books/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(data);
            if (data.success > 0) {
                queryClient.invalidateQueries({ queryKey: ['books'] });
                queryClient.invalidateQueries({ queryKey: ['admin-books'] });
                toast.success(`Imported ${data.success} books successfully`);
            }
            if (data.errors.length > 0) {
                toast.warning(`Import completed with ${data.errors.length} errors`);
            }
        } catch (error: any) {
            console.error('Import failed', error);
            toast.error(error.response?.data?.message || 'Failed to import books');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            // Reset state when closing
            setTimeout(() => {
                setResult(null);
                setUploading(false);
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Bulk Import Books</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with columns: Title, Author, ISBN, Genre, Description, CoverUrl, RentalPrice, Copies.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="file">CSV File</Label>
                            <Input id="file" name="file" type="file" accept=".csv" required disabled={uploading} />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={uploading}>
                                {uploading ? (
                                    <>
                                        <FileUp className="mr-2 h-4 w-4 animate-bounce" /> Importing...
                                    </>
                                ) : (
                                    'Upload & Import'
                                )}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>
                                    Successfully imported {result.success} books.
                                </AlertDescription>
                            </Alert>
                            {result.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Errors ({result.errors.length})</AlertTitle>
                                    <AlertDescription>
                                        Some records failed to import.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {result.errors.length > 0 && (
                            <div className="border rounded-md p-2">
                                <p className="text-sm font-medium mb-2 px-2">Error Log:</p>
                                <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/50 p-4">
                                    <ul className="text-xs space-y-1 font-mono text-muted-foreground">
                                        {result.errors.map((err, i) => (
                                            <li key={i} className="text-red-500">{err}</li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button onClick={() => setOpen(false)}>Done</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
