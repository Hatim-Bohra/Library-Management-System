'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
    copies: z.coerce.number().min(0, 'Must have at least 0 copies'), // Allow 0 for updates
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookDialogProps {
    initialData?: Book;
}

export function BookDialog({ initialData }: BookDialogProps) {
    const [open, setOpen] = useState(false);
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
        },
    });

    // Reset form when initialData changes or dialog opens
    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    title: initialData.title,
                    isbn: initialData.isbn,
                    authorName: initialData.authorName, // Assuming flattened structure or handle mismatch
                    categoryId: initialData.categoryId,
                    publishedYear: initialData.publishedYear,
                    copies: initialData.copies,
                    description: '', // If book has description, add it to interface
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
            alert(`Book ${initialData ? 'updated' : 'added'} successfully!`);
        },
        onError: (error: any) => {
            console.error(error);
            alert(`Failed to save book: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        },
    });

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update the details of the book.' : 'Enter the details of the new book.'} Click save when you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                        <div className="grid grid-cols-2 gap-4">
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
                                                {categories?.map((category) => (
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
                        {/* Description field removed or optional based on schema/types */}
                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Saving...' : 'Save Book'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
