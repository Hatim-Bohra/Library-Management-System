import api from './api';

export interface Member {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export const getMembers = async (): Promise<Member[]> => {
    const response = await api.get('/members');
    return response.data;
};

export const createMember = async (data: any) => {
    const response = await api.post('/members', data);
    return response.data;
};
