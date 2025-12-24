import api from './api';

export interface Loan {
    id: string;
    userId: string;
    bookId: string;
    dueDate: string;
    returnedAt?: string;
    status: 'ISSUED' | 'RETURNED';
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    book: {
        title: string;
        isbn: string;
    }
}

export const getLoans = async (): Promise<Loan[]> => {
    const response = await api.get('/circulation/loans');
    return response.data;
};

export const createLoan = async (data: { bookId: string; userId: string }) => {
    const response = await api.post('/circulation/checkout', data);
    return response.data;
};

export const checkInBook = async (id: string) => {
    const response = await api.patch(`/circulation/checkin/${id}`);
    return response.data;
}
