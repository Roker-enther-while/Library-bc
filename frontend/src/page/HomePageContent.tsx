'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Feather, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getBooks, getAuthors, getCategories } from '@/lib/apiClient';
import BookCard from '@/components/ui/BookCard';
import ReservationModal from '@/components/ui/ReservationModal';

const HomePageContent: React.FC = () => {
    const router = useRouter();
    const [works_dynamic, setWorks] = useState<any[]>([]);
    const [authors_dynamic, setAuthors] = useState<any[]>([]);
    const [categories_dynamic, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userFavorites, setUserFavorites] = useState<string[]>([]);
    const [reservedBook, setReservedBook] = useState<any>(null);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const [booksData, authorsData, categoriesData] = await Promise.all([
                    getBooks(),
                    getAuthors(),
                    getCategories()
                ]);
                setWorks(booksData);
                setAuthors(authorsData);
                setCategories(categoriesData);
            } catch (error) {
                console.error("Error fetching home data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-parchment">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-sans text-vermillion font-semibold">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section */}
            <section className="hero-gradient relative min-h-[85vh] flex items-center overflow-hidden">
                <div className="absolute inset-0 pattern-bg opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-parchment dark:to-dark-bg" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
                    <div className="max-w-3xl">
                        <div className="animate-fadeInUp">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="h-px w-12 bg-gold" />
                                <span className="text-gold font-sans text-xs font-semibold uppercase tracking-[0.2em]">
                                    Thư viện số
                                </span>
                            </div>
                            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight mb-6 text-shadow-gold">
                                Kho Tàng
                                <br />
                                <span className="text-gold">Văn Chương</span>
                                <br />
                                Việt Nam
                            </h1>
                        </div>
                        <div className="animate-fadeInUp stagger-2">
                            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-8 max-w-xl font-body">
                                Khám phá những kiệt tác văn học từ ngàn xưa đến nay —
                                từ Truyện Kiều của Nguyễn Du đến thơ mới của Xuân Diệu,
                                từ ca dao dân gian đến văn xuôi hiện đại.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4 animate-fadeInUp stagger-3">
                            <button
                                onClick={() => router.push('/thu-vien')}
                                className="px-7 py-3.5 bg-vermillion text-white rounded-xl font-sans font-semibold text-sm hover:bg-vermillion-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                <BookOpen size={18} />
                                Khám phá thư viện
                            </button>
                            <button
                                onClick={() => router.push('/tac-gia')}
                                className="px-7 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl font-sans font-semibold text-sm hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Users size={18} />
                                Tác giả
                            </button>
                        </div>

                        <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-6 max-w-md animate-fadeInUp stagger-4">
                            {[
                                { number: works_dynamic.length, label: 'Tác phẩm' },
                                { number: authors_dynamic.length, label: 'Tác giả' },
                                { number: categories_dynamic.length, label: 'Thể loại' },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center sm:text-left">
                                    <div className="text-2xl sm:text-3xl font-display font-bold text-gold">{stat.number}+</div>
                                    <div className="text-xs text-white/50 font-sans mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Works */}
            <section className="py-16 sm:py-24 bg-parchment dark:bg-dark-bg transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Star size={16} className="text-gold" />
                                <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold-dark">Tuyển chọn</span>
                            </div>
                            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink dark:text-parchment">
                                Tác Phẩm Nổi Bật
                            </h2>
                            <p className="text-sm text-ink-light/60 dark:text-gray-400 mt-2 font-sans">Những kiệt tác được yêu thích nhất</p>
                        </div>
                        <button
                            onClick={() => router.push('/thu-vien')}
                            className="mt-4 sm:mt-0 text-sm font-sans font-semibold text-vermillion hover:text-vermillion-dark transition-colors flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {works_dynamic
                            .filter(w => w.isFeatured)
                            .sort((a, b) => {
                                const isFavA = userFavorites.includes(a._id || a.id);
                                const isFavB = userFavorites.includes(b._id || b.id);
                                if (isFavA && !isFavB) return -1;
                                if (!isFavA && isFavB) return 1;
                                return 0;
                            })
                            .slice(0, 4)
                            .map((work, i) => (
                                <BookCard key={work._id || work.id} work={work} onRead={() => router.push(`/doc/${work._id || work.id}`)} onReserve={(w: any) => setReservedBook(w)} variant="featured" index={i} />
                            ))
                        }
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 sm:py-24 bg-white dark:bg-dark-card transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink dark:text-parchment mb-3">
                            Thể Loại Văn Học
                        </h2>
                        <p className="text-sm text-ink-light/60 dark:text-gray-400 font-sans max-w-lg mx-auto">
                            Khám phá kho tàng văn học Việt Nam qua các thể loại đa dạng
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {categories_dynamic.map((cat, i) => {
                            const count = works_dynamic.filter(w => w.category === cat.id || (typeof w.category === 'object' && w.category?.id === cat.id)).length;
                            return (
                                <button
                                    key={cat.id || cat._id}
                                    onClick={() => router.push(`/the-loai?category=${cat.id || cat._id}`)}
                                    className={`group relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient || 'from-gold-light to-gold'} opacity-90`} />
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/5" />
                                    <div className="relative">
                                        <div className="text-3xl sm:text-4xl mb-3">{cat.icon || '📚'}</div>
                                        <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-1">{cat.name}</h3>
                                        <p className="text-xs text-white/70 font-sans mb-3 line-clamp-2">{cat.description}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/50 font-sans">{count} tác phẩm</span>
                                            <ChevronRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Authors Preview */}
            <section className="py-16 sm:py-24 bg-parchment dark:bg-dark-bg transition-colors pattern-bg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Feather size={16} className="text-gold" />
                                <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold-dark">Danh nhân</span>
                            </div>
                            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink dark:text-parchment">
                                Tác Giả Tiêu Biểu
                            </h2>
                        </div>
                        <button
                            onClick={() => router.push('/tac-gia')}
                            className="mt-4 sm:mt-0 text-sm font-sans font-semibold text-vermillion hover:text-vermillion-dark transition-colors flex items-center gap-1"
                        >
                            Xem tất cả <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        {authors_dynamic.slice(0, 10).map((author, i) => {
                            const worksCount = author.worksCount || 0;
                            return (
                                <button
                                    key={author._id || author.id}
                                    onClick={() => router.push(`/tac-gia/${author._id || author.id}`)}
                                    className={`group bg-white dark:bg-dark-card rounded-2xl p-5 text-center transition-all animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
                                >
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-parchment-dark dark:bg-dark-surface flex items-center justify-center text-3xl group-hover:scale-110 transition-transform overflow-hidden">
                                        {author.avatar?.trim().startsWith('http') ? (
                                            <img src={author.avatar.trim()} alt={author.name} className="w-full h-full object-cover" />
                                        ) : (
                                            author.avatar?.trim() || '✍️'
                                        )}
                                    </div>
                                    <h3 className="font-display text-sm font-bold text-ink dark:text-parchment group-hover:text-vermillion transition-colors">
                                        {author.name}
                                    </h3>
                                    <p className="text-[11px] text-ink-light/50 dark:text-gray-500 font-sans mt-1">
                                        {author.birthYear}–{author.deathYear || '?'}
                                    </p>
                                    <p className="text-[11px] text-gold-dark font-sans mt-0.5">
                                        {worksCount} tác phẩm
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Quote Section */}
            <section className="py-20 sm:py-28 bg-ink relative overflow-hidden">
                <div className="absolute inset-0 pattern-bg opacity-10" />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-6xl text-gold/30 font-display mb-6">"</div>
                    <blockquote className="font-display text-xl sm:text-2xl lg:text-3xl text-white/90 leading-relaxed italic mb-6">
                        Trăm năm trong cõi người ta,
                        <br />
                        Chữ tài chữ mệnh khéo là ghét nhau.
                    </blockquote>
                    <div className="ornament-divider max-w-xs mx-auto mb-4">
                        <span className="text-gold text-sm">✦</span>
                    </div>
                    <p className="text-gold font-display font-semibold">Nguyễn Du</p>
                    <p className="text-white/40 text-sm font-sans mt-1">Truyện Kiều</p>
                </div>
            </section>
            {reservedBook && (
                <ReservationModal
                    book={reservedBook}
                    onClose={() => setReservedBook(null)}
                />
            )}
        </div>
    );
};

export default HomePageContent;
