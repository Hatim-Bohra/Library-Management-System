'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { login } from '@/lib/auth';

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    rememberMe: z.boolean().optional(),
});

import { useAuth } from '@/components/providers/auth-provider';

import { useSearchParams } from 'next/navigation';

import { Suspense } from 'react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || searchParams.get('returnUrl');
    const [showPassword, setShowPassword] = useState(false);

    const { login: authLogin } = useAuth();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    // Load saved email from localStorage on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            form.setValue('email', savedEmail);
            form.setValue('rememberMe', true);
        }
    }, [form]);

    const mutation = useMutation({
        mutationFn: login, // API call
        onSuccess: (data) => { // API returns { access_token, refresh_token }
            const rememberMe = form.getValues('rememberMe');
            authLogin(data.access_token, data.refresh_token, rememberMe, redirectUrl || undefined);
            // Provider handles redirect
        },
        onError: (error: any) => {
            console.error('Login error:', error);
            const message = error.response?.data?.message || error.message || 'Login failed';
            alert(`Login failed: ${message}`);
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        // Save or clear email in localStorage based on rememberMe
        if (values.rememberMe) {
            localStorage.setItem('rememberedEmail', values.email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
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
                                        <div className="relative">
                                            <Input type={showPassword ? "text" : "password"} {...field} />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
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
                        <FormField
                            control={form.control}
                            name="rememberMe"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                            Remember me
                                        </FormLabel>
                                    </div>
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
