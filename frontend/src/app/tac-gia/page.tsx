'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import { getAuthors } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const AuthorsPageContent: React.FC = () => {
    const router = useRouter();
    const [authors_dynamic, setAuthors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedEra, setSelectedEra] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const authorsData = await getAuthors();
                setAuthors(authorsData || []);
            } catch (error) {
                console.error("Error fetching authors page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const AUTHORS_PER_PAGE = 8;

    const eras = ['all', ...Array.from(new Set(authors_dynamic.map(a => a.era).filter((e): e is string => !!e)))];

    const filtered = authors_dynamic.filter(a => {
        const name = a.name || '';
        const bio = a.bio || '';
        const matchSearch = !search ||
            name.toLowerCase().includes(search.toLowerCase()) ||
            bio.toLowerCase().includes(search.toLowerCase());
        const matchEra = selectedEra === 'all' || a.era === selectedEra;
        return matchSearch && matchEra;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedEra]);

    const totalPages = Math.ceil(filtered.length / AUTHORS_PER_PAGE);
    const pagedAuthors = filtered.slice((currentPage - 1) * AUTHORS_PER_PAGE, currentPage * AUTHORS_PER_PAGE);

    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
        if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg transition-colors">
            <section className="hero-gradient pt-28 pb-16 sm:pt-36 sm:pb-20 relative overflow-hidden">
                <div className="absolute inset-0 pattern-bg opacity-20" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl animate-fadeIn">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold">Danh nhân</span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                            Tác Giả Văn Học
                        </h1>
                        <p className="text-base text-white/60 font-sans">
                            {authors_dynamic.length} tác giả tiêu biểu của nền văn học Việt Nam
                        </p>
                    </div>
                    <div className="mt-8 max-w-xl animate-fadeInUp stagger-2">
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm tác giả..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-sans text-vermillion font-semibold">Đang tải tác giả...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Toolbar with Dropdown Filter */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <p className="text-sm font-sans text-ink-light dark:text-gray-400">
                                    Tìm thấy <span className="font-bold text-ink dark:text-parchment underline decoration-gold/50 decoration-2 underline-offset-4">{filtered.length}</span> tác giả tiêu biểu
                                </p>
                                {selectedEra !== 'all' && (
                                    <>
                                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />
                                        <button
                                            onClick={() => setSelectedEra('all')}
                                            className="text-xs font-sans text-vermillion hover:underline flex items-center gap-1 font-bold"
                                        >
                                            Xóa bộ lọc <ChevronRight size={12} className="rotate-180" />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs font-sans text-ink-light/60 dark:text-gray-500 whitespace-nowrap font-medium">Giai đoạn:</span>
                                <select
                                    value={selectedEra}
                                    onChange={(e) => setSelectedEra(e.target.value)}
                                    className="bg-parchment-dark dark:bg-dark-bg border-none rounded-xl px-4 py-2 text-xs font-sans font-bold text-ink dark:text-parchment focus:ring-2 focus:ring-gold/30 outline-none cursor-pointer min-w-[150px]"
                                >
                                    <option value="all">Tất cả giai đoạn</option>
                                    {eras.filter(e => e !== 'all').map(era => (
                                        <option key={era} value={era}>{era}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Main Grid Area */}
                        {filtered.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                                    {pagedAuthors.map((author, i) => {
                                        const worksCount = author.worksCount || 0;
                                        return (
                                            <button
                                                key={author._id || author.id}
                                                onClick={() => router.push(`/tac-gia/${author._id || author.id}`)}
                                                className={`group bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden text-left transition-all hover:shadow-xl hover:-translate-y-1 animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
                                            >
                                                <div className="flex h-full">
                                                    <div className="w-28 sm:w-36 bg-gradient-to-br from-parchment to-parchment-dark dark:from-dark-surface dark:to-dark-bg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                                        {author.avatar?.trim().startsWith('http') ? (
                                                            <img src={author.avatar.trim()} alt={author.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        ) : (
                                                            <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-700">
                                                                {author.avatar?.trim() || '👤'}
                                                            </span>
                                                        )}
                                                        <div className="absolute inset-0 bg-ink/5 group-hover:bg-transparent transition-colors" />
                                                    </div>
                                                    <div className="flex-1 p-5 sm:p-6 flex flex-col">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <h3 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-parchment group-hover:text-vermillion transition-colors truncate">
                                                                    {author.name}
                                                                </h3>
                                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-light/50 dark:text-gray-500 font-sans font-bold">
                                                                        <Calendar size={12} className="text-gold" />
                                                                        {author.birthYear}-{author.deathYear || '?'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-light/50 dark:text-gray-500 font-sans font-bold">
                                                                        <MapPin size={12} className="text-gold" />
                                                                        {author.region}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-shrink-0 bg-gold/10 dark:bg-gold/5 border border-gold/20 dark:border-gold/10 px-3 py-1.5 rounded-lg shadow-sm">
                                                                <span className="text-gold-dark dark:text-gold text-[9px] font-sans font-black uppercase tracking-tighter">
                                                                    {author.era}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-ink-light/60 dark:text-gray-400 font-sans leading-relaxed line-clamp-2 mt-2 mb-4 italic">
                                                            "{author.bio}"
                                                        </p>
                                                        <div className="flex items-center justify-between pt-3 border-t border-parchment-dark dark:border-dark-surface mt-auto">
                                                            <span className="flex items-center gap-1.5 text-xs text-ink-light/50 dark:text-gray-400 font-sans font-medium">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                                                {worksCount} tác phẩm
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs font-sans font-bold text-vermillion transform translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                                Chi tiết <ChevronRight size={14} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
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
                                            &lsaquo;
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
                                            &rsaquo;
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-dark-card rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                <div className="text-5xl mb-4 grayscale opacity-50">👤</div>
                                <h3 className="font-display text-xl font-bold text-ink dark:text-parchment mb-2">Không tìm thấy tác giả</h3>
                                <button
                                    onClick={() => { setSearch(''); setSelectedEra('all'); }}
                                    className="px-6 py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AuthorsPageContent;
