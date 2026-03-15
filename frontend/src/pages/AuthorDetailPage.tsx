import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, BookOpen, Clock, Award } from 'lucide-react';
import { LiteraryWork, Author } from '../types';
import { getAuthorById, getBooks } from '../services/api';
import BookCard from '../components/BookCard';
import { useParams, useNavigate } from 'react-router-dom';

const AuthorDetailPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const authorId = params.id;

  const [author, setAuthor] = useState<Author | null>(null);
  const [authorWorks, setAuthorWorks] = useState<LiteraryWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAuthorData = async () => {
      setLoading(true);
      try {
        if (authorId) {
          const [authorData, booksData] = await Promise.all([
            getAuthorById(authorId),
            getBooks()
          ]);
          setAuthor(authorData);
          const filteredWorks = (booksData || []).filter((w: LiteraryWork) => (w.author?.id || w.authorId) === authorId);
          setAuthorWorks(filteredWorks);
        }
      } catch (error) {
        console.error("Error fetching author detail data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorData();
  }, [authorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-vermillion border-t-transparent rounded-full animate-spin"></div>
          <p className="font-sans text-vermillion font-semibold">Đang tải thông tin tác giả...</p>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="font-display text-2xl font-bold text-ink mb-2">Không tìm thấy tác giả</h2>
          <button
            onClick={() => navigate('/tac-gia')}
            className="mt-4 px-6 py-2.5 bg-vermillion text-white rounded-xl text-sm font-sans font-medium"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const totalViews = authorWorks.reduce((sum, w) => sum + (w.views || 0), 0);
  const totalReadTime = authorWorks.reduce((sum, w) => sum + (typeof w.readTime === 'number' ? w.readTime : 0), 0);

  return (
    <div className="min-h-screen bg-parchment">
      <section className="hero-gradient pt-24 pb-16 sm:pt-32 sm:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pattern-bg opacity-20" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/tac-gia')}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-sans mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Tất cả tác giả
          </button>

          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 animate-fadeIn">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-6xl sm:text-7xl flex-shrink-0 border border-white/10 overflow-hidden">
              {author.avatar?.trim().startsWith('http') ? (
                <img src={author.avatar.trim()} alt={author.name} className="w-full h-full object-cover" />
              ) : (
                author.avatar?.trim() || '👤'
              )}
            </div>

            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-gold/20 text-gold text-xs font-sans font-semibold rounded-full mb-3">
                {author.era}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                {author.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm font-sans mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {author.birthYear} - {author.deathYear || '?'}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} />
                  {author.region}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={15} />
                  {authorWorks.length} tác phẩm
                </span>
              </div>
              <p className="text-white/70 leading-relaxed font-body max-w-2xl">
                {author.bio}
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md animate-fadeInUp stagger-2">
            {[
              { icon: <BookOpen size={18} />, value: authorWorks.length, label: 'Tác phẩm' },
              { icon: <Clock size={18} />, value: `${totalReadTime}p`, label: 'Thời gian đọc' },
              { icon: <Award size={18} />, value: `${(totalViews / 1000).toFixed(0)}k`, label: 'Lượt đọc' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
              >
                <div className="text-gold mb-1 flex justify-center">{stat.icon}</div>
                <div className="text-xl font-display font-bold text-white">{stat.value}</div>
                <div className="text-[11px] text-white/50 font-sans mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display text-2xl font-bold text-ink mb-8">
          Tác phẩm của {author.name}
        </h2>

        {authorWorks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorWorks.map((work, i) => (
              <BookCard key={work.id || work._id} work={work} onRead={() => navigate(`/doc/${work.id || work._id}`)} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-ink-light/60 font-sans">Chưa có tác phẩm nào trong thư viện</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AuthorDetailPage;
