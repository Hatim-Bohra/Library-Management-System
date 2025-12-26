'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PublicNav } from '@/components/public-nav';
import { BookGrid } from '@/components/book-grid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { FeaturedHero } from '@/components/featured-hero';
import { BookCarousel } from '@/components/book-carousel';
import { CategoryPills } from '@/components/category-pills';
import Link from 'next/link';

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
    },
    refetchOnWindowFocus: false,
  });

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data;
    },
    retry: false
  });

  // Derived state for "Trending" (Just slicing for demo/MVP)
  // Ideally this would be a separate API call /books/trending
  const trendingBooks = books ? books.slice(0, 8) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* 1. Feature Hero - Spotlight */}
      <FeaturedHero />

      {/* 2. Trending Carousel - Social Proof */}
      <BookCarousel title="Trending Now" books={trendingBooks} loading={booksLoading} />

      {/* 3. Main Catalog Section */}
      <section id="catalog" className="w-full py-12 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 space-y-8">

          {/* Header & Filters */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Curated Collection</h2>
                <p className="text-muted-foreground mt-1">Explore our entire library of knowledge.</p>
              </div>

              {/* Search Bar - Sticky on Mobile? */}
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search title, author..."
                  className="pl-9 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Category Pills */}
            <CategoryPills
              categories={categories}
              selectedId={category}
              onSelect={setCategory}
            />
          </div>

          {/* Grid */}
          {booksLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className="h-[280px] bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : (
            <>
              {books && books.length > 0 ? (
                <div className="w-full">
                  <BookGrid books={books} />
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <p>No books found matching your criteria.</p>
                  <Button variant="link" onClick={() => { setSearch(''); setCategory('all'); }}>Clear Filters</Button>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 bg-muted border-t">
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>© 2024 Lumina Library. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:underline">Privacy</Link>
            <Link href="#" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
