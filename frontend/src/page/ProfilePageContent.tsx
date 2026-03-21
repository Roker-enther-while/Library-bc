'use client';

import { useState, useEffect } from 'react';
import { getBooks, getAuthors } from '@/lib/apiClient';
import { User as UserIcon, BookOpen, Heart, Clock, Award, TrendingUp, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ProfilePageContent: React.FC = () => {
    const router = useRouter();
    const [works_dynamic, setWorks] = useState<any[]>([]);
    const [authors_dynamic, setAuthors] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [recentlyRead, setRecentlyRead] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRead: 0,
        totalTime: 0,
        favoriteCategory: '',
        favoriteAuthor: '',
        streak: 0,
        level: 'Người mới'
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [booksData, authorsData] = await Promise.all([
                    getBooks(),
                    getAuthors()
                ]);
                setWorks(booksData);
                setAuthors(authorsData);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (works_dynamic.length > 0) {
            const favoriteIds: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');
            const favoriteWorks = works_dynamic.filter(work => favoriteIds.includes(work.id || work._id || ''));
            setFavorites(favoriteWorks);

            const history: string[] = JSON.parse(localStorage.getItem('readingHistory') || '[]');
            const historyWorks = history
                .map((id: string) => works_dynamic.find(w => (w.id || w._id) === id))
                .filter((w: any): w is any => !!w)
                .slice(0, 5);
            setRecentlyRead(historyWorks);

            const categoryCount: Record<string, number> = {};
            const authorCount: Record<string, number> = {};
            let totalTime = 0;

            favoriteWorks.forEach(work => {
                const catId = typeof work.category === 'string' ? work.category : work.category?._id || work.category?.id;
                const authId = work.author?._id || work.authorId || '';
                if (catId) categoryCount[catId] = (categoryCount[catId] || 0) + 1;
                if (authId) authorCount[authId] = (authorCount[authId] || 0) + 1;
                totalTime += work.readTime || 0;
            });

            const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
            const topAuthor = Object.entries(authorCount).sort((a, b) => b[1] - a[1])[0];

            const catWork = favoriteWorks.find(w => (typeof w.category === 'string' ? w.category : w.category?._id || w.category?.id) === topCategory?.[0]);
            const favoriteCategoryName = catWork?.categoryName || (typeof catWork?.category === 'object' ? (catWork.category as any).name : catWork?.category) || 'Chưa có';

            const authorInfo = authors_dynamic.find(a => (a._id || a.id) === topAuthor?.[0]);

            let level = 'Người mới';
            if (favoriteWorks.length >= 10) level = 'Độc giả thường xuyên';
            if (favoriteWorks.length >= 20) level = 'Người yêu sách';

            setStats({
                totalRead: history.length,
                totalTime,
                favoriteCategory: favoriteCategoryName,
                favoriteAuthor: authorInfo?.name || 'Chưa có',
                streak: Math.floor(Math.random() * 7) + 1,
                level
            });
        }
    }, [works_dynamic, authors_dynamic]);

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg py-8 animate-pageSlideIn transition-colors">
            <div className="max-w-5xl mx-auto px-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-vermillion flex items-center justify-center text-white shadow-lg">
                                    <UserIcon size={40} />
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <h1 className="text-2xl md:text-3xl font-display font-bold text-ink dark:text-parchment mb-1">Độc giả văn học</h1>
                                    <p className="text-ink-light dark:text-gray-400 mb-3">Thành viên từ tháng 3 năm 2026</p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        <span className="px-3 py-1 bg-gold/10 text-gold-dark rounded-full text-xs font-semibold">🏆 {stats.level}</span>
                                        <span className="px-3 py-1 bg-vermillion/10 text-vermillion rounded-full text-xs font-semibold">🔥 Streak: {stats.streak} ngày</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { icon: <BookOpen className="text-emerald-600" />, value: stats.totalRead, label: 'Đã đọc' },
                                { icon: <Heart className="text-vermillion" />, value: favorites.length, label: 'Yêu thích' },
                                { icon: <Clock className="text-blue-600" />, value: stats.totalTime, label: 'Phút đọc' },
                                { icon: <TrendingUp className="text-gold" />, value: stats.streak, label: 'Ngày liên tiếp' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-dark-card rounded-xl p-4 text-center shadow-md">
                                    <div className="flex justify-center mb-2">{s.icon}</div>
                                    <div className="text-2xl font-bold text-ink dark:text-parchment">{s.value}</div>
                                    <div className="text-xs text-gray-500">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4">Thành tựu</h2>
                                <div className="space-y-3">
                                    {[
                                        { title: 'Bắt đầu hành trình', desc: 'Đọc tác phẩm đầu tiên', icon: '🚀', unlocked: stats.totalRead >= 1 },
                                        { title: 'Người yêu thơ', desc: 'Yêu thích 5 tác phẩm thơ', icon: '📝', unlocked: favorites.filter(f => f.categoryName?.includes('Thơ')).length >= 5 },
                                        { title: 'Sưu tập gia', desc: 'Yêu thích 10 tác phẩm', icon: '📚', unlocked: favorites.length >= 10 },
                                    ].map((a, i) => (
                                        <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${a.unlocked ? 'bg-gold/10' : 'bg-gray-100 dark:bg-dark-surface opacity-50'}`}>
                                            <span className="text-2xl">{a.icon}</span>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-sm text-ink dark:text-parchment">{a.title}</h3>
                                                <p className="text-xs text-gray-500">{a.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-lg">
                                <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                                    <Calendar className="text-sky" size={20} /> Đọc gần đây
                                </h2>
                                {recentlyRead.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentlyRead.map(work => (
                                            <button
                                                key={work._id || work.id}
                                                onClick={() => router.push(`/doc/${work._id || work.id}`)}
                                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-parchment-dark dark:hover:bg-dark-surface transition-colors text-left"
                                            >
                                                <div className="w-10 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                                    {work.coverImage ? <img src={work.coverImage} className="w-full h-full object-cover" /> : "📖"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-sm text-ink dark:text-parchment truncate">{work.title}</h3>
                                                    <p className="text-xs text-gray-500">{work.authorName || work.author?.name}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500 py-4 text-center">Chưa có lịch sử đọc</p>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfilePageContent;
