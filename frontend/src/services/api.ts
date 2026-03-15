/// <reference types="vite/client" />
import axios from 'axios';
import { LiteraryWork, AdminUser, BorrowRecord } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Books ---
export const getBooks = async (): Promise<LiteraryWork[]> => {
  const response = await api.get('/books');
  return response.data;
};

export const searchBooks = async (query: string): Promise<LiteraryWork[]> => {
  const response = await api.get(`/books/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.url;
};

export const getBookById = async (id: string): Promise<LiteraryWork> => {
  const response = await api.get(`/books/${id}`);
  return response.data;
};

export const addBook = async (bookData: Partial<LiteraryWork>): Promise<LiteraryWork> => {
  const response = await api.post('/books', bookData);
  return response.data;
};

export const updateBook = async (id: string, bookData: Partial<LiteraryWork>): Promise<LiteraryWork> => {
  const response = await api.put(`/books/${id}`, bookData);
  return response.data;
};

export const deleteBook = async (id: string): Promise<void> => {
  await api.delete(`/books/${id}`, { headers: getAuthHeader() });
};

export const getAdminStats = async (): Promise<any> => {
  const response = await api.get('/books/stats', { headers: getAuthHeader() });
  return response.data;
};

// --- Reading Progress ---
export const saveReadingProgress = async (bookId: string, chapterNumber: number, scrollY: number): Promise<void> => {
  const headers = getAuthHeader();
  if (!headers.Authorization) return; // Chỉ lưu nếu đã đăng nhập

  await api.post('/progress', { bookId, chapterNumber, scrollY }, {
    headers
  });
};

export const getReadingProgress = async (bookId: string): Promise<any> => {
  const headers = getAuthHeader();
  if (!headers.Authorization) return null;

  try {
    const response = await api.get(`/progress/${bookId}`, {
      headers
    });
    return response.data.progress;
  } catch (error) {
    console.error("Lỗi lấy tiến độ đọc:", error);
    return null;
  }
};

// --- Chapters ---
export const getChapter = async (bookId: string, chapterNumber: number) => {
  const response = await api.get(`/chapters/${bookId}/${chapterNumber}`);
  return response.data;
};

// --- Authors ---
export const getAuthors = async () => {
  const response = await api.get('/authors');
  return response.data;
};

export const getAuthorById = async (id: string) => {
  const response = await api.get(`/authors/${id}`);
  return response.data;
};

export const addAuthor = async (data: any) => {
  const response = await api.post('/authors', data, { headers: getAuthHeader() });
  return response.data;
};

export const updateAuthor = async (id: string, data: any) => {
  const response = await api.put(`/authors/${id}`, data, { headers: getAuthHeader() });
  return response.data;
};

export const deleteAuthor = async (id: string) => {
  const response = await api.delete(`/authors/${id}`, { headers: getAuthHeader() });
  return response.data;
};

// --- Auth ---
export const loginAdmin = async (username: string, password: string): Promise<{ token: string; user: AdminUser }> => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// --- Accounts (backend) ---
export const getAccounts = async (): Promise<AdminUser[]> => {
  const response = await api.get('/auth/accounts', { headers: getAuthHeader() });
  return response.data;
};

export const addAccount = async (accountData: Partial<AdminUser>): Promise<AdminUser> => {
  const response = await api.post('/auth/accounts', accountData, { headers: getAuthHeader() });
  return response.data;
};

export const updateAccount = async (id: string, data: Partial<AdminUser>): Promise<AdminUser> => {
  const response = await api.put(`/auth/accounts/${id}`, data, { headers: getAuthHeader() });
  return response.data;
};

export const deleteAccount = async (id: string): Promise<void> => {
  await api.delete(`/auth/accounts/${id}`, { headers: getAuthHeader() });
};

export const toggleAccountStatus = async (id: string): Promise<AdminUser> => {
  const response = await api.patch(`/auth/accounts/${id}/toggle`, {}, { headers: getAuthHeader() });
  return response.data;
};

// --- Borrowing (LMS) ---
export const createBorrowLink = async (userId: string, bookId: string, days?: number): Promise<BorrowRecord> => {
  const response = await api.post('/borrow', { userId, bookId, days }, { headers: getAuthHeader() });
  return response.data;
};

export const returnBookLMS = async (recordId: string): Promise<BorrowRecord> => {
  const response = await api.post('/borrow/return', { recordId }, { headers: getAuthHeader() });
  return response.data;
};

export const getBorrowHistory = async (userId: string): Promise<BorrowRecord[]> => {
  const response = await api.get(`/borrow/user/${userId}`, { headers: getAuthHeader() });
  return response.data;
};

export const getAllBorrowsLMS = async (): Promise<BorrowRecord[]> => {
  const response = await api.get('/borrow/all', { headers: getAuthHeader() });
  return response.data;
};

// --- Categories ---
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const addCategory = async (data: any) => {
  const response = await api.post('/categories', data, { headers: getAuthHeader() });
  return response.data;
};

export const updateCategory = async (id: string, data: any) => {
  const response = await api.put(`/categories/${id}`, data, { headers: getAuthHeader() });
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await api.delete(`/categories/${id}`, { headers: getAuthHeader() });
  return response.data;
};

// --- Borrow Records (Local) ---
const BORROWS_KEY = 'borrowRecords';

export const getBorrowRecords = async (): Promise<BorrowRecord[]> => {
  const stored = localStorage.getItem(BORROWS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const returnBook = async (recordId: string): Promise<BorrowRecord> => {
  const records = await getBorrowRecords();
  const idx = records.findIndex(r => r.id === recordId);
  if (idx >= 0) {
    records[idx].status = 'returned';
    records[idx].returnDate = new Date().toLocaleDateString('vi-VN');
    localStorage.setItem(BORROWS_KEY, JSON.stringify(records));
    return records[idx];
  }
  throw new Error('Record not found');
};

export const getBorrowStats = async (): Promise<{
  topBooks: { bookTitle: string; count: number }[];
  dailyBorrows: { date: string; borrowed: number; returned: number }[];
  categoryDistribution: { category: string; count: number }[];
  summary: { totalThisMonth: number; returnedThisMonth: number; overdueCount: number };
}> => {
  const response = await api.get('/borrow/stats', { headers: getAuthHeader() });
  return response.data;
};

export const sendEmailReminders = async (): Promise<{ sent: number; failed: number; skipped: number; message: string }> => {
  const response = await api.post('/borrow/send-reminders', {}, { headers: getAuthHeader() });
  return response.data;
};

// ─── Reservations ────────────────────────────────────────────────────────────
export const createReservation = async (bookId: string, note = '') => {
  const response = await api.post('/reservations', { bookId, note }, { headers: getAuthHeader() });
  return response.data;
};

export const getMyReservations = async () => {
  const response = await api.get('/reservations/my', { headers: getAuthHeader() });
  return response.data;
};

export const getAllReservations = async (status?: string) => {
  const response = await api.get('/reservations', { headers: getAuthHeader(), params: status ? { status } : {} });
  return response.data;
};

export const confirmReservation = async (id: string, pickupDays = 3) => {
  const response = await api.patch(`/reservations/${id}/confirm`, { pickupDays }, { headers: getAuthHeader() });
  return response.data;
};

export const cancelReservation = async (id: string, reason = '') => {
  const response = await api.patch(`/reservations/${id}/cancel`, { reason }, { headers: getAuthHeader() });
  return response.data;
};

export const markReservationPickedUp = async (id: string) => {
  const response = await api.patch(`/reservations/${id}/pickup`, {}, { headers: getAuthHeader() });
  return response.data;
};

export default api;

