import api from './api';

export enum BookRequestType {
    PICKUP = 'PICKUP',
    DELIVERY = 'DELIVERY',
    RETURN = 'RETURN'
}

export enum BookRequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERY_FAILED = 'DELIVERY_FAILED',
    REJECTED = 'REJECTED',
    FULFILLED = 'FULFILLED',
    CANCELLED = 'CANCELLED'
}

export interface BookRequest {
    id: string;
    bookId: string;
    userId: string;
    status: BookRequestStatus;
    type: BookRequestType;
    createdAt: string;
    book: {
        title: string;
        coverUrl?: string;
    };
    user?: {
        email: string;
        firstName: string;
        lastName: string;
    }
}

export const getRequests = async (params?: any): Promise<BookRequest[]> => {
    const response = await api.get('/requests', { params });
    return response.data;
};

export const createRequest = async (data: { bookId: string; type: BookRequestType; address?: string }) => {
    const response = await api.post('/requests', data);
    return response.data;
};
