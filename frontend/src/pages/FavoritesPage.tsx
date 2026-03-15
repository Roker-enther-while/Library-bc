import { useState, useEffect } from 'react';
import { LiteraryWork, Author } from '../types';
import { getBooks, getAuthors } from '../services/api';
import BookCard from '../components/BookCard';
import { useNavigate } from 'react-router-dom';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [works_dynamic, setWorks] = useState<LiteraryWork[]>([]);
  const [authors_dynamic, setAuthors] = useState<Author[]>([]);
  const [favorites, setFavorites] = useState<LiteraryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'author'>('recent');

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
        console.error("Error fetching favorites data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (works_dynamic.length > 0) {
      loadFavorites();
    }
  }, [works_dynamic]);

  useEffect(() => {
    const handleStorage = () => loadFavorites();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [works_dynamic]);

  const loadFavorites = () => {
    const favoriteIds: string[] = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteWorks = works_dynamic.filter(work => favoriteIds.includes(work.id || work._id || ''));
    setFavorites(favoriteWorks);
  };

  const getAuthor = (authorId: string) => authors_dynamic.find(a => a.id === authorId);

  const sortedFavorites = [...favorites].sort((a, b) => {
    const nameA = a.author?.name || a.authorName || '';
    const nameB = b.author?.name || b.authorName || '';
    if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi');
    if (sortBy === 'author') return nameA.localeCompare(nameB, 'vi');
    return 0;
  });

  const removeFavorite = (workId: string) => {
    const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = favoriteIds.filter((id: string) => id !== workId);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    loadFavorites();
  };

  const uniqueAuthors = new Set(favorites.map(f => f.author?.id || f.authorId)).size;
  const uniqueCategories = new Set(favorites.map(f => typeof f.category === 'string' ? f.category : f.category?.id)).size;
  const modernWorks = favorites.filter(f => {
    const author = getAuthor(f.author?.id || f.authorId || '');
    return author?.era === 'Hiện đại';
  }).length;

  return (
    <div className="min-h-screen bg-parchment dark:bg-dark-bg py-8 animate-pageSlideIn">
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
                className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-transparent"
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
            <p className="font-sans text-vermillion font-semibold">Đang tải danh sách yêu thích...</p>
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
                <h3 className="text-xl font-display font-bold text-ink dark:text-parchment mb-2">
                  Chưa có tác phẩm yêu thích
                </h3>
                <p className="text-ink-light dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Khám phá thư viện và thêm các tác phẩm bạn yêu thích vào đây để dễ dàng tìm lại sau.
                </p>
                <button
                  onClick={() => navigate('/thu-vien')}
                  className="px-6 py-3 bg-gradient-to-r from-vermillion to-gold text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Khám phá thư viện
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-vermillion">{favorites.length}</div>
                    <div className="text-sm text-gray-500">Tác phẩm</div>
                  </div>
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-jade">{uniqueAuthors}</div>
                    <div className="text-sm text-gray-500">Tác giả</div>
                  </div>
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-sky">{uniqueCategories}</div>
                    <div className="text-sm text-gray-500">Thể loại</div>
                  </div>
                  <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-gold">{modernWorks}</div>
                    <div className="text-sm text-gray-500">Tác phẩm hiện đại</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sortedFavorites.map((work, index) => (
                    <div
                      key={work.id || work._id}
                      className="animate-fadeInUp relative group"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <BookCard
                        work={work}
                        onRead={() => navigate(`/doc/${work.id || work._id}`)}
                      />
                      <button
                        onClick={() => removeFavorite(work.id || work._id || '')}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-dark-card/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-vermillion hover:text-white"
                        title="Xóa khỏi yêu thích"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-12 bg-gradient-to-r from-gold/10 to-vermillion/10 dark:from-gold/20 dark:to-vermillion/20 rounded-2xl p-8 text-center">
                  <h3 className="text-xl font-display font-bold text-ink dark:text-parchment mb-2">
                    📚 Thử thách đọc sách
                  </h3>
                  <p className="text-ink-light dark:text-gray-400 mb-4">
                    Bạn đã yêu thích {favorites.length} tác phẩm. Hãy đặt mục tiêu đọc hết trong tháng này.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold to-vermillion rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (favorites.length / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-ink dark:text-parchment">
                      {favorites.length}/10
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
