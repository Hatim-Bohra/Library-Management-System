'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

const formSchema = z.object({
    type: z.enum(['PICKUP', 'DELIVERY']),
    address: z.string().optional(),
    returnDate: z.string().optional(),
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
    rentalPrice?: number;
    trigger?: React.ReactNode;
}

export function RequestDialog({ bookId, bookTitle, rentalPrice, trigger }: RequestDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'PICKUP',
            address: '',
            returnDate: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data } = await api.post('/requests', {
                bookId,
                type: values.type,
                address: values.type === 'DELIVERY' ? values.address : undefined,
                returnDate: values.returnDate || undefined,
            });
            return data;
        },
        onSuccess: () => {
            setOpen(false);
            form.reset();
            toast.success('Request placed successfully!');
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            queryClient.invalidateQueries({ queryKey: ['books'] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to place request');
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    const type = form.watch('type');

    // Date limits
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);

    const minStr = tomorrow.toISOString().split('T')[0];
    const maxStr = maxDate.toISOString().split('T')[0];

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
                        {((rentalPrice || 0) > 0) && (
                            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                                Note: This book has a rental fee of ${Number(rentalPrice).toFixed(2)}.
                                Payment will be deducted from your wallet upon fulfillment.
                            </div>
                        )}
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

                        <FormField
                            control={form.control}
                            name="returnDate"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel>Expected Return Date (Optional)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            min={minStr}
                                            max={maxStr}
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        Max duration: 14 days from today
                                    </p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
