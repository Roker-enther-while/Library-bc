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
  UserCheck, Package, Layers, Sparkles, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminUser, LiteraryWork, BorrowRecord, LibraryMember, NewsItem, ActivityLog } from '../types';
import { categories, getCategoryName } from '../constants/categories';
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook as apiDeleteBook,
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount as apiDeleteAccount,
  toggleAccountStatus as apiToggleAccountStatus,
  getAllBorrowsLMS,
  returnBookLMS,
  createBorrowLink,
  getCategories,
  sendEmailReminders,
  getAllReservations,
  confirmReservation,
  cancelReservation as apiCancelReservation,
  markReservationPickedUp,
} from '../services/api';
import BookStatsCharts from '../components/BookStatsCharts';

interface AdminDashboardProps {
  user: AdminUser;
}

type ActiveTab = 'dashboard' | 'books' | 'members' | 'borrows' | 'accounts' | 'news' | 'logs' | 'reservations';

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
    category: typeof book.category === 'string' ? book.category : book.category?.id || book.category?.name || '',
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
    const related = borrows.filter(b => b.userId === acc.id);
    const currentlyBorrowing = related.filter(b => b.status === 'borrowing' || b.status === 'overdue').length;
    return {
      id: acc.id,
      fullName: acc.fullName || '',
      email: acc.email || '',
      phone: acc.phone || '',
      studentId: acc.studentId || '',
      role: 'reader',
      cardStatus: (acc.cardStatus as any) || (acc.status === 'active' ? 'active' : 'inactive'),
      memberSince: acc.createdAt || fmt(new Date()),
      totalBorrowed: related.length,
      currentlyBorrowing,
      notes: notes[acc.id] || '',
      avatarColor: memberColors[idx % memberColors.length]
    };
  });
};

// ==================== SUB-COMPONENTS ====================
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    active: { label: 'Hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    inactive: { label: 'Đã khóa', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
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

const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold pointer-events-auto border backdrop-blur-sm animate-slideInRight ${t.type === 'success' ? 'bg-emerald-500/95 text-white border-emerald-400' :
        t.type === 'error' ? 'bg-red-500/95 text-white border-red-400' :
          t.type === 'warning' ? 'bg-amber-500/95 text-white border-amber-400' :
            'bg-blue-500/95 text-white border-blue-400'
        }`}>
        {t.type === 'success' ? <CheckCircle2 size={16} /> :
          t.type === 'error' ? <AlertCircle size={16} /> :
            t.type === 'warning' ? <AlertTriangle size={16} /> :
              <Info size={16} />}
        {t.message}
      </div>
    ))}
  </div>
);

const MiniBarChart: React.FC<{ data: { label: string; borrow: number; return: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.borrow));
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: '88px' }}>
            <div
              className="w-full rounded-t-sm transition-all duration-700"
              style={{ height: `${max > 0 ? (d.return / max) * 88 * 0.6 : 0}px`, background: 'rgba(45,106,79,0.4)', minHeight: d.return > 0 ? '3px' : '0' }}
            />
            <div
              className="w-full rounded-t-sm transition-all duration-700"
              style={{ height: `${max > 0 ? (d.borrow / max) * 88 * 0.9 : 0}px`, background: 'linear-gradient(to top, #3A7CA5, #5A9EC4)', minHeight: d.borrow > 0 ? '4px' : '0' }}
            />
          </div>
          <p className="text-[9px] text-gray-400 font-medium">{d.label}</p>
        </div>
      ))}
    </div>
  );
};

const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0);
  let cumulative = 0;
  const r = 38, cx = 50, cy = 50;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="14" />
        ) : segments.map((seg, i) => {
          const frac = seg.value / total;
          const dash = frac * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += frac;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={28} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-gray-800 text-[14px] font-bold" style={{ fontSize: '14px', fontWeight: 700 }}>
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-[11px] text-gray-600">{seg.label}</span>
            <span className="text-[11px] font-bold text-gray-800 ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const QRCodeDisplay: React.FC<{ value: string; size?: number }> = ({ value, size = 120 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    const modules = 21;
    const cellSize = size / modules;
    let seed = 0;
    for (let c of value) seed = ((seed * 31) + c.charCodeAt(0)) & 0xffff;
    const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return ((seed >>> 0) / 0xffffffff); };
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        const inFinder = (
          (row < 8 && col < 8) || (row < 8 && col > modules - 9) || (row > modules - 9 && col < 8)
        );
        let fill = false;
        if (inFinder) {
          const r = row % (modules - 1 > row ? row : 1);
          const c2 = col % (modules - 1 > col ? col : 1);
          fill = !((r === 1 || r === 5) && c2 > 0 && c2 < 7) && !(r > 1 && r < 5 && (c2 === 1 || c2 === 5));
          const inBox = (row < 7 && col < 7) || (row < 7 && col > modules - 8) || (row > modules - 8 && col < 7);
          const border = row === 0 || row === 6 || col === 0 || col === 6 ||
            row === modules - 7 || row === modules - 1 || col === modules - 7 || col === modules - 1;
          const inner = (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
            (row >= 2 && row <= 4 && col >= modules - 5 && col <= modules - 3) ||
            (row >= modules - 5 && row <= modules - 3 && col >= 2 && col <= 4);
          fill = inBox && (border || inner);
        } else {
          fill = rand() > 0.5;
        }
        ctx.fillStyle = fill ? '#1A1A2E' : 'white';
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
    [[0, 0], [0, modules - 7], [modules - 7, 0]].forEach(([sr, sc]) => {
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect(sc * cellSize, sr * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = 'white';
      ctx.fillRect((sc + 1) * cellSize, (sr + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#1A1A2E';
      ctx.fillRect((sc + 2) * cellSize, (sr + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    });
  }, [value, size]);
  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
};

// ==================== MAIN COMPONENT ====================
const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const [books, setBooks] = useState<LiteraryWork[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>(categories);
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
  const [memberNotes, setMemberNotes] = useState<Record<string, string>>(() => {
    const s = localStorage.getItem('memberNotes');
    return s ? JSON.parse(s) : {};
  });
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
  const [showQR, setShowQR] = useState<BorrowRecord | null>(null);
  const [qrScanMode, setQrScanMode] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);

  // Reservations
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationFilter, setReservationFilter] = useState<string>('');

  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
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

  if (!user || !user.fullName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Phiên đăng nhập không hợp lệ</h2>
          <p className="text-sm text-gray-500 mb-6">Vui lòng đăng nhập lại để truy cập hệ thống quản lý.</p>
          <button
            onClick={() => navigate('/admin/dangnhap')}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black transition-colors"
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }



  // Fetch reservations
  useEffect(() => {
    if (activeTab === 'reservations') {
      getAllReservations(reservationFilter || undefined)
        .then(data => setReservations(data || []))
        .catch(() => setReservations([]));
    }
  }, [activeTab, reservationFilter]);
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [booksData, accountsData, borrowsData, categoriesData] = await Promise.all([
          getBooks(),
          getAccounts(),
          getAllBorrowsLMS(),
          getCategories().catch(() => categories)
        ]);
        if (!mounted) return;
        const normalizedBooks = (booksData || []).map(normalizeBook);
        const normalizedAccounts = (accountsData || []).map(normalizeAccount);
        const normalizedBorrows = (borrowsData || []).map(normalizeBorrow).map(b => ({
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
    };
    fetchData();
    return () => { mounted = false; };
  }, [user, memberNotes]);

  useEffect(() => {
    localStorage.setItem('memberNotes', JSON.stringify(memberNotes));
  }, [memberNotes]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const refreshBooks = useCallback(async () => {
    try {
      const booksData = await getBooks();
      setBooks((booksData || []).map(normalizeBook));
    } catch {
      console.error('refreshBooks error');
    }
  }, []);

  const refreshBorrows = useCallback(async () => {
    try {
      const borrowsData = await getAllBorrowsLMS();
      const normalized = (borrowsData || []).map(normalizeBorrow).map(b => ({
        ...b,
        status: (b.status === 'borrowing' && isOverdue(b.dueDate)) ? 'overdue' : b.status,
      }));
      setBorrows(normalized);
    } catch {
      console.error('refreshBorrows error');
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    try {
      const accountsData = await getAccounts();
      const normalized = (accountsData || []).map(normalizeAccount);
      setAccounts(normalized);
      setMembers(mapMembersFromAccounts(normalized, borrows, memberNotes));
    } catch {
      console.error('refreshAccounts error');
    }
  }, [borrows, memberNotes]);

  const handleSendReminders = useCallback(async () => {
    setSendingReminders(true);
    try {
      const result = await sendEmailReminders();
      addToast(`📧 ${result.message}`, result.sent > 0 ? 'success' : 'info');
    } catch {
      addToast('Lỗi khi gửi email nhắc hạn!', 'error');
    } finally {
      setSendingReminders(false);
    }
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
  const saveBook = async () => {
    if (!bookForm.title.trim() || !bookForm.authorName.trim()) {
      addToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error'); return;
    }
    const payload: Partial<LiteraryWork> = {
      title: bookForm.title,
      author: { id: 'custom', name: bookForm.authorName },
      category: { id: bookForm.category },
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
        const bookId = (editingBook as any)._id || editingBook.id;
        const updated = await updateBook(bookId, payload);
        setBooks(prev => prev.map(b => b.id === editingBook.id ? normalizeBook(updated) : b));
        addToast(`✅ Đã cập nhật "${bookForm.title}"`);
      } else {
        const created = await addBook(payload);
        setBooks(prev => [normalizeBook(created), ...prev]);
        addToast(`✅ Đã thêm "${bookForm.title}"`);
      }
      setShowBookModal(false);
    } catch {
      addToast('Lỗi khi lưu sách!', 'error');
    }
  };
  const deleteBook = async (book: LiteraryWork) => {
    if (!confirm(`Xóa tác phẩm "${book.title}"?\n\nHành động này không thể hoàn tác.`)) return;
    try {
      const bookId = (book as any)._id || book.id;
      await apiDeleteBook(bookId);
      setBooks(prev => prev.filter(b => b.id !== book.id));
      addToast(`🗑️ Đã xóa "${book.title}"`, 'info');
    } catch {
      addToast('Lỗi khi xóa sách!', 'error');
    }
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
  const saveMember = async () => {
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
        setMembers(mapMembersFromAccounts(nextAccounts, borrows, { ...memberNotes, [normalized.id]: memberForm.notes }));
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
        setMembers(mapMembersFromAccounts(nextAccounts, borrows, { ...memberNotes, [normalized.id]: memberForm.notes }));
        addToast(`✅ Đã thêm thành viên "${memberForm.fullName}"`);
      }
      setShowMemberModal(false);
    } catch {
      addToast('Lỗi khi lưu thành viên!', 'error');
    }
  };
  const deleteMember = async (m: LibraryMember) => {
    if (!confirm(`Xóa thành viên "${m.fullName}"?`)) return;
    try {
      await apiDeleteAccount(m.id);
      const nextAccounts = accounts.filter(a => a.id !== m.id);
      setAccounts(nextAccounts);
      setMembers(mapMembersFromAccounts(nextAccounts, borrows, memberNotes));
      addToast(`🗑️ Đã xóa "${m.fullName}"`, 'info');
    } catch {
      addToast('Lỗi khi xóa thành viên!', 'error');
    }
  };
  const toggleMemberStatus = async (m: LibraryMember) => {
    try {
      const updated = await apiToggleAccountStatus(m.id);
      const normalized = normalizeAccount(updated);
      const nextAccounts = accounts.map(a => a.id === normalized.id ? normalized : a);
      setAccounts(nextAccounts);
      setMembers(mapMembersFromAccounts(nextAccounts, borrows, memberNotes));
      const nextStatus = normalized.status === 'active' ? '✅ Đã kích hoạt' : '⚠️ Đã tạm khóa';
      addToast(`${nextStatus} thẻ "${m.fullName}"`, normalized.status === 'active' ? 'success' : 'warning');
    } catch {
      addToast('Lỗi khi cập nhật trạng thái!', 'error');
    }
  };

  // ==================== BORROW HANDLERS ====================
  const filteredBorrows = useMemo(() => {
    let list = borrows;
    if (borrowFilter !== 'all') list = list.filter(b => b.status === borrowFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => (b.bookTitle || '').toLowerCase().includes(q) || (b.borrowerName || '').toLowerCase().includes(q) || (b.borrowerStudentId || '').toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  }, [borrows, borrowFilter, search]);

  const totalBorrowPages = Math.ceil(filteredBorrows.length / PER_PAGE);
  const paginatedBorrows = filteredBorrows.slice((borrowPage - 1) * PER_PAGE, borrowPage * PER_PAGE);

  const openBorrowModal = () => {
    setBorrowForm({ bookId: '', memberId: '', notes: '' });
    setShowBorrowModal(true);
  };
  const saveBorrow = async () => {
    const book = books.find(b => b.id === borrowForm.bookId);
    const member = members.find(m => m.id === borrowForm.memberId);
    if (!book || !member) { addToast('Vui lòng chọn sách và thành viên!', 'error'); return; }
    if ((book.available ?? 0) <= 0) { addToast('Sách này hiện đã hết!', 'error'); return; }
    if (member.cardStatus !== 'active') { addToast('Thẻ thư viện không hoạt động!', 'warning'); return; }
    try {
      const created = await createBorrowLink(member.id, book.id, 14);
      const normalized = normalizeBorrow(created);
      setBorrows(prev => [normalized, ...prev]);
      setMembers(mapMembersFromAccounts(accounts, [normalized, ...borrows], memberNotes));
      await Promise.all([refreshBooks(), refreshBorrows()]);
      setShowBorrowModal(false);
      addToast(`✅ Đã tạo phiếu mượn "${book.title}" cho ${member.fullName}`);
      setShowQR(normalized);
    } catch {
      addToast('Lỗi khi tạo phiếu mượn!', 'error');
    }
  };
  const handleReturn = async (record: BorrowRecord) => {
    const fine = isOverdue(record.dueDate) ? Math.abs(daysLeft(record.dueDate)) * 1000 : 0;
    const msg = fine > 0
      ? `Xác nhận trả sách?\nPhí phạt: ${fine.toLocaleString('vi')}đ (${Math.abs(daysLeft(record.dueDate))} ngày quá hạn)`
      : `Xác nhận trả sách "${record.bookTitle}"?`;
    if (!confirm(msg)) return;
    try {
      const updated = await returnBookLMS(record.id);
      const normalized = normalizeBorrow(updated);
      setBorrows(prev => prev.map(b => b.id === record.id ? normalized : b));
      setMembers(mapMembersFromAccounts(accounts, borrows.map(b => b.id === record.id ? normalized : b), memberNotes));
      await Promise.all([refreshBooks(), refreshBorrows()]);
      addToast(`✅ Đã trả sách "${record.bookTitle}"${fine > 0 ? ` · Phạt ${fine.toLocaleString('vi')}đ` : ''}`);
    } catch {
      addToast('Lỗi khi trả sách!', 'error');
    }
  };
  const handleQRReturn = () => {
    if (!qrInput.trim()) { addToast('Vui lòng nhập mã phiếu!', 'error'); return; }
    const record = borrows.find(b => b.id.toLowerCase() === qrInput.trim().toLowerCase() && (b.status === 'borrowing' || b.status === 'overdue'));
    if (!record) { addToast('Không tìm thấy phiếu mượn hợp lệ!', 'error'); return; }
    handleReturn(record);
    setQrInput('');
    setQrScanMode(false);
  };

  // ==================== ACCOUNT HANDLERS ====================
  const filteredAccounts = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(a => a.fullName.toLowerCase().includes(q) || a.username.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
  }, [accounts, search]);

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'librarian', status: 'active' });
    setShowAccountModal(true);
  };
  const openEditAccount = (acc: AdminUser) => {
    setEditingAccount(acc);
    setAccountForm({ username: acc.username, password: acc.password || '', fullName: acc.fullName, email: acc.email, phone: acc.phone || '', role: acc.role as any, status: acc.status });
    setShowAccountModal(true);
  };
  const saveAccount = async () => {
    if (!accountForm.username.trim() || !accountForm.fullName.trim() || !accountForm.password.trim()) {
      addToast('Vui lòng điền đầy đủ thông tin!', 'error'); return;
    }
    try {
      if (editingAccount) {
        const updated = await updateAccount(editingAccount.id, {
          username: accountForm.username,
          password: accountForm.password,
          fullName: accountForm.fullName,
          email: accountForm.email,
          phone: accountForm.phone,
          role: accountForm.role as any,
          status: accountForm.status,
          cardStatus: accountForm.status
        });
        const normalized = normalizeAccount(updated);
        const nextAccounts = accounts.map(a => a.id === normalized.id ? normalized : a);
        setAccounts(nextAccounts);
        setMembers(mapMembersFromAccounts(nextAccounts, borrows, memberNotes));
        addToast(`✅ Đã cập nhật "${accountForm.fullName}"`);
      } else {
        const created = await addAccount({
          username: accountForm.username,
          password: accountForm.password,
          fullName: accountForm.fullName,
          email: accountForm.email,
          phone: accountForm.phone,
          role: accountForm.role as any,
          status: accountForm.status,
          cardStatus: accountForm.status
        });
        const normalized = normalizeAccount(created);
        const nextAccounts = [normalized, ...accounts];
        setAccounts(nextAccounts);
        setMembers(mapMembersFromAccounts(nextAccounts, borrows, memberNotes));
        addToast(`✅ Đã thêm "${accountForm.fullName}"`);
      }
      setShowAccountModal(false);
    } catch {
      addToast('Lỗi khi lưu tài khoản!', 'error');
    }
  };
  const handleDeleteAccount = async (acc: AdminUser) => {
    if (acc.id === user.id) { addToast('Không thể xóa tài khoản đang đăng nhập!', 'error'); return; }
    if (!confirm(`Xóa tài khoản "${acc.fullName}"?`)) return;
    try {
      await apiDeleteAccount(acc.id);
      await refreshAccounts();
      addToast(`🗑️ Đã xóa "${acc.fullName}"`, 'info');
    } catch {
      addToast('Lỗi khi xóa tài khoản!', 'error');
    }
  };
  const handleToggleAccountStatus = async (acc: AdminUser) => {
    if (acc.id === user.id) { addToast('Không thể khóa tài khoản đang đăng nhập!', 'error'); return; }
    try {
      const updated = await apiToggleAccountStatus(acc.id);
      const normalized = normalizeAccount(updated);
      const nextAccounts = accounts.map(a => a.id === normalized.id ? normalized : a);
      setAccounts(nextAccounts);
      setMembers(mapMembersFromAccounts(nextAccounts, borrows, memberNotes));
      const nextLabel = normalized.status === 'active' ? '✅ Kích hoạt' : '🔒 Đã khóa';
      addToast(`${nextLabel} "${acc.fullName}"`, normalized.status === 'active' ? 'success' : 'warning');
    } catch {
      addToast('Lỗi khi cập nhật trạng thái!', 'error');
    }
  };

  // ==================== NEWS HANDLERS ====================
  const openAddNews = () => {
    setEditingNews(null);
    setNewsForm({ title: '', content: '', status: 'draft' });
    setShowNewsModal(true);
  };
  const openEditNews = (n: NewsItem) => {
    setEditingNews(n);
    setNewsForm({ title: n.title, content: n.content, status: n.status });
    setShowNewsModal(true);
  };
  const saveNews = () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      addToast('Vui lòng điền tiêu đề và nội dung!', 'error'); return;
    }
    if (editingNews) {
      setNews(prev => prev.map(n => n.id === editingNews.id ? { ...n, ...newsForm } : n));
      addToast(`✅ Đã cập nhật "${newsForm.title}"`);
    } else {
      const slug = newsForm.title.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-');
      const newItem: NewsItem = {
        id: `news-${Date.now()}`,
        title: newsForm.title, slug, content: newsForm.content,
        status: newsForm.status, createdAt: fmt(new Date()),
      };
      setNews(prev => [newItem, ...prev]);
      addToast(`✅ Đã thêm "${newsForm.title}"`);
    }
    setShowNewsModal(false);
  };
  const deleteNews = (n: NewsItem) => {
    if (!confirm(`Xóa tin "${n.title}"?`)) return;
    setNews(prev => prev.filter(x => x.id !== n.id));
    addToast(`🗑️ Đã xóa "${n.title}"`, 'info');
  };
  const toggleNewsStatus = (n: NewsItem) => {
    const next = n.status === 'published' ? 'draft' : 'published';
    setNews(prev => prev.map(x => x.id === n.id ? { ...x, status: next } : x));
    addToast(`${next === 'published' ? '✅ Đã đăng' : '📝 Chuyển nháp'} "${n.title}"`, 'info');
  };

  // ==================== RESERVATIONS ACTIONS ====================
  const handleConfirmReservation = async (reservation: any) => {
    const pickupDaysStr = prompt('Số ngày giữ sách (ví dụ: 3):', '3');
    if (!pickupDaysStr) return;
    const pickupDays = parseInt(pickupDaysStr) || 3;

    try {
      await confirmReservation(reservation._id, pickupDays);
      addToast('✅ Đã xác nhận đặt trước', 'success');
      // Refresh list
      getAllReservations(reservationFilter || undefined).then(setReservations);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi xác nhận', 'error');
    }
  };

  const handleCancelReservation = async (reservation: any) => {
    const reason = prompt('Lý do hủy:');
    if (!reason) return;

    try {
      await apiCancelReservation(reservation._id, reason);
      addToast('❌ Đã hủy đặt trước', 'info');
      getAllReservations(reservationFilter || undefined).then(setReservations);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi khi hủy', 'error');
    }
  };

  const handleMarkPickedUp = async (reservation: any) => {
    if (!confirm('Xác nhận độc giả đã đến nhận sách?')) return;

    try {
      await markReservationPickedUp(reservation._id);
      addToast('📚 Đã đánh dấu đã nhận sách', 'success');
      getAllReservations(reservationFilter || undefined).then(setReservations);
      fetchBorrows(); // Also refresh borrows
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi thực hiện', 'error');
    }
  };

  const fetchBorrows = async () => {
    try {
      const data = await getAllBorrowsLMS();
      setBorrows(data || []);
    } catch (err) {
      console.error('Error fetching borrows:', err);
    }
  };

  // ==================== DASHBOARD DATA ====================
  const overdueBorrows = borrows.filter(b => b.status === 'overdue').length;
  const activeBorrows = borrows.filter(b => b.status === 'borrowing').length;
  const totalBorrows = borrows.length;
  const returnedBorrows = borrows.filter(b => b.status === 'returned').length;
  const availableBooks = books.reduce((s, b) => s + (b.available ?? 0), 0);
  const totalBooksQty = books.reduce((s, b) => s + (b.quantity ?? 0), 0);
  const activeMembers = members.filter(m => m.cardStatus === 'active').length;

  const monthlyData = useMemo(() => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months.map((label, idx) => ({
      label,
      borrow: borrows.filter(b => new Date(b.borrowDate).getMonth() === idx).length,
      return: borrows.filter(b => b.returnDate && new Date(b.returnDate).getMonth() === idx).length,
    }));
  }, [borrows]);

  const topBooks = useMemo(() =>
    [...books].sort((a, b) => (b.borrowCount || 0) - (a.borrowCount || 0)).slice(0, 5),
    [books]
  );

  const categoryStats = useMemo(() => {
    const catMap: Record<string, number> = {};
    books.forEach(b => { catMap[b.category as any] = (catMap[b.category as any] || 0) + 1; });
    const colors = ['#A52422', '#2D6A4F', '#3A7CA5', '#C5973E', '#6B4226', '#40916C', '#5A9EC4', '#D4A856'];
    return Object.entries(catMap).slice(0, 5).map(([cat, count], i) => ({
      label: getCategoryName(cat as any),
      value: count,
      color: colors[i % colors.length],
    }));
  }, [books]);

  const recentBorrows = useMemo(() =>
    [...borrows].sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()).slice(0, 5),
    [borrows]
  );

  // ==================== SIDEBAR ====================
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Tổng quan', icon: <LayoutDashboard size={18} />, color: '#5A9EC4', always: true, badge: 0 },
    { id: 'books' as ActiveTab, label: 'Quản lý Sách', icon: <Library size={18} />, color: '#A52422', always: true, badge: 0 },
    { id: 'members' as ActiveTab, label: 'Thành viên', icon: <Users size={18} />, color: '#2D6A4F', always: true, badge: 0 },
    { id: 'borrows' as ActiveTab, label: 'Mượn / Trả', icon: <ClipboardList size={18} />, color: '#3A7CA5', always: true, badge: overdueBorrows },
    { id: 'news' as ActiveTab, label: 'Tin tức', icon: <Newspaper size={18} />, color: '#C5973E', always: true, badge: 0 },
    { id: 'reservations' as ActiveTab, label: 'Đặt trước', icon: <BookMarked size={18} />, color: '#0ea5e9', always: true, badge: reservations.filter(r => r.status === 'pending').length },
    { id: 'accounts' as ActiveTab, label: 'Tài khoản', icon: <UserCog size={18} />, color: '#7C3AED', always: false, badge: 0 },
    { id: 'logs' as ActiveTab, label: 'Nhật ký', icon: <Activity size={18} />, color: '#6B4226', always: false, badge: 0 },
  ].filter(item => item.always || user.role === 'admin');

  const tabTitle = navItems.find(n => n.id === activeTab)?.label ?? '';

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#F0F2F5' }}>
      <ToastContainer toasts={toasts} />

      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-[70px]' : 'w-[240px]'}`}
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 50%, #0F3460 100%)', boxShadow: '4px 0 24px rgba(0,0,0,0.3)' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${sidebarCollapsed ? 'justify-center px-3' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #A52422 0%, #C5973E 100%)' }}>
            <BookMarked size={17} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-[13px] leading-tight tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>Thư Viện</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Văn Học Việt Nam</p>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* User info */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #A52422, #C5973E)' : 'linear-gradient(135deg, #3A7CA5, #2D6A4F)' }}>
                {user.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-[12px] font-semibold truncate">{user.fullName}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-white/40 text-[10px]">{user.role === 'admin' ? 'Quản trị viên' : 'Thủ thư'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-white/10 flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #A52422, #C5973E)' : 'linear-gradient(135deg, #3A7CA5, #2D6A4F)' }}>
              {user.fullName.charAt(0)}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSearch(''); setBorrowPage(1); setBookPage(1); setMemberPage(1); }}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${activeTab === item.id ? 'text-white shadow-lg' : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
              style={activeTab === item.id ? { background: `linear-gradient(135deg, ${item.color}30, ${item.color}50)`, boxShadow: `0 2px 12px ${item.color}40` } : {}}
            >
              {activeTab === item.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: item.color }} />}
              <span className="flex-shrink-0 transition-colors" style={activeTab === item.id ? { color: item.color } : {}}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-[13px] font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse bg-red-500">{item.badge}</span>
                  )}
                </>
              )}
              {sidebarCollapsed && item.badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2.5 border-t border-white/10 space-y-0.5">
          <button onClick={() => navigate('/')}
            title={sidebarCollapsed ? 'Về trang chủ' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-white/8 hover:text-white/80 transition-all text-sm ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Globe size={17} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-[13px]">Về trang chủ</span>}
          </button>
          <button onClick={handleLogout}
            title={sidebarCollapsed ? 'Đăng xuất' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut size={17} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-[13px]">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-6 py-3 flex items-center gap-4 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                {user.role === 'admin' ? '👑 Admin' : '📚 Thủ thư'}
              </span>
              <ChevronRight size={12} />
            </div>
            <h1 className="text-sm font-bold text-gray-900 truncate">{tabTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search */}
            {activeTab !== 'dashboard' && activeTab !== 'logs' && (
              <div className="relative hidden md:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={search}
                  onChange={e => { setSearch(e.target.value); setBookPage(1); setMemberPage(1); setBorrowPage(1); }}
                  placeholder={`Tìm trong ${tabTitle.toLowerCase()}...`}
                  className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-52 bg-gray-50 transition-all"
                />
              </div>
            )}

            {/* Action buttons */}
            {activeTab === 'books' && (
              <button onClick={openAddBook} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #A52422, #C5973E)' }}>
                <Plus size={14} /> Thêm sách
              </button>
            )}
            {activeTab === 'members' && (
              <button onClick={openAddMember} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                <Plus size={14} /> Thêm thành viên
              </button>
            )}
            {activeTab === 'borrows' && (
              <div className="flex items-center gap-2">
                <button onClick={openBorrowModal} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #3A7CA5, #2D6A4F)' }}>
                  <Plus size={14} /> Tạo phiếu mượn
                </button>
                <button onClick={handleSendReminders} disabled={sendingReminders}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold shadow-sm hover:shadow-md transition-all border disabled:opacity-60"
                  style={{ background: '#fff', color: '#3A7CA5', borderColor: '#3A7CA5' }}>
                  {sendingReminders ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
                  {sendingReminders ? 'Đang gửi...' : 'Gửi nhắc hạn'}
                </button>
              </div>
            )}
            {activeTab === 'news' && (
              <button onClick={openAddNews} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #C5973E, #D4A856)' }}>
                <Plus size={14} /> Thêm tin tức
              </button>
            )}
            {activeTab === 'accounts' && user.role === 'admin' && (
              <button onClick={openAddAccount} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)' }}>
                <Plus size={14} /> Thêm tài khoản
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
                <Bell size={17} />
                {overdueBorrows > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                    {overdueBorrows}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
                    <p className="font-bold text-amber-800 text-sm">🔔 Thông báo hệ thống</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {overdueBorrows > 0 ? (
                      borrows.filter(b => b.status === 'overdue').map(b => (
                        <div key={b.id} className="px-4 py-3 hover:bg-gray-50">
                          <p className="text-[12px] font-semibold text-red-600">⚠️ Quá hạn: {b.bookTitle}</p>
                          <p className="text-[11px] text-gray-500">{b.borrowerName} · {Math.abs(daysLeft(b.dueDate))} ngày</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-400 text-sm">✅ Không có thông báo mới</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer ring-2 ring-white shadow-sm"
              style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #A52422, #C5973E)' : 'linear-gradient(135deg, #3A7CA5, #2D6A4F)' }}
              title={user.fullName}>
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 overflow-auto">

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Welcome banner */}
              <div className="rounded-2xl p-5 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F3460 100%)' }}>
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C5973E, transparent)' }} />
                  <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #A52422, transparent)' }} />
                </div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={16} className="text-amber-400" />
                      <span className="text-white/60 text-[12px] font-medium">Xin chào,</span>
                    </div>
                    <h2 className="text-xl font-bold mb-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>{user.fullName}</h2>
                    <p className="text-white/50 text-[12px]">
                      {user.role === 'admin' ? '👑 Quản trị viên hệ thống' : '📚 Thủ thư'}
                      · {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    {overdueBorrows > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-[12px] font-semibold">
                        <AlertTriangle size={13} />
                        {overdueBorrows} phiếu quá hạn
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[12px] font-semibold">
                      <Activity size={13} />
                      Hệ thống hoạt động
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng tác phẩm', value: books.length, sub: `${availableBooks} bản còn sẵn`, icon: <Library size={20} />, color: '#A52422', trend: '+3 tháng này' },
                  { label: 'Thành viên', value: members.length, sub: `${activeMembers} thẻ hoạt động`, icon: <Users size={20} />, color: '#2D6A4F', trend: `+${members.filter(m => m.memberSince >= fmt(addDays(new Date(), -30))).length} tháng này` },
                  { label: 'Đang mượn', value: activeBorrows, sub: overdueBorrows > 0 ? `⚠️ ${overdueBorrows} quá hạn` : 'Tất cả đúng hạn', icon: <BookCopy size={20} />, color: '#3A7CA5', trend: `${totalBorrows} tổng phiếu` },
                  { label: 'Đã trả', value: returnedBorrows, sub: `${Math.round(returnedBorrows / Math.max(totalBorrows, 1) * 100)}% tổng phiếu`, icon: <CheckCircle2 size={20} />, color: '#40916C', trend: 'Hoàn thành tốt' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                        style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}CC)` }}>
                        {stat.icon}
                      </div>
                      <span className="text-[10px] text-gray-400 text-right leading-tight max-w-[80px]">{stat.trend}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[12px] font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Monthly Bar Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-[14px]">Thống kê Mượn/Trả theo tháng</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">Năm {new Date().getFullYear()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />Mượn</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400/60 inline-block" />Trả</span>
                    </div>
                  </div>
                  <MiniBarChart data={monthlyData} />
                </div>

                {/* Category Donut */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-[14px]">Thể loại sách</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Phân bố kho sách</p>
                  </div>
                  <DonutChart segments={categoryStats} />
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Borrowed Books */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-[14px]">Top 5 sách được mượn nhiều nhất</h3>
                    <Award size={16} className="text-amber-500" />
                  </div>
                  <div className="space-y-3">
                    {topBooks.map((book, i) => (
                      <div key={book.id} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{book.title}</p>
                          <p className="text-[10px] text-gray-400">{book.authorName}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-700">{book.borrowCount || 0}</p>
                          <p className="text-[10px] text-gray-400">lượt</p>
                        </div>
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(book.borrowCount || 0) / Math.max(topBooks[0].borrowCount || 1, 1) * 100}%`, background: book.coverColor }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Borrows */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-[14px]">Phiếu mượn gần đây</h3>
                    <button onClick={() => setActiveTab('borrows')} className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                      Xem tất cả <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {recentBorrows.map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                          style={{ background: b.status === 'overdue' ? '#EF4444' : b.status === 'returned' ? '#10B981' : '#3B82F6' }}>
                          {(b.borrowerName || '').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{b.bookTitle}</p>
                          <p className="text-[10px] text-gray-400">{b.borrowerName} · {b.borrowDate}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Stats Footer */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Tổng số bản sách', value: totalBooksQty, icon: <Package size={15} />, color: '#A52422' },
                  { label: 'Bản sách còn lại', value: availableBooks, icon: <Layers size={15} />, color: '#2D6A4F' },
                  { label: 'Tin tức đã đăng', value: news.filter(n => n.status === 'published').length, icon: <Newspaper size={15} />, color: '#C5973E' },
                  { label: 'Tài khoản nhân viên', value: accounts.filter(a => a.status === 'active').length, icon: <UserCheck size={15} />, color: '#3A7CA5' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: `${s.color}20`, color: s.color }}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{s.value}</p>
                      <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Advanced Statistics with Recharts */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3A7CA5, #2D6A4F)', color: '#fff' }}>
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Thống kê nâng cao</h3>
                    <p className="text-gray-400 text-xs">Dữ liệu mượn sách từ hệ thống · Cập nhật theo thời gian thực</p>
                  </div>
                </div>
                <BookStatsCharts />
              </div>
            </div>
          )}

          {/* ===== BOOKS TAB ===== */}
          {activeTab === 'books' && (
            <div className="space-y-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => { setBookCategoryFilter('all'); setBookPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${bookCategoryFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                  Tất cả ({books.length})
                </button>
                {categoryOptions.slice(0, 6).map(cat => (
                  <button key={cat.id} onClick={() => { setBookCategoryFilter(cat.id); setBookPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${bookCategoryFilter === cat.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    style={bookCategoryFilter === cat.id ? { background: '#A52422' } : {}}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100" style={{ background: 'linear-gradient(90deg, #FAFAFA, #F5F5F5)' }}>
                        <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tác phẩm</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tác giả</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thể loại</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Năm</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">SL / Còn</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Kệ sách</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lượt mượn</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedBooks.map(book => (
                        <tr key={book.id} className="hover:bg-gray-50/70 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-11 rounded-lg flex items-center justify-center text-base flex-shrink-0 shadow-sm border"
                                style={{ background: (book.coverColor || '#A52422') + '15', borderColor: (book.coverColor || '#A52422') + '30' }}>
                                📖
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate max-w-[180px] text-[13px]">{book.title}</p>
                                {book.isbn && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{book.isbn}</p>}
                                {book.isFeatured && (
                                  <span className="inline-block text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 mt-0.5">⭐ Nổi bật</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 text-[13px] font-medium">{book.authorName}</td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                              {getCategoryName(typeof book.category === 'string' ? book.category : (book.category as any)?.id || 'all')}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-gray-500 text-[13px]">{book.year}</td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-gray-700 font-bold text-[13px]">{book.quantity || 5}</span>
                              <span className="text-gray-300 text-xs">/</span>
                              <span className={`font-bold text-[13px] ${(book.available ?? 0) > 2 ? 'text-emerald-600' : (book.available ?? 0) > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                {book.available ?? 0}
                              </span>
                            </div>
                            <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mt-1 overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${((book.available ?? 0) / Math.max(book.quantity ?? 1, 1)) * 100}%`, background: (book.available ?? 0) > 2 ? '#10B981' : (book.available ?? 0) > 0 ? '#F59E0B' : '#EF4444' }} />
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-[12px]">
                            {book.shelfLocation ? (
                              <span className="flex items-center gap-1">
                                <MapPin size={10} className="text-gray-400" />
                                {book.shelfLocation}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-600">
                              <TrendingUp size={11} className="text-gray-400" />
                              {book.borrowCount || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewingBook(book)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Xem chi tiết">
                                <Eye size={13} />
                              </button>
                              <button onClick={() => openEditBook(book)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors" title="Sửa">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => deleteBook(book)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Xóa">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedBooks.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                          <BookOpen size={36} className="mx-auto mb-2 opacity-25" />
                          <p className="text-sm">Không tìm thấy tác phẩm nào</p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalBookPages > 1 && <Pagination current={bookPage} total={totalBookPages} onChange={setBookPage} resultText={`${(bookPage - 1) * PER_PAGE + 1}–${Math.min(bookPage * PER_PAGE, filteredBooks.length)} / ${filteredBooks.length} tác phẩm`} />}
              </div>
            </div>
          )}

          {/* ===== MEMBERS TAB ===== */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                {[
                  { v: 'all', l: 'Tất cả', c: members.length },
                  { v: 'active', l: '✅ Hoạt động', c: members.filter(m => m.cardStatus === 'active').length },
                  { v: 'suspended', l: '⚠️ Tạm khóa', c: members.filter(m => m.cardStatus === 'suspended').length },
                  { v: 'inactive', l: '🔒 Đã khóa', c: members.filter(m => m.cardStatus === 'inactive').length },
                ].map(f => (
                  <button key={f.v} onClick={() => { setMemberFilter(f.v as any); setMemberPage(1); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${memberFilter === f.v ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                    {f.l}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${memberFilter === f.v ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{f.c}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedMembers.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${m.avatarColor}, ${m.avatarColor}99)` }}>
                          {m.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-[13px]">{m.fullName}</p>
                          {m.studentId && <p className="text-[11px] text-gray-400 font-mono">{m.studentId}</p>}
                        </div>
                      </div>
                      <StatusBadge status={m.cardStatus} />
                    </div>
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-[12px] text-gray-500">
                        <Mail size={11} className="text-gray-400 flex-shrink-0" /><span className="truncate">{m.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-gray-500">
                        <Phone size={11} className="text-gray-400 flex-shrink-0" /><span>{m.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-gray-500">
                        <Calendar size={11} className="text-gray-400 flex-shrink-0" /><span>Từ {fmtDate(m.memberSince)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-gray-50">
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ color: '#2D6A4F' }}>{m.totalBorrowed}</p>
                        <p className="text-[10px] text-gray-400">Tổng mượn</p>
                      </div>
                      <div className="text-center border-l border-gray-200">
                        <p className={`text-lg font-bold ${m.currentlyBorrowing > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{m.currentlyBorrowing}</p>
                        <p className="text-[10px] text-gray-400">Đang mượn</p>
                      </div>
                    </div>
                    {m.notes && (
                      <p className="text-[11px] text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 mb-3">⚠️ {m.notes}</p>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button onClick={() => setViewingMember(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-50 text-gray-600 text-[12px] font-semibold hover:bg-gray-100 transition-colors border border-gray-200">
                        <Eye size={11} />
                      </button>
                      <button onClick={() => openEditMember(m)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-[12px] font-semibold hover:bg-blue-100 transition-colors">
                        <Pencil size={11} /> Sửa
                      </button>
                      <button onClick={() => toggleMemberStatus(m)} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[12px] font-semibold transition-colors ${m.cardStatus === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {m.cardStatus === 'active' ? <><XSquare size={11} />Khóa</> : <><CheckSquare size={11} />Mở</>}
                      </button>
                      <button onClick={() => deleteMember(m)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {paginatedMembers.length === 0 && (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <Users size={36} className="mx-auto mb-2 opacity-25" />
                    <p className="text-sm">Không tìm thấy thành viên nào</p>
                  </div>
                )}
              </div>
              {totalMemberPages > 1 && (
                <Pagination current={memberPage} total={totalMemberPages} onChange={setMemberPage} resultText={`${(memberPage - 1) * PER_PAGE + 1}–${Math.min(memberPage * PER_PAGE, filteredMembers.length)} / ${filteredMembers.length} thành viên`} />
              )}
            </div>
          )}

          {/* ===== BORROWS TAB ===== */}
          {activeTab === 'borrows' && (
            <div className="space-y-4">
              {/* QR + Filter Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {[
                    { v: 'all', l: 'Tất cả', c: borrows.length },
                    { v: 'borrowing', l: '📖 Đang mượn', c: borrows.filter(b => b.status === 'borrowing').length },
                    { v: 'overdue', l: '⚠️ Quá hạn', c: borrows.filter(b => b.status === 'overdue').length },
                    { v: 'returned', l: '✅ Đã trả', c: borrows.filter(b => b.status === 'returned').length },
                  ].map(f => (
                    <button key={f.v} onClick={() => { setBorrowFilter(f.v as any); setBorrowPage(1); }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${borrowFilter === f.v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {f.l}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${borrowFilter === f.v ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{f.c}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setQrScanMode(!qrScanMode)}
                  className={`ml-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${qrScanMode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}>
                  <QrCode size={14} /> {qrScanMode ? 'Đóng QR' : 'Quét QR trả sách'}
                </button>
              </div>

              {/* QR Scanner Panel */}
              {qrScanMode && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-purple-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 flex items-center justify-center flex-shrink-0">
                      <QrCode size={28} className="text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-[14px] mb-1">Nhập mã phiếu mượn để trả sách</h3>
                      <p className="text-[12px] text-gray-500 mb-3">Quét QR code hoặc nhập mã phiếu thủ công</p>
                      <div className="flex gap-2">
                        <input
                          type="text" value={qrInput}
                          onChange={e => setQrInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleQRReturn()}
                          placeholder="Nhập mã phiếu mượn (VD: BR-ABC123)..."
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                          autoFocus
                        />
                        <button onClick={handleQRReturn}
                          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                          style={{ background: 'linear-gradient(135deg, #7C3AED, #9333EA)' }}>
                          Xác nhận trả
                        </button>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[10px] text-gray-400 mb-2 text-center font-semibold uppercase tracking-wider">Các phiếu đang mượn</p>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {borrows.filter(b => b.status === 'borrowing' || b.status === 'overdue').slice(0, 4).map(b => (
                          <button key={b.id} onClick={() => setQrInput(b.id)}
                            className="block w-full text-left px-2 py-1 rounded-lg bg-gray-50 hover:bg-purple-50 text-[11px] font-mono text-purple-600 transition-colors border border-gray-200 hover:border-purple-200">
                            {b.id.slice(0, 14)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mã phiếu</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tác phẩm</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Người mượn</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thủ thư</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ngày mượn</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hạn trả</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paginatedBorrows.map(record => {
                        const days = daysLeft(record.dueDate);
                        return (
                          <tr key={record.id} className={`hover:bg-gray-50/70 transition-colors ${record.status === 'overdue' ? 'bg-red-50/20' : ''}`}>
                            <td className="px-5 py-3.5">
                              <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{record.id.slice(0, 14)}</span>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-gray-900 text-[13px] max-w-[150px]">
                              <p className="truncate">{record.bookTitle}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-[13px] text-gray-900 font-medium">{record.borrowerName}</p>
                              <p className="text-[11px] text-gray-400">{record.borrowerPhone}</p>
                              {record.borrowerStudentId && <p className="text-[10px] text-gray-400 font-mono">{record.borrowerStudentId}</p>}
                            </td>
                            <td className="px-4 py-3.5 text-[12px] text-gray-500">{record.librarianName}</td>
                            <td className="px-4 py-3.5 text-center text-[12px] text-gray-600">{record.borrowDate}</td>
                            <td className="px-4 py-3.5 text-center">
                              <p className={`text-[12px] font-semibold ${record.status === 'overdue' ? 'text-red-600' : record.status === 'borrowing' && days <= 3 ? 'text-amber-600' : 'text-gray-600'}`}>
                                {record.dueDate}
                              </p>
                              {record.status !== 'returned' && (
                                <p className={`text-[10px] font-semibold ${days < 0 ? 'text-red-500' : days === 0 ? '⚡ Hôm nay' : `Còn ${days} ngày`}`}>
                                  {days < 0 ? `Quá ${Math.abs(days)} ngày` : days === 0 ? '⚡ Hôm nay' : `Còn ${days} ngày`}
                                </p>
                              )}
                              {record.status === 'overdue' && (record.fineAmount ?? 0) > 0 && (
                                <p className="text-[10px] text-red-500 font-bold">Phạt: {(record.fineAmount ?? 0).toLocaleString('vi')}đ</p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center"><StatusBadge status={record.status} /></td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => setShowQR(record)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors" title="Xem QR">
                                  <QrCode size={13} />
                                </button>
                                {(record.status === 'borrowing' || record.status === 'overdue') && (
                                  <button onClick={() => handleReturn(record)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-sm"
                                    style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                                    <RefreshCw size={11} /> Trả
                                  </button>
                                )}
                                {record.status === 'returned' && (
                                  <div className="text-center">
                                    <p className="text-[11px] text-emerald-600 font-semibold">✅ {record.returnDate}</p>
                                    {(record.fineAmount ?? 0) > 0 && <p className="text-[10px] text-red-500">Phạt: {(record.fineAmount ?? 0).toLocaleString('vi')}đ</p>}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedBorrows.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                          <BookCopy size={36} className="mx-auto mb-2 opacity-25" />
                          <p className="text-sm">Không có phiếu mượn nào</p>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalBorrowPages > 1 && <Pagination current={borrowPage} total={totalBorrowPages} onChange={setBorrowPage} resultText={`${(borrowPage - 1) * PER_PAGE + 1}–${Math.min(borrowPage * PER_PAGE, filteredBorrows.length)} / ${filteredBorrows.length} phiếu`} />}
              </div>
            </div>
          )}

          {/* ===== NEWS TAB ===== */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {news.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="h-2" style={{ background: item.status === 'published' ? 'linear-gradient(90deg, #2D6A4F, #40916C)' : 'linear-gradient(90deg, #9CA3AF, #D1D5DB)' }} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <StatusBadge status={item.status} />
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar size={10} /> {fmtDate(item.createdAt)}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-[14px] mb-2 line-clamp-2 leading-snug" style={{ fontFamily: 'Playfair Display, serif' }}>{item.title}</h3>
                      <p className="text-[12px] text-gray-500 line-clamp-3 mb-4 leading-relaxed">{item.content}</p>
                      <div className="pt-3 border-t border-gray-100 flex gap-2">
                        <button onClick={() => openEditNews(item)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-[12px] font-semibold hover:bg-blue-100 transition-colors">
                          <Pencil size={11} /> Sửa
                        </button>
                        <button onClick={() => toggleNewsStatus(item)}
                          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[12px] font-semibold transition-colors ${item.status === 'published' ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                          {item.status === 'published' ? <><FileText size={11} />Nháp</> : <><Globe size={11} />Đăng</>}
                        </button>
                        <button onClick={() => deleteNews(item)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {news.length === 0 && (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <Newspaper size={36} className="mx-auto mb-2 opacity-25" />
                    <p className="text-sm">Chưa có tin tức nào</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== ACCOUNTS TAB ===== */}
          {activeTab === 'accounts' && user.role === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAccounts.map(acc => (
                <div key={acc.id} className={`bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all ${acc.id === user.id ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-sm ring-2 ring-white"
                        style={{ background: acc.role === 'admin' ? 'linear-gradient(135deg, #A52422, #C5973E)' : 'linear-gradient(135deg, #3A7CA5, #2D6A4F)' }}>
                        {acc.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 text-[13px]">{acc.fullName}</p>
                          {acc.id === user.id && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold border border-blue-200">Bạn</span>}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">@{acc.username}</p>
                      </div>
                    </div>
                    <StatusBadge status={acc.status} />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${acc.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {acc.role === 'admin' ? '👑 Quản trị viên' : '📚 Thủ thư'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-500"><Mail size={11} className="text-gray-400" /><span className="truncate">{acc.email}</span></div>
                    {acc.phone && <div className="flex items-center gap-2 text-[12px] text-gray-500"><Phone size={11} className="text-gray-400" /><span>{acc.phone}</span></div>}
                    <div className="flex items-center gap-2 text-[12px] text-gray-500"><Calendar size={11} className="text-gray-400" /><span>Tạo: {fmtDate(acc.createdAt)}</span></div>
                  </div>

                  {/* Permissions */}
                  <div className="p-3 rounded-xl mb-4 bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quyền hạn</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: 'Quản lý sách', allowed: true },
                        { label: 'Thành viên', allowed: true },
                        { label: 'Mượn / Trả', allowed: true },
                        { label: 'Tin tức', allowed: true },
                        { label: 'Tài khoản', allowed: acc.role === 'admin' },
                        { label: 'Nhật ký', allowed: acc.role === 'admin' },
                      ].map(p => (
                        <div key={p.label} className="flex items-center gap-1.5">
                          {p.allowed ? <Check size={11} className="text-emerald-500 flex-shrink-0" /> : <X size={11} className="text-gray-300 flex-shrink-0" />}
                          <span className={`text-[11px] ${p.allowed ? 'text-gray-700' : 'text-gray-300'}`}>{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <KeyRound size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] text-gray-500 flex-1 font-mono">{showPasswords[acc.id] ? acc.password : '••••••••'}</span>
                    <button onClick={() => setShowPasswords(p => ({ ...p, [acc.id]: !p[acc.id] }))} className="text-gray-400 hover:text-gray-600 transition-colors">
                      {showPasswords[acc.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => openEditAccount(acc)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-[12px] font-semibold hover:bg-blue-100 transition-colors">
                      <Pencil size={11} /> Sửa
                    </button>
                    <button onClick={() => handleToggleAccountStatus(acc)} disabled={acc.id === user.id}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${acc.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {acc.status === 'active' ? <><X size={11} />Khóa</> : <><Check size={11} />Mở</>}
                    </button>
                    <button onClick={() => handleDeleteAccount(acc)} disabled={acc.id === user.id}
                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredAccounts.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <UserCog size={36} className="mx-auto mb-2 opacity-25" />
                  <p className="text-sm">Không tìm thấy tài khoản nào</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'accounts' && user.role === 'librarian' && <AccessDenied />}

          {/* ===== RESERVATIONS TAB ===== */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {['', 'pending', 'confirmed', 'picked_up', 'cancelled', 'expired'].map(status => (
                  <button
                    key={status}
                    onClick={() => setReservationFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all ${reservationFilter === status ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >
                    {status === '' ? 'Tất cả' :
                      status === 'pending' ? 'Chờ duyệt' :
                        status === 'confirmed' ? 'Đã xác nhận' :
                          status === 'picked_up' ? 'Đã nhận' :
                            status === 'cancelled' ? 'Đã hủy' : 'Quá hạn'}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100" style={{ background: 'linear-gradient(90deg, #FAFAFA, #F5F5F5)' }}>
                        <th className="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Độc giả</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sách đặt</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ngày gửi</th>
                        <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hạn nhận</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-center px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reservations.length > 0 ? (
                        reservations.map(res => (
                          <tr key={res._id} className="hover:bg-gray-50/70 transition-colors group">
                            <td className="px-5 py-3.5">
                              <p className="font-bold text-gray-900 leading-tight">{res.user?.fullName || 'N/A'}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{res.user?.email || res.user?.username}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-gray-800 leading-tight truncate max-w-[200px]">{res.book?.title || 'N/A'}</p>
                              <p className="text-[11px] text-sky-600 mt-0.5 font-sans italic">{res.book?.shelfLocation || 'Kệ trống'}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 text-gray-500 text-[12px]">
                                <Calendar size={12} className="text-gray-400" />
                                {fmtDateTime(res.requestDate)}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {res.pickupDeadline ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[12px]">
                                  <Clock size={12} />
                                  {fmtDate(res.pickupDeadline)}
                                </div>
                              ) : <span className="text-gray-300 text-[11px] italic">Chưa chốt</span>}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <StatusBadge status={res.status} />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                {res.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmReservation(res)}
                                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                      title="Xác nhận"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleCancelReservation(res)}
                                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                      title="Hủy"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                )}
                                {res.status === 'confirmed' && (
                                  <>
                                    <button
                                      onClick={() => handleMarkPickedUp(res)}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-600 font-bold text-[11px] hover:bg-sky-100 transition-colors"
                                    >
                                      <BookOpen size={12} /> Nhận sách
                                    </button>
                                    <button
                                      onClick={() => handleCancelReservation(res)}
                                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors ml-1"
                                      title="Hủy"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                )}
                                {(res.status === 'picked_up' || res.status === 'cancelled' || res.status === 'expired') && (
                                  <span className="text-gray-300 text-[11px] font-sans">Đã đóng</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                            <BookMarked size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Không có yêu cầu đặt trước nào</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== LOGS TAB ===== */}
          {activeTab === 'logs' && user.role === 'admin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
                style={{ background: 'linear-gradient(90deg, #FAFAFA, #F5F5F5)' }}>
                <div>
                  <h3 className="font-bold text-gray-900 text-[14px]">Nhật ký hoạt động hệ thống</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Theo dõi mọi thao tác · {logs.length} bản ghi</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                  <Activity size={12} /> Live
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {logs.map(log => (
                  <div key={log.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-start gap-4 group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${log.action.includes('CREATE') || log.action.includes('ADD') ? 'bg-emerald-50 text-emerald-600' :
                      log.action.includes('DELETE') ? 'bg-red-50 text-red-600' :
                        log.action.includes('RETURN') ? 'bg-blue-50 text-blue-600' :
                          log.action.includes('LOGIN') ? 'bg-purple-50 text-purple-600' :
                            'bg-amber-50 text-amber-600'
                      }`}>
                      {log.action.includes('BORROW') || log.action.includes('RETURN') ? <BookOpen size={15} /> :
                        log.action.includes('MEMBER') ? <Users size={15} /> :
                          log.action.includes('BOOK') ? <Library size={15} /> :
                            log.action.includes('LOGIN') ? <Shield size={15} /> :
                              <Activity size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[13px] font-semibold text-gray-900">{log.userFullName}</span>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-lg border border-gray-200">{log.action}</span>
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">{log.entity}</span>
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{log.details}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-gray-400 font-medium">{fmtDateTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'logs' && user.role === 'librarian' && <AccessDenied />}
        </main>
      </div>

      {/* ===== MODALS ===== */}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-80 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1A1A2E, #0F3460)' }}>
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-white" />
                <h3 className="font-bold text-white text-[13px]">Mã QR Phiếu Mượn</h3>
              </div>
              <button onClick={() => setShowQR(null)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
                <X size={14} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4">
              <QRCodeDisplay value={showQR.id} size={160} />
              <div className="text-center">
                <p className="font-mono text-[13px] font-bold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{showQR.id}</p>
                <p className="text-[12px] font-semibold text-gray-700 mt-2">{showQR.bookTitle}</p>
                <p className="text-[11px] text-gray-500">{showQR.borrowerName} · Hạn: {showQR.dueDate}</p>
              </div>
              <div className="flex gap-2 w-full">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[12px] font-semibold hover:bg-gray-200 transition-colors border border-gray-200">
                  <Printer size={13} /> In phiếu
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-[12px] font-semibold"
                  style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                  <Download size={13} /> Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {viewingBook && (
        <Modal title={`Chi tiết: ${viewingBook.title}`} onClose={() => setViewingBook(null)} headerColor="#1A1A2E">
          <div className="p-6 space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 shadow-md py-5"
                style={{ background: `linear-gradient(135deg, ${(viewingBook.coverColor || '#A52422')}15, ${(viewingBook.coverColor || '#A52422')}30)`, border: `1px solid ${(viewingBook.coverColor || '#A52422')}30` }}>📖</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-[16px] leading-snug" style={{ fontFamily: 'Playfair Display, serif' }}>{viewingBook.title}</h3>
                <p className="text-gray-500 text-[13px] mt-0.5">{viewingBook.authorName} · {viewingBook.year}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                  {getCategoryName(typeof viewingBook.category === 'string' ? viewingBook.category : (viewingBook.category as any)?.id || 'all')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'NXB', value: viewingBook.publisher || 'N/A' },
                { label: 'ISBN', value: viewingBook.isbn || 'N/A' },
                { label: 'Kệ sách', value: viewingBook.shelfLocation || 'N/A' },
                { label: 'Lượt mượn', value: `${viewingBook.borrowCount || 0} lần` },
                { label: 'Số lượng', value: String(viewingBook.quantity || 0) },
                { label: 'Còn lại', value: String(viewingBook.available ?? 0) },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-[13px] font-semibold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tóm tắt</p>
              <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-4">{viewingBook.summary}</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setViewingBook(null); openEditBook(viewingBook); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-[13px] font-semibold hover:bg-amber-100 border border-amber-200">
                <Pencil size={13} /> Sửa thông tin
              </button>
              <button onClick={() => setViewingBook(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Member Detail Modal */}
      {viewingMember && (
        <Modal title={`Thành viên: ${viewingMember.fullName}`} onClose={() => setViewingMember(null)} headerColor="#2D6A4F">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${viewingMember.avatarColor}, ${viewingMember.avatarColor}CC)` }}>
                {viewingMember.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[16px]">{viewingMember.fullName}</h3>
                {viewingMember.studentId && <p className="font-mono text-[12px] text-gray-400">{viewingMember.studentId}</p>}
                <StatusBadge status={viewingMember.cardStatus} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Email', value: viewingMember.email },
                { label: 'Điện thoại', value: viewingMember.phone },
                { label: 'Ngày đăng ký', value: fmtDate(viewingMember.memberSince) },
                { label: 'Tổng đã mượn', value: `${viewingMember.totalBorrowed} cuốn` },
                { label: 'Đang mượn', value: `${viewingMember.currentlyBorrowing} cuốn` },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-[13px] font-semibold text-gray-800 mt-0.5 truncate">{item.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Lịch sử mượn sách</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {borrows.filter(b => b.userId === viewingMember.id).slice(0, 6).map(b => (
                  <div key={b.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 border border-gray-100">
                    <StatusBadge status={b.status} />
                    <p className="text-[12px] text-gray-700 font-medium flex-1 truncate">{b.bookTitle}</p>
                    <p className="text-[11px] text-gray-400 flex-shrink-0">{b.borrowDate}</p>
                  </div>
                ))}
                {borrows.filter(b => b.userId === viewingMember.id).length === 0 && (
                  <p className="text-[12px] text-gray-400 text-center py-3">Chưa có lịch sử mượn</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setViewingMember(null); openEditMember(viewingMember); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[13px] font-semibold hover:bg-blue-100 border border-blue-200">
                <Pencil size={13} /> Sửa
              </button>
              <button onClick={() => setViewingMember(null)} className="px-4 py-2 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Book Add/Edit Modal */}
      {showBookModal && (
        <Modal title={editingBook ? `Sửa: ${editingBook.title}` : 'Thêm tác phẩm mới'} onClose={() => setShowBookModal(false)} headerColor="#A52422" size="lg">
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><FormLabel required>Tên tác phẩm</FormLabel><FormInput value={bookForm.title} onChange={v => setBookForm(p => ({ ...p, title: v }))} placeholder="Ví dụ: Truyện Kiều" /></div>
              <div><FormLabel required>Tác giả</FormLabel><FormInput value={bookForm.authorName} onChange={v => setBookForm(p => ({ ...p, authorName: v }))} placeholder="Nguyễn Du" /></div>
              <div>
                <FormLabel>Thể loại</FormLabel>
                <select value={bookForm.category} onChange={e => setBookForm(p => ({ ...p, category: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white">
                  {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div><FormLabel>Năm xuất bản</FormLabel><FormInput value={bookForm.year} onChange={v => setBookForm(p => ({ ...p, year: v }))} placeholder="2024" /></div>
              <div><FormLabel>Nhà xuất bản</FormLabel><FormInput value={bookForm.publisher} onChange={v => setBookForm(p => ({ ...p, publisher: v }))} placeholder="NXB Giáo Dục" /></div>
              <div><FormLabel>ISBN</FormLabel><FormInput value={bookForm.isbn} onChange={v => setBookForm(p => ({ ...p, isbn: v }))} placeholder="978-604-..." /></div>
              <div><FormLabel>Vị trí kệ sách</FormLabel><FormInput value={bookForm.shelfLocation} onChange={v => setBookForm(p => ({ ...p, shelfLocation: v }))} placeholder="Kệ A1 - Tầng 2" /></div>
              <div><FormLabel>Số lượng</FormLabel><input type="number" min={0} value={bookForm.quantity} onChange={e => setBookForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" /></div>
              <div><FormLabel>Còn lại</FormLabel><input type="number" min={0} max={bookForm.quantity} value={bookForm.available} onChange={e => setBookForm(p => ({ ...p, available: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" /></div>
              <div className="col-span-2"><FormLabel>Tóm tắt nội dung</FormLabel><textarea value={bookForm.summary} onChange={e => setBookForm(p => ({ ...p, summary: e.target.value }))} rows={3} placeholder="Mô tả ngắn về tác phẩm..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" /></div>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowBookModal(false)} onConfirm={saveBook} confirmLabel={editingBook ? 'Cập nhật' : 'Thêm mới'} confirmColor="#A52422" />
        </Modal>
      )}

      {/* Member Add/Edit Modal */}
      {showMemberModal && (
        <Modal title={editingMember ? `Sửa: ${editingMember.fullName}` : 'Thêm thành viên mới'} onClose={() => setShowMemberModal(false)} headerColor="#2D6A4F">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><FormLabel required>Họ và tên</FormLabel><FormInput value={memberForm.fullName} onChange={v => setMemberForm(p => ({ ...p, fullName: v }))} placeholder="Nguyễn Thị Ánh" /></div>
              <div><FormLabel required>Số điện thoại</FormLabel><FormInput value={memberForm.phone} onChange={v => setMemberForm(p => ({ ...p, phone: v }))} placeholder="0988123456" type="tel" /></div>
              <div><FormLabel>Mã sinh viên</FormLabel><FormInput value={memberForm.studentId} onChange={v => setMemberForm(p => ({ ...p, studentId: v }))} placeholder="SV20210001" /></div>
              <div className="col-span-2"><FormLabel>Email</FormLabel><FormInput value={memberForm.email} onChange={v => setMemberForm(p => ({ ...p, email: v }))} placeholder="example@gmail.com" type="email" /></div>
              <div>
                <FormLabel>Trạng thái thẻ</FormLabel>
                <select value={memberForm.cardStatus} onChange={e => setMemberForm(p => ({ ...p, cardStatus: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white">
                  <option value="active">✅ Hoạt động</option>
                  <option value="suspended">⚠️ Tạm khóa</option>
                  <option value="inactive">🔒 Đã khóa</option>
                </select>
              </div>
              <div><FormLabel>Ghi chú</FormLabel><FormInput value={memberForm.notes} onChange={v => setMemberForm(p => ({ ...p, notes: v }))} placeholder="Ghi chú..." /></div>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowMemberModal(false)} onConfirm={saveMember} confirmLabel={editingMember ? 'Cập nhật' : 'Đăng ký thẻ'} confirmColor="#2D6A4F" />
        </Modal>
      )}

      {/* Borrow Modal */}
      {showBorrowModal && (
        <Modal title="Tạo phiếu mượn sách" onClose={() => setShowBorrowModal(false)} headerColor="#3A7CA5" size="lg">
          <div className="p-6 space-y-4">
            <div>
              <FormLabel required>Chọn tác phẩm</FormLabel>
              <select value={borrowForm.bookId} onChange={e => setBorrowForm(p => ({ ...p, bookId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                <option value="">-- Chọn sách --</option>
                {books.filter(b => (b.available ?? 0) > 0).map(b => (
                  <option key={b.id} value={b.id}>{b.title} – {b.authorName} · Còn {b.available} bản</option>
                ))}
              </select>
            </div>
            <div>
              <FormLabel required>Chọn thành viên</FormLabel>
              <select value={borrowForm.memberId} onChange={e => setBorrowForm(p => ({ ...p, memberId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
                <option value="">-- Chọn thành viên --</option>
                {members.filter(m => m.cardStatus === 'active').map(m => (
                  <option key={m.id} value={m.id}>{m.fullName} {m.studentId ? `(${m.studentId})` : ''} · {m.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <FormLabel>Ghi chú</FormLabel>
              <textarea value={borrowForm.notes} onChange={e => setBorrowForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                placeholder="Tình trạng sách, ghi chú đặc biệt..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            </div>
            {borrowForm.bookId && borrowForm.memberId && (() => {
              const b = books.find(x => x.id === borrowForm.bookId);
              const m = members.find(x => x.id === borrowForm.memberId);
              if (!b || !m) return null;
              const due = fmt(addDays(new Date(), 14));
              return (
                <div className="p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 space-y-2">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5"><Zap size={12} />Xác nhận phiếu mượn</p>
                  <div className="grid grid-cols-2 gap-2 text-[12px] text-blue-800">
                    <div><span className="text-blue-500">Sách: </span><strong>{b.title}</strong></div>
                    <div><span className="text-blue-500">Người mượn: </span><strong>{m.fullName}</strong></div>
                    <div><span className="text-blue-500">Ngày mượn: </span><strong>{fmt(new Date())}</strong></div>
                    <div><span className="text-blue-500">Hạn trả: </span><strong className="text-red-600">{due}</strong></div>
                    <div><span className="text-blue-500">Thủ thư: </span><strong>{user.fullName}</strong></div>
                    <div><span className="text-blue-500">Còn lại sau: </span><strong>{(b.available ?? 1) - 1} bản</strong></div>
                  </div>
                </div>
              );
            })()}
          </div>
          <ModalFooter onCancel={() => setShowBorrowModal(false)} onConfirm={saveBorrow} confirmLabel="✅ Xác nhận mượn" confirmColor="#3A7CA5" />
        </Modal>
      )}

      {/* Account Add/Edit Modal */}
      {showAccountModal && user.role === 'admin' && (
        <Modal title={editingAccount ? `Sửa: ${editingAccount.fullName}` : 'Thêm tài khoản mới'} onClose={() => setShowAccountModal(false)} headerColor="#1A1A2E">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><FormLabel required>Tên đăng nhập</FormLabel><FormInput value={accountForm.username} onChange={v => setAccountForm(p => ({ ...p, username: v }))} placeholder="username" /></div>
              <div><FormLabel required>Mật khẩu</FormLabel><FormInput value={accountForm.password} onChange={v => setAccountForm(p => ({ ...p, password: v }))} placeholder="••••••••" /></div>
              <div className="col-span-2"><FormLabel required>Họ và tên</FormLabel><FormInput value={accountForm.fullName} onChange={v => setAccountForm(p => ({ ...p, fullName: v }))} placeholder="Nguyễn Văn A" /></div>
              <div><FormLabel>Email</FormLabel><FormInput value={accountForm.email} onChange={v => setAccountForm(p => ({ ...p, email: v }))} placeholder="email@thuvien.vn" type="email" /></div>
              <div><FormLabel>Điện thoại</FormLabel><FormInput value={accountForm.phone} onChange={v => setAccountForm(p => ({ ...p, phone: v }))} placeholder="0987654321" type="tel" /></div>
              <div>
                <FormLabel>Vai trò</FormLabel>
                <select value={accountForm.role} onChange={e => setAccountForm(p => ({ ...p, role: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                  <option value="librarian">📚 Thủ thư</option>
                  <option value="admin">👑 Quản trị viên</option>
                </select>
              </div>
              <div>
                <FormLabel>Trạng thái</FormLabel>
                <select value={accountForm.status} onChange={e => setAccountForm(p => ({ ...p, status: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white">
                  <option value="active">✅ Hoạt động</option>
                  <option value="inactive">🔒 Đã khóa</option>
                </select>
              </div>
            </div>
            <div className="p-3.5 rounded-xl text-[12px]" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="font-bold text-green-800 mb-1">📋 Phân quyền theo vai trò:</p>
              <p className="text-green-700"><strong>Thủ thư:</strong> Quản lý sách, thành viên, mượn/trả, tin tức.</p>
              <p className="text-green-700"><strong>Quản trị viên:</strong> Tất cả quyền + quản lý tài khoản + nhật ký hệ thống.</p>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowAccountModal(false)} onConfirm={saveAccount} confirmLabel={editingAccount ? 'Cập nhật' : 'Tạo tài khoản'} confirmColor="#1A1A2E" />
        </Modal>
      )}

      {/* News Add/Edit Modal */}
      {showNewsModal && (
        <Modal title={editingNews ? `Sửa: ${editingNews.title}` : 'Thêm tin tức mới'} onClose={() => setShowNewsModal(false)} headerColor="#C5973E" size="lg">
          <div className="p-6 space-y-4">
            <div><FormLabel required>Tiêu đề</FormLabel><FormInput value={newsForm.title} onChange={v => setNewsForm(p => ({ ...p, title: v }))} placeholder="Nhập tiêu đề tin tức..." /></div>
            <div>
              <FormLabel required>Nội dung</FormLabel>
              <textarea value={newsForm.content} onChange={e => setNewsForm(p => ({ ...p, content: e.target.value }))} rows={6}
                placeholder="Nhập nội dung tin tức..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            </div>
            <div>
              <FormLabel>Trạng thái</FormLabel>
              <select value={newsForm.status} onChange={e => setNewsForm(p => ({ ...p, status: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
                <option value="draft">📝 Lưu nháp</option>
                <option value="published">🌐 Đăng ngay</option>
              </select>
            </div>
          </div>
          <ModalFooter onCancel={() => setShowNewsModal(false)} onConfirm={saveNews} confirmLabel={editingNews ? 'Cập nhật' : 'Lưu tin tức'} confirmColor="#C5973E" />
        </Modal>
      )}
    </div>
  );
};

// ==================== REUSABLE UI ====================
const AccessDenied: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 text-gray-400">
    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
      <Shield size={32} className="text-amber-500" />
    </div>
    <h3 className="text-lg font-bold text-gray-600 mb-2">Không có quyền truy cập</h3>
    <p className="text-sm text-center max-w-xs text-gray-400">Chỉ Quản trị viên mới có thể xem nội dung này.</p>
  </div>
);

const Pagination: React.FC<{ current: number; total: number; onChange: (p: number) => void; resultText: string }> = ({ current, total, onChange, resultText }) => (
  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
    <p className="text-[11px] text-gray-400">{resultText}</p>
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors">
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: Math.min(total, 7) }, (_, i) => {
        const page = total <= 7 ? i + 1 : current <= 4 ? i + 1 : current >= total - 3 ? total - 6 + i : current - 3 + i;
        return (
          <button key={page} onClick={() => onChange(page)}
            className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-all ${current === page ? 'text-white shadow-sm' : 'hover:bg-gray-200 text-gray-500'}`}
            style={current === page ? { background: 'linear-gradient(135deg, #1A1A2E, #0F3460)' } : {}}>
            {page}
          </button>
        );
      })}
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition-colors">
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; headerColor?: string; size?: 'sm' | 'md' | 'lg' }> = ({ title, onClose, children, headerColor = '#1A1A2E', size = 'md' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ${size === 'lg' ? 'max-w-xl' : size === 'sm' ? 'max-w-sm' : 'max-w-lg'}`}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: headerColor }}>
        <h3 className="font-bold text-white text-[13px] font-sans">{title}</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all">
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ModalFooter: React.FC<{ onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmColor?: string }> = ({ onCancel, onConfirm, confirmLabel, confirmColor = '#2D6A4F' }) => (
  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
    <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm" style={{ background: confirmColor }}>
      <Check size={14} /> {confirmLabel}
    </button>
  </div>
);

const FormLabel: React.FC<{ required?: boolean; children: React.ReactNode }> = ({ required, children }) => (
  <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const FormInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white transition-all placeholder:text-gray-300" />
);

export default AdminDashboard;
