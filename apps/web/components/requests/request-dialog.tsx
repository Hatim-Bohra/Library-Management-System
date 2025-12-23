'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

const formSchema = z.object({
    type: z.enum(['PICKUP', 'DELIVERY']),
    address: z.string().optional(),
}).refine((data) => {
    if (data.type === 'DELIVERY' && (!data.address || data.address.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Address is required for delivery",
    path: ["address"],
});

interface RequestDialogProps {
    bookId: string;
    bookTitle: string;
    trigger?: React.ReactNode;
}

export function RequestDialog({ bookId, bookTitle, trigger }: RequestDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'PICKUP',
            address: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data } = await api.post('/requests', {
                bookId,
                type: values.type,
                address: values.type === 'DELIVERY' ? values.address : undefined,
            });
            return data;
        },
        onSuccess: () => {
            setOpen(false);
            form.reset();
            alert('Request placed successfully!');
            queryClient.invalidateQueries({ queryKey: ['requests'] });
        },
        onError: (error: any) => {
            alert(error?.response?.data?.message || 'Failed to place request');
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    const type = form.watch('type');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Request</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Book</DialogTitle>
                    <DialogDescription>
                        Requesting &quot;{bookTitle}&quot;. Choose your fulfillment method.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PICKUP">Pickup (Library)</SelectItem>
                                            <SelectItem value="DELIVERY">Delivery (Home)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {type === 'DELIVERY' && (
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Delivery Address</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Enter your full address..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
