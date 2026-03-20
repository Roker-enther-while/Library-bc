'use client';

import React, { useState, useMemo } from 'react';
import { X, QrCode, CheckCircle2, Clock, User, Phone, Smartphone } from 'lucide-react';
import { LiteraryWork, BorrowRecord } from '@/types';

interface QRBorrowModalProps {
    work: LiteraryWork;
    onClose: () => void;
}

function generateQRPattern(text: string): boolean[][] {
    const size = 25;
    const grid: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    const drawFinder = (ox: number, oy: number) => {
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const isOuter = y === 0 || y === 6 || x === 0 || x === 6;
                const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
                if (isOuter || isInner) {
                    grid[oy + y][ox + x] = true;
                }
            }
        }
    };
    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);
    for (let i = 8; i < size - 8; i++) {
        grid[6][i] = i % 2 === 0;
        grid[i][6] = i % 2 === 0;
    }
    const ax = size - 9, ay = size - 9;
    for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
            const isOuter = Math.abs(x) === 2 || Math.abs(y) === 2;
            const isCenter = x === 0 && y === 0;
            if (isOuter || isCenter) {
                grid[ay + y][ax + x] = true;
            }
        }
    }
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash + text.charCodeAt(i)) & 0x7FFFFFFF;
    }
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
            if (x === 6 || y === 6) continue;
            if (Math.abs(x - ax) <= 2 && Math.abs(y - ay) <= 2) continue;
            const val = ((hash * (x * 31 + 7) + y * 37 + 13 + x * y) >>> 0) % 100;
            grid[y][x] = val > 42;
        }
    }
    return grid;
}

const QRBorrowModal: React.FC<QRBorrowModalProps> = ({ work, onClose }) => {
    const [step, setStep] = useState<'form' | 'qr' | 'success'>('form');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [record, setRecord] = useState<BorrowRecord | null>(null);
    const workId = work.id || work._id || '';
    const qrPattern = useMemo(() => generateQRPattern(`BORROW:${workId}:${work.title}:${Date.now()}`), [workId, work.title]);

    const handleBorrow = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;
        const now = new Date();
        const due = new Date(now);
        due.setDate(due.getDate() + 14);
        const newRecord: BorrowRecord = {
            id: `BR-${Date.now().toString(36).toUpperCase()}`,
            bookId: workId,
            bookTitle: work.title,
            borrowerName: name.trim(),
            borrowerPhone: phone.trim(),
            userId: '',
            borrowDate: now.toISOString().split('T')[0],
            dueDate: due.toISOString().split('T')[0],
            status: 'borrowing'
        };
        const existing = JSON.parse(localStorage.getItem('borrowRecords') || '[]');
        existing.push(newRecord);
        localStorage.setItem('borrowRecords', JSON.stringify(existing));
        setRecord(newRecord);
        setStep('qr');
    };

    const cellSize = 8;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="text-white px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            {step === 'success' ? <CheckCircle2 size={22} /> : <QrCode size={22} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">
                                {step === 'form' ? 'Mượn sách' : step === 'qr' ? 'Mã QR mượn sách' : 'Thành công!'}
                            </h3>
                            <p className="text-[11px] text-white/80">Hệ thống QR mượn sách</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                    <div
                        className="w-10 h-14 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: (work.coverColor || '#c9c9c9') + '20' }}
                    >
                        {work.coverImage ? (
                            <img src={work.coverImage} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            '📘'
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{work.title}</h3>
                        <p className="text-xs text-gray-500">{work.authorName} · {work.publicationYear}</p>
                    </div>
                </div>

                {step === 'form' && (
                    <form onSubmit={handleBorrow} className="p-6 space-y-4">
                        <p className="text-sm text-gray-500">
                            Điền thông tin để mượn sách. Bạn sẽ nhận mã QR để xuất trình tại thư viện.
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                                <User size={12} className="inline mr-1" />Họ và tên
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập họ tên..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                                <Phone size={12} className="inline mr-1" />Số điện thoại
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0xxx xxx xxx"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                required
                            />
                        </div>
                        <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2 border border-amber-100">
                            <Clock size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                                Thời hạn mượn: <strong>14 ngày</strong>. Vui lòng trả sách đúng hạn.
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
                        >
                            <QrCode size={18} />
                            Tạo mã QR mượn sách
                        </button>
                    </form>
                )}

                {step === 'qr' && record && (
                    <div className="p-6 space-y-4">
                        <div className="flex justify-center">
                            <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 shadow-inner inline-block">
                                <svg
                                    width={cellSize * 25}
                                    height={cellSize * 25}
                                    viewBox={`0 0 ${cellSize * 25} ${cellSize * 25}`}
                                    className="block"
                                >
                                    {qrPattern.map((row, y) =>
                                        row.map((cell, x) =>
                                            cell ? (
                                                <rect
                                                    key={`${x}-${y}`}
                                                    x={x * cellSize}
                                                    y={y * cellSize}
                                                    width={cellSize}
                                                    height={cellSize}
                                                    fill="#1A1A2E"
                                                    rx={1}
                                                />
                                            ) : null
                                        )
                                    )}
                                    <rect x={cellSize * 10} y={cellSize * 10} width={cellSize * 5} height={cellSize * 5} fill="white" rx={4} />
                                    <text
                                        x={cellSize * 12.5}
                                        y={cellSize * 13}
                                        textAnchor="middle"
                                        fontSize={cellSize * 3}
                                        fill="#2D6A4F"
                                    >
                                        📚
                                    </text>
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Mã mượn</span>
                                <span className="text-xs font-bold text-emerald-700">{record.id}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Người mượn</span>
                                <span className="text-xs font-semibold text-gray-800">{record.borrowerName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">SDT</span>
                                <span className="text-xs text-gray-700">{record.borrowerPhone}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Ngày mượn</span>
                                <span className="text-xs text-gray-700">{record.borrowDate}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Hạn trả</span>
                                <span className="text-xs font-semibold text-red-600">{record.dueDate}</span>
                            </div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 flex items-start gap-2 border border-emerald-100">
                            <Smartphone size={14} className="text-emerald-700 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-emerald-800">
                                Lưu hoặc chụp mã QR này. Xuất trình tại quầy thư viện để nhận sách.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep('success')}
                            className="w-full py-3 text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
                        >
                            <CheckCircle2 size={18} />
                            Xác nhận mượn sách
                        </button>
                    </div>
                )}

                {step === 'success' && record && (
                    <div className="p-8 text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={40} className="text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Mượn sách thành công!</h4>
                            <p className="text-sm text-gray-500">
                                Mã mượn: <span className="font-bold text-emerald-700">{record.id}</span>
                            </p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <p className="text-sm text-gray-900">
                                📖 <strong>{work.title}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Hạn trả: <strong className="text-red-600">{record.dueDate}</strong>
                            </p>
                        </div>
                        <p className="text-xs text-gray-400">
                            Vui lòng đến thư viện với mã QR để nhận sách. Trả sách đúng hạn nhé.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRBorrowModal;
