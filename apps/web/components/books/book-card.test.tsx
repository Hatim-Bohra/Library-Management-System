import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookCard } from './book-card';

// Mock the RequestDialog to avoid React Query context issues and isolate unit test
vi.mock('@/components/requests/request-dialog', () => ({
    RequestDialog: ({ trigger }: any) => <div data-testid="request-dialog">{trigger}</div>
}));

const mockBook: any = {
    id: '1',
    title: 'Test Book',
    author: { name: 'Test Author' },
    isbn: '123456',
    isAvailable: true,
    price: 10,
    copies: 5,
    inventory: []
};

describe('BookCard', () => {
    it('renders book details', () => {
        render(<BookCard book={mockBook} />);
        expect(screen.getByText('Test Book')).toBeDefined();
        expect(screen.getByText('Test Author')).toBeDefined();
        expect(screen.getByText('0 available / 5 copies in library')).toBeDefined();
    });

    it('renders enabled request button when available', () => {
        render(<BookCard book={mockBook} />);
        const button = screen.getByRole('button', { name: /request/i });
        expect(button).toBeDefined();
        expect(button.closest('button')).not.toHaveProperty('disabled', true);
    });

    it('renders disabled button if not available', () => {
        const unavailableBook = { ...mockBook, isAvailable: false };
        render(<BookCard book={unavailableBook} />);

        const button = screen.getByRole('button', { name: /request/i });
        expect(button.closest('button')).toHaveProperty('disabled', true);
    });
});
