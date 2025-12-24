import api from './api';

export interface Book {
    id: string;
    title: string;
    isbn: string;
    publishedYear: number;
    copies: number;
    authorName: string;
    categoryId: string;
}

export const getBooks = async (): Promise<Book[]> => {
    const response = await api.get('/books');
    return response.data;
};

export const createBook = async (data: Omit<Book, 'id'>) => {
    const response = await api.post('/books', data);
    return response.data;
};

export const updateBook = async (id: string, data: Partial<Book>) => {
    const response = await api.patch(`/books/${id}`, data);
    return response.data;
};

