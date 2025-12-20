import axios, { AxiosResponse } from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
        // Handle global errors (e.g. 401 logout)
        return Promise.reject(error);
    }
);

export default api;
