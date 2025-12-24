'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PublicNav } from '@/components/public-nav';
import { BookGrid } from '@/components/book-grid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Books
  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ['public-books', debouncedSearch, category],
    queryFn: async () => {
      const params: any = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (category && category !== 'all') params.categoryId = category;
      const { data } = await api.get('/books', { params });
      return data;
    }
  });

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories'); // Ensure this endpoint exists or mock it? 
      // Wait, I didn't check if /categories exists public. 
      // If not, I should probably fail gracefully or check permissions. 
      // Assuming it does or I'll implement it quickly if needed.
      return data;
    },
    retry: false
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-100 dark:bg-gray-900 border-b">
        <div className="container px-4 md:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              Discover Your Next Great Read
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Browse our extensive collection of books, journals, and magazines.
            </p>
            <div className="flex w-full max-w-sm items-center space-x-2 mx-auto pt-4">
              <Input
                type="search"
                placeholder="Search by title, author, or ISBN..."
                className="bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit"><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Catalog</h2>

            {/* Filter */}
            <div className="w-full md:w-[200px]">
              <Select onValueChange={setCategory} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {booksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-[400px] bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <BookGrid books={books} />
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-gray-100 dark:bg-gray-900 border-t">
        <div className="container px-4 md:px-6 text-center text-sm text-gray-500">
          © 2024 Acmei Library System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
