import axios from 'axios';
import { getToken, saveToken } from '@/utils/storage';
import { useAuthStore } from '../store/authStore';

const BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 1. Request Interceptor: Attach Access Token to every request
api.interceptors.request.use(
    async (config) => {
        const token = await getToken('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle 401 & Auto-Refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 and we haven't retried yet to avoid infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await getToken('refresh_token');

                if (!refreshToken) {
                    // No refresh token available, force logout
                    console.log("[Auth] No refresh token, logging out.");
                    await useAuthStore.getState().logout();
                    return Promise.reject(error);
                }

                // Call the specific route to get a new access token
                const response = await axios.post(`${BASE_URL}/auth/get-new-access-token/`, {
                    refresh_token: refreshToken
                });

                const { access_token } = response.data;

                if (access_token) {
                    // 1. Save new token to storage
                    await saveToken('access_token', access_token);

                    // 2. Update Zustand store state
                    useAuthStore.getState().setTokens(access_token);

                    // 3. Update the header of the failed request
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;

                    // 4. Retry the original request
                    return api(originalRequest);
                }

            } catch (refreshError) {
                // If the refresh attempt fails (e.g., refresh token is also expired)
                console.error("[Auth] Refresh failed, logging out:", refreshError);
                await useAuthStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
