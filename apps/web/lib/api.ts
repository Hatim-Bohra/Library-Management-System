import axios, { AxiosResponse } from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

import { getCookie } from 'cookies-next';

api.interceptors.request.use((config) => {
    const token = getCookie('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

import { toast } from 'sonner';

api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => {
        // Global Error Handling
        if (error.response) {
            const { status, data } = error.response;

            // 1. Auth Errors
            if (status === 401) {
                // Rely on Middleware/Context for redirection, but toast can be helpful if unexpected
                // toast.error("Session expired, please login again.");
            }

            // 2. Server Errors (500+)
            if (status >= 500) {
                console.error('[API] Server Error:', data);
                toast.error("Server error. We're looking into it.", {
                    description: "Please try again later."
                });
            }
        } else if (error.request) {
            // Network Error (No response received)
            console.error('[API] Network Error:', error.message);
            toast.error("Network Error", {
                description: "Please check your internet connection."
            });
        }
        return Promise.reject(error);
    }
);

export default api;
