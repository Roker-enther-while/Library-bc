'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import { Search, X, BookOpen, SlidersHorizontal, TrendingUp, Clock } from 'lucide-react';
import { getBooks, searchBooks, getCategories } from '@/lib/apiClient';
import BookCard from '@/components/ui/BookCard';
import { LiteraryWork, CategoryInfo } from '@/types';
import ReservationModal from '@/components/ui/ReservationModal';
import { useRouter, useSearchParams } from 'next/navigation';

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchFromQuery = searchParams.get('q') || '';

    const [works_dynamic, setWorks] = useState<LiteraryWork[]>([]);
    const [allWorksForCounting, setAllWorksForCounting] = useState<LiteraryWork[]>([]);
    const [categories_dynamic, setCategories] = useState<CategoryInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearchFromQuery);
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [sortBy, setSortBy] = useState<'title' | 'publicationYear' | 'views' | 'readTime'>('views');
    const [showFilters, setShowFilters] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [yearFilter, setYearFilter] = useState<{ min: number; max: number }>({ min: 1900, max: new Date().getFullYear() });
    const [currentPage, setCurrentPage] = useState(1);
    const BOOKS_PER_PAGE = 12;
    const [reservedBook, setReservedBook] = useState<any>(null);
    const [userFavorites, setUserFavorites] = useState<string[]>([]);
    const [userBorrows, setUserBorrows] = useState<any[]>([]);


    // Autocomplete
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const cats = await getCategories();
                setCategories(cats);
            } catch (e) {
                console.error(e);
            }
        };
        fetchCats();

        const syncUserData = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserFavorites(user.favorites || []);

                    // Lấy thêm lịch sử mượn để xác định trạng thái các đối tượng Sách
                    const { getUserHistory } = await import('@/lib/apiClient');
                    const history = await getUserHistory(user.id || user._id);
                    setUserBorrows(history || []);
                } catch (e) { console.error(e); }
            }
        };

        syncUserData();
        window.addEventListener('storage', syncUserData);
        return () => window.removeEventListener('storage', syncUserData);

    }, []);

    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                const fullData = await getBooks();
                setAllWorksForCounting(fullData || []);

                let data;
                if (debouncedSearch) {
                    data = await searchBooks(debouncedSearch);
                } else {
                    data = fullData;
                }
                setWorks(data || []);
            } catch (error) {
                console.error("Error fetching library books:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
        console.log('[LIBRARY] Library initialization complete.');
    }, [debouncedSearch]);

    const filtered = useMemo(() => {
        let result = [...works_dynamic];

        if (selectedCategory !== 'all') {
            const selectedCatInfo = categories_dynamic.find(c => (c._id || c.id) === selectedCategory);
            result = result.filter(w => {
                const wCatId = typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id;
                return wCatId === selectedCategory || (selectedCatInfo && (wCatId === selectedCatInfo.id || wCatId === selectedCatInfo._id));
            });
        }

        // Filter by Year
        result = result.filter(w => {
            const y = Number(w.publicationYear || 0);
            if (!y) return true; // Keep if no year info
            return y >= yearFilter.min && y <= yearFilter.max;
        });

        result.sort((a, b) => {
            const idA = a._id || a.id;
            const idB = b._id || b.id;
            const isFavA = userFavorites.includes(idA);
            const isFavB = userFavorites.includes(idB);

            if (isFavA && !isFavB) return -1;
            if (!isFavA && isFavB) return 1;

            switch (sortBy) {
                case 'title':
                    return (a.title || '').localeCompare(b.title || '', 'vi');
                case 'publicationYear':
                    return Number(b.publicationYear || 0) - Number(a.publicationYear || 0);
                case 'views':
                    return (b.views || 0) - (a.views || 0);
                case 'readTime':
                    return (a.readTime || 0) - (b.readTime || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [works_dynamic, selectedCategory, sortBy, userFavorites, yearFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, selectedCategory, sortBy]);

    const totalPages = Math.ceil(filtered.length / BOOKS_PER_PAGE);
    const pagedBooks = filtered.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const handleQueryChange = useCallback((val: string) => {
        setSearch(val);
        setActiveIdx(-1);
        if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
        if (!val.trim()) { setSuggestions([]); return; }
        suggestDebounceRef.current = setTimeout(async () => {
            const query = val.trim();
            setSuggestLoading(true);
            try {
                const results = await searchBooks(query);
                setSuggestions((results || []).slice(0, 5));
            } catch {
                setSuggestions([]);
            } finally {
                setSuggestLoading(false);
            }
        }, 300);
    }, []);

    const pickSuggestion = (book: any) => {
        router.push(`/doc/${book._id || book.id}`);
        setSuggestions([]);
        setSearch('');
    };

    const handleReturn = async (work: any) => {
        if (!confirm(`Bạn muốn xác nhận trả cuốn sách "${work.title}"?`)) return;
        try {
            const borrow = userBorrows.find(b => (b.bookId === work.id || b.book?._id === work.id || b.book?._id === work._id) && b.status !== 'returned');
            if (!borrow) return;

            const { returnBookLMS } = await import('@/lib/apiClient');
            await returnBookLMS(borrow._id || borrow.id);
            alert('Đã gửi yêu cầu trả sách!');
            // Refresh borrow list
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const { getUserHistory } = await import('@/lib/apiClient');
                const history = await getUserHistory(user.id || user._id);
                setUserBorrows(history || []);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi trả sách');
        }
    };


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!suggestions.length) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0 && suggestions[activeIdx]) {
                e.preventDefault();
                pickSuggestion(suggestions[activeIdx]);
            } else {
                setSuggestions([]);
                setDebouncedSearch(search);
            }
        } else if (e.key === 'Escape') {
            setSuggestions([]);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSuggestions([]);
                setActiveIdx(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg transition-colors">
            <section className="hero-gradient pt-28 pb-16 sm:pt-36 sm:pb-20 relative overflow-hidden">
                <div className="absolute inset-0 pattern-bg opacity-20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen size={16} className="text-gold" />
                            <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold">Thư viện</span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                            Tủ Sách Văn Học
                        </h1>
                        <p className="text-base text-white/60 font-sans">
                            Tổng hợp {works_dynamic.length} tác phẩm văn học Việt Nam kinh điển
                        </p>
                    </div>
                    <div className="mt-8 max-w-2xl animate-fadeInUp stagger-2 relative" ref={searchRef}>
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 z-10" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => handleQueryChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tìm kiếm tác phẩm..."
                                className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:bg-white/15"
                            />
                            {suggestLoading && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2 mr-2">
                                    <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {search && (
                                <button
                                    onClick={() => { setSearch(''); setSuggestions([]); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute mt-2 w-full z-30 bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
                                {suggestions.map((book, idx) => (
                                    <button
                                        key={book._id || book.id || idx}
                                        onClick={() => pickSuggestion(book)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === activeIdx
                                            ? 'bg-gold/10 dark:bg-gold/20'
                                            : 'hover:bg-parchment dark:hover:bg-dark-card'
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden bg-vermillion/10 flex items-center justify-center">
                                            {book.coverImage
                                                ? <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
                                                : <BookOpen size={16} className="text-vermillion" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-ink dark:text-parchment truncate">{book.title}</p>
                                            <p className="text-xs text-ink-light/60 dark:text-gray-400 truncate">
                                                {book.authorName || book.author?.name || ''}
                                            </p>
                                        </div>
                                        <Search size={14} className="text-gray-300 flex-shrink-0" />
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setSuggestions([]); setDebouncedSearch(search); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gold-dark dark:text-gold font-medium hover:bg-gold/5 transition-colors"
                                >
                                    <TrendingUp size={16} />
                                    Xem kết quả tìm kiếm cho &ldquo;{search}&rdquo;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-sans text-vermillion font-semibold text-lg">Đang tải sách...</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Filters */}
                        <aside className="w-full lg:w-64 flex-shrink-0">
                            <div className="sticky top-24 space-y-8">
                                <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
                                    <h3 className="font-display text-sm font-bold text-ink dark:text-parchment uppercase tracking-wider mb-5 flex items-center gap-2 px-1">
                                        <SlidersHorizontal size={18} className="text-gold" />
                                        Thể loại
                                    </h3>

                                    <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                        {/* All Categories Button */}
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className={`relative text-left px-5 py-3.5 rounded-xl transition-all border flex items-center justify-between group ${selectedCategory === 'all'
                                                ? 'bg-vermillion border-vermillion text-white shadow-lg shadow-vermillion/20 z-10'
                                                : 'bg-parchment/30 dark:bg-dark-bg border-gray-50 dark:border-gray-800 text-ink-light dark:text-gray-400 hover:border-gold hover:text-vermillion hover:bg-white dark:hover:bg-dark-surface shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <SlidersHorizontal size={14} className={selectedCategory === 'all' ? 'text-white/70' : 'text-gold'} />
                                                <span className={`text-xs font-sans font-bold leading-tight ${selectedCategory === 'all' ? 'text-white' : 'text-ink dark:text-parchment'}`}>
                                                    Tất cả tác phẩm
                                                </span>
                                            </div>
                                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-ink-light/50 group-hover:bg-vermillion/10'}`}>
                                                {works_dynamic.length}
                                            </div>
                                        </button>

                                        {/* Individual Category Buttons */}
                                        {categories_dynamic.map(cat => {
                                            const categoryId = cat._id || cat.id;
                                            const categoryName = cat.name?.toLowerCase().trim();

                                            const count = allWorksForCounting.filter(w => {
                                                const wCatId = (typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id || '').toString().toLowerCase().trim();
                                                const wCatName = ((w as any).categoryName || '').toString().toLowerCase().trim();

                                                const targetId = categoryId.toString().toLowerCase().trim();

                                                return wCatId === targetId || (categoryName && wCatName === categoryName);
                                            }).length;

                                            if (count > 0) {
                                                // console.log(`[DEBUG] Category ${cat.name} matches ${count} books.`);
                                            }
                                            const isActive = selectedCategory === categoryId;

                                            return (
                                                <button
                                                    key={categoryId}
                                                    onClick={() => setSelectedCategory(categoryId)}
                                                    className={`group relative text-left px-5 py-3.5 rounded-xl transition-all border flex items-center justify-between gap-4 ${isActive
                                                        ? 'bg-vermillion border-vermillion text-white shadow-lg shadow-vermillion/20 z-10'
                                                        : 'bg-parchment/30 dark:bg-dark-bg border-gray-50 dark:border-gray-800 text-ink-light dark:text-gray-400 hover:border-gold hover:text-vermillion hover:bg-white dark:hover:bg-dark-surface shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : 'bg-gold'}`} />
                                                        <span className={`text-[13px] font-sans font-bold leading-snug truncate ${isActive ? 'text-white' : 'text-ink dark:text-parchment group-hover:text-vermillion'}`}>
                                                            {cat.name}
                                                        </span>
                                                    </div>
                                                    <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-ink-light/50 group-hover:bg-vermillion/10 group-hover:text-vermillion'}`}>
                                                        {count}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </aside>

                        {/* Main Content Area */}
                        <main className="flex-1 min-w-0">
                            <div className="bg-white dark:bg-dark-card rounded-2xl p-4 mb-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-sans text-ink-light dark:text-gray-400">
                                        Tìm thấy <span className="font-bold text-ink dark:text-parchment">{filtered.length}</span> kết quả
                                    </p>
                                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />
                                    {selectedCategory !== 'all' && (
                                        <button
                                            onClick={() => setSelectedCategory('all')}
                                            className="text-xs font-sans text-vermillion hover:underline flex items-center gap-1"
                                        >
                                            Xóa bộ lọc <X size={12} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-sans text-ink-light/60 dark:text-gray-500 whitespace-nowrap">Sắp xếp:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-parchment-dark dark:bg-dark-bg border-none rounded-xl px-4 py-2 text-xs font-sans font-semibold text-ink dark:text-parchment focus:ring-2 focus:ring-gold/30 outline-none cursor-pointer"
                                    >
                                        <option value="views">Phổ biến nhất</option>
                                        <option value="title">Tên tác phẩm (A-Z)</option>
                                        <option value="publicationYear">Năm sáng tác (Mới nhất)</option>
                                        <option value="readTime">Thời gian đọc (Ngắn nhất)</option>
                                    </select>
                                </div>
                            </div>

                            {filtered.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {pagedBooks.map((work, i) => {
                                            const workId = work._id || work.id;
                                            const activeBorrow = userBorrows.find(b => (b.bookId === workId || b.book?._id === workId) && b.status !== 'returned');
                                            let status: 'none' | 'borrowing' | 'overdue' = 'none';
                                            if (activeBorrow) {
                                                status = activeBorrow.status === 'overdue' ? 'overdue' : 'borrowing';
                                            }

                                            return (
                                                <BookCard
                                                    key={workId}
                                                    work={work}
                                                    onRead={() => router.push(`/doc/${workId}`)}
                                                    onReserve={(w: any) => setReservedBook(w)}
                                                    onReturn={handleReturn}
                                                    userStatus={status}
                                                    index={i}
                                                />
                                            );
                                        })}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="mt-12 flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                                disabled={currentPage === 1}
                                                className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 flex items-center justify-center text-ink-light dark:text-gray-300 disabled:opacity-30 hover:border-gold transition-colors"
                                            >
                                                &#8249;
                                            </button>
                                            <div className="flex items-center gap-1.5">
                                                {getPageNumbers().map((p, idx) =>
                                                    p === '...' ? (
                                                        <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center text-ink-light/40">...</span>
                                                    ) : (
                                                        <button
                                                            key={`page-${p}`}
                                                            onClick={() => { setCurrentPage(Number(p)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${currentPage === p
                                                                ? 'bg-vermillion text-white shadow-lg shadow-vermillion/20'
                                                                : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 text-ink-light dark:text-gray-300 hover:border-gold'
                                                                }`}
                                                        >
                                                            {p}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            <button
                                                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                                disabled={currentPage === totalPages}
                                                className="w-10 h-10 rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 flex items-center justify-center text-ink-light dark:text-gray-300 disabled:opacity-30 hover:border-gold transition-colors"
                                            >
                                                &#8250;
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-24 bg-white dark:bg-dark-card rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                    <div className="text-6xl mb-6 grayscale opacity-50">📚</div>
                                    <h3 className="font-display text-2xl font-bold text-ink dark:text-parchment mb-3">Không tìm thấy kết quả</h3>
                                    <p className="text-sm text-ink-light/60 dark:text-gray-500 font-sans mb-8">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn</p>
                                    <button
                                        onClick={() => { setSearch(''); setSelectedCategory('all'); setYearFilter({ min: 1900, max: new Date().getFullYear() }); }}
                                        className="px-8 py-3 bg-ink dark:bg-gold text-white dark:text-ink rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-lg"
                                    >
                                        Thiết lập lại tất cả
                                    </button>
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </section>

            {reservedBook && (
                <ReservationModal
                    book={reservedBook}
                    onClose={() => setReservedBook(null)}
                />
            )}
        </div>
    );
}

export default function LibraryPageContent() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <LibraryContent />
        </Suspense>
    );
}
