import axios from 'axios';

// NEXT_PUBLIC_API_URL=http://localhost:5000 (set in .env.local)
// Khi build production, thay bằng URL backend thật
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL && typeof window !== 'undefined') {
    console.warn('NEXT_PUBLIC_API_URL is not defined. Defaulting to localhost:5000 for development.');
}

const FINAL_BASE_URL = BASE_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${FINAL_BASE_URL}/api`,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('user');
                localStorage.removeItem('adminUser');
                // Optional: window.location.href = '/dang-nhap'; 
            }
        }
        return Promise.reject(error);
    }
);

// Global In-Memory Cache for GET requests
const apiCache: Record<string, any> = {};

export const getBooks = async () => {
    if (apiCache['/books']) return apiCache['/books'];
    const { data } = await api.get('/books');
    apiCache['/books'] = data;
    return data;
};

export const searchBooks = async (query: string) => {
    const q = query.trim();
    const cacheKey = `/books/search?q=${q}`;
    if (apiCache[cacheKey]) return apiCache[cacheKey];

    const { data } = await api.get(`/books/search?q=${encodeURIComponent(q)}`);
    apiCache[cacheKey] = data;
    return data;
};

export const getBookById = async (id: string) => {
    if (apiCache[`/books/${id}`]) return apiCache[`/books/${id}`];
    const { data } = await api.get(`/books/${id}`);
    apiCache[`/books/${id}`] = data;
    return data;
};

export const login = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const register = async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const loginAdmin = async (username: string, password: string) => {
    const { data } = await api.post('/auth/admin/login', { username, password });
    return data;
};

export const getAuthors = async () => {
    if (apiCache['/authors']) return apiCache['/authors'];
    const { data } = await api.get('/authors');
    apiCache['/authors'] = data;
    return data;
};

export const getAuthorById = async (id: string) => {
    if (apiCache[`/authors/${id}`]) return apiCache[`/authors/${id}`];
    const { data } = await api.get(`/authors/${id}`);
    apiCache[`/authors/${id}`] = data;
    return data;
};

export const addAuthor = async (authorData: any) => {
    const { data } = await api.post('/authors', authorData);
    delete apiCache['/authors'];
    return data;
};

export const updateAuthor = async (id: string, authorData: any) => {
    const { data } = await api.put(`/authors/${id}`, authorData);
    delete apiCache['/authors'];
    delete apiCache[`/authors/${id}`];
    return data;
};

export const deleteAuthor = async (id: string) => {
    const { data } = await api.delete(`/authors/${id}`);
    delete apiCache['/authors'];
    delete apiCache[`/authors/${id}`];
    return data;
};

export const toggleFavorite = async (bookId: string) => {
    const { data } = await api.patch(`/auth/favorites/${bookId}`);
    return data;
};

export const getFavorites = async () => {
    const { data } = await api.get('/auth/favorites');
    return data;
};

export const chatAI = async (messages: any[], model = 'google/gemini-2.0-flash-001') => {
    const { data } = await api.post('/ai/chat', { messages, model });
    return data;
};

export const getChapter = async (bookId: string, chapterNumber: number) => {
    const { data } = await api.get(`/books/${bookId}/chapters/${chapterNumber}`);
    return data;
};

export const saveReadingProgress = async (bookId: string, chapter: number, scrollY: number) => {
    const { data } = await api.post(`/books/${bookId}/progress`, { chapter, scrollY });
    return data;
};

export const getReadingProgress = async (bookId: string) => {
    try {
        const { data } = await api.get(`/books/${bookId}/progress`);
        return data;
    } catch {
        return null;
    }
};

export const getCategories = async () => {
    if (apiCache['/categories']) return apiCache['/categories'];
    const { data } = await api.get('/categories');
    apiCache['/categories'] = data;
    return data;
};

export const addCategory = async (categoryData: any) => {
    const { data } = await api.post('/categories', categoryData);
    delete apiCache['/categories'];
    return data;
};

export const updateCategory = async (id: string, categoryData: any) => {
    const { data } = await api.put(`/categories/${id}`, categoryData);
    delete apiCache['/categories'];
    return data;
};

export const deleteCategory = async (id: string) => {
    const { data } = await api.delete(`/categories/${id}`);
    delete apiCache['/categories'];
    return data;
};

export const createReservation = async (bookId: string, note = '') => {
    const { data } = await api.post('/reservations', { bookId, note });
    return data;
};

// Admin Services
export const addBook = async (bookData: any) => {
    const { data } = await api.post('/books', bookData);
    delete apiCache['/books'];
    return data;
};

export const updateBook = async (id: string, bookData: any) => {
    const { data } = await api.put(`/books/${id}`, bookData);
    delete apiCache['/books'];
    delete apiCache[`/books/${id}`];
    return data;
};

export const deleteBook = async (id: string) => {
    const { data } = await api.delete(`/books/${id}`);
    delete apiCache['/books'];
    delete apiCache[`/books/${id}`];
    return data;
};

export const getAccounts = async () => {
    const { data } = await api.get('/auth/accounts');
    return data;
};

export const addAccount = async (userData: any) => {
    const { data } = await api.post('/auth/accounts', userData);
    return data;
};

export const updateAccount = async (id: string, userData: any) => {
    const { data } = await api.put(`/auth/accounts/${id}`, userData);
    return data;
};

export const deleteAccount = async (id: string) => {
    const { data } = await api.delete(`/auth/accounts/${id}`);
    return data;
};

export const toggleAccountStatus = async (id: string) => {
    const { data } = await api.patch(`/auth/accounts/${id}/toggle-status`);
    return data;
};

export const getAllBorrowsLMS = async () => {
    const { data } = await api.get('/borrows');
    return data;
};

export const returnBookLMS = async (id: string) => {
    const { data } = await api.post(`/borrows/${id}/return`);
    return data;
};

export const createBorrowLink = async (userId: string, bookId: string, days: number) => {
    const { data } = await api.post('/borrows', { userId, bookId, days });
    return data;
};

export const sendEmailReminders = async () => {
    const { data } = await api.post('/borrows/reminders');
    return data;
};

export const getAllReservations = async (filter?: string) => {
    const { data } = await api.get(`/reservations${filter ? `?status=${filter}` : ''}`);
    return data;
};

export const confirmReservation = async (id: string, pickupDays?: number) => {
    const { data } = await api.post(`/reservations/${id}/confirm`, { pickupDays });
    return data;
};

export const cancelReservation = async (id: string, reason?: string) => {
    const { data } = await api.post(`/reservations/${id}/cancel`, { reason });
    return data;
};

export const markReservationPickedUp = async (id: string) => {
    const { data } = await api.post(`/reservations/${id}/pick-up`);
    return data;
};

export const getBorrowStats = async () => {
    const { data } = await api.get('/borrows/stats');
    return data;
};

export default api;
