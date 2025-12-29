import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookCard } from './book-card';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from './providers/auth-provider';

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

// Mock auth context value
const mockAuthContext = {
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
};

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={mockAuthContext}>
                {children}
            </AuthContext.Provider>
        </QueryClientProvider>
    );
};

describe('BookCard', () => {
    it('renders book details', () => {
        render(<BookCard book={mockBook} />, { wrapper: TestWrapper });
        // Title appears in fallback cover and in details area
        expect(screen.getAllByText('Test Book').length).toBeGreaterThan(0);
        expect(screen.getByText('Test Author')).toBeDefined();
    });

    it('renders view details link by default', () => {
        render(<BookCard book={mockBook} />, { wrapper: TestWrapper });
        // Now we have 2 links: full card overlay + "Details" text link
        const links = screen.getAllByRole('link', { name: /details/i });
        expect(links.length).toBeGreaterThanOrEqual(1);
    });

    it('renders unavailable status correctly', () => {
        const unavailableBook = { ...mockBook, isAvailable: false, inventoryItems: [] };
        render(<BookCard book={unavailableBook} />, { wrapper: TestWrapper });

        // Badge now says "Out" instead of "Out of Stock"
        expect(screen.getByText('Out')).toBeDefined();
    });

    it('renders custom action if provided', () => {
        render(<BookCard book={mockBook} action={<button>Custom Action</button>} />, { wrapper: TestWrapper });
        expect(screen.getByRole('button', { name: /custom action/i })).toBeDefined();
        // The default "Details" link might still be there in the minimalist design unless we explicitly hid it, 
        // but looking at component logic: line 137 check "action ? ( ... ) : ( ... )". 
        // Yes, the default row (link + price) is in the else block.
        expect(screen.queryByText(/details/i, { selector: 'a' })).toBeNull();
    });
});
