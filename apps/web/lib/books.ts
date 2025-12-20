import api from './api';

export interface Book {
    id: string;
    title: string;
    isbn: string;
    publishedYear: number;
    copies: number;
    authorId: string;
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
