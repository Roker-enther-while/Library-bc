'use client';

import { useState, useEffect } from 'react';

export type ReadingMode = 'light' | 'sepia' | 'dark' | 'night';
export type FontFamily = 'serif' | 'sans' | 'mono';

interface ReadingModeProps {
    onModeChange: (mode: ReadingMode) => void;
    onFontChange: (font: FontFamily) => void;
    onSizeChange: (size: number) => void;
    currentMode: ReadingMode;
    currentFont: FontFamily;
    currentSize: number;
}

export default function ReadingModeSelector({
    onModeChange,
    onFontChange,
    onSizeChange,
    currentMode,
    currentFont,
    currentSize
}: ReadingModeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const modes: { id: ReadingMode; label: string; bg: string; text: string }[] = [
        { id: 'light', label: 'Sáng', bg: '#ffffff', text: '#1a1a2e' },
        { id: 'sepia', label: 'Giấy cũ', bg: '#f4ecd8', text: '#433422' },
        { id: 'dark', label: 'Tối', bg: '#1a1a2e', text: '#e8e6e3' },
        { id: 'night', label: 'Đêm', bg: '#0a0a14', text: '#9ca3af' }
    ];
    const fonts: { id: FontFamily; label: string; sample: string }[] = [
        { id: 'serif', label: 'Serif', sample: 'Aa' },
        { id: 'sans', label: 'Sans', sample: 'Aa' },
        { id: 'mono', label: 'Mono', sample: 'Aa' }
    ];
    const fontClasses: Record<FontFamily, string> = {
        serif: 'font-serif',
        sans: 'font-sans',
        mono: 'font-mono'
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.reading-mode-selector')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="reading-mode-selector relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200"
            >
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Chế độ đọc</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
                    <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                            Nền đọc
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {modes.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => onModeChange(mode.id)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${currentMode === mode.id
                                            ? 'border-amber-400 ring-2 ring-amber-400/20'
                                            : 'border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold"
                                        style={{ backgroundColor: mode.bg, color: mode.text }}
                                    >
                                        A
                                    </div>
                                    <span className="text-xs text-gray-700">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                            Kiểu chữ
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {fonts.map(font => (
                                <button
                                    key={font.id}
                                    onClick={() => onFontChange(font.id)}
                                    className={`p-3 rounded-lg border-2 transition-all ${fontClasses[font.id]} ${currentFont === font.id
                                            ? 'border-amber-400 bg-amber-50'
                                            : 'border-gray-200 hover:border-amber-200'
                                        }`}
                                >
                                    <div className="text-lg font-medium text-gray-800">{font.sample}</div>
                                    <div className="text-xs text-gray-500">{font.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                            Cỡ chữ: {currentSize}px
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onSizeChange(Math.max(14, currentSize - 2))}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <span className="text-sm font-bold text-gray-700">A-</span>
                            </button>
                            <input
                                type="range"
                                min="14"
                                max="28"
                                value={currentSize}
                                onChange={(e) => onSizeChange(Number(e.target.value))}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <button
                                onClick={() => onSizeChange(Math.min(28, currentSize + 2))}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <span className="text-lg font-bold text-gray-700">A+</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
