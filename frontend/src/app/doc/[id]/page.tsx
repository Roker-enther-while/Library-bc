'use client';

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, Clock, Eye, BookOpen, ChevronUp, Bookmark, Calendar, User as UserIcon } from 'lucide-react';
import { getChapter, getBooks, saveReadingProgress, getReadingProgress } from '@/lib/apiClient';
import BookCard from '@/components/ui/BookCard';
import ReservationModal from '@/components/ui/ReservationModal';
import { useRouter, useParams } from 'next/navigation';

const ReadingPageContent: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const bookId = params.id as string;

    const [work, setWork] = useState<any | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [fontSize, setFontSize] = useState(1);
    const [chapterContent, setChapterContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [author, setAuthor] = useState<any>(null);
    const [relatedWorks, setRelatedWorks] = useState<any[]>([]);
    const [reservedBook, setReservedBook] = useState<any>(null);

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
                if (!currentWork && bookId) {
                    const allBooks = await getBooks();
                    currentWork = allBooks.find((b: any) => (b.id === bookId || b._id === bookId)) || null;
                    if (currentWork) {
                        setWork(currentWork);
                    }
                }
                if (!currentWork) throw new Error("Work not found");

                // Fetch chapter 1 by default
                const chapter = await getChapter(currentWork._id || currentWork.id, 1);
                setChapterContent(chapter.content);

                const allBooks = await getBooks();
                const authorId = currentWork.author?._id || currentWork.authorId;
                if (authorId) {
                    const related = allBooks.filter((w: any) =>
                        (w.author?._id || w.authorId) === authorId && (w._id || w.id) !== (currentWork?._id || currentWork?.id)
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
        if (bookId) fetchContent();
    }, [bookId]);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const loadProgress = async () => {
            if (!bookId) return;
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            if (!token) return;

            try {
                const progress = await getReadingProgress(bookId);
                if (progress && progress.scrollY > 0) {
                    setTimeout(() => {
                        window.scrollTo({ top: progress.scrollY, behavior: 'smooth' });
                    }, 500);
                }
            } catch (e) {
                console.error("Failed to load progress", e);
            }
        };
        if (!loading && chapterContent) {
            loadProgress();
        }
    }, [loading, chapterContent, bookId]);

    useEffect(() => {
        let timeoutId: any;
        const currentBookId = bookId;
        const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
                if (currentBookId && token) {
                    saveReadingProgress(currentBookId, 1, window.scrollY);
                }
            }, 2000);
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            if (currentBookId && token) {
                saveReadingProgress(currentBookId, 1, window.scrollY);
            }
        };
    }, [bookId]);

    const fontSizes = [
        { label: 'Nhỏ', size: 0.9, lineHeight: '1.9' },
        { label: 'Vừa', size: 1, lineHeight: '2.1' },
        { label: 'Lớn', size: 1.15, lineHeight: '2.3' },
        { label: 'Rất lớn', size: 1.3, lineHeight: '2.5' },
    ];

    const categoryId = typeof work?.category === 'string' ? work?.category : work?.category?._id || work?.category?.id;
    const isPoem = categoryId === 'tho' || categoryId === 'ca-dao' || categoryId === 'truyen-tho';

    if (!work && !loading) {
        return (
            <div className="min-h-screen bg-parchment dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-display text-ink dark:text-parchment mb-4">Không tìm thấy tác phẩm</h2>
                    <button onClick={() => router.push('/thu-vien')} className="text-vermillion hover:underline">Về thư viện</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-parchment dark:bg-dark-bg transition-colors">
            <div
                className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 overflow-hidden"
                style={{ backgroundColor: work?.coverColor || '#1e3a5f' }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
                <div className="absolute inset-0 pattern-bg opacity-10" />
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => router.push('/thu-vien')}
                        className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-sans mb-8 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Quay lại thư viện
                    </button>
                    <div className="animate-fadeIn flex flex-col md:flex-row gap-8 items-start">
                        <div
                            className="w-32 sm:w-40 lg:w-48 aspect-[3/4] rounded-2xl shadow-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                            style={{ backgroundColor: work?.coverColor || '#1e3a5f' }}
                        >
                            {work?.coverImage ? (
                                <img src={work.coverImage} alt={work.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-6xl">📖</div>
                            )}
                        </div>
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-sans font-medium rounded-full mb-4">
                                {work?.categoryName || 'Tác phẩm'}
                            </span>
                            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                                {work?.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm font-sans">
                                <button
                                    onClick={() => router.push(`/tac-gia/${work?.author?._id || work?.authorId}`)}
                                    className="flex items-center gap-2 hover:text-white transition-colors"
                                >
                                    <UserIcon size={15} />
                                    {work?.authorName || work?.author?.name}
                                </button>
                                <span className="flex items-center gap-1">
                                    <Calendar size={15} />
                                    {work?.publicationYear || '-'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock size={15} />
                                    {work?.readTime ?? 0} phút đọc
                                </span>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => setReservedBook(work)}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 border border-emerald-500/20"
                                >
                                    📌 Đặt trước sách giấy
                                </button>
                                <p className="text-[10px] text-white/50 mt-2 italic">* Bạn có thể đến thư viện nhận sách sau khi được duyệt.</p>
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
                    <div className="flex flex-col gap-8">
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Bookmark size={16} className="text-gold" />
                                <h2 className="font-display text-sm font-bold text-gold-dark uppercase tracking-wider">Giới thiệu</h2>
                            </div>
                            <p className="text-ink-light dark:text-gray-300 leading-relaxed font-body">{work?.summary || 'Chưa có tóm tắt.'}</p>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-vermillion" />
                                    <span className="text-sm font-sans font-semibold text-ink dark:text-parchment">Cỡ chữ</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {fontSizes.map((f, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setFontSize(i)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${fontSize === i
                                                ? 'bg-vermillion text-white'
                                                : 'bg-parchment dark:bg-dark-surface text-ink-light dark:text-gray-400'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 sm:p-10 shadow-sm relative">
                            <div className="ornament-divider mb-8">
                                <span className="text-gold text-sm">❀</span>
                            </div>
                            <div
                                className={isPoem ? 'reading-text-poem dark:text-parchment' : 'reading-text dark:text-parchment'}
                                style={{
                                    fontSize: `${fontSizes[fontSize].size}rem`,
                                    lineHeight: fontSizes[fontSize].lineHeight,
                                }}
                            >
                                {(chapterContent || work?.fullText || '').split('\n').map((line: string, i: number) => {
                                    if (line.trim() === '') return <br key={i} />;
                                    return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line) }} />;
                                })}
                            </div>
                            <div className="ornament-divider mt-10">
                                <span className="text-gold text-sm">❀</span>
                            </div>
                        </div>

                        {relatedWorks.length > 0 && (
                            <div className="mt-8">
                                <h3 className="font-display text-lg font-bold text-ink dark:text-parchment mb-4">
                                    Tác phẩm cùng tác giả
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {relatedWorks.map((w, i) => (
                                        <BookCard key={w._id || w.id} work={w} onRead={() => router.push(`/doc/${w._id || w.id}`)} onReserve={(book: any) => setReservedBook(book)} index={i} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 w-12 h-12 bg-vermillion text-white rounded-full shadow-lg flex items-center justify-center hover:bg-vermillion-dark transition-all z-40"
                >
                    <ChevronUp size={20} />
                </button>
            )}

            {reservedBook && (
                <ReservationModal
                    book={reservedBook}
                    onClose={() => setReservedBook(null)}
                />
            )}
        </div>
    );
};

export default ReadingPageContent;
