'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import { getAuthors, getBooks } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const AuthorsPage: React.FC = () => {
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
                    <>
                        <div className="flex items-center gap-2 flex-wrap mb-8">
                            {eras.map(era => (
                                <button
                                    key={era}
                                    onClick={() => setSelectedEra(era)}
                                    className={`px-4 py-2 rounded-full text-xs font-sans font-medium transition-all ${selectedEra === era
                                        ? 'bg-vermillion text-white shadow-md'
                                        : 'bg-white dark:bg-dark-card text-ink-light dark:text-gray-300'
                                        }`}
                                >
                                    {era === 'all' ? 'Tất cả' : era}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filtered.map((author, i) => {
                                const worksCount = author.worksCount || 0;
                                return (
                                    <button
                                        key={author._id || author.id}
                                        onClick={() => router.push(`/tac-gia/${author._id || author.id}`)}
                                        className={`group bg-white dark:bg-dark-card rounded-2xl book-card-shadow overflow-hidden text-left animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
                                    >
                                        <div className="flex">
                                            <div className="w-28 sm:w-36 bg-gradient-to-br from-parchment to-parchment-dark dark:from-dark-surface dark:to-dark-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300 w-full h-full flex items-center justify-center">
                                                    {author.avatar?.trim().startsWith('http') ? (
                                                        <img src={author.avatar.trim()} alt={author.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        author.avatar?.trim() || '👤'
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex-1 p-5 sm:p-6">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-display text-lg sm:text-xl font-bold text-ink dark:text-parchment group-hover:text-vermillion transition-colors">
                                                            {author.name}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="flex items-center gap-1 text-xs text-ink-light/50 dark:text-gray-500 font-sans">
                                                                <Calendar size={12} />
                                                                {author.birthYear}-{author.deathYear || '?'}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-xs text-ink-light/50 dark:text-gray-500 font-sans">
                                                                <MapPin size={12} />
                                                                {author.region}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 bg-gold/10 text-gold-dark text-[10px] font-sans font-semibold rounded-full">
                                                        {author.era}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-ink-light/60 dark:text-gray-400 font-sans leading-relaxed line-clamp-2 mt-2 mb-3">
                                                    {author.bio}
                                                </p>
                                                <div className="flex items-center justify-between pt-3 border-t border-parchment-dark dark:border-dark-surface">
                                                    <span className="flex items-center gap-1 text-xs text-ink-light/50 dark:text-gray-500 font-sans">
                                                        <BookOpen size={12} />
                                                        {worksCount} tác phẩm
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs font-sans font-semibold text-vermillion opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Xem chi tiết <ChevronRight size={14} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-20">
                                <div className="text-5xl mb-4">👤</div>
                                <h3 className="font-display text-xl font-bold text-ink dark:text-parchment mb-2">Không tìm thấy tác giả</h3>
                                <p className="text-sm text-ink-light/60 dark:text-gray-500 font-sans">Thử thay đổi từ khóa tìm kiếm</p>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};

export default AuthorsPage;
