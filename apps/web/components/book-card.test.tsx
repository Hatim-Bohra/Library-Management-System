import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookCard } from './book-card';

const mockBook: any = {
    id: '1',
    title: 'Test Book',
    author: { name: 'Test Author' },
    isbn: '123456',
    isAvailable: true,
    price: 10,
    copies: 5,
    inventoryItems: [],
    rentalPrice: 5
};

describe('BookCard', () => {
    it('renders book details', () => {
        render(<BookCard book={mockBook} />);
        // Title appears in fallback cover and in details area
        expect(screen.getAllByText('Test Book').length).toBeGreaterThan(0);
        expect(screen.getByText('Test Author')).toBeDefined();
    });

    it('renders view details link by default', () => {
        render(<BookCard book={mockBook} />);
        const link = screen.getByRole('link', { name: /details/i });
        expect(link).toBeDefined();
    });

    it('renders unavailable status correctly', () => {
        const unavailableBook = { ...mockBook, isAvailable: false, inventoryItems: [] };
        render(<BookCard book={unavailableBook} />);

        // Badge now says "Out" instead of "Out of Stock"
        expect(screen.getByText('Out')).toBeDefined();
    });

    it('renders custom action if provided', () => {
        render(<BookCard book={mockBook} action={<button>Custom Action</button>} />);
        expect(screen.getByRole('button', { name: /custom action/i })).toBeDefined();
        // The default "Details" link might still be there in the minimalist design unless we explicitly hid it, 
        // but looking at component logic: if Action is provided, the bottom area replaces the default link/price row?
        // Let's check component: line 137 check "action ? ( ... ) : ( ... )". 
        // Yes, the default row (link + price) is in the else block.
        expect(screen.queryByText(/details/i, { selector: 'a' })).toBeNull();
    });
});
