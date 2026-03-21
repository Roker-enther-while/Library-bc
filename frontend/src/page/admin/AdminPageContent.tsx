'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LayoutDashboard, Library, Users, ClipboardList, Newspaper,
    BookMarked, UserCog, Activity,
    Pencil, Trash2, ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getBooks, getAccounts,
    addBook, updateBook, deleteBook,
    addAccount, updateAccount, deleteAccount, toggleAccountStatus,
    getAuthors, addAuthor, updateAuthor, deleteAuthor,
    getCategories, addCategory, updateCategory, deleteCategory,
    getAllBorrowsLMS, returnBookLMS, createBorrowLink,
    sendEmailReminders,
    getAllReservations, confirmReservation, cancelReservation, markReservationPickedUp
} from '@/lib/apiClient';

import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import {
    BookModal, MemberModal, ViewingMemberModal,
    BorrowModal, NewsModal, AccountModal,
    AuthorModal, CategoryModal
} from '@/components/admin/AdminModals';
import { Pagination } from '@/components/admin/AdminUIHelper';
import BookStatsCharts from '@/components/admin/BookStatsCharts';
import MembersTab from '@/components/admin/MembersTab';
import BorrowsTab from '@/components/admin/BorrowsTab';
import NewsTab from '@/components/admin/NewsTab';
import ReservationsTab from '@/components/admin/ReservationsTab';
import AccountsTab from '@/components/admin/AccountsTab';
import { LiteraryWork, LibraryMember, BorrowRecord, AdminUser, NewsItem } from '@/types';

type ActiveTab = 'dashboard' | 'books' | 'authors' | 'categories' | 'members' | 'borrows' | 'news' | 'reservations' | 'activities' | 'accounts';

const tabToSlug: Record<string, string> = {
    dashboard: '',
    books: 'sach',
    authors: 'tac-gia',
    categories: 'the-loai',
    members: 'doc-gia',
    borrows: 'muon-tra',
    news: 'tin-tuc',
    reservations: 'dat-truoc',
    activities: 'hoat-dong',
    accounts: 'tai-khoan'
};

const slugToTab: Record<string, ActiveTab> = Object.entries(tabToSlug).reduce((acc, [tab, slug]) => {
    acc[slug] = tab as ActiveTab;
    return acc;
}, {} as Record<string, ActiveTab>);

const AdminPageContent = ({ slug = '' }: { slug?: string }) => {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Sync activeTab with slug prop
    useEffect(() => {
        const targetTab = slugToTab[slug] || 'dashboard';
        if (targetTab !== activeTab) {
            setActiveTabState(targetTab);
        }
    }, [slug, activeTab]);

    const setActiveTab = useCallback((tabId: ActiveTab) => {
        setActiveTabState(tabId);
        const targetSlug = tabToSlug[tabId];
        router.push(targetSlug ? `/admin/${targetSlug}` : '/admin');
    }, [router]);

    // Data State
    const [books, setBooks] = useState<LiteraryWork[]>([]);
    const [authors, setAuthors] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [members, setMembers] = useState<LibraryMember[]>([]);
    const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Form & Modal States
    const [showBookModal, setShowBookModal] = useState(false);
    const [editingBook, setEditingBook] = useState<LiteraryWork | null>(null);
    const [bookForm, setBookForm] = useState({ title: '', authorId: '', authorName: '', category: '', categoryName: '', quantity: 1, available: 1, year: new Date().getFullYear(), summary: '' });

    const [showAuthorModal, setShowAuthorModal] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<any>(null);
    const [authorForm, setAuthorForm] = useState({ name: '', id: '', bio: '', birthYear: '' });

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [categoryForm, setCategoryForm] = useState({ name: '', id: '', description: '' });

    const [showMemberModal, setShowMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState<LibraryMember | null>(null);
    const [memberForm, setMemberForm] = useState({ fullName: '', studentId: '', email: '', phone: '', notes: '' });
    const [viewingMember, setViewingMember] = useState<LibraryMember | null>(null);

    const [showBorrowModal, setShowBorrowModal] = useState(false);
    const [borrowForm, setBorrowForm] = useState({ bookId: '', memberId: '', notes: '' });

    const [showNewsModal, setShowNewsModal] = useState(false);
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
    const [newsForm, setNewsForm] = useState({ title: '', content: '', status: 'draft' as 'draft' | 'published' });

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [accountForm, setAccountForm] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'librarian' as 'librarian' | 'admin',
        status: 'active' as 'active' | 'inactive'
    });

    // Pagination & Filters
    const [bookPage, setBookPage] = useState(1);
    const [authorPage, setAuthorPage] = useState(1);
    const [categoryPage, setCategoryPage] = useState(1);
    const [memberPage, setMemberPage] = useState(1);
    const [borrowPage, setBorrowPage] = useState(1);
    const [memberFilter, setMemberFilter] = useState('all');
    const [borrowFilter, setBorrowFilter] = useState('all');
    const [reservationFilter, setReservationFilter] = useState<string | undefined>(undefined);
    const PER_PAGE = 10;

    const [memberNotes, setMemberNotes] = useState<Record<string, string>>({});
    const [sendingReminders, setSendingReminders] = useState(false);

    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const mapMembersFromAccounts = useCallback((accs: any[], currentBorrows: any[], notes: Record<string, string>): LibraryMember[] => {
        return accs.filter(a => a.role === 'reader').map(a => {
            const userId = a._id || a.id;
            const userBorrows = currentBorrows.filter(b => {
                const bUserId = b.borrowerId || (b.user && typeof b.user !== 'string' && (b.user._id || b.user.id));
                return bUserId === userId;
            });
            return {
                id: userId,
                fullName: a.fullName,
                studentId: a.username || 'N/A',
                email: a.email || 'N/A',
                phone: a.phone || 'N/A',
                memberSince: a.createdAt,
                role: 'reader' as const,
                cardStatus: (a.cardStatus || (a.status === 'active' ? 'active' : 'inactive')) as 'active' | 'inactive' | 'suspended',
                totalBorrowed: userBorrows.length,
                currentlyBorrowing: userBorrows.filter(b => b.status === 'borrowing' || b.status === 'overdue').length,
                avatarColor: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                notes: notes[userId] || ''
            };
        });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [booksData, borrowsData, accountsData, resData, authorsData, categoriesData] = await Promise.all([
                getBooks(),
                getAllBorrowsLMS(),
                getAccounts(),
                getAllReservations(reservationFilter || undefined),
                getAuthors(),
                getCategories()
            ]);

            setBooks(booksData || []);
            setBorrows(borrowsData || []);
            setAccounts(accountsData || []);
            setReservations(resData || []);
            setAuthors(authorsData || []);
            setCategories(categoriesData || []);
            setMembers(mapMembersFromAccounts(accountsData || [], borrowsData || [], memberNotes));

            setNews([
                { id: '1', title: 'Thông báo nghỉ Tết Bính Ngọ', content: 'Thư viện sẽ nghỉ từ ngày 29 tháng Chạp...', status: 'published', createdAt: new Date().toISOString() },
                { id: '2', title: 'Cập nhật nội quy mượn sách mới', content: 'Từ ngày 01/03, độc giả có thể mượn tối đa 5 cuốn...', status: 'published', createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]);
        } catch (error) {
            addToast('Lỗi tải dữ liệu!', 'error');
        } finally {
            setLoading(false);
        }
    }, [reservationFilter, memberNotes, mapMembersFromAccounts, addToast]);

    useEffect(() => {
        const storedUser = localStorage.getItem('adminUser');
        const token = localStorage.getItem('adminToken');
        if (!storedUser || !token) {
            router.push('/admin-login');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchData();
    }, [router, fetchData]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/admin-login');
    };

    const openAddBook = () => { setEditingBook(null); setBookForm({ title: '', authorId: '', authorName: '', category: '', categoryName: '', quantity: 1, available: 1, year: new Date().getFullYear(), summary: '' }); setShowBookModal(true); };
    const openEditBook = (b: LiteraryWork) => {
        setEditingBook(b);
        const catId = typeof b.category === 'string' ? b.category : (b.category as any)?.id || '';
        setBookForm({
            title: b.title,
            authorId: b.authorId || '',
            authorName: b.authorName || '',
            category: catId,
            categoryName: b.categoryName || '',
            quantity: b.quantity || 0,
            available: b.available || 0,
            year: (b.publicationYear || b.year || 0) as number,
            summary: b.summary || ''
        });
        setShowBookModal(true);
    };

    const saveBookAction = async () => {
        try {
            if (editingBook) await updateBook(editingBook.id, bookForm);
            else await addBook(bookForm);
            await fetchData();
            setShowBookModal(false);
            addToast(editingBook ? 'Cập nhật sách thành công' : 'Thêm sách mới thành công');
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Lỗi khi lưu sách!', 'error');
        }
    };
    const deleteBookAction = async (b: LiteraryWork) => {
        if (!confirm(`Xóa sách "${b.title}"?`)) return;
        try { await deleteBook(b.id); await fetchData(); addToast('Đã xóa sách'); }
        catch { addToast('Lỗi khi xóa!', 'error'); }
    };

    const openEditMember = (m: LibraryMember) => { setEditingMember(m); setMemberForm({ fullName: m.fullName, studentId: m.studentId || '', email: m.email, phone: m.phone, notes: m.notes || '' }); setShowMemberModal(true); };
    const saveMemberAction = () => {
        const memberId = editingMember?.id || 'new';
        setMemberNotes(prev => ({ ...prev, [memberId]: memberForm.notes }));
        setShowMemberModal(false);
        addToast('Cập nhật thông tin thành công');
    };

    const saveBorrowAction = async () => {
        try {
            const borrower = members.find(m => m.id === borrowForm.memberId);
            if (!borrower) return;
            await createBorrowLink(borrowForm.memberId, borrowForm.bookId, 14);
            await fetchData();
            setShowBorrowModal(false);
            addToast('Đã lập phiếu mượn');
        } catch { addToast('Lỗi khi tạo phiếu mượn!', 'error'); }
    };

    const handleSendReminders = async () => {
        setSendingReminders(true);
        try { await sendEmailReminders(); addToast('Đã gửi email nhắc hạn'); }
        catch { addToast('Lỗi gửi email!', 'error'); }
        finally { setSendingReminders(false); }
    };

    const saveNewsAction = () => {
        if (editingNews) setNews(prev => prev.map(n => n.id === editingNews.id ? { ...n, ...newsForm } : n));
        else setNews(prev => [...prev, { id: Date.now().toString(), ...newsForm, createdAt: new Date().toISOString() }]);
        setShowNewsModal(false);
        addToast(editingNews ? 'Cập nhật thành công' : 'Đã đăng tin');
    };

    const openEditAccount = (a: any) => {
        setEditingAccount(a);
        setAccountForm({
            username: a.username,
            password: '',
            fullName: a.fullName,
            email: a.email || '',
            phone: a.phone || '',
            role: a.role as 'librarian' | 'admin',
            status: a.status as 'active' | 'inactive'
        });
        setShowAccountModal(true);
    };

    const saveAccountAction = async () => {
        try {
            if (editingAccount) {
                await updateAccount(editingAccount.id || editingAccount._id, accountForm);
                addToast('Cập nhật tài khoản thành công');
            } else {
                await addAccount(accountForm);
                addToast('Thêm tài khoản mới thành công');
            }
            await fetchData();
            setShowAccountModal(false);
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Lỗi khi lưu tài khoản!', 'error');
        }
    };

    // Author Actions
    const openAddAuthor = () => { setEditingAuthor(null); setAuthorForm({ name: '', id: '', bio: '', birthYear: '' }); setShowAuthorModal(true); };
    const openEditAuthor = (a: any) => { setEditingAuthor(a); setAuthorForm({ name: a.name, id: a.id, bio: a.bio || '', birthYear: a.birthYear || '' }); setShowAuthorModal(true); };
    const saveAuthorAction = async () => {
        try {
            if (editingAuthor) await updateAuthor(editingAuthor._id || editingAuthor.id, authorForm);
            else await addAuthor(authorForm);
            await fetchData();
            setShowAuthorModal(false);
            addToast('Đã lưu thông tin tác giả');
        } catch { addToast('Lỗi khi lưu tác giả!', 'error'); }
    };
    const deleteAuthorAction = async (a: any) => {
        if (!confirm(`Xóa tác giả "${a.name}"?`)) return;
        try { await deleteAuthor(a._id || a.id); await fetchData(); addToast('Đã xóa tác giả'); }
        catch { addToast('Lỗi khi xóa!', 'error'); }
    };

    // Category Actions
    const openAddCategory = () => { setEditingCategory(null); setCategoryForm({ name: '', id: '', description: '' }); setShowCategoryModal(true); };
    const openEditCategory = (c: any) => { setEditingCategory(c); setCategoryForm({ name: c.name, id: c.id, description: c.description || '' }); setShowCategoryModal(true); };
    const saveCategoryAction = async () => {
        try {
            if (editingCategory) await updateCategory(editingCategory.id || editingCategory._id, categoryForm);
            else await addCategory(categoryForm);
            await fetchData();
            setShowCategoryModal(false);
            addToast('Đã lưu thể loại');
        } catch { addToast('Lỗi khi lưu thể loại!', 'error'); }
    };
    const deleteCategoryAction = async (c: any) => {
        if (!confirm(`Xóa thể loại "${c.name}"?`)) return;
        try { await deleteCategory(c.id || c._id); await fetchData(); addToast('Đã xóa thể loại'); }
        catch { addToast('Lỗi khi xóa!', 'error'); }
    };

    const overdueBorrows = useMemo(() => borrows.filter(b => b.status === 'overdue').length, [borrows]);
    const borrowsInCurrentQuarter = useMemo(() => {
        const q = Math.floor(new Date().getMonth() / 3);
        const y = new Date().getFullYear();
        return borrows.filter(b => {
            const d = new Date(b.borrowDate);
            return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === y;
        });
    }, [borrows]);
    const borrowsInCurrentYear = useMemo(() => borrows.filter(b => new Date(b.borrowDate).getFullYear() === new Date().getFullYear()), [borrows]);

    const downloadReport = (type: 'quarter' | 'year') => {
        const data = type === 'quarter' ? borrowsInCurrentQuarter : borrowsInCurrentYear;
        const csv = 'ID,Sách,Người mượn,Ngày mượn,Hạn trả,Trạng thái\n' +
            data.map(b => `${b.id},${b.bookTitle},${b.borrowerName},${b.borrowDate},${b.dueDate},${b.status}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `report_${type}_${Date.now()}.csv`;
        link.click();
    };

    const filteredBooks = books;
    const totalBookPages = Math.ceil(filteredBooks.length / PER_PAGE);
    const paginatedBooks = filteredBooks.slice((bookPage - 1) * PER_PAGE, bookPage * PER_PAGE);

    const filteredMembers = members.filter(m => memberFilter === 'all' || m.cardStatus === memberFilter);
    const totalMemberPages = Math.ceil(filteredMembers.length / PER_PAGE);
    const paginatedMembers = filteredMembers.slice((memberPage - 1) * PER_PAGE, memberPage * PER_PAGE);

    const navItems = [
        { id: 'dashboard' as const, label: 'Tổng quan', icon: <LayoutDashboard size={18} />, color: '#3A7CA5', always: true, badge: 0 },
        { id: 'books' as const, label: 'Tác phẩm', icon: <Library size={18} />, color: '#C5973E', always: true, badge: 0 },
        { id: 'authors' as const, label: 'Tác giả', icon: <Users size={18} />, color: '#7C3AED', always: true, badge: 0 },
        { id: 'categories' as const, label: 'Thể loại', icon: <Activity size={18} />, color: '#2D6A4F', always: true, badge: 0 },
        { id: 'members' as const, label: 'Độc giả', icon: <Users size={18} />, color: '#3A7CA5', always: true, badge: 0 },
        { id: 'borrows' as const, label: 'Phiếu mượn', icon: <ClipboardList size={18} />, color: '#3A7CA5', always: true, badge: overdueBorrows },
        { id: 'reservations' as const, label: 'Đặt trước', icon: <BookMarked size={18} />, color: '#0ea5e9', always: true, badge: reservations.filter(r => r.status === 'pending').length },
        { id: 'news' as const, label: 'Tin tức', icon: <Newspaper size={18} />, color: '#D68910', always: true, badge: 0 },
        { id: 'activities' as const, label: 'Hoạt động', icon: <Activity size={18} />, color: '#7C3AED', always: true, badge: 0 },
    ];
    const accountsNavItem = { id: 'accounts' as const, label: 'Tài khoản', icon: <UserCog size={18} />, color: '#1E1B4B', always: false, badge: 0 };

    if (!user || loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium animate-pulse">Đang khởi tạo hệ thống...</p>
            </div>
        </div>
    );

    const fullNavItems = user.role === 'admin' ? [...navItems, accountsNavItem] : navItems;

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col lg:flex-row font-sans text-gray-900">
            <AdminSidebar
                sidebarCollapsed={sidebarCollapsed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                navItems={fullNavItems}
                onLogout={handleLogout}
                onGoHome={() => router.push('/')}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[240px]'}`}>
                <AdminHeader
                    user={user}
                    activeTabLabel={fullNavItems.find(i => i.id === activeTab)?.label || ''}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    showNotifications={showNotifications}
                    setShowNotifications={setShowNotifications}
                    showProfileMenu={showProfileMenu}
                    setShowProfileMenu={setShowProfileMenu}
                    borrows={borrows}
                    reservations={reservations}
                    overdueBorrows={overdueBorrows}
                    handleLogout={handleLogout}
                    setActiveTab={setActiveTab}
                />

                <main className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Tổng sách', value: books.length },
                                    { label: 'Độc giả', value: members.length },
                                    { label: 'Đang mượn', value: borrows.filter(b => b.status === 'borrowing').length },
                                    { label: 'Quá hạn', value: overdueBorrows }
                                ].map((s) => (
                                    <div key={s.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <p className="text-2xl font-bold">{s.value}</p>
                                        <p className="text-xs text-gray-500 font-medium uppercase">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                            <BookStatsCharts />
                        </div>
                    )}

                    {activeTab === 'books' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Danh sách tác phẩm</h3>
                                <button onClick={openAddBook} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all">+ Thêm sách</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold">
                                        <tr><th className="px-6 py-3 text-left">Tác phẩm</th><th className="px-4 py-3 text-left">Tác giả</th><th className="px-4 py-3 text-center">SL / Còn</th><th className="px-4 py-3 text-center">Thao tác</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedBooks.map(b => (
                                            <tr key={b.id || b._id}>
                                                <td className="px-6 py-4 font-semibold">{b.title}</td>
                                                <td className="px-4 py-4 text-gray-500">{typeof b.authorName === 'string' ? b.authorName : (authors.find(a => a.id === b.authorId)?.name || 'N/A')}</td>
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

                    {activeTab === 'authors' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Quản lý Tác giả</h3>
                                <button onClick={openAddAuthor} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all">+ Thêm tác giả</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold">
                                        <tr><th className="px-6 py-3 text-left">Họ tên</th><th className="px-4 py-3 text-left">Năm sinh</th><th className="px-4 py-3 text-center">Số tác phẩm</th><th className="px-4 py-3 text-center">Thao tác</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {authors.slice((authorPage - 1) * PER_PAGE, authorPage * PER_PAGE).map(a => (
                                            <tr key={a.id || a._id}>
                                                <td className="px-6 py-4 font-semibold">{a.name}</td>
                                                <td className="px-4 py-4 text-gray-500">{a.birthYear || 'N/A'}</td>
                                                <td className="px-4 py-4 text-center">{a.worksCount || 0}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEditAuthor(a)} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                                                        <button onClick={() => deleteAuthorAction(a)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination current={authorPage} total={Math.ceil(authors.length / PER_PAGE)} onChange={setAuthorPage} resultText={`Hiển thị ${authors.length} tác giả`} />
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Quản lý Thể loại</h3>
                                <button onClick={openAddCategory} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all">+ Thêm thể loại</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold">
                                        <tr><th className="px-6 py-3 text-left">Tên thể loại</th><th className="px-4 py-3 text-left">Mô tả</th><th className="px-4 py-3 text-center">Thao tác</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {categories.slice((categoryPage - 1) * PER_PAGE, categoryPage * PER_PAGE).map(c => (
                                            <tr key={c.id || c._id}>
                                                <td className="px-6 py-4 font-semibold">{c.name}</td>
                                                <td className="px-4 py-4 text-gray-500">{c.description || 'N/A'}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEditCategory(c)} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                                                        <button onClick={() => deleteCategoryAction(c)} className="text-red-600 hover:text-red-800"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination current={categoryPage} total={Math.ceil(categories.length / PER_PAGE)} onChange={setCategoryPage} resultText={`Hiển thị ${categories.length} thể loại`} />
                        </div>
                    )}

                    {activeTab === 'members' && <MembersTab members={members} memberFilter={memberFilter} setMemberFilter={setMemberFilter} setMemberPage={setMemberPage} paginatedMembers={paginatedMembers} memberPage={memberPage} totalMemberPages={totalMemberPages} filteredMembers={filteredMembers} PER_PAGE={PER_PAGE} onView={setViewingMember} onEdit={openEditMember} onToggleStatus={async (m) => { try { await toggleAccountStatus(m.id); await fetchData(); addToast('Đã cập nhật trạng thái'); } catch { addToast('Lỗi!', 'error'); } }} onDelete={async (m) => { if (!confirm(`Xóa ${m.fullName}?`)) return; try { await deleteAccount(m.id); await fetchData(); addToast('Đã xóa'); } catch { addToast('Lỗi!', 'error'); } }} />}
                    {activeTab === 'borrows' && <BorrowsTab borrows={borrows} borrowFilter={borrowFilter} setBorrowFilter={setBorrowFilter} setBorrowPage={setBorrowPage} paginatedBorrows={borrows.filter(b => borrowFilter === 'all' || b.status === borrowFilter).slice((borrowPage - 1) * PER_PAGE, borrowPage * PER_PAGE)} borrowPage={borrowPage} totalBorrowPages={Math.ceil(borrows.filter(b => borrowFilter === 'all' || b.status === borrowFilter).length / PER_PAGE)} filteredBorrows={borrows.filter(b => borrowFilter === 'all' || b.status === borrowFilter)} PER_PAGE={PER_PAGE} sendingReminders={sendingReminders} onSendReminders={handleSendReminders} openBorrowModal={() => setShowBorrowModal(true)} onReturn={async (b) => { if (!confirm(`Trả "${b.bookTitle}"?`)) return; try { await returnBookLMS(b._id || b.id); await fetchData(); addToast('Đã trả'); } catch { addToast('Lỗi!', 'error'); } }} />}
                    {activeTab === 'news' && <NewsTab news={news} onAdd={() => { setEditingNews(null); setNewsForm({ title: '', content: '', status: 'draft' }); setShowNewsModal(true); }} onEdit={(n) => { setEditingNews(n); setNewsForm({ title: n.title, content: n.content, status: n.status }); setShowNewsModal(true); }} onDelete={(n) => { if (!confirm(`Xóa "${n.title}"?`)) return; setNews(prev => prev.filter(x => x.id !== n.id)); addToast('Đã xóa'); }} onToggleStatus={(n) => { const next = n.status === 'published' ? 'draft' : 'published'; setNews(prev => prev.map(x => x.id === n.id ? { ...x, status: next } : x)); addToast('Đã cập nhật'); }} />}
                    {activeTab === 'reservations' && <ReservationsTab reservations={reservations} reservationFilter={reservationFilter || ''} setReservationFilter={setReservationFilter} onConfirm={async (r) => { const promptVal = prompt('Hạn nhận (ngày):', '3'); const pickupDays = parseInt(promptVal || '3') || 3; try { await confirmReservation(r._id, pickupDays); addToast('Đã xác nhận'); await fetchData(); } catch { addToast('Lỗi!', 'error'); } }} onCancel={async (r) => { const reason = prompt('Lý do hủy:'); if (!reason) return; try { await cancelReservation(r._id, reason); addToast('Đã hủy'); await fetchData(); } catch { addToast('Lỗi!', 'error'); } }} onPickedUp={async (r) => { if (!confirm('Xác nhận nhận sách?')) return; try { await markReservationPickedUp(r._id); addToast('Đã nhận sách'); await fetchData(); } catch { addToast('Lỗi!', 'error'); } }} />}

                    {activeTab === 'activities' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                                {[
                                    ...borrows.map(b => ({ id: b._id || b.id, title: `Độc giả ${b.borrowerName} mượn sách`, detail: b.bookTitle, date: b.borrowDate, target: 'borrows' as const, color: '#3A7CA5' })),
                                    ...reservations.map(r => ({ id: r._id || r.id, title: `Đặt chỗ mới`, detail: r.book?.title, date: r.createdAt, target: 'reservations' as const, color: '#0ea5e9' }))
                                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(act => (
                                    <div key={`${act.target}-${act.id}`} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${act.color}15`, color: act.color }}><Activity size={16} /></div>
                                            <div><p className="text-[14px] font-bold">{act.title}</p><p className="text-[12px] text-gray-500">{act.detail}</p></div>
                                        </div>
                                        <button onClick={() => setActiveTab(act.target)} className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] font-bold text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg">Xem chi tiết <ArrowUpRight size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'accounts' && user.role === 'admin' && (
                        <AccountsTab accounts={accounts} currentUserId={user.id} isAdmin={user.role === 'admin'} onAdd={() => { setEditingAccount(null); setAccountForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'librarian', status: 'active' }); setShowAccountModal(true); }} onEdit={openEditAccount} onDelete={async (a) => { if (a.id === user.id) return addToast('Không thể xóa chính mình!', 'error'); if (!confirm(`Xóa ${a.fullName}?`)) return; try { await deleteAccount(a.id); await fetchData(); } catch { addToast('Lỗi!', 'error'); } }} onToggleStatus={async (a) => { if (a.id === user.id) return addToast('Không thể khóa chính mình!', 'error'); try { await toggleAccountStatus(a.id); await fetchData(); } catch { addToast('Lỗi!', 'error'); } }} />
                    )}
                </main>
            </div>

            {/* Modals */}
            {showBookModal && <BookModal editingBook={editingBook} bookForm={bookForm} setBookForm={setBookForm} authors={authors} categories={categories} onClose={() => setShowBookModal(false)} onSave={saveBookAction} />}
            {showAuthorModal && <AuthorModal editingAuthor={editingAuthor} authorForm={authorForm} setAuthorForm={setAuthorForm} onClose={() => setShowAuthorModal(false)} onSave={saveAuthorAction} />}
            {showCategoryModal && <CategoryModal editingCategory={editingCategory} categoryForm={categoryForm} setCategoryForm={setCategoryForm} onClose={() => setShowCategoryModal(false)} onSave={saveCategoryAction} />}
            {showMemberModal && <MemberModal editingMember={editingMember} memberForm={memberForm} setMemberForm={setMemberForm} onClose={() => setShowMemberModal(false)} onSave={saveMemberAction} />}
            {viewingMember && <ViewingMemberModal viewingMember={viewingMember} onClose={() => setViewingMember(null)} />}
            {showBorrowModal && <BorrowModal borrowForm={borrowForm} setBorrowForm={setBorrowForm} books={books} members={members} onClose={() => setShowBorrowModal(false)} onSave={saveBorrowAction} />}
            {showNewsModal && <NewsModal editingNews={editingNews} newsForm={newsForm} setNewsForm={setNewsForm} onClose={() => setShowNewsModal(false)} onSave={saveNewsAction} />}
            {showAccountModal && <AccountModal editingAccount={editingAccount} accountForm={accountForm} setAccountForm={setAccountForm} onClose={() => setShowAccountModal(false)} onSave={saveAccountAction} />}

            {/* Toasts */}
            <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`px-5 py-3.5 rounded-2xl shadow-xl border animate-slideIn pointer-events-auto min-w-[280px] bg-white ${t.type === 'error' ? 'border-red-100 text-red-600' : 'border-gray-100 text-gray-900'}`}>
                        <span className="text-[13px] font-bold">{t.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPageContent;
