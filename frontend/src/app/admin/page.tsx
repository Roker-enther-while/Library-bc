'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    BookOpen, Users, LogOut, Search, Plus, Pencil, Trash2,
    X, Check, ChevronLeft, ChevronRight, Shield, Library,
    UserCog, ClipboardList, AlertCircle, CheckCircle2, BookCopy,
    Menu, Bell, Phone, Mail, Calendar, MapPin,
    RefreshCw, Eye, EyeOff, LayoutDashboard,
    CheckSquare, XSquare, AlertTriangle, Activity, KeyRound, Info,
    Newspaper, QrCode, TrendingUp, BookMarked,
    ArrowUpRight, Zap, Clock,
    Download, Printer, Globe, FileText,
    UserCheck, Package, Layers, Sparkles, Award,
    ChevronDown, User, Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminUser, LiteraryWork, BorrowRecord, LibraryMember, NewsItem, ActivityLog } from '@/types';

import {
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    getAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    getAllBorrowsLMS,
    returnBookLMS,
    createBorrowLink,
    getCategories,
    sendEmailReminders,
    getAllReservations,
    confirmReservation,
    cancelReservation,
    markReservationPickedUp,
} from '@/lib/apiClient';
import BookStatsCharts from '@/components/admin/BookStatsCharts';
import MembersTab from '@/components/admin/MembersTab';
import BorrowsTab from '@/components/admin/BorrowsTab';
import NewsTab from '@/components/admin/NewsTab';
import ReservationsTab from '@/components/admin/ReservationsTab';
import AccountsTab from '@/components/admin/AccountsTab';

type ActiveTab = 'dashboard' | 'books' | 'members' | 'borrows' | 'accounts' | 'news' | 'logs' | 'reservations' | 'activities';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

// ==================== HELPERS ====================
const isValidDate = (d: any) => {
    const date = new Date(d);
    return date instanceof Date && !isNaN(date.getTime());
};

const fmt = (d: Date | string) => {
    if (!d) return '';
    const date = new Date(d);
    if (!isValidDate(date)) return '';
    return date.toISOString().split('T')[0];
};

const addDays = (d: Date | string, n: number) => {
    const r = new Date(d);
    if (!isValidDate(r)) return new Date();
    r.setDate(r.getDate() + n);
    return r;
};

const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    return isValidDate(d) && d < new Date();
};

const daysLeft = (dueDate: string) => {
    if (!dueDate) return 0;
    const d = new Date(dueDate);
    if (!isValidDate(d)) return 0;
    const diff = d.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const fmtDateTime = (iso: string) => {
    if (!iso || !isValidDate(iso)) return 'N/A';
    return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtDate = (iso: string) => {
    if (!iso || !isValidDate(iso)) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const normalizeBook = (book: any): LiteraryWork => {
    if (!book) return {} as any;
    const id = book._id || book.id;
    return {
        id,
        _id: id,
        title: book.title || '',
        authorName: book.authorName || book.author?.name || '',
        authorId: book.authorId || book.author?.id || book.author?.name || '',
        category: typeof book.category === 'string' ? book.category : book.category?._id || book.category?.id || book.category?.name || '',
        publicationYear: book.publicationYear || book.year,
        year: book.publicationYear || book.year,
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        summary: book.summary || '',
        shelfLocation: book.shelfLocation || '',
        quantity: book.quantity ?? book.totalCopies ?? 0,
        available: book.available ?? book.availableCopies ?? 0,
        borrowCount: book.borrowCount ?? 0,
        coverImage: book.coverImage || '',
        coverColor: book.coverColor || '#A52422',
        isFeatured: !!book.isFeatured
    };
};

const normalizeAccount = (acc: any): AdminUser => {
    if (!acc) return {} as any;
    const id = acc._id || acc.id;
    return {
        id,
        username: acc.username || acc.email || '',
        password: acc.password || '',
        fullName: acc.fullName || acc.name || '',
        email: acc.email || '',
        phone: acc.phone || '',
        studentId: acc.studentId || '',
        role: acc.role || 'reader',
        status: acc.status || (acc.cardStatus === 'active' ? 'active' : 'inactive') || 'active',
        cardStatus: acc.cardStatus || (acc.status === 'active' ? 'active' : 'inactive'),
        penalties: acc.penalties || 0,
        createdAt: acc.createdAt ? fmt(acc.createdAt) : fmt(new Date()),
        updatedAt: acc.updatedAt ? fmt(acc.updatedAt) : undefined
    };
};

const normalizeBorrow = (record: any): BorrowRecord => {
    if (!record) return {} as any;
    const borrowDate = record.borrowDate ? fmt(record.borrowDate) : '';
    const dueDate = record.dueDate ? fmt(record.dueDate) : '';
    const returnDate = record.returnDate ? fmt(record.returnDate) : undefined;
    const status = record.status === 'borrowed' ? 'borrowing' : record.status;
    return {
        id: record._id || record.id,
        userId: record.userId || record.user?._id || record.user?.id || record.user,
        bookId: record.bookId || record.book?._id || record.book?.id || record.book,
        bookTitle: record.bookTitle || record.book?.title || '',
        borrowerName: record.borrowerName || record.user?.fullName || '',
        borrowerPhone: record.borrowerPhone || record.user?.phone || '',
        borrowerStudentId: record.borrowerStudentId || record.user?.studentId || '',
        librarianId: record.librarianId || record.librarian?._id || record.librarian?.id || record.librarian,
        librarianName: record.librarianName || record.librarian?.fullName || '',
        borrowDate,
        dueDate,
        returnDate,
        status,
        fineAmount: record.fineAmount || 0,
        notes: record.notes || ''
    };
};

const memberColors = ['#A52422', '#2D6A4F', '#3A7CA5', '#C5973E', '#6B4226', '#40916C'];

const mapMembersFromAccounts = (
    accounts: AdminUser[],
    borrows: BorrowRecord[],
    notes: Record<string, string> = {}
): LibraryMember[] => {
    const memberAccounts = (accounts || []).filter(a => a.role === 'reader');
    return memberAccounts.map((acc, idx) => {
        const aid = acc._id || acc.id;
        const related = borrows.filter(b => b.userId === aid);
        const currentlyBorrowing = related.filter(b => b.status === 'borrowing' || b.status === 'overdue').length;
        return {
            id: aid,
            fullName: acc.fullName || '',
            email: acc.email || '',
            phone: acc.phone || '',
            studentId: acc.studentId || '',
            role: 'reader',
            cardStatus: (acc.cardStatus as any) || (acc.status === 'active' ? 'active' : 'inactive'),
            memberSince: acc.createdAt || fmt(new Date()),
            totalBorrowed: related.length,
            currentlyBorrowing,
            notes: notes[aid] || '',
            avatarColor: memberColors[idx % memberColors.length]
        };
    });
};

// ==================== SUB-COMPONENTS ====================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
        active: { label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        inactive: { label: 'Đã khóa', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
        locked: { label: 'Đã khóa', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
        suspended: { label: 'Tạm khóa', cls: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
        borrowing: { label: 'Đang mượn', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
        returned: { label: 'Đã trả', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        overdue: { label: 'Quá hạn', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
        published: { label: 'Đã đăng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        draft: { label: 'Nháp', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
        pending: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
        confirmed: { label: 'Đã xác nhận', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
        picked_up: { label: 'Đã nhận', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
        cancelled: { label: 'Đã hủy', cls: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-300' },
        expired: { label: 'Quá hạn nhận', cls: 'bg-rose-50 text-rose-600 border-rose-200', dot: 'bg-rose-500' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
};

const Pagination: React.FC<{ current: number; total: number; onChange: (p: number) => void; resultText: string }> = ({ current, total, onChange, resultText }) => (
    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-medium text-gray-500">
        <p>{resultText}</p>
        <div className="flex items-center gap-1">
            <button disabled={current === 1} onClick={() => onChange(current - 1)} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-gray-900">Trang {current} / {total}</span>
            <button disabled={current === total} onClick={() => onChange(current + 1)} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight size={14} />
            </button>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [search, setSearch] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);

    const [books, setBooks] = useState<LiteraryWork[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
    const [showBookModal, setShowBookModal] = useState(false);
    const [editingBook, setEditingBook] = useState<LiteraryWork | null>(null);
    const [bookPage, setBookPage] = useState(1);
    const [bookCategoryFilter, setBookCategoryFilter] = useState('all');
    const [bookForm, setBookForm] = useState({
        title: '', authorName: '', category: 'tho' as any, year: '',
        publisher: '', isbn: '', shelfLocation: '',
        summary: '', quantity: 5, available: 5,
    });
    const [viewingBook, setViewingBook] = useState<LiteraryWork | null>(null);

    const [members, setMembers] = useState<LibraryMember[]>([]);
    const [memberNotes, setMemberNotes] = useState<Record<string, string>>({});
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState<LibraryMember | null>(null);
    const [memberForm, setMemberForm] = useState({
        fullName: '', email: '', phone: '', studentId: '',
        cardStatus: 'active' as LibraryMember['cardStatus'], notes: '',
    });
    const [memberPage, setMemberPage] = useState(1);
    const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'suspended' | 'inactive'>('all');
    const [viewingMember, setViewingMember] = useState<LibraryMember | null>(null);

    const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [borrowFilter, setBorrowFilter] = useState<'all' | 'borrowing' | 'returned' | 'overdue'>('all');
    const [borrowPage, setBorrowPage] = useState(1);
    const [borrowForm, setBorrowForm] = useState({ bookId: '', memberId: '', notes: '' });
    const [sendingReminders, setSendingReminders] = useState(false);

    // Reservations
    const [reservations, setReservations] = useState<any[]>([]);
    const [reservationFilter, setReservationFilter] = useState<string>('');

    const [accounts, setAccounts] = useState<AdminUser[]>([]);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AdminUser | null>(null);
    const [accountForm, setAccountForm] = useState({
        username: '', password: '', fullName: '', email: '', phone: '',
        role: 'librarian' as 'admin' | 'librarian',
        status: 'active' as 'active' | 'inactive',
    });

    const [news, setNews] = useState<NewsItem[]>([]);
    const [showNewsModal, setShowNewsModal] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [newsForm, setNewsForm] = useState({ title: '', content: '', status: 'draft' as 'published' | 'draft' });

    const [logs] = useState<ActivityLog[]>([]);

    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const adminUser = localStorage.getItem('adminUser');
        if (adminUser) {
            setUser(JSON.parse(adminUser));
        } else {
            router.push('/admin-login');
        }

        const notes = localStorage.getItem('memberNotes');
        if (notes) setMemberNotes(JSON.parse(notes));
    }, [router]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [booksData, accountsData, borrowsData, categoriesData] = await Promise.all([
                getBooks(),
                getAccounts(),
                getAllBorrowsLMS(),
                getCategories().catch(() => [])
            ]);

            const normalizedBooks = (booksData || []).map(normalizeBook);
            const normalizedAccounts = (accountsData || []).map(normalizeAccount);
            const normalizedBorrows = (borrowsData || []).map(normalizeBorrow).map((b: any) => ({
                ...b,
                status: (b.status === 'borrowing' && isOverdue(b.dueDate)) ? 'overdue' : b.status,
            }));

            setBooks(normalizedBooks);
            setAccounts(normalizedAccounts);
            setBorrows(normalizedBorrows);
            setMembers(mapMembersFromAccounts(normalizedAccounts, normalizedBorrows, memberNotes));
            if (Array.isArray(categoriesData) && categoriesData.length > 0) {
                setCategoryOptions(categoriesData);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }, [user, memberNotes]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (activeTab === 'reservations') {
            getAllReservations(reservationFilter || undefined)
                .then(data => setReservations(data || []))
                .catch(() => setReservations([]));
        }
    }, [activeTab, reservationFilter]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminToken');
        router.push('/');
    };

    const refreshBooks = useCallback(async () => {
        try {
            const booksData = await getBooks();
            setBooks((booksData || []).map(normalizeBook));
        } catch { console.error('refreshBooks error'); }
    }, []);

    const refreshBorrows = useCallback(async () => {
        try {
            const borrowsData = await getAllBorrowsLMS();
            const normalized = (borrowsData || []).map(normalizeBorrow).map((b: any) => ({
                ...b,
                status: (b.status === 'borrowing' && isOverdue(b.dueDate)) ? 'overdue' : b.status,
            }));
            setBorrows(normalized);
        } catch { console.error('refreshBorrows error'); }
    }, []);

    const refreshAccounts = useCallback(async () => {
        try {
            const accountsData = await getAccounts();
            const normalized = (accountsData || []).map(normalizeAccount);
            setAccounts(normalized);
            setMembers(mapMembersFromAccounts(normalized, borrows, memberNotes));
        } catch { console.error('refreshAccounts error'); }
    }, [borrows, memberNotes]);

    const handleSendReminders = useCallback(async () => {
        setSendingReminders(true);
        try {
            const result = await sendEmailReminders();
            addToast(`📧 ${result.message}`, result.sent > 0 ? 'success' : 'info');
        } catch { addToast('Lỗi khi gửi email nhắc hạn!', 'error'); }
        finally { setSendingReminders(false); }
    }, [addToast]);

    // ==================== BOOK HANDLERS ====================
    const filteredBooks = useMemo(() => {
        let list = books;
        if (bookCategoryFilter !== 'all') list = list.filter(b => b.category === bookCategoryFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(b => b.title.toLowerCase().includes(q) || (b.authorName || '').toLowerCase().includes(q) || (b.isbn || '').includes(q));
        }
        return list;
    }, [books, search, bookCategoryFilter]);

    const PER_PAGE = 8;
    const totalBookPages = Math.ceil(filteredBooks.length / PER_PAGE);
    const paginatedBooks = filteredBooks.slice((bookPage - 1) * PER_PAGE, bookPage * PER_PAGE);

    const openAddBook = () => {
        setEditingBook(null);
        setBookForm({ title: '', authorName: '', category: 'tho', year: '', publisher: '', isbn: '', shelfLocation: '', summary: '', quantity: 5, available: 5 });
        setShowBookModal(true);
    };
    const openEditBook = (book: LiteraryWork) => {
        setEditingBook(book);
        setBookForm({
            title: book.title, authorName: book.authorName || '', category: book.category as any,
            year: String(book.year || book.publicationYear || ''), publisher: book.publisher || '', isbn: book.isbn || '',
            shelfLocation: book.shelfLocation || '', summary: book.summary || '',
            quantity: book.quantity || book.totalCopies || 5, available: book.available ?? book.availableCopies ?? 5,
        });
        setShowBookModal(true);
    };
    const saveBookAction = async () => {
        if (!bookForm.title.trim() || !bookForm.authorName.trim()) {
            addToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error'); return;
        }
        const payload: Partial<LiteraryWork> = {
            title: bookForm.title.trim(),
            author: { id: 'custom', name: bookForm.authorName.trim() } as any,
            category: { id: bookForm.category } as any,
            publicationYear: parseInt(String(bookForm.year || new Date().getFullYear()), 10),
            summary: bookForm.summary,
            totalCopies: bookForm.quantity,
            availableCopies: bookForm.available,
            publisher: bookForm.publisher,
            isbn: bookForm.isbn,
            shelfLocation: bookForm.shelfLocation
        };
        try {
            if (editingBook) {
                const bookId = editingBook._id || editingBook.id;
                const updated = await updateBook(bookId, payload);
                setBooks(prev => prev.map(b => b.id === editingBook.id ? normalizeBook(updated) : b));
                addToast(`✅ Đã cập nhật "${bookForm.title}"`);
            } else {
                const created = await addBook(payload);
                setBooks(prev => [normalizeBook(created), ...prev]);
                addToast(`✅ Đã thêm "${bookForm.title}"`);
            }
            setShowBookModal(false);
        } catch { addToast('Lỗi khi lưu sách!', 'error'); }
    };
    const deleteBookAction = async (book: LiteraryWork) => {
        if (!confirm(`Xóa tác phẩm "${book.title}"?\n\nHành động này không thể hoàn tác.`)) return;
        try {
            const bookId = book._id || book.id;
            await deleteBook(bookId);
            setBooks(prev => prev.filter(b => b.id !== book.id));
            addToast(`🗑️ Đã xóa "${book.title}"`, 'info');
        } catch { addToast('Lỗi khi xóa sách!', 'error'); }
    };

    // ==================== MEMBER HANDLERS ====================
    const filteredMembers = useMemo(() => {
        let list = members;
        if (memberFilter !== 'all') list = list.filter(m => m.cardStatus === memberFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(m =>
                m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) ||
                (m.studentId || '').toLowerCase().includes(q) || m.phone.includes(q)
            );
        }
        return list;
    }, [members, search, memberFilter]);

    const totalMemberPages = Math.ceil(filteredMembers.length / PER_PAGE);
    const paginatedMembers = filteredMembers.slice((memberPage - 1) * PER_PAGE, memberPage * PER_PAGE);

    const openAddMember = () => {
        setEditingMember(null);
        setMemberForm({ fullName: '', email: '', phone: '', studentId: '', cardStatus: 'active', notes: '' });
        setShowMemberModal(true);
    };
    const openEditMember = (m: LibraryMember) => {
        setEditingMember(m);
        setMemberForm({ fullName: m.fullName, email: m.email, phone: m.phone, studentId: m.studentId || '', cardStatus: m.cardStatus, notes: m.notes || '' });
        setShowMemberModal(true);
    };
    const saveMemberAction = async () => {
        if (!memberForm.fullName.trim() || !memberForm.phone.trim()) {
            addToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error'); return;
        }
        try {
            if (editingMember) {
                const updated = await updateAccount(editingMember.id, {
                    fullName: memberForm.fullName,
                    email: memberForm.email,
                    phone: memberForm.phone,
                    studentId: memberForm.studentId,
                    role: 'reader',
                    status: memberForm.cardStatus === 'active' ? 'active' : 'inactive',
                    cardStatus: memberForm.cardStatus
                });
                const normalized = normalizeAccount(updated);
                const nextAccounts = accounts.map(a => a.id === normalized.id ? normalized : a);
                setAccounts(nextAccounts);
                setMemberNotes(prev => ({ ...prev, [normalized.id]: memberForm.notes }));
                addToast(`✅ Đã cập nhật thành viên "${memberForm.fullName}"`);
            } else {
                const created = await addAccount({
                    username: memberForm.email || `reader_${Date.now()}`,
                    password: 'reader123',
                    fullName: memberForm.fullName,
                    email: memberForm.email,
                    phone: memberForm.phone,
                    studentId: memberForm.studentId,
                    role: 'reader',
                    status: memberForm.cardStatus === 'active' ? 'active' : 'inactive',
                    cardStatus: memberForm.cardStatus
                });
                const normalized = normalizeAccount(created);
                const nextAccounts = [normalized, ...accounts];
                setAccounts(nextAccounts);
                setMemberNotes(prev => ({ ...prev, [normalized.id]: memberForm.notes }));
                addToast(`✅ Đã thêm thành viên "${memberForm.fullName}"`);
            }
            setShowMemberModal(false);
        } catch { addToast('Lỗi khi lưu thành viên!', 'error'); }
    };

    const saveBorrowAction = async () => {
        if (!borrowForm.bookId || !borrowForm.memberId) {
            addToast('Vui lòng chọn sách và thành viên!', 'error'); return;
        }
        try {
            await createBorrowLink(borrowForm.memberId, borrowForm.bookId, 14); // Mặc định 14 ngày
            addToast(`✅ Đã tạo phiếu mượn thành công`);
            setShowBorrowModal(false);
            fetchData(); // Refresh all data
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Lỗi khi tạo phiếu mượn!';
            addToast(msg, 'error');
        }
    };

    const saveAccountAction = async () => {
        if (!accountForm.username || !accountForm.fullName) {
            addToast('Vui lòng điền đủ thông tin!', 'error'); return;
        }
        try {
            if (editingAccount) {
                await updateAccount(editingAccount.id, accountForm);
                addToast(`✅ Đã cập nhật tài khoản ${accountForm.fullName}`);
            } else {
                await addAccount(accountForm);
                addToast(`✅ Đã tạo tài khoản ${accountForm.fullName}`);
            }
            setShowAccountModal(false);
            refreshAccounts();
        } catch { addToast('Lỗi khi lưu tài khoản!', 'error'); }
    };

    const saveNewsAction = async () => {
        if (!newsForm.title || !newsForm.content) {
            addToast('Vui lòng điền đủ tiêu đề và nội dung!', 'error'); return;
        }
        try {
            if (editingNews) {
                setNews(prev => prev.map(n => n.id === editingNews.id ? { ...n, title: newsForm.title, content: newsForm.content, status: newsForm.status } : n));
                addToast('✅ Đã cập nhật tin tức');
            } else {
                const newId = Date.now().toString();
                const newItem: NewsItem = {
                    id: newId,
                    title: newsForm.title,
                    content: newsForm.content,
                    status: newsForm.status,
                    createdAt: new Date().toISOString()
                };
                setNews(prev => [newItem, ...prev]);
                addToast('✅ Đã đăng tin tức');
            }
            setShowNewsModal(false);
        } catch { addToast('Lỗi khi lưu tin tức!', 'error'); }
    };

    const overdueBorrows = borrows.filter(b => b.status === 'overdue').length;
    const navItems = [
        { id: 'dashboard' as ActiveTab, label: 'Tổng quan', icon: <LayoutDashboard size={18} />, color: '#5A9EC4', always: true, badge: 0 },
        { id: 'books' as ActiveTab, label: 'Quản lý Sách', icon: <Library size={18} />, color: '#A52422', always: true, badge: 0 },
        { id: 'members' as ActiveTab, label: 'Thành viên', icon: <Users size={18} />, color: '#2D6A4F', always: true, badge: 0 },
        { id: 'borrows' as ActiveTab, label: 'Mượn / Trả', icon: <ClipboardList size={18} />, color: '#3A7CA5', always: true, badge: overdueBorrows },
        { id: 'news' as ActiveTab, label: 'Tin tức', icon: <Newspaper size={18} />, color: '#C5973E', always: true, badge: 0 },
        { id: 'reservations' as ActiveTab, label: 'Đặt trước', icon: <BookMarked size={18} />, color: '#0ea5e9', always: true, badge: reservations.filter(r => r.status === 'pending').length },
        { id: 'accounts' as ActiveTab, label: 'Tài khoản', icon: <UserCog size={18} />, color: '#7C3AED', always: false, badge: 0 },
        { id: 'logs' as ActiveTab, label: 'Nhật ký', icon: <Activity size={18} />, color: '#6B4226', always: false, badge: 0 },
        { id: 'activities' as ActiveTab, label: 'Trung tâm Hoạt động', icon: <Activity size={18} />, color: '#f59e0b', always: true, badge: 0 },
    ].filter(item => item.always || user?.role === 'admin');

    const downloadReport = (type: 'quarter' | 'year') => {
        const now = new Date();
        const year = now.getFullYear();
        const quarter = Math.floor(now.getMonth() / 3) + 1;

        let filtered = borrows;
        if (type === 'year') {
            filtered = borrows.filter(b => new Date(b.borrowDate).getFullYear() === year);
        } else {
            filtered = borrows.filter(b => {
                const d = new Date(b.borrowDate);
                return d.getFullYear() === year && Math.floor(d.getMonth() / 3) + 1 === quarter;
            });
        }

        const headers = ["Tên sách", "Người mượn", "Ngày mượn", "Hạn trả", "Trạng thái", "Tiền phạt"];
        const rows = filtered.map(b => [
            `"${b.bookTitle}"`,
            `"${b.borrowerName}"`,
            b.borrowDate,
            b.dueDate,
            b.status === 'borrowing' ? 'Đang mượn' : b.status === 'overdue' ? 'Quá hạn' : 'Đã trả',
            b.fineAmount || 0
        ]);

        const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_cao_muon_sach_${type === 'year' ? year : 'Q' + quarter + '_' + year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast(`📊 Đã tải báo cáo ${type === 'year' ? 'năm' : 'quý'}!`, 'success');
    };

    const borrowsInCurrentYear = useMemo(() =>
        borrows.filter(b => new Date(b.borrowDate).getFullYear() === new Date().getFullYear()),
        [borrows]);

    const borrowsInCurrentQuarter = useMemo(() => {
        const now = new Date();
        const q = Math.floor(now.getMonth() / 3);
        const y = now.getFullYear();
        return borrows.filter(b => {
            const d = new Date(b.borrowDate);
            return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q;
        });
    }, [borrows]);

    if (!user) return null;

    return (
        <div className="min-h-screen flex font-sans" style={{ background: '#F0F2F5' }}>
            {/* ===== SIDEBAR ===== */}
            <aside className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-[70px]' : 'w-[240px]'}`}
                style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 50%, #0F3460 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.3)' }}>
                <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${sidebarCollapsed ? 'justify-center px-3' : ''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #A52422 0%, #C5973E 100%)' }}>
                        <BookMarked size={17} className="text-white" />
                    </div>
                    {!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="text-white font-bold text-[13px] leading-tight tracking-wide">Thư Viện</p><p className="text-white/40 text-[10px] uppercase tracking-widest">Văn Học Việt Nam</p></div>}
                </div>
                <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${activeTab === item.id ? 'text-white' : 'text-white/50 hover:text-white/90 hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center' : ''}`} style={activeTab === item.id ? { background: `linear-gradient(135deg, ${item.color}30, ${item.color}50)` } : {}}>
                            <span className="flex-shrink-0" style={activeTab === item.id ? { color: item.color } : {}}>{item.icon}</span>
                            {!sidebarCollapsed && <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>}
                            {item.badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center animate-pulse">{item.badge}</span>}
                        </button>
                    ))}
                </nav>
                <div className="p-2.5 border-t border-white/10 space-y-0.5">
                    <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white/80 transition-all text-sm"><Globe size={17} />{!sidebarCollapsed && <span className="text-[13px]">Về trang chủ</span>}</button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm"><LogOut size={17} />{!sidebarCollapsed && <span className="text-[13px]">Đăng xuất</span>}</button>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <Menu size={18} />
                        </button>
                        <h1 className="text-sm font-bold text-gray-900">{navItems.find(n => n.id === activeTab)?.label}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <div className="relative">
                            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                                className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                <Bell size={18} />
                                {overdueBorrows > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn origin-top-right">
                                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                        <span className="text-[12px] font-bold text-gray-900 uppercase tracking-wider">Thông báo mới</span>
                                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto">
                                        <div className="p-2 space-y-1">
                                            <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase">Hoạt động mượn sách</p>
                                            {borrows.slice(0, 3).map(b => (
                                                <div key={b.id} className="p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                                                    <p className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{b.borrowerName} mượn "{b.bookTitle}"</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Hạn trả: {new Date(b.dueDate).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                            ))}

                                            <div className="h-px bg-gray-50 my-2" />

                                            <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase">Quy trình mượn sách</p>
                                            {reservations.filter(r => r.status === 'pending').map(r => (
                                                <div key={`notif-res-${r._id || r.id}`} className="p-3 bg-blue-50/30 rounded-xl border border-blue-100 flex items-start gap-3">
                                                    <p className="text-[13px] font-semibold text-gray-800">Yêu cầu đặt chỗ mới</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">Từ: {r.user?.fullName || 'Độc giả'}</p>
                                                </div>
                                            ))}
                                            {reservations.filter(r => r.status === 'pending').length === 0 && (
                                                <p className="px-3 py-4 text-center text-[12px] text-gray-400 italic">Không có quy trình nào cần xử lý</p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => { setActiveTab('activities'); setShowNotifications(false); }} className="w-full py-3 text-center text-[12px] font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-50">Xem tất cả hoạt động</button>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu */}
                        <div className="relative">
                            <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                                className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all ${showProfileMenu ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {user.fullName.charAt(0)}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-[13px] font-bold text-gray-900 leading-none mb-0.5">{user.fullName}</p>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{user.role === 'admin' ? 'Quản trị viên' : 'Thủ thư'}</p>
                                </div>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn origin-top-right">
                                    <div className="p-2 space-y-1">
                                        {user?.role === 'admin' && (
                                            <button onClick={() => { setActiveTab('accounts'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><User size={16} /></div>
                                                Hồ sơ & Tài khoản
                                            </button>
                                        )}
                                        {/* <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Settings size={16} /></div>
                                            Thiết lập cá nhân
                                        </button> */}
                                        <div className="h-px bg-gray-50 my-1 mx-2" />
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-600 hover:bg-red-50 transition-all">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><LogOut size={16} /></div>
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
                                <div className="relative z-10">
                                    <h2 className="text-xl font-bold">Xin chào, {user.fullName}</h2>
                                    <p className="text-white/60 text-sm">{user.role === 'admin' ? 'Quản trị viên' : 'Thủ thư'} · {new Date().toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Tổng sách', value: books.length, color: 'bg-red-500' },
                                    { label: 'Thành viên', value: members.length, color: 'bg-green-500' },
                                    { label: 'Đang mượn', value: borrows.filter(b => b.status === 'borrowing').length, color: 'bg-blue-500' },
                                    { label: 'Quá hạn', value: overdueBorrows, color: 'bg-orange-500' }
                                ].map((s, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-2xl font-bold">{s.value}</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <BookStatsCharts />

                            {user?.role === 'admin' && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                <FileText size={20} className="text-indigo-500" />
                                                Báo cáo & Thống kê Tình trạng Mượn sách
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">Xuất dữ liệu thống kê phục vụ công tác báo cáo định kỳ theo quý và năm</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => downloadReport('quarter')}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                                            >
                                                <Download size={14} /> Xuất Quý
                                            </button>
                                            <button
                                                onClick={() => downloadReport('year')}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                                            >
                                                <Download size={14} /> Xuất Năm
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-indigo-200 transition-all">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Dữ liệu Quý hiện tại</p>
                                            <p className="text-xl font-bold text-gray-900">{borrowsInCurrentQuarter.length} <span className="text-xs font-medium text-gray-500">lượt mượn</span></p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-slate-300 transition-all">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Dữ liệu Năm hiện tại</p>
                                            <p className="text-xl font-bold text-gray-900">{borrowsInCurrentYear.length} <span className="text-xs font-medium text-gray-500">lượt mượn</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'books' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Danh sách sách</h3>
                                <button onClick={openAddBook} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all">+ Thêm sách</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Tác phẩm</th>
                                            <th className="px-4 py-3 text-left">Tác giả</th>
                                            <th className="px-4 py-3 text-center">SL / Còn</th>
                                            <th className="px-4 py-3 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedBooks.map(b => (
                                            <tr key={b.id}>
                                                <td className="px-6 py-4 font-semibold">{b.title}</td>
                                                <td className="px-4 py-4 text-gray-500">{b.authorName}</td>
                                                <td className="px-4 py-4 text-center font-mono">{b.quantity} / {b.available}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEditBook(b)} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                                                        <button onClick={() => deleteBookAction(b)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination current={bookPage} total={totalBookPages} onChange={setBookPage} resultText={`Hiển thị ${paginatedBooks.length} / ${filteredBooks.length}`} />
                        </div>
                    )}
                    {activeTab === 'members' && (
                        <MembersTab
                            members={members}
                            memberFilter={memberFilter}
                            setMemberFilter={setMemberFilter}
                            setMemberPage={setMemberPage}
                            paginatedMembers={paginatedMembers}
                            memberPage={memberPage}
                            totalMemberPages={totalMemberPages}
                            filteredMembers={filteredMembers}
                            PER_PAGE={PER_PAGE}
                            onView={(m) => setViewingMember(m)}
                            onEdit={openEditMember}
                            onToggleStatus={async (m) => {
                                const targetId = m._id || m.id;
                                if (!targetId) return;
                                try {
                                    const nextActive = m.cardStatus !== 'active';
                                    const nextStatus = nextActive ? 'active' : 'inactive';
                                    const nextCard = nextActive ? 'active' : 'locked';

                                    await toggleAccountStatus(targetId);

                                    const nextAccounts = accounts.map(a => (a._id || a.id) === targetId ? { ...a, status: nextStatus as any, cardStatus: nextCard as any } : a);
                                    setAccounts(nextAccounts);
                                    setMembers(mapMembersFromAccounts(nextAccounts, borrows, memberNotes));
                                    addToast(`${nextActive ? '✅ Mở khóa' : '🔒 Đã khóa'} "${m.fullName}"`);
                                } catch (error) {
                                    console.error('Toggle error:', error);
                                    addToast('Lỗi cập nhật trạng thái!', 'error');
                                }
                            }}
                            onDelete={async (m) => {
                                const targetId = m._id || m.id;
                                if (!targetId) return;
                                if (!confirm(`Xóa thành viên "${m.fullName}"?`)) return;
                                try {
                                    await deleteAccount(targetId);
                                    await refreshAccounts();
                                    addToast(`🗑️ Đã xóa "${m.fullName}"`, 'info');
                                } catch { addToast('Lỗi khi xóa thành viên!', 'error'); }
                            }}
                        />
                    )}
                    {activeTab === 'borrows' && (
                        <BorrowsTab
                            borrows={borrows}
                            borrowFilter={borrowFilter}
                            setBorrowFilter={setBorrowFilter}
                            setBorrowPage={setBorrowPage}
                            paginatedBorrows={borrows.filter(b => borrowFilter === 'all' || b.status === borrowFilter)
                                .slice((borrowPage - 1) * PER_PAGE, borrowPage * PER_PAGE)}
                            borrowPage={borrowPage}
                            totalBorrowPages={Math.ceil(borrows.filter(b => borrowFilter === 'all' || b.status === borrowFilter).length / PER_PAGE)}
                            filteredBorrows={borrows.filter(b => borrowFilter === 'all' || b.status === borrowFilter)}
                            PER_PAGE={PER_PAGE}
                            sendingReminders={sendingReminders}
                            onSendReminders={handleSendReminders}
                            openBorrowModal={() => setShowBorrowModal(true)}
                            onReturn={async (b) => {
                                if (!confirm(`Xác nhận trả sách "${b.bookTitle}"?`)) return;
                                try {
                                    await returnBookLMS(b.id);
                                    await refreshBorrows();
                                    addToast(`✅ Đã trả sách "${b.bookTitle}"`);
                                } catch { addToast('Lỗi khi trả sách!', 'error'); }
                            }}
                        />
                    )}
                    {activeTab === 'news' && (
                        <NewsTab
                            news={news}
                            onAdd={() => { setEditingNews(null); setNewsForm({ title: '', content: '', status: 'draft' }); setShowNewsModal(true); }}
                            onEdit={(n) => { setEditingNews(n); setNewsForm({ title: n.title, content: n.content, status: n.status }); setShowNewsModal(true); }}
                            onDelete={(n) => {
                                if (!confirm(`Xóa tin "${n.title}"?`)) return;
                                setNews(prev => prev.filter(x => x.id !== n.id));
                                addToast(`🗑️ Đã xóa "${n.title}"`, 'info');
                            }}
                            onToggleStatus={(n) => {
                                const next = n.status === 'published' ? 'draft' : 'published';
                                setNews(prev => prev.map(x => x.id === n.id ? { ...x, status: next } : x));
                                addToast(`${next === 'published' ? '✅ Đã đăng' : '📝 Chuyển nháp'} "${n.title}"`, 'info');
                            }}
                        />
                    )}
                    {activeTab === 'reservations' && (
                        <ReservationsTab
                            reservations={reservations}
                            reservationFilter={reservationFilter}
                            setReservationFilter={setReservationFilter}
                            onConfirm={async (r) => {
                                const pickupDays = parseInt(prompt('Số ngày giữ sách:', '3') || '3') || 3;
                                try {
                                    await confirmReservation(r._id, pickupDays);
                                    addToast('✅ Đã xác nhận đặt trước', 'success');
                                    getAllReservations(reservationFilter || undefined).then(d => setReservations(d || []));
                                } catch { addToast('Lỗi xác nhận!', 'error'); }
                            }}
                            onCancel={async (r) => {
                                const reason = prompt('Lý do hủy:');
                                if (!reason) return;
                                try {
                                    await cancelReservation(r._id, reason);
                                    addToast('❌ Đã hủy đặt trước', 'info');
                                    getAllReservations(reservationFilter || undefined).then(d => setReservations(d || []));
                                } catch { addToast('Lỗi hủy!', 'error'); }
                            }}
                            onPickedUp={async (r) => {
                                if (!confirm('Xác nhận độc giả đã nhận sách?')) return;
                                try {
                                    await markReservationPickedUp(r._id);
                                    addToast('📚 Đã đánh dấu đã nhận sách', 'success');
                                    getAllReservations(reservationFilter || undefined).then(d => setReservations(d || []));
                                    await refreshBorrows();
                                } catch { addToast('Lỗi!', 'error'); }
                            }}
                        />
                    )}

                    {activeTab === 'activities' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Trung tâm Hoạt động</h2>
                                    <p className="text-gray-500 text-sm">Tổng hợp toàn bộ diễn biến trong hệ thống thư viện</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={fetchData} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"><RefreshCw size={18} /></button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="divide-y divide-gray-50">
                                    {[
                                        ...borrows.map(b => ({ id: b._id || b.id, type: 'borrow', title: `Độc giả ${b.borrowerName} mượn sách`, detail: `Sách: ${b.bookTitle}`, date: b.borrowDate, target: 'borrows' as ActiveTab, color: '#3A7CA5', icon: <ClipboardList size={16} /> })),
                                        ...reservations.map(r => ({ id: r._id || r.id, type: 'reservation', title: `Yêu cầu đặt chỗ mới`, detail: `Độc giả: ${r.user?.fullName || 'N/A'} - Sách: ${r.book?.title || 'N/A'}`, date: r.createdAt || new Date().toISOString(), target: 'reservations' as ActiveTab, color: '#0ea5e9', icon: <BookMarked size={16} /> })),
                                        ...news.map(n => ({ id: n._id || n.id, type: 'news', title: `Thông báo mới: ${n.title}`, detail: n.content.substring(0, 60) + '...', date: n.createdAt, target: 'news' as ActiveTab, color: '#C5973E', icon: <Newspaper size={16} /> }))
                                    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(act => (
                                        <div key={`${act.type}-${act.id}`} className="p-4 hover:bg-gray-50/50 transition-all flex items-start gap-4 group">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${act.color}15`, color: act.color }}>
                                                {act.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className="text-[14px] font-bold text-gray-900">{act.title}</p>
                                                    <span className="text-[11px] text-gray-400 font-medium">{new Date(act.date).toLocaleString('vi-VN')}</span>
                                                </div>
                                                <p className="text-[13px] text-gray-500 truncate">{act.detail}</p>
                                            </div>
                                            <button onClick={() => setActiveTab(act.target)} className="opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1.5">
                                                Xem chi tiết <ArrowUpRight size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {borrows.length + reservations.length + news.length === 0 && (
                                        <div className="py-20 text-center">
                                            <Activity size={40} className="mx-auto text-gray-200 mb-3" />
                                            <p className="text-gray-400 font-medium">Chưa có hoạt động nào được ghi nhận</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'accounts' && user.role === 'admin' && (
                        <AccountsTab
                            accounts={accounts}
                            currentUserId={user.id}
                            isAdmin={user.role === 'admin'}
                            onAdd={() => { setEditingAccount(null); setAccountForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'librarian', status: 'active' }); setShowAccountModal(true); }}
                            onEdit={(a) => { setEditingAccount(a); setAccountForm({ username: a.username, password: '', fullName: a.fullName, email: a.email || '', phone: a.phone || '', role: (a.role as any) || 'librarian', status: (a.status as any) || 'active' }); setShowAccountModal(true); }}
                            onDelete={async (a) => {
                                const targetId = a._id || a.id;
                                if (targetId === (user._id || user.id)) { addToast('Không thể xóa tài khoản đang đăng nhập!', 'error'); return; }
                                if (!confirm(`Xóa tài khoản "${a.fullName}"?`)) return;
                                try { await deleteAccount(targetId!); await refreshAccounts(); addToast(`🗑️ Đã xóa "${a.fullName}"`, 'info'); }
                                catch { addToast('Lỗi xóa tài khoản!', 'error'); }
                            }}
                            onToggleStatus={async (a) => {
                                const targetId = a._id || a.id;
                                if (targetId === (user._id || user.id)) { addToast('Không thể khóa tài khoản đang đăng nhập!', 'error'); return; }
                                try { await toggleAccountStatus(targetId!); await refreshAccounts(); addToast(`Đã cập nhật trạng thái "${a.fullName}"`); }
                                catch { addToast('Lỗi cập nhật!', 'error'); }
                            }}
                        />
                    )}
                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                            <p className="text-sm">Nhật ký hoạt động sẽ hiển thị ở đây.</p>
                        </div>
                    )}
                </main>
            </div>

            {showBookModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-900">{editingBook ? 'Cập nhật tác phẩm' : 'Thêm tác phẩm mới'}</h3>
                            <button onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề sách</label>
                                <input type="text" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tác giả</label>
                                    <input type="text" value={bookForm.authorName} onChange={e => setBookForm({ ...bookForm, authorName: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thể loại</label>
                                    <select value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm bg-white">
                                        <option value="tho">Thơ</option>
                                        <option value="truyen">Truyện</option>
                                        <option value="tieu_thuyet">Tiểu thuyết</option>
                                        <option value="ky">Ký</option>
                                        <option value="kich">Kịch</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số lượng</label>
                                    <input type="number" value={bookForm.quantity} onChange={e => setBookForm({ ...bookForm, quantity: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hiện có</label>
                                    <input type="number" value={bookForm.available} onChange={e => setBookForm({ ...bookForm, available: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowBookModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all text-sm">Hủy</button>
                            <button onClick={saveBookAction} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-lg transition-all text-sm">Lưu thay đổi</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Member Modal (Add/Edit) */}
            {showMemberModal && (
                <Modal title={editingMember ? `Cập nhật: ${editingMember.fullName}` : 'Thêm thành viên mới'} onClose={() => setShowMemberModal(false)} headerColor="#2D6A4F">
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><FormLabel required>Họ tên</FormLabel><FormInput value={memberForm.fullName} onChange={v => setMemberForm({ ...memberForm, fullName: v })} /></div>
                            <div><FormLabel required>Mã số độc giả</FormLabel><FormInput value={memberForm.studentId} onChange={v => setMemberForm({ ...memberForm, studentId: v })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><FormLabel>Email</FormLabel><FormInput value={memberForm.email} onChange={v => setMemberForm({ ...memberForm, email: v })} /></div>
                            <div><FormLabel required>Số điện thoại</FormLabel><FormInput value={memberForm.phone} onChange={v => setMemberForm({ ...memberForm, phone: v })} /></div>
                        </div>
                        <div>
                            <FormLabel>Ghi chú thành viên</FormLabel>
                            <textarea value={memberForm.notes} onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm" />
                        </div>
                    </div>
                    <ModalFooter onCancel={() => setShowMemberModal(false)} onConfirm={saveMemberAction} confirmLabel={editingMember ? 'Cập nhật' : 'Thêm thành viên'} confirmColor="#2D6A4F" />
                </Modal>
            )}

            {/* Member Detail Modal (View) */}
            {viewingMember && (
                <Modal title={`Chi tiết: ${viewingMember.fullName}`} onClose={() => setViewingMember(null)} headerColor="#1A1A2E" size="lg">
                    <div className="p-6">
                        <div className="flex items-center gap-5 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ backgroundColor: viewingMember.avatarColor }}>
                                {viewingMember.fullName.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-gray-900">{viewingMember.fullName}</h4>
                                <p className="text-sm text-gray-500 mb-2">{viewingMember.studentId} · {viewingMember.email}</p>
                                <StatusBadge status={viewingMember.cardStatus} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-gray-900">{viewingMember.totalBorrowed}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Tổng mượn</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-blue-600">{viewingMember.currentlyBorrowing}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Đang giữ</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-gray-900">{new Date(viewingMember.memberSince).getFullYear()}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Năm tham gia</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3">Thông tin liên hệ & Ghi chú</h5>
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div><p className="text-gray-400 mb-1">Số điện thoại</p><p className="font-semibold">{viewingMember.phone || 'N/A'}</p></div>
                                <div><p className="text-gray-400 mb-1">Mã số sinh viên (MSV)</p><p className="font-semibold">{viewingMember.studentId || 'N/A'}</p></div>
                            </div>
                            <div className="pt-2">
                                <p className="text-gray-400 text-sm mb-1">Ghi chú quản lý</p>
                                <p className="p-3 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-100 italic">
                                    {viewingMember.notes || 'Không có ghi chú nào cho thành viên này.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Borrow Modal */}
            {showBorrowModal && (
                <Modal title="Lập phiếu mượn mới" onClose={() => setShowBorrowModal(false)} headerColor="#3A7CA5">
                    <div className="p-6 space-y-4">
                        <div>
                            <FormLabel required>Chọn tác phẩm</FormLabel>
                            <select value={borrowForm.bookId} onChange={e => setBorrowForm({ ...borrowForm, bookId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                                <option value="">-- Chọn sách --</option>
                                {books.filter(b => (b.available ?? 0) > 0).map(b => (
                                    <option key={b.id} value={b.id}>{b.title} (Còn {b.available})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <FormLabel required>Chọn độc giả</FormLabel>
                            <select value={borrowForm.memberId} onChange={e => setBorrowForm({ ...borrowForm, memberId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-none">
                                <option value="">-- Chọn độc giả --</option>
                                {members.filter(m => m.cardStatus === 'active').map(m => (
                                    <option key={m.id} value={m.id}>{m.fullName} - {m.studentId}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <FormLabel>Ghi chú mượn</FormLabel>
                            <textarea value={borrowForm.notes} onChange={e => setBorrowForm({ ...borrowForm, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Tình trạng sách, ngày hẹn trả..." />
                        </div>
                    </div>
                    <ModalFooter onCancel={() => setShowBorrowModal(false)} onConfirm={saveBorrowAction} confirmLabel="Xác nhận mượn" confirmColor="#3A7CA5" />
                </Modal>
            )}

            {/* News Modal */}
            {showNewsModal && (
                <Modal title={editingNews ? 'Sửa tin tức' : 'Đăng tin mới'} onClose={() => setShowNewsModal(false)} headerColor="#C5973E" size="lg">
                    <div className="p-6 space-y-4">
                        <div><FormLabel required>Tiêu đề tin</FormLabel><FormInput value={newsForm.title} onChange={v => setNewsForm({ ...newsForm, title: v })} /></div>
                        <div>
                            <FormLabel required>Nội dung</FormLabel>
                            <textarea value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} rows={8} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none" />
                        </div>
                        <div>
                            <FormLabel>Trạng thái</FormLabel>
                            <select value={newsForm.status} onChange={e => setNewsForm({ ...newsForm, status: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                                <option value="draft">Bản nháp</option>
                                <option value="published">Công khai</option>
                            </select>
                        </div>
                    </div>
                    <ModalFooter onCancel={() => setShowNewsModal(false)} onConfirm={saveNewsAction} confirmLabel="Lưu tin" confirmColor="#C5973E" />
                </Modal>
            )}

            {/* Account Modal */}
            {showAccountModal && (
                <Modal title={editingAccount ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'} onClose={() => setShowAccountModal(false)} headerColor="#7C3AED">
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><FormLabel required>Tên đăng nhập</FormLabel><FormInput value={accountForm.username} onChange={v => setAccountForm({ ...accountForm, username: v })} /></div>
                            <div><FormLabel required={!editingAccount}>Mật khẩu</FormLabel><FormInput type="password" value={accountForm.password || ''} onChange={v => setAccountForm({ ...accountForm, password: v })} placeholder={editingAccount ? '(Để trống nếu không đổi)' : 'Nhập mật khẩu'} /></div>
                        </div>
                        <div><FormLabel required>Họ tên đầy đủ</FormLabel><FormInput value={accountForm.fullName} onChange={v => setAccountForm({ ...accountForm, fullName: v })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FormLabel>Vai trò</FormLabel>
                                <select value={accountForm.role} onChange={e => setAccountForm({ ...accountForm, role: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                                    <option value="librarian">📚 Thủ thư</option>
                                    <option value="admin">👑 Quản trị viên</option>
                                </select>
                            </div>
                            <div>
                                <FormLabel>Trạng thái</FormLabel>
                                <select value={accountForm.status} onChange={e => setAccountForm({ ...accountForm, status: e.target.value as any })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                                    <option value="active">✅ Hoạt động</option>
                                    <option value="inactive">🔒 Đã khóa</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <ModalFooter onCancel={() => setShowAccountModal(false)} onConfirm={saveAccountAction} confirmLabel="Lưu tài khoản" confirmColor="#7C3AED" />
                </Modal>
            )}

            {/* Toasts Feedback */}
            <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border animate-slideIn pointer-events-auto min-w-[300px] ${t.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                        t.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            'bg-white border-gray-100 text-gray-900'
                        }`}>
                        {t.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-emerald-500" />}
                        <span className="text-[13px] font-bold">{t.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== REUSABLE MODAL UI ====================
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; headerColor?: string; size?: 'sm' | 'md' | 'lg' }> = ({ title, onClose, children, headerColor = '#1A1A2E', size = 'md' }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scaleIn ${size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg'}`}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: headerColor }}>
                <h3 className="font-bold text-white text-[13px] uppercase tracking-wider">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    <X size={16} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

const ModalFooter: React.FC<{ onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmColor?: string }> = ({ onCancel, onConfirm, confirmLabel, confirmColor = '#2D6A4F' }) => (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Hủy</button>
        <button onClick={onConfirm} className="px-6 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2" style={{ background: confirmColor }}>
            <Check size={16} /> {confirmLabel}
        </button>
    </div>
);

const FormLabel: React.FC<{ required?: boolean; children: React.ReactNode }> = ({ required, children }) => (
    <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest leading-none">
        {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
);

const FormInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ value, onChange, placeholder, type = 'text' }) => (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none hover:border-gray-300 transition-all placeholder:text-gray-300" />
);

export default AdminDashboard;
