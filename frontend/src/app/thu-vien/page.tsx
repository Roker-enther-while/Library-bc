'use client';

import React, { useState, useMemo, useEffect, Suspense, useCallback, useRef } from 'react';
import { Search, X, BookOpen, SlidersHorizontal, TrendingUp, Clock } from 'lucide-react';
import { getBooks, searchBooks, getCategories } from '@/lib/apiClient';
import BookCard from '@/components/ui/BookCard';
import ReservationModal from '@/components/ui/ReservationModal';
import { useRouter, useSearchParams } from 'next/navigation';

function LibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchFromQuery = searchParams.get('q') || '';

    const [works_dynamic, setWorks] = useState<any[]>([]);
    const [categories_dynamic, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialSearchFromQuery);
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [sortBy, setSortBy] = useState<'title' | 'publicationYear' | 'views' | 'readTime'>('views');
    const [showFilters, setShowFilters] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const BOOKS_PER_PAGE = 12;
    const [reservedBook, setReservedBook] = useState<any>(null);
    const [userFavorites, setUserFavorites] = useState<string[]>([]);

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

        const syncFavorites = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setUserFavorites(user.favorites || []);
                } catch (e) { console.error(e); }
            }
        };

        syncFavorites();
        window.addEventListener('storage', syncFavorites);
        return () => window.removeEventListener('storage', syncFavorites);
    }, []);

    useEffect(() => {
        const fetchBooks = async () => {
            setLoading(true);
            try {
                let data;
                if (debouncedSearch) {
                    data = await searchBooks(debouncedSearch);
                } else {
                    data = await getBooks();
                }
                setWorks(data || []);
            } catch (error) {
                console.error("Error fetching library books:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBooks();
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
    }, [works_dynamic, selectedCategory, sortBy]);

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
                    <>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-full text-xs font-sans font-medium transition-all ${selectedCategory === 'all'
                                        ? 'bg-vermillion text-white shadow-md'
                                        : 'bg-white dark:bg-dark-card text-ink-light dark:text-gray-300'
                                        }`}
                                >
                                    Tất cả ({works_dynamic.length})
                                </button>
                                {categories_dynamic.map(cat => {
                                    const count = works_dynamic.filter(w => {
                                        const wCatId = typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id;
                                        return wCatId === cat.id || wCatId === cat._id;
                                    }).length;
                                    return (
                                        <button
                                            key={cat._id || cat.id}
                                            onClick={() => setSelectedCategory(cat._id || cat.id)}
                                            className={`px-4 py-2 rounded-full text-xs font-sans font-medium transition-all ${selectedCategory === (cat._id || cat.id)
                                                ? 'bg-vermillion text-white shadow-md'
                                                : 'bg-white dark:bg-dark-card text-ink-light dark:text-gray-300'
                                                }`}
                                        >
                                            {cat.icon} {cat.name} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-dark-card text-ink-light dark:text-gray-300 text-xs font-sans font-medium shadow-sm"
                            >
                                <SlidersHorizontal size={14} />
                                Sắp xếp
                            </button>
                        </div>

                        {showFilters && (
                            <div className="mb-8 p-4 bg-white dark:bg-dark-card rounded-xl shadow-sm animate-fadeIn">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-sans text-ink-light/60 dark:text-gray-400 mr-2">Sắp xếp theo:</span>
                                    {[
                                        { value: 'views', label: 'Phổ biến nhất' },
                                        { value: 'title', label: 'Tên A-Z' },
                                        { value: 'publicationYear', label: 'Mới nhất' },
                                        { value: 'readTime', label: 'Ngắn nhất' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSortBy(opt.value as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${sortBy === opt.value
                                                ? 'bg-ink dark:bg-parchment text-white dark:text-ink'
                                                : 'bg-parchment dark:bg-dark-surface text-ink-light dark:text-parchment'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <p className="text-sm text-ink-light/50 dark:text-gray-500 font-sans">
                                {filtered.length > 0
                                    ? `Hiển thị ${filtered.length} tác phẩm`
                                    : 'Không tìm thấy tác phẩm nào'}
                            </p>
                        </div>

                        {filtered.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {pagedBooks.map((work, i) => (
                                        <BookCard
                                            key={work._id || work.id}
                                            work={work}
                                            onRead={() => router.push(`/doc/${work._id || work.id}`)}
                                            onReserve={(w: any) => setReservedBook(w)}
                                            index={i}
                                        />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-10 flex items-center justify-center gap-1.5">
                                        <button
                                            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                            disabled={currentPage === 1}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-light dark:text-gray-300 disabled:opacity-30"
                                        >
                                            &#8249;
                                        </button>
                                        {getPageNumbers().map((p, idx) =>
                                            p === '...' ? (
                                                <span key={idx} className="w-9 h-9 flex items-center justify-center text-ink-light/40">...</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    onClick={() => { setCurrentPage(Number(p)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${currentPage === p
                                                        ? 'bg-vermillion text-white shadow-md'
                                                        : 'text-ink-light dark:text-gray-300 hover:bg-white dark:hover:bg-dark-card'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        )}
                                        <button
                                            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                                            disabled={currentPage === totalPages}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-light dark:text-gray-300 disabled:opacity-30"
                                        >
                                            &#8250;
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <div className="text-5xl mb-4">📚</div>
                                <h3 className="font-display text-xl font-bold text-ink dark:text-parchment mb-2">Không tìm thấy</h3>
                                <button
                                    onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                                    className="px-6 py-2.5 bg-vermillion text-white rounded-xl text-sm font-medium hover:bg-vermillion-dark"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </>
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

export default function LibraryPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <LibraryContent />
        </Suspense>
    );
}
