'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createBook, updateBook, Book } from '@/lib/books';
import { getAuthors } from '@/lib/authors';
import { getCategories } from '@/lib/categories';

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    isbn: z.string().min(10, 'ISBN must be at least 10 characters'),
    authorName: z.string().min(1, 'Author Name is required'),
    categoryId: z.string().min(1, 'Category is required'),
    publishedYear: z.coerce.number().min(1000, 'Invalid year'),
    copies: z.coerce.number().min(0, 'Must have at least 0 copies'),
    description: z.string().optional(),
    coverUrl: z.string().optional(),
    coverImageSize: z.number().optional(),
    coverImageMime: z.string().optional(),
    rentalPrice: z.coerce.number().min(0, 'Cannot be negative').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookDialogProps {
    initialData?: Book;
}

export function BookDialog({ initialData }: BookDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: '',
            isbn: '',
            authorName: '',
            categoryId: '',
            publishedYear: new Date().getFullYear(),
            copies: 1,
            description: '',
            coverUrl: '',
            rentalPrice: 0,
        },
    });

    const coverUrl = form.watch('coverUrl');

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    title: initialData.title,
                    isbn: initialData.isbn,
                    authorName: initialData.authorName,
                    categoryId: initialData.categoryId,
                    publishedYear: initialData.publishedYear,
                    copies: initialData.copies,
                    description: '',
                    coverUrl: initialData.coverUrl || '',
                    rentalPrice: Number(initialData.rentalPrice || 0),
                });
            } else {
                form.reset({
                    title: '',
                    isbn: '',
                    authorName: '',
                    categoryId: '',
                    publishedYear: new Date().getFullYear(),
                    copies: 1,
                    description: '',
                    coverUrl: '',
                    rentalPrice: 0,
                });
            }
        }
    }, [open, initialData, form]);

    const { data: authors } = useQuery({
        queryKey: ['authors'],
        queryFn: getAuthors,
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            if (initialData) {
                return updateBook(initialData.id, values);
            }
            return createBook(values);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            queryClient.invalidateQueries({ queryKey: ['admin-books'] });
            setOpen(false);
            if (!initialData) form.reset();
            toast.success(`Book ${initialData ? 'updated' : 'added'} successfully!`);
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(`Failed to save book: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post('/uploads/cover', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            form.setValue('coverUrl', data.url);
            form.setValue('coverImageSize', data.size);
            form.setValue('coverImageMime', data.mimetype);
            toast.success('Cover uploaded');
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Failed to upload cover');
        } finally {
            setUploading(false);
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {initialData ? (
                    <Button variant="ghost" size="sm">Edit</Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Book
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update the details of the book.' : 'Enter the details of the new book.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex gap-4">
                            {/* Left Column: Image Upload */}
                            <div className="w-1/3 space-y-2">
                                <Label>Cover Image</Label>
                                <div className="border rounded-md aspect-[2/3] flex items-center justify-center bg-muted overflow-hidden relative group">
                                    {coverUrl ? (
                                        // Use img tag for simplicity, serving from API
                                        // Need to prepend API URL if it's relative? 
                                        // Assuming API is on same domain via proxy or CORS configured.
                                        // Since we are checking locally, assume `http://localhost:3002` + url or just `url` if proxy.
                                        // The backend returns `/uploads/covers/...` relative URL.
                                        // Next.js Image component needs absolute or configured domain.
                                        // Using standard img for now.
                                        <Image
                                            src={(coverUrl || '').startsWith('http') ? coverUrl : coverUrl}
                                            alt="Cover"
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    ) : (
                                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        </div>
                                    )}
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="text-xs"
                                />
                            </div>

                            {/* Right Column: Form Fields */}
                            <div className="flex-1 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="The Great Gatsby" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="authorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Author Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="F. Scott Fitzgerald" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Array.isArray(categories) && categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="isbn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ISBN</FormLabel>
                                        <FormControl>
                                            <Input placeholder="978-..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="publishedYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Year</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="1925" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="copies"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Copies</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="5" {...field} disabled={!!initialData} title={initialData ? "Manage copies in Inventory" : ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rentalPrice"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rental Price ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending || uploading}>
                                {mutation.isPending ? 'Saving...' : 'Save Book'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
