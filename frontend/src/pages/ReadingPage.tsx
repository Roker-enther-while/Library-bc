import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, Clock, Eye, BookOpen, ChevronUp, Bookmark, Calendar, User } from 'lucide-react';
import { LiteraryWork } from '../types';
import { getCategoryName } from '../constants/categories';
import { getChapter, getBooks, saveReadingProgress, getReadingProgress } from '../services/api';
import BookCard from '../components/BookCard';
import { useParams, useNavigate } from 'react-router-dom';

const ReadingPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState<LiteraryWork | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [chapterContent, setChapterContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<any>(null);
  const [relatedWorks, setRelatedWorks] = useState<LiteraryWork[]>([]);

  useEffect(() => {
    if (work?.author) {
      setAuthor(work.author);
    }
  }, [work]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        let currentWork = work;
        if (!currentWork && params.id) {
          const allBooks = await getBooks();
          currentWork = allBooks.find((b: LiteraryWork) => b.id === params.id || b._id === params.id) || null;
          if (currentWork) {
            setWork(currentWork);
          }
        }
        if (!currentWork) throw new Error("Work not found");
        const chapter = await getChapter(currentWork._id || currentWork.id, 1);
        setChapterContent(chapter.content);
        const allBooks = await getBooks();
        const authorId = currentWork.author?.id;
        if (authorId) {
          const related = allBooks.filter((w: LiteraryWork) =>
            w.author?.id === authorId && w.id !== currentWork?.id
          );
          setRelatedWorks(related);
        }
      } catch (error) {
        console.error("Error fetching reading data:", error);
        if (work) setChapterContent(work.fullText || null);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [work?.id, params.id]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadProgress = async () => {
      const bookId = work?.id || work?._id;
      if (!bookId) return;
      const progress = await getReadingProgress(bookId);
      if (progress && progress.scrollY > 0) {
        setTimeout(() => {
          window.scrollTo({ top: progress.scrollY, behavior: 'smooth' });
        }, 500);
      }
    };
    if (!loading && chapterContent) {
      loadProgress();
    }
  }, [loading, chapterContent, work?.id, work?._id]);

  useEffect(() => {
    let timeoutId: any;
    const bookId = work?.id || work?._id;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (bookId) {
          saveReadingProgress(bookId, 1, window.scrollY);
        }
      }, 2000);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      if (bookId) {
        saveReadingProgress(bookId, 1, window.scrollY);
      }
    };
  }, [work?.id, work?._id]);

  const fontSizes = [
    { label: 'Nhỏ', size: 0.9, lineHeight: '1.9' },
    { label: 'Vừa', size: 1, lineHeight: '2.1' },
    { label: 'Lớn', size: 1.15, lineHeight: '2.3' },
    { label: 'Rất lớn', size: 1.3, lineHeight: '2.5' },
  ];

  const categoryId = typeof work?.category === 'string' ? work?.category : work?.category?.id;
  const displayYear = work?.publicationYear ?? (typeof work?.year === 'string' ? Number(work?.year) : work?.year);
  const isPoem = categoryId === 'tho' || categoryId === 'ca-dao' || categoryId === 'truyen-tho' || categoryId === 'truyen-tho-nom';

  const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  if (!work) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        {loading ? (
          <div className="animate-spin w-8 h-8 border-4 border-vermillion border-t-transparent rounded-full" />
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold font-display text-ink mb-4">Không tìm thấy tác phẩm</h2>
            <button onClick={() => navigate('/thu-vien')} className="text-vermillion hover:underline">Về thư viện</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div
        className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden"
        style={{ backgroundColor: work?.coverColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
        <div className="absolute inset-0 pattern-bg opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/thu-vien')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-sans mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Quay lại thư viện
          </button>
          <div className="animate-fadeIn flex flex-col md:flex-row gap-8 items-start">
            <div
              className="w-32 sm:w-40 lg:w-48 aspect-[3/4] rounded-2xl shadow-2xl flex items-center justify-center flex-shrink-0 book-3d transform -rotate-2 relative overflow-hidden"
              style={{ backgroundColor: work?.coverColor }}
            >
              {work.coverImage ? (
                <img src={work.coverImage} alt={work.title} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent" />
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/10 to-transparent" />
                  <span className="text-6xl sm:text-7xl drop-shadow-lg transform hover:scale-110 transition-transform cursor-pointer">📖</span>
                </>
              )}
            </div>
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-sans font-medium rounded-full mb-4">
                {getCategoryName(typeof work?.category === 'string' ? work.category : work?.category?.id)}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {work?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm font-sans">
                <button
                  onClick={() => navigate(`/tac-gia/${work?.author?.id}`)}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <User size={15} />
                  {work?.author?.name}
                </button>
                <span className="flex items-center gap-1">
                  <Calendar size={15} />
                  {displayYear || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={15} />
                  {work?.readTime ?? 0} phút đọc
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={15} />
                  {formatViews(work?.views || 0)} lượt đọc
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
            <p className="font-sans text-vermillion font-semibold">Đang tải nội dung...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 animate-fadeInUp">
                <div className="flex items-center gap-2 mb-3">
                  <Bookmark size={16} className="text-gold" />
                  <h2 className="font-display text-sm font-bold text-gold-dark uppercase tracking-wider">Giới thiệu</h2>
                </div>
                <p className="text-ink-light leading-relaxed font-body">{work.summary || 'Chưa có tóm tắt.'}</p>
                {work.significance && (
                  <div className="mt-4 p-4 bg-gold/5 rounded-xl border-l-4 border-gold">
                    <p className="text-sm text-ink-light/80 font-sans italic">{work.significance}</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm mb-8 animate-fadeInUp stagger-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-vermillion" />
                    <span className="text-sm font-sans font-semibold text-ink">Cỡ chữ</span>
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {fontSizes.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => setFontSize(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${fontSize === i
                          ? 'bg-vermillion text-white'
                          : 'bg-parchment text-ink-light hover:bg-parchment-dark'
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {!(localStorage.getItem('token') || localStorage.getItem('adminToken')) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    <p className="text-xs text-ink-light font-sans hidden sm:block">Đăng nhập để hệ thống tự động lưu lại vị trí bạn đang đọc.</p>
                    <button
                      onClick={() => navigate('/dang-nhap')}
                      className="text-xs font-sans font-semibold text-jade hover:text-jade-dark transition-colors px-3 py-1.5 bg-jade/10 rounded-lg hover:bg-jade/20"
                    >
                      Đăng nhập ngay
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm mb-8 animate-fadeInUp stagger-3">
                <div className="ornament-divider mb-8">
                  <span className="text-gold text-sm">❀</span>
                </div>
                <div
                  className={isPoem ? 'reading-text-poem' : 'reading-text'}
                  style={{
                    fontSize: `${fontSizes[fontSize].size}rem`,
                    lineHeight: fontSizes[fontSize].lineHeight,
                  }}
                >
                  {(chapterContent || work.fullText || '').split('\n').map((line, i) => {
                    if (line.trim() === '') return <br key={i} />;
                    if (line.trim() === '~~~') {
                      return (
                        <div key={i} className="my-6 flex justify-center">
                          <span className="text-gold/40">· · ·</span>
                        </div>
                      );
                    }
                    if (line.startsWith('«') || line.startsWith('»')) {
                      return <p key={i} className="text-center text-gold-dark font-semibold mt-6 mb-2 not-italic" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line) }} />;
                    }
                    return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line) }} />;
                  })}
                </div>
                <div className="ornament-divider mt-10">
                  <span className="text-gold text-sm">❀</span>
                </div>
              </div>

              {author && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8 animate-fadeInUp stagger-4">
                  <h3 className="font-display text-sm font-bold text-gold-dark uppercase tracking-wider mb-4">Về tác giả</h3>
                  <button
                    onClick={() => navigate(`/tac-gia/${author.id}`)}
                    className="flex items-start gap-4 group text-left w-full"
                  >
                    <div className="w-16 h-16 rounded-xl bg-parchment-dark flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                      {author.avatar?.trim().startsWith('http') ? (
                        <img src={author.avatar.trim()} alt={author.name} className="w-full h-full object-cover" />
                      ) : (
                        author.avatar?.trim() || '👤'
                      )}
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-bold text-ink group-hover:text-vermillion transition-colors">
                        {author.name}
                      </h4>
                      <p className="text-xs text-ink-light/50 font-sans mb-2">
                        {author.birthYear} – {author.deathYear || '?'} · {author.region} · {author.era}
                      </p>
                      <p className="text-sm text-ink-light/70 font-sans leading-relaxed line-clamp-3">
                        {author.bio}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {relatedWorks.length > 0 && (
                <div className="animate-fadeInUp stagger-5">
                  <h3 className="font-display text-lg font-bold text-ink mb-4">
                    Tác phẩm cùng tác giả
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedWorks.map((w, i) => (
                      <BookCard key={w.id || w._id} work={w} onRead={() => navigate(`/doc/${w.id || w._id}`)} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-vermillion text-white rounded-full shadow-lg flex items-center justify-center hover:bg-vermillion-dark transition-all animate-scaleIn z-40"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
};

export default ReadingPage;
