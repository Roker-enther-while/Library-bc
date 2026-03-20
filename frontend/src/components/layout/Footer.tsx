'use client';

import React from 'react';
import { BookOpen, Heart } from 'lucide-react';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="bg-ink text-white/80 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-vermillion text-white flex items-center justify-center">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 className="font-display text-lg font-bold text-white">Văn Học Việt Nam</h3>
                                <p className="text-xs text-gold">Kho tàng văn chương dân tộc</p>
                            </div>
                        </div>
                        <p className="text-sm leading-relaxed text-white/60">
                            Nơi lưu giữ và tôn vinh những tác phẩm văn học kinh điển của dân tộc Việt Nam,
                            từ ca dao tục ngữ dân gian đến thơ mới, từ trung đại đến hiện đại.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-display text-sm font-bold text-gold mb-4 uppercase tracking-wider">
                            Khám phá
                        </h4>
                        <ul className="space-y-2">
                            {[
                                { path: '/thu-vien', label: 'Thư viện tác phẩm' },
                                { path: '/tac-gia', label: 'Tác giả nổi tiếng' },
                                { path: '/the-loai', label: 'Thể loại văn học' },
                            ].map((item) => (
                                <li key={item.path}>
                                    <Link
                                        href={item.path}
                                        className="text-sm text-white/60 hover:text-gold transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-display text-sm font-bold text-gold mb-4 uppercase tracking-wider">
                            Thời kỳ văn học
                        </h4>
                        <ul className="space-y-2">
                            {['Văn học dân gian', 'Văn học trung đại', 'Văn học hiện đại', 'Thơ mới 1932-1945'].map((era) => (
                                <li key={era}>
                                    <span className="text-sm text-white/60">{era}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-white/40 flex items-center gap-1">
                        Xây dựng với <Heart size={12} className="text-vermillion fill-vermillion" /> cho văn học Việt Nam
                    </p>
                    <p className="text-xs text-white/40">
                        © 2025 Thư Viện Văn Học Việt Nam
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
