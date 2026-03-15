import { useState, useEffect } from 'react';
import { LiteraryWork, Author } from '../types';
import { getBooks, getAuthors } from '../services/api';
import { categories } from '../constants/categories';
import { User, BookOpen, Heart, Clock, Award, TrendingUp, Calendar, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReadingStats {
  totalRead: number;
  totalTime: number;
  favoriteCategory: string;
  favoriteAuthor: string;
  streak: number;
  level: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [works_dynamic, setWorks] = useState<LiteraryWork[]>([]);
  const [authors_dynamic, setAuthors] = useState<Author[]>([]);
  const [favorites, setFavorites] = useState<LiteraryWork[]>([]);
  const [recentlyRead, setRecentlyRead] = useState<LiteraryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReadingStats>({
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
        .filter((w: LiteraryWork | undefined): w is LiteraryWork => !!w)
        .slice(0, 5);
      setRecentlyRead(historyWorks);

      const categoryCount: Record<string, number> = {};
      const authorCount: Record<string, number> = {};
      let totalTime = 0;

      favoriteWorks.forEach(work => {
        const catId = typeof work.category === 'string' ? work.category : work.category?.id;
        const authId = work.author?.id || work.authorId || '';
        if (catId) categoryCount[catId] = (categoryCount[catId] || 0) + 1;
        if (authId) authorCount[authId] = (authorCount[authId] || 0) + 1;
        totalTime += work.readTime || 0;
      });

      const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
      const topAuthor = Object.entries(authorCount).sort((a, b) => b[1] - a[1])[0];

      const categoryInfo = categories.find(c => c.id === topCategory?.[0]);
      const authorInfo = authors_dynamic.find(a => a.id === topAuthor?.[0]);

      let level = 'Người mới';
      if (favoriteWorks.length >= 10) level = 'Độc giả thường xuyên';
      if (favoriteWorks.length >= 20) level = 'Người yêu sách';
      if (favoriteWorks.length >= 30) level = 'Nhà phê bình';

      setStats({
        totalRead: history.length,
        totalTime,
        favoriteCategory: categoryInfo?.name || 'Chưa có',
        favoriteAuthor: authorInfo?.name || 'Chưa có',
        streak: Math.floor(Math.random() * 7) + 1,
        level
      });
    }
  }, [works_dynamic, authors_dynamic]);

  const isPoetryCategory = (work: LiteraryWork) => {
    const catId = typeof work.category === 'string' ? work.category : work.category?.id;
    const catName = (typeof work.category === 'string'
      ? categories.find(c => c.id === catId)?.name
      : work.category?.name) || '';
    return catName.toLowerCase().includes('thơ');
  };

  const achievements = [
    { id: 1, title: 'Bắt đầu hành trình', desc: 'Đọc tác phẩm đầu tiên', icon: '🚀', unlocked: stats.totalRead >= 1 },
    { id: 2, title: 'Người yêu thơ', desc: 'Yêu thích 5 tác phẩm thơ', icon: '📝', unlocked: favorites.filter(isPoetryCategory).length >= 5 },
    { id: 3, title: 'Khám phá gia', desc: 'Đọc từ 5 tác giả khác nhau', icon: '🔍', unlocked: new Set(favorites.map(f => f.author?.id || f.authorId)).size >= 5 },
    { id: 4, title: 'Độc giả chăm chỉ', desc: 'Streak 7 ngày', icon: '🔥', unlocked: stats.streak >= 7 },
    { id: 5, title: 'Sưu tập gia', desc: 'Yêu thích 10 tác phẩm', icon: '📚', unlocked: favorites.length >= 10 },
    { id: 6, title: 'Bậc thầy văn học', desc: 'Đọc toàn bộ thư viện', icon: '🏆', unlocked: stats.totalRead >= works_dynamic.length && works_dynamic.length > 0 },
  ];

  return (
    <div className="min-h-screen bg-parchment dark:bg-dark-bg py-8 animate-pageSlideIn">
      <div className="max-w-5xl mx-auto px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
            <p className="font-sans text-vermillion font-semibold text-lg">Đang chuẩn bị trang cá nhân...</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 md:p-8 mb-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-vermillion flex items-center justify-center text-white shadow-lg">
                  <User size={40} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-ink dark:text-parchment mb-1">
                    Độc giả văn học
                  </h1>
                  <p className="text-ink-light dark:text-gray-400 mb-3">
                    Thành viên từ {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 bg-gold/10 text-gold-dark rounded-full text-sm font-medium">
                      🏆 {stats.level}
                    </span>
                    <span className="px-3 py-1 bg-vermillion/10 text-vermillion rounded-full text-sm font-medium">
                      🔥 Streak: {stats.streak} ngày
                    </span>
                  </div>
                </div>
                <button className="p-3 rounded-xl bg-parchment-dark dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Settings size={20} className="text-ink-light dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 text-center shadow-md">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-jade" />
                <div className="text-2xl font-bold text-ink dark:text-parchment">{stats.totalRead}</div>
                <div className="text-xs text-gray-500">Đã đọc</div>
              </div>
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 text-center shadow-md">
                <Heart className="w-8 h-8 mx-auto mb-2 text-vermillion" />
                <div className="text-2xl font-bold text-ink dark:text-parchment">{favorites.length}</div>
                <div className="text-xs text-gray-500">Yêu thích</div>
              </div>
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 text-center shadow-md">
                <Clock className="w-8 h-8 mx-auto mb-2 text-sky" />
                <div className="text-2xl font-bold text-ink dark:text-parchment">{stats.totalTime}</div>
                <div className="text-xs text-gray-500">Phút đọc</div>
              </div>
              <div className="bg-white dark:bg-dark-card rounded-xl p-4 text-center shadow-md">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gold" />
                <div className="text-2xl font-bold text-ink dark:text-parchment">{stats.streak}</div>
                <div className="text-xs text-gray-500">Ngày liên tiếp</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                  <Award className="text-gold" /> Thành tựu
                </h2>
                <div className="space-y-3">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all ${achievement.unlocked
                        ? 'bg-gold/10'
                        : 'bg-gray-100 dark:bg-dark-surface opacity-50'
                        }`}
                    >
                      <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-ink dark:text-parchment text-sm">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-gray-500">{achievement.desc}</p>
                      </div>
                      {achievement.unlocked && (
                        <span className="text-jade text-lg">✔</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                    <Heart className="text-vermillion" /> Sở thích đọc
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thể loại yêu thích</span>
                      <span className="font-medium text-ink dark:text-parchment">{stats.favoriteCategory}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tác giả yêu thích</span>
                      <span className="font-medium text-ink dark:text-parchment">{stats.favoriteAuthor}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-display font-bold text-ink dark:text-parchment mb-4 flex items-center gap-2">
                    <Calendar className="text-sky" /> Đọc gần đây
                  </h2>
                  {recentlyRead.length > 0 ? (
                    <div className="space-y-2">
                      {recentlyRead.map(work => (
                        <button
                          key={work.id || work._id}
                          onClick={() => navigate(`/doc/${work.id || work._id}`)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-parchment-dark dark:hover:bg-dark-surface transition-colors text-left"
                        >
                          <div
                            className="w-10 h-12 rounded flex items-center justify-center text-lg relative overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: (work.coverColor || '#ccc') + '30' }}
                          >
                            {work.coverImage ? (
                              <img src={work.coverImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              "📖"
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-ink dark:text-parchment truncate">
                              {work.title}
                            </h3>
                            <p className="text-xs text-gray-500">{work.author?.name || work.authorName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Chưa có lịch sử đọc
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-vermillion to-gold rounded-2xl p-8 text-center text-white">
              <h3 className="text-2xl font-display font-bold mb-2">Tiếp tục khám phá</h3>
              <p className="opacity-90 mb-4">
                Còn {Math.max(0, works_dynamic.length - stats.totalRead)} tác phẩm đang chờ bạn
              </p>
              <button
                onClick={() => navigate('/thu-vien')}
                className="px-6 py-3 bg-white text-vermillion rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Khám phá ngay
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
