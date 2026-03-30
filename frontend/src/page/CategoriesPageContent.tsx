'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { getBooks, getCategories } from '@/lib/apiClient';
import BookCard from '@/components/ui/BookCard';
import ReservationModal from '@/components/ui/ReservationModal';
import { useRouter, useSearchParams } from 'next/navigation';

function CategoriesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCategoryFromQuery = searchParams.get('category') || null;

    const [works_dynamic, setWorks] = useState<any[]>([]);
    const [categories_dynamic, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(initialCategoryFromQuery);
    const [reservedBook, setReservedBook] = useState<any>(null);

    // Filter & Pagination state
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    useEffect(() => {
        setSelected(initialCategoryFromQuery);
    }, [initialCategoryFromQuery]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [booksData, catsData] = await Promise.all([
                    getBooks(),
                    getCategories()
                ]);
                setWorks(booksData);
                setCategories(catsData);
            } catch (error) {
                console.error("Error fetching data for categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selected]);

    const filteredCats = categories_dynamic.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredCats.length / ITEMS_PER_PAGE);
    const paginatedCats = filteredCats.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const selectedInfo = categories_dynamic.find(c => (c._id || c.id) === selected);

    const filteredWorks = selected ? works_dynamic.filter(w => {
        const wCatId = typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id;
        return wCatId === selected || (selectedInfo && (wCatId === selectedInfo.id || wCatId === selectedInfo._id));
    }) : [];

    if (!selected) {
        return (
            <div className="min-h-screen bg-parchment dark:bg-dark-bg transition-colors">
                <section className="hero-gradient pt-28 pb-16 sm:pt-36 sm:pb-20 relative overflow-hidden">
                    <div className="absolute inset-0 pattern-bg opacity-20" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fadeIn">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Grid3X3 size={16} className="text-gold" />
                                    <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold">Phân loại</span>
                                </div>
                                <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">Thể Loại Văn Học</h1>
                                <p className="text-base text-white/60 font-sans">Khám phá {categories_dynamic.length} thể loại văn học chính</p>
                            </div>

                            <div className="w-full md:w-80 group">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm thể loại..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-11 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all backdrop-blur-md"
                                    />
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-gold transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    </div>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedCats.map((cat, i) => {
                                    const catWorks = works_dynamic.filter(w => {
                                        const wCatId = typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id;
                                        return wCatId === cat.id || wCatId === cat._id;
                                    });

                                    // Vibrant gradients for fallback
                                    const vibrantGradients = [
                                        'from-blue-500 to-cyan-400',
                                        'from-purple-500 to-pink-500',
                                        'from-orange-400 to-red-500',
                                        'from-green-400 to-emerald-600',
                                        'from-indigo-500 to-purple-600',
                                        'from-rose-400 to-orange-300',
                                        'from-teal-400 to-blue-500',
                                        'from-amber-400 to-orange-500'
                                    ];

                                    return (
                                        <button
                                            key={cat._id || cat.id}
                                            onClick={() => setSelected(cat._id || cat.id)}
                                            className="group relative overflow-hidden rounded-2xl p-8 sm:p-10 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fadeInUp"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient || vibrantGradients[((currentPage - 1) * ITEMS_PER_PAGE + i) % vibrantGradients.length]} opacity-90`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                            <div className="relative">
                                                <div className="text-5xl mb-4">{cat.icon}</div>
                                                <h3 className="font-display text-2xl font-bold text-white mb-2">{cat.name}</h3>
                                                <p className="text-sm text-white/70 font-sans mb-4 leading-relaxed line-clamp-2">{cat.description}</p>
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                                                    <span className="text-sm text-white/60 font-sans">{catWorks.length} tác phẩm</span>
                                                    <span className="text-sm text-white font-sans font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Xem →</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-8">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 text-sm font-sans font-medium text-ink-light dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold hover:text-gold transition-all"
                                    >
                                        Trước
                                    </button>
                                    {Array.from({ length: totalPages }, (_, idx) => (
                                        <button
                                            key={idx + 1}
                                            onClick={() => setCurrentPage(idx + 1)}
                                            className={`w-10 h-10 rounded-xl text-sm font-sans font-bold transition-all ${currentPage === idx + 1
                                                    ? 'bg-vermillion text-white shadow-lg shadow-vermillion/20'
                                                    : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 text-ink-light dark:text-gray-400 hover:border-gold hover:text-gold'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 text-sm font-sans font-medium text-ink-light dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gold hover:text-gold transition-all"
                                    >
                                        Sau
                                    </button>
                                </div>
                            )}

                            {filteredCats.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <h3 className="text-lg font-bold text-ink dark:text-parchment">Không tìm thấy thể loại nào</h3>
                                    <p className="text-sm text-ink-light/50">Vui lòng thử từ khóa khác</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg transition-colors">
            <section className={`pt-28 pb-16 sm:pt-36 sm:pb-20 relative overflow-hidden ${selectedInfo?.gradient || 'hero-gradient'}`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 pattern-bg opacity-10" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => setSelected(null)}
                        className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-sans mb-6 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Tất cả thể loại
                    </button>
                    <div className="animate-fadeIn">
                        <div className="text-5xl mb-4">{selectedInfo?.icon}</div>
                        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-3">{selectedInfo?.name}</h1>
                        <p className="text-base text-white/70 font-sans max-w-xl">{selectedInfo?.description} · {filteredWorks.length} tác phẩm</p>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {filteredWorks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredWorks.map((work, i) => (
                            <BookCard key={work._id || work.id} work={work} onRead={() => router.push(`/doc/${work._id || work.id}`)} onReserve={(w: any) => setReservedBook(w)} index={i} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">📚</div>
                        <h3 className="font-display text-xl font-bold text-ink dark:text-parchment mb-2">Chưa có tác phẩm</h3>
                        <p className="text-sm text-ink-light/60 dark:text-gray-500 font-sans">Thể loại này đang được cập nhật</p>
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

export default function CategoriesPageContent() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-parchment dark:bg-dark-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <CategoriesContent />
        </Suspense>
    );
}
