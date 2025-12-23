import api from './api';

export interface Author {
    id: string;
    name: string;
    bio?: string;
}

export const getAuthors = async (): Promise<Author[]> => {
    const response = await api.get('/authors');
    return response.data;
};
