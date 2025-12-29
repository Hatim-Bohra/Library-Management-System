import api from './api';

export interface Book {
    id: string;
    title: string;
    isbn: string;
    publishedYear: number;
    copies: number;
    description?: string;
    author: {
        id: string;
        name: string;
    };
    authorName?: string; // Legacy support or optional
    category?: {
        id: string;
        name: string;
    };
    categoryId: string;
    coverUrl?: string;
    price?: number;
    rentalPrice?: number;
    isAvailable?: boolean;
    inventoryItems?: Array<{
        id: string;
        status: 'AVAILABLE' | 'RENTED' | 'LOST' | 'MAINTENANCE';
    }>;
    rating?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface BookInput {
    title: string;
    isbn: string;
    publishedYear: number;
    copies: number;
    description?: string;
    authorName: string;
    categoryId: string;
    coverUrl?: string;
    price?: number;
    rentalPrice?: number;
}

export const getBooks = async (): Promise<Book[]> => {
    const response = await api.get('/books');
    return response.data;
};

export const createBook = async (data: BookInput) => {
    const response = await api.post('/books', data);
    return response.data;
};

export const updateBook = async (id: string, data: Partial<BookInput>) => {
    const response = await api.patch(`/books/${id}`, data);
    return response.data;
};

