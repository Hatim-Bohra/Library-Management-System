'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useState } from 'react';

const formSchema = z.object({
    email: z.string().email(),
});

export default function ForgotPasswordPage() {
    const [isSent, setIsSent] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data } = await api.post('/auth/forgot-password', values);
            return data;
        },
        onSuccess: () => {
            setIsSent(true);
        },
        onError: (error: any) => {
            console.error('Request failed:', error);
            // Even on error (e.g. user not found), we might want to show success or generic error
            alert('Failed to process request. Please try again.');
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    if (isSent) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Check your email</CardTitle>
                    <CardDescription>
                        If an account exists for that email, we have sent password reset instructions.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    <Link href="/login" className="text-blue-600 hover:underline">Back to Login</Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="m@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="justify-center">
                <Link href="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
            </CardFooter>
        </Card>
    );
}
