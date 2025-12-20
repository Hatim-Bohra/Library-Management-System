'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createLoan } from '@/lib/circulation';
import { getBooks } from '@/lib/books';
import { getMembers } from '@/lib/members';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
    bookId: z.string().uuid(),
    userId: z.string().uuid(),
});

export default function CheckOutPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: books } = useQuery({ queryKey: ['books'], queryFn: getBooks });
    const { data: members } = useQuery({ queryKey: ['members'], queryFn: getMembers });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const mutation = useMutation({
        mutationFn: createLoan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loans'] });
            router.push('/dashboard/circulation');
        },
        onError: (error: Error) => {
            console.error(error);
            alert('Failed to check out book (maybe no copies available?)');
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Check Out Book</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="bookId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Book</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a book" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {books?.map((book: any) => (
                                                <SelectItem key={book.id} value={book.id}>
                                                    {book.title} ({book.copies} copies)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="userId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Member</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a member" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {members?.map((member: any) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.firstName} {member.lastName} ({member.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Processing...' : 'Check Out'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
