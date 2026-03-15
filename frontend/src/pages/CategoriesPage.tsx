import React, { useState, useEffect } from 'react';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { LiteraryWork, CategoryInfo } from '../types';
import { getBooks, getCategories } from '../services/api';
import BookCard from '../components/BookCard';
import { useNavigate, useLocation } from 'react-router-dom';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategoryFromQuery = queryParams.get('category') || null;
  const [works_dynamic, setWorks] = useState<LiteraryWork[]>([]);
  const [categories_dynamic, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(initialCategoryFromQuery);

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
    if (initialCategoryFromQuery) setSelected(initialCategoryFromQuery);
  }, [initialCategoryFromQuery]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selected]);

  const filteredWorks = selected ? works_dynamic.filter(w => {
    const catId = typeof w.category === 'string' ? w.category : w.category?.id;
    return catId === selected;
  }) : [];

  const selectedInfo = categories_dynamic.find(c => c.id === selected);

  if (!selected) {
    return (
      <div className="min-h-screen bg-parchment">
        <section className="hero-gradient pt-28 pb-16 sm:pt-36 sm:pb-20 relative overflow-hidden">
          <div className="absolute inset-0 pattern-bg opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 size={16} className="text-gold" />
                <span className="text-xs font-sans font-semibold uppercase tracking-wider text-gold">Phân loại</span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
                Thể Loại Văn Học
              </h1>
              <p className="text-base text-white/60 font-sans">
                Khám phá {categories_dynamic.length} thể loại văn học chính
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
              <p className="font-sans text-vermillion font-semibold">Đang tải thể loại...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories_dynamic.map((cat, i) => {
                const catWorks = works_dynamic.filter(w => {
                  const catId = typeof w.category === 'string' ? w.category : w.category?.id;
                  return catId === cat.id;
                });
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelected(cat.id)}
                    className={`group relative overflow-hidden rounded-2xl p-8 sm:p-10 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl animate-fadeInUp stagger-${Math.min(i + 1, 8)}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-90`} />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                    <div className="relative">
                      <div className="text-5xl mb-4">{cat.icon}</div>
                      <h3 className="font-display text-2xl font-bold text-white mb-2">{cat.name}</h3>
                      <p className="text-sm text-white/70 font-sans mb-4 leading-relaxed">{cat.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <span className="text-sm text-white/60 font-sans">{catWorks.length} tác phẩm</span>
                        <span className="text-sm text-white font-sans font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem →
                        </span>
                      </div>
                      <div className="mt-4 space-y-1">
                        {catWorks.slice(0, 3).map(w => (
                          <div key={w.id || w._id} className="text-xs text-white/40 font-sans truncate">
                            • {w.title} - {w.author?.name || w.authorName}
                          </div>
                        ))}
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
    <div className="min-h-screen bg-parchment">
      <section className={`pt-28 pb-16 sm:pt-36 sm:pb-20 relative overflow-hidden ${selectedInfo?.gradient || 'hero-gradient'}`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 pattern-bg opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              setSelected(null);
              navigate(-1);
            }}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-sans mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Tất cả thể loại
          </button>
          <div className="animate-fadeIn">
            <div className="text-5xl mb-4">{selectedInfo?.icon}</div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-3">
              {selectedInfo?.name}
            </h1>
            <p className="text-base text-white/70 font-sans max-w-xl">
              {selectedInfo?.description} · {filteredWorks.length} tác phẩm
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredWorks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredWorks.map((work, i) => (
              <BookCard key={work.id || work._id} work={work} onRead={() => navigate(`/doc/${work.id || work._id}`)} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="font-display text-xl font-bold text-ink mb-2">Chưa có tác phẩm</h3>
            <p className="text-sm text-ink-light/60 font-sans">Thể loại này đang được cập nhật</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CategoriesPage;
