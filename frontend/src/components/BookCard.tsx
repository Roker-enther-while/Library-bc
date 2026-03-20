'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Eye, BookOpen, ChevronRight, Heart, MapPin } from 'lucide-react';
import { LiteraryWork } from '@/types';

interface BookCardProps {
    work: LiteraryWork;
    onRead: (work: LiteraryWork) => void;
    onReserve?: (work: LiteraryWork) => void;
    variant?: 'default' | 'featured' | 'compact';
    index?: number;
}

const BookCard: React.FC<BookCardProps> = ({ work, onRead, onReserve, variant = 'default', index = 0 }) => {
    const [isFavorite, setIsFavorite] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const workId = work.id || work._id || '';
    const coverImage = work.coverImage || work.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400";
    const publicationYear =
        work.publicationYear ??
        (typeof work.year === 'string' ? Number(work.year) : work.year);

    useEffect(() => {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavorite(favorites.includes(workId));
    }, [workId]);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        let newFavorites: string[];
        if (isFavorite) {
            newFavorites = favorites.filter((id: string) => id !== workId);
        } else {
            newFavorites = [...favorites, workId];
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 600);
        }
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
        setIsFavorite(!isFavorite);
        window.dispatchEvent(new Event('storage'));
    };

    const formatViews = (n: number) => {
        if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
        return n.toString();
    };

    const categoryName = work.categoryName || (typeof work.category === 'object' ? (work.category as any).name : work.category) || 'Không rõ';

    if (variant === 'featured') {
        return (
            <div className="group relative overflow-hidden rounded-2xl shadow-md bg-white w-full">
                <div className="flex flex-col sm:flex-row">
                    <button
                        onClick={() => onRead(work)}
                        className="sm:w-48 h-48 sm:h-auto flex-shrink-0 flex items-center justify-center relative overflow-hidden text-left"
                        style={{ backgroundColor: work.coverColor }}
                    >
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/10" />
                            <div className="relative text-center p-6">
                                <div className="text-4xl sm:text-5xl mb-2 opacity-90">📜</div>
                                <p className="text-white/90 font-bold text-sm leading-tight">{work.title}</p>
                            </div>
                        </div>
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg">
                            ⭐ Nổi bật
                        </div>
                    </button>
                    <div className="flex-1 p-5 sm:p-6 flex flex-col">
                        <div className="flex items-start justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                                {categoryName}
                            </span>
                            <button
                                onClick={toggleFavorite}
                                className={`p-1.5 rounded-full transition-all duration-300 ${isFavorite
                                    ? 'text-red-600 bg-red-50'
                                    : 'text-gray-300 hover:text-red-600 hover:bg-red-50'
                                    } ${isAnimating ? 'scale-125' : ''}`}
                            >
                                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                        <h3
                            className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-red-700 transition-colors"
                            onClick={() => onRead(work)}
                        >
                            {work.title}
                        </h3>
                        <p className="text-sm text-amber-700 font-medium mb-1">{work.authorName || (work.author as any)?.name}</p>
                        {work.shelfLocation && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 italic">
                                <MapPin size={13} className="text-red-400" />
                                Vị trí: {work.shelfLocation}
                            </div>
                        )}
                        {(work.available != null || work.availableCopies != null) && (
                            <div className="mb-3">
                                {(() => {
                                    const avail = work.available ?? work.availableCopies ?? 0;
                                    const total = work.quantity ?? work.totalCopies;
                                    return avail > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                            Còn {avail}{total ? `/${total}` : ''} bản
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                            Hết sách
                                        </span>
                                    );
                                })()}
                            </div>
                        )}
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">{work.summary}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Clock size={13} />{work.readTime ?? 0} phút</span>
                                <span className="flex items-center gap-1"><Eye size={13} />{formatViews(work.views ?? 0)}</span>
                                <span>{publicationYear || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {onReserve && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onReserve(work); }}
                                        className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors border border-emerald-200 hover:border-emerald-400 px-2.5 py-1 rounded-lg hover:bg-emerald-50"
                                    >
                                        Đặt trước
                                    </button>
                                )}
                                <button
                                    onClick={() => onRead(work)}
                                    className="flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 transition-colors"
                                >
                                    Đọc ngay <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <button
                onClick={() => onRead(work)}
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all text-left w-full"
            >
                <div
                    className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0 text-xl shadow-md"
                    style={{ backgroundColor: (work.coverColor || '#855') + '20' }}
                >
                    📘
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-red-700 transition-colors">
                        {work.title}
                    </h4>
                    <p className="text-xs text-gray-400">{work.authorName || (work.author as any)?.name}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-red-700 transition-colors" />
            </button>
        );
    }

    return (
        <div className="group">
            <div className="rounded-2xl overflow-hidden shadow-md bg-white hover:shadow-xl transition-all duration-300">
                <button
                    onClick={() => onRead(work)}
                    className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: work.coverColor }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
                    <img
                        src={coverImage}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                        onClick={toggleFavorite}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 z-20 ${isFavorite
                            ? 'bg-white text-red-600 shadow-lg'
                            : 'bg-black/20 text-white/80 hover:bg-white hover:text-red-600'
                            } ${isAnimating ? 'scale-125' : ''}`}
                    >
                        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    {work.isFeatured && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg">
                            ⭐ Nổi bật
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="px-4 py-2 bg-white rounded-full text-gray-900 text-sm font-semibold flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            <BookOpen size={16} /> Đọc ngay
                        </span>
                    </div>
                </button>
                <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                        {categoryName}
                    </span>
                    <h3
                        className="text-base font-bold text-gray-900 mt-1 line-clamp-1 group-hover:text-red-700 transition-colors cursor-pointer"
                        onClick={() => onRead(work)}
                    >
                        {work.title}
                    </h3>
                    <p className="text-sm text-amber-700 mt-0.5">{work.authorName || (work.author as any)?.name}</p>
                    {work.shelfLocation && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 italic">
                            <MapPin size={10} /> {work.shelfLocation}
                        </div>
                    )}
                    {(work.available != null || work.availableCopies != null) && (
                        <div className="mt-1.5">
                            {(() => {
                                const avail = work.available ?? work.availableCopies ?? 0;
                                const total = work.quantity ?? work.totalCopies;
                                return avail > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                        Còn {avail}{total ? `/${total}` : ''} bản
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                        Hết sách
                                    </span>
                                );
                            })()}
                            {onReserve && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReserve(work); }}
                                    className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400 transition-all"
                                >
                                    📌 Đặt trước sách này
                                </button>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                        <span>{publicationYear || '—'}</span>
                        <span>•</span>
                        <span>{work.readTime ?? 0} phút</span>
                        <span className="flex items-center gap-1">
                            <Eye size={12} /> {formatViews(work.views ?? 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookCard;
