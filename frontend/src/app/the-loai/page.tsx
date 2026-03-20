'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { getBooks, getCategories } from '@/lib/apiClient';
import BookCard from '@/components/ui/BookCard';
import ReservationModal from '@/components/ui/ReservationModal';
import { useRouter, useSearchParams } from 'next/navigation';

const CategoriesPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialCategoryFromQuery = searchParams.get('category') || null;

    const [works_dynamic, setWorks] = useState<any[]>([]);
    const [categories_dynamic, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(initialCategoryFromQuery);
    const [reservedBook, setReservedBook] = useState<any>(null);

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
                        <div className="max-w-2xl animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4">
                                <Grid3X3 size={16} className="text-gold" />
                                <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold">Phân loại</span>
                            </div>
                            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">Thể Loại Văn Học</h1>
                            <p className="text-base text-white/60 font-sans">Khám phá {categories_dynamic.length} thể loại văn học chính</p>
                        </div>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories_dynamic.map((cat, i) => {
                                const catWorks = works_dynamic.filter(w => {
                                    const wCatId = typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id;
                                    return wCatId === cat.id || wCatId === cat._id;
                                });
                                return (
                                    <button
                                        key={cat._id || cat.id}
                                        onClick={() => setSelected(cat._id || cat.id)}
                                        className="group relative overflow-hidden rounded-2xl p-8 sm:p-10 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fadeInUp"
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient || 'from-gray-700 to-gray-900'} opacity-90`} />
                                        <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-black/5" />
                                        <div className="relative">
                                            <div className="text-5xl mb-4">{cat.icon}</div>
                                            <h3 className="font-display text-2xl font-bold text-white mb-2">{cat.name}</h3>
                                            <p className="text-sm text-white/70 font-sans mb-4 leading-relaxed">{cat.description}</p>
                                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                                                <span className="text-sm text-white/60 font-sans">{catWorks.length} tác phẩm</span>
                                                <span className="text-sm text-white font-sans font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Xem →</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
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
};

export default CategoriesPage;
