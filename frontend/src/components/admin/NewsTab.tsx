'use client';
import React from 'react';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { NewsItem } from '@/types';
import { StatusBadge } from './AdminUIHelper';

const fmtDate = (iso: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface NewsTabProps {
    news: NewsItem[];
    onAdd: () => void;
    onEdit: (n: NewsItem) => void;
    onDelete: (n: NewsItem) => void;
    onToggleStatus: (n: NewsItem) => void;
}

const NewsTab: React.FC<NewsTabProps> = ({ news, onAdd, onEdit, onDelete, onToggleStatus }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{news.filter(n => n.status === 'published').length} đã đăng · {news.filter(n => n.status === 'draft').length} nháp</span>
            </div>
            <button onClick={onAdd} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[13px] font-semibold shadow-sm" style={{ background: 'linear-gradient(135deg,#C5973E,#D4A856)' }}>
                + Thêm tin tức
            </button>
        </div>
        <div className="space-y-3">
            {news.map(n => (
                <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={n.status} />
                                <span className="text-[11px] text-gray-400">{fmtDate(n.createdAt)}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-[14px] leading-snug">{n.title}</h4>
                            <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{n.content?.replace(/<[^>]*>/g, '') || ''}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => onToggleStatus(n)} title={n.status === 'published' ? 'Chuyển nháp' : 'Đăng ngay'}
                                className={`p-2 rounded-xl transition-colors ${n.status === 'published' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                {n.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => onEdit(n)} className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Pencil size={14} /></button>
                            <button onClick={() => onDelete(n)} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>
            ))}
            {news.length === 0 && (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                    <p className="text-sm">Chưa có tin tức nào. Nhấn "Thêm tin tức" để bắt đầu.</p>
                </div>
            )}
        </div>
    </div>
);

export default NewsTab;
