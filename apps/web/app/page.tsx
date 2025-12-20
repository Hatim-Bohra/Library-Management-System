import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Library Management System
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Manage your books, members, and loans efficiently.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/login">Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register">Create Account</Link>
        </Button>
      </div>
    </main>
  );
}
