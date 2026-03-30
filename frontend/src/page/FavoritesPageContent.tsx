'use client';

import { useState, useEffect } from 'react';
import { getBooks, getAuthors, getFavorites, toggleFavorite as apiToggleFavorite } from '@/lib/apiClient';
import { useToast } from '@/components/ui/Toast';
import BookCard from '@/components/ui/BookCard';
import ReservationModal from '@/components/ui/ReservationModal';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

const FavoritesPageContent: React.FC = () => {
    const router = useRouter();
    const { showToast } = useToast();
    const [works_dynamic, setWorks] = useState<any[]>([]);
    const [authors_dynamic, setAuthors] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author'>('recent');
    const [reservedBook, setReservedBook] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const [booksData, authorsData, favsData] = await Promise.all([
                    getBooks(),
                    getAuthors(),
                    getFavorites()
                ]);
                setWorks(booksData);
                setAuthors(authorsData);
                setFavorites(favsData);
            } catch (error) {
                console.error("Error fetching favorites data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const removeFavorite = async (workId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await apiToggleFavorite(workId);
            const removedWork = favorites.find(f => (f._id || f.id) === workId);
            setFavorites(prev => prev.filter(f => (f._id || f.id) !== workId));

            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.favorites = response.favorites;
                localStorage.setItem('user', JSON.stringify(user));
            }

            if (removedWork) {
                showToast('success', `Đã xóa "${removedWork.title}" khỏi yêu thích`);
            }

            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error("Error removing favorite:", error);
        }
    };

    const uniqueAuthors = new Set(favorites.map(f => f.author?._id || f.authorId)).size;
    const uniqueCategories = new Set(favorites.map(f => typeof f.category === 'string' ? f.category : f.category?._id || f.category?.id)).size;

    const sortedFavorites = [...favorites].sort((a, b) => {
        const nameA = a.author?.name || a.authorName || '';
        const nameB = b.author?.name || b.authorName || '';
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi');
        if (sortBy === 'author') return nameA.localeCompare(nameB, 'vi');
        return 0;
    });

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg py-8 animate-pageSlideIn transition-colors">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-ink dark:text-parchment mb-2">
                            ❤️ Tác phẩm yêu thích
                        </h1>
                        <p className="text-ink-light dark:text-gray-400">
                            {favorites.length} tác phẩm trong danh sách của bạn
                        </p>
                    </div>
                    {favorites.length > 0 && !loading && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-ink-light dark:text-gray-400">Sắp xếp:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-ink dark:text-parchment focus:ring-2 focus:ring-gold"
                            >
                                <option value="recent">Mới thêm</option>
                                <option value="title">Tên tác phẩm</option>
                                <option value="author">Tác giả</option>
                            </select>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                ) : (
                    <>
                        {favorites.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-vermillion/10 to-gold/10 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-vermillion/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-display font-bold text-ink dark:text-parchment mb-2">Chưa có tác phẩm yêu thích</h3>
                                <button
                                    onClick={() => router.push('/thu-vien')}
                                    className="px-6 py-3 bg-gradient-to-r from-vermillion to-gold text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                                >
                                    Khám phá thư viện
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="text-2xl font-bold text-vermillion">{favorites.length}</div>
                                        <div className="text-sm text-gray-500">Tác phẩm</div>
                                    </div>
                                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="text-2xl font-bold text-emerald-600">{uniqueAuthors}</div>
                                        <div className="text-sm text-gray-500">Tác giả</div>
                                    </div>
                                    <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="text-2xl font-bold text-blue-600">{uniqueCategories}</div>
                                        <div className="text-sm text-gray-500">Thể loại</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {sortedFavorites.map((work: any, index: number) => (
                                        <div key={work._id || work.id} className="relative group">
                                            <BookCard
                                                work={work}
                                                onRead={() => router.push(`/doc/${work._id || work.id}`)}
                                                onReserve={(w: any) => setReservedBook(w)}
                                                index={index}
                                            />
                                            <button
                                                onClick={() => removeFavorite(work._id || work.id)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-dark-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-vermillion hover:text-white"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            {reservedBook && (
                <ReservationModal
                    book={reservedBook}
                    onClose={() => setReservedBook(null)}
                />
            )}
        </div>
    );
};

export default FavoritesPageContent;
