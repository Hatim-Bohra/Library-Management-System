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
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Books with standard pagination
  const { data: booksData, isLoading: booksLoading, isPlaceholderData } = useQuery({
    queryKey: ['public-books', debouncedSearch, category, page],
    queryFn: async () => {
      const params: any = { page, limit: pageSize };
      if (debouncedSearch) params.q = debouncedSearch;
      if (category && category !== 'all') params.categoryId = category;

      const { data } = await api.get('/books', { params });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });

  const books = Array.isArray(booksData?.data) ? booksData.data : [];
  const meta = booksData?.meta;
  const hasMore = meta ? page < meta.lastPage : false;

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
  // Note: Since we paginate now, "Trending" should ideally be a separate query if we want it consistent regardless of page.
  // For now, I'll keep using the current books or fetch separately if needed. 
  // BETTER: Let's fetch trending separately so it doesn't change when user paginates the catalog.
  const { data: trendingBooks } = useQuery({
    queryKey: ['trending-books'],
    queryFn: async () => {
      const { data } = await api.get('/books', { params: { limit: 8 } });
      return data;
    },
    staleTime: 60000,
  });


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />

      {/* 1. Feature Hero - Spotlight */}
      <div className="container mx-auto px-4 md:px-6 py-6 space-y-8">
        <FeaturedHero book={trendingBooks?.[0]} />

        {/* 2. Trending Carousel - Social Proof */}
        <BookCarousel title="Trending Now" books={trendingBooks || []} loading={!trendingBooks} />
      </div>

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

              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search title, author..."
                    className="pl-9 bg-background h-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Category Filter (Dropdown) */}
                <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[200px] h-10 bg-background">
                    <SelectValue placeholder="Select Genre" />
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
          </div>

          {/* Grid */}
          {booksLoading && !isPlaceholderData ? (
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

              {/* Pagination Controls */}
              {meta && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-lg font-medium">
                    Page {meta.page} of {meta.lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setPage(p => p + 1);
                      window.scrollTo({ top: document.getElementById('catalog')?.offsetTop || 0, behavior: 'smooth' });
                    }}
                    disabled={page >= meta.lastPage}
                  >
                    Next
                  </Button>
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
