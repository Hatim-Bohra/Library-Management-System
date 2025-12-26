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

export function RequestDialog({ bookId, bookTitle, rentalPrice = 0, trigger }: RequestDialogProps) {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const [depositAmount, setDepositAmount] = useState<number>(10);

    // Fetch user wallet balance
    const { data: wallet, isLoading: isWalletLoading, refetch: refetchWallet } = useQuery({
        queryKey: ['wallet-balance'],
        queryFn: async () => {
            const { data } = await api.get('/wallet/balance');
            return data;
        },
        enabled: open, // Only fetch when dialog opens
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'PICKUP',
            address: '',
            returnDate: '',
        },
    });

    const requestMutation = useMutation({
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
            refetchWallet(); // Update balance
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to place request');
        }
    });

    const depositMutation = useMutation({
        mutationFn: async (amount: number) => {
            const { data } = await api.post('/wallet/deposit', { amount });
            return data;
        },
        onSuccess: () => {
            toast.success('Funds added successfully!');
            refetchWallet(); // Update balance to unblock UI
        },
        onError: (error: any) => {
            toast.error('Failed to add funds.');
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        requestMutation.mutate(values);
    }

    const type = form.watch('type');
    const currentBalance = Number(wallet?.balance || 0);
    const hasInsufficientFunds = rentalPrice > 0 && currentBalance < rentalPrice;
    const fundsNeeded = rentalPrice - currentBalance;

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
                        Requesting &quot;{bookTitle}&quot;.
                    </DialogDescription>
                </DialogHeader>

                {isWalletLoading ? (
                    <div className="py-8 text-center text-muted-foreground animate-pulse">Checking wallet...</div>
                ) : hasInsufficientFunds ? (
                    /* 🚨 INSUFFICIENT FUNDS VIEW */
                    <div className="space-y-4 py-2">
                        <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-red-800">
                                <span className="font-medium">Insufficient Wallet Balance</span>
                                <span className="text-xs font-bold bg-red-200 px-2 py-1 rounded-full">Missing ${(fundsNeeded).toFixed(2)}</span>
                            </div>
                            <div className="text-sm text-red-600">
                                Current Balance: <span className="font-mono font-bold">${currentBalance.toFixed(2)}</span><br />
                                Required: <span className="font-mono font-bold">${Number(rentalPrice).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm font-medium text-center">Add funds to continue</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[5, 10, 20].map((amt) => (
                                    <Button
                                        key={amt}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDepositAmount(amt)}
                                        className={depositAmount === amt ? "border-primary bg-primary/10" : ""}
                                    >
                                        ${amt}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                className="w-full"
                                onClick={() => depositMutation.mutate(depositAmount)}
                                disabled={depositMutation.isPending}
                            >
                                {depositMutation.isPending ? 'Processing...' : `Add $${depositAmount} & Continue`}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ✅ STANDARD CHECKOUT VIEW */
                    <Form {...form}>
                        {rentalPrice > 0 && (
                            <div className="p-3 bg-green-50 text-green-800 rounded-md text-sm flex justify-between items-center">
                                <span>Wallet Balance: <strong>${currentBalance.toFixed(2)}</strong></span>
                                <span className="text-xs bg-green-200 px-2 py-0.5 rounded">OK</span>
                            </div>
                        )}
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
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
                                                <SelectItem value="DELIVERY">Delivery ({rentalPrice > 0 ? '+ Shipping' : 'Free'})</SelectItem>
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
                                <Button type="submit" disabled={requestMutation.isPending}>
                                    {requestMutation.isPending ? 'Confirming...' : (rentalPrice > 0 ? `Pay $${rentalPrice} & Rent` : 'Confirm Rental')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
