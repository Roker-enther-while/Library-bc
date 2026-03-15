import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, BookOpen, SlidersHorizontal } from 'lucide-react';
import { LiteraryWork, CategoryInfo } from '../types';
import { getBooks, searchBooks, getCategories } from '../services/api';

import BookCard from '../components/BookCard';
import ReservationModal from '../components/ReservationModal';
import { useNavigate, useLocation } from 'react-router-dom';

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearchFromQuery = queryParams.get('q') || '';

  const [works_dynamic, setWorks] = useState<LiteraryWork[]>([]);
  const [categories_dynamic, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchFromQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'publicationYear' | 'views' | 'readTime'>('views');
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const BOOKS_PER_PAGE = 12; // 3 hàng × 4 cột
  const [reservedBook, setReservedBook] = useState<any>(null);

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
      result = result.filter(w => {
        const catId = typeof w.category === 'string' ? w.category : w.category?.id;
        return catId === selectedCategory;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '', 'vi');
        case 'publicationYear':
          return Number(b.publicationYear ?? b.year ?? 0) - Number(a.publicationYear ?? a.year ?? 0);
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

  // Reset về trang 1 khi thay đổi bộ lọc / tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, sortBy]);

  const totalPages = Math.ceil(filtered.length / BOOKS_PER_PAGE);
  const pagedBooks = filtered.slice((currentPage - 1) * BOOKS_PER_PAGE, currentPage * BOOKS_PER_PAGE);

  // Tạo dãy số trang hiển thị (có dấu ... khi cần)
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="min-h-screen bg-parchment">
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
          <div className="mt-8 max-w-2xl animate-fadeInUp stagger-2">
            <div className="relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tác phẩm, tác giả..."
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:bg-white/15"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
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
                    : 'bg-white text-ink-light hover:bg-parchment-dark'
                    }`}
                >
                  Tất cả ({works_dynamic.length})
                </button>
                {categories_dynamic.map(cat => {
                  const count = works_dynamic.filter(w => {
                    const catId = typeof w.category === 'string' ? w.category : w.category?.id;
                    return catId === cat.id;
                  }).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-sans font-medium transition-all ${selectedCategory === cat.id
                        ? 'bg-vermillion text-white shadow-md'
                        : 'bg-white text-ink-light hover:bg-parchment-dark'
                        }`}
                    >
                      {cat.icon} {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-ink-light text-xs font-sans font-medium hover:bg-parchment-dark transition-all"
              >
                <SlidersHorizontal size={14} />
                Sắp xếp
              </button>
            </div>

            {showFilters && (
              <div className="mb-8 p-4 bg-white rounded-xl shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-sans text-ink-light/60 mr-2">Sắp xếp theo:</span>
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
                        ? 'bg-ink text-white'
                        : 'bg-parchment text-ink-light hover:bg-parchment-dark'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-ink-light/50 font-sans">
                {filtered.length > 0
                  ? `Hiển thị ${filtered.length} tác phẩm${search ? ` cho "${search}"` : ''}${selectedCategory !== 'all' ? ` trong ${categories_dynamic.find(c => c.id === selectedCategory)?.name || selectedCategory}` : ''}`
                  : 'Không tìm thấy tác phẩm nào'}
              </p>
            </div>

            {filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {pagedBooks.map((work, i) => (
                    <BookCard
                      key={work.id || work._id}
                      work={work}
                      onRead={() => navigate(`/doc/${work.id || work._id}`)}
                      onReserve={(w) => setReservedBook(w)}
                      index={i}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-1.5">
                    {/* Prev */}
                    <button
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      disabled={currentPage === 1}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-light hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-sans"
                    >
                      &#8249;
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-ink-light/40 text-sm">&#8230;</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => { setCurrentPage(Number(p)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-sans font-medium transition-all ${currentPage === p
                            ? 'bg-vermillion text-white shadow-md'
                            : 'text-ink-light hover:bg-white hover:shadow-sm'
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button
                      onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-light hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-sans"
                    >
                      &#8250;
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="font-display text-xl font-bold text-ink mb-2">Không tìm thấy</h3>
                <p className="text-sm text-ink-light/60 font-sans mb-6">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </p>
                <button
                  onClick={() => { setSearch(''); setSelectedCategory('all'); }}
                  className="px-6 py-2.5 bg-vermillion text-white rounded-xl text-sm font-sans font-medium hover:bg-vermillion-dark transition-colors"
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
};

export default LibraryPage;
