'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CategoryPillsProps {
    categories: { id: string; name: string }[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export function CategoryPills({ categories, selectedId, onSelect }: CategoryPillsProps) {
    const allCategories = [{ id: 'all', name: 'All Genres' }, ...(categories || [])];

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {allCategories.map((cat) => (
                <Button
                    key={cat.id}
                    variant={selectedId === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSelect(cat.id)}
                    className={cn(
                        "rounded-full whitespace-nowrap transition-all",
                        selectedId === cat.id ? "shadow-md" : "hover:bg-muted"
                    )}
                >
                    {cat.name}
                </Button>
            ))}
        </div>
    );
}
