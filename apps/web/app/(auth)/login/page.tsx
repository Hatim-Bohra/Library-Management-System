'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
import { login } from '@/lib/auth';

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

import { useAuth } from '@/components/providers/auth-provider';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || searchParams.get('returnUrl');

    const { login: authLogin } = useAuth();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const mutation = useMutation({
        mutationFn: login, // API call
        onSuccess: (data) => { // API returns { access_token, refresh_token }
            authLogin(data.access_token, data.refresh_token, redirectUrl || undefined);
            // Provider handles redirect
        },
        onError: (error: any) => {
            console.error('Login error:', error);
            const message = error.response?.data?.message || error.message || 'Login failed';
            alert(`Login failed: ${message}`);
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
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
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <div className="flex justify-end">
                                        <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-gray-500">
                    Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
                </p>
            </CardFooter>
        </Card >
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8">Loading login form...</div>}>
            <LoginForm />
        </Suspense>
    );
}
