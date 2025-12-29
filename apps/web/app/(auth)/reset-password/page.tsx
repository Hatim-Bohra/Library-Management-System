'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Suspense, useState, useEffect } from 'react';

const formSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [success, setSuccess] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const { data } = await api.post('/auth/reset-password', {
                token,
                newPassword: values.password
            });
            return data;
        },
        onSuccess: () => {
            setSuccess(true);
            setTimeout(() => router.push('/login'), 2000);
        },
        onError: (error: any) => {
            console.error('Reset failed:', error);
            alert(`Failed: ${error.response?.data?.message || 'Invalid or expired token'}`);
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!token) {
            alert('Missing reset token');
            return;
        }
        mutation.mutate(values);
    }

    if (success) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Password Reset Successful!</CardTitle>
                    <CardDescription>
                        Redirecting to login...
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!token) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Invalid Link</CardTitle>
                    <CardDescription>
                        This password reset link is invalid or missing the token.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">Request new link</Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter your new password below.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Resetting...' : 'Set New Password'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
