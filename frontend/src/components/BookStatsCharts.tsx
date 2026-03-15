import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getBorrowStats } from '../services/api';
import { TrendingUp, BookOpen, PieChart as PieIcon, Loader2 } from 'lucide-react';

interface StatsData {
    topBooks: { bookTitle: string; count: number }[];
    dailyBorrows: { date: string; borrowed: number; returned: number }[];
    categoryDistribution: { category: string; count: number }[];
    summary: { totalThisMonth: number; returnedThisMonth: number; overdueCount: number };
}

const PIE_COLORS = ['#3A7CA5', '#2D6A4F', '#C5973E', '#A52422', '#6B4226', '#40916C', '#7F4F24', '#5E60CE'];

const CATEGORY_LABELS: Record<string, string> = {
    tho: 'Thơ', truyen: 'Truyện', tieu_thuyet: 'Tiểu thuyết',
    ky: 'Ký', kich: 'Kịch', khac: 'Khác',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-gray-500">{p.name}:</span>
                    <span className="font-bold text-gray-800">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            <p className="text-gray-400 text-xs">{subtitle}</p>
        </div>
    </div>
);

const BookStatsCharts: React.FC = () => {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        getBorrowStats()
            .then(data => { if (mounted) setStats(data); })
            .catch(() => { if (mounted) setError(true); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48 text-gray-400 gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Đang tải thống kê...</span>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Không thể tải thống kê. Vui lòng thử lại sau.
            </div>
        );
    }

    const now = new Date();
    const monthLabel = `tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

    // Truncate long book titles for bar chart
    const topBooksFormatted = stats.topBooks.map(b => ({
        ...b,
        shortTitle: b.bookTitle.length > 24 ? b.bookTitle.slice(0, 22) + '…' : b.bookTitle,
    }));

    const pieData = stats.categoryDistribution.map(c => ({
        name: CATEGORY_LABELS[c.category] || c.category,
        value: c.count,
    }));

    return (
        <div className="space-y-6">
            {/* Summary Pills */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: `Lượt mượn ${monthLabel}`, value: stats.summary.totalThisMonth, color: 'bg-blue-50 text-blue-700' },
                    { label: 'Đã trả trong tháng', value: stats.summary.returnedThisMonth, color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Đang quá hạn', value: stats.summary.overdueCount, color: stats.summary.overdueCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600' },
                ].map((s, i) => (
                    <div key={i} className={`${s.color} rounded-xl px-4 py-3 text-center`}>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Chart 1: Top sách mượn nhiều nhất */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <SectionTitle
                    icon={<TrendingUp size={16} />}
                    title={`Top 10 sách hot nhất ${monthLabel}`}
                    subtitle="Xếp hạng theo số lượt mượn"
                />
                {topBooksFormatted.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu mượn sách trong tháng này.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={topBooksFormatted} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="shortTitle" tick={{ fontSize: 11, fill: '#374151' }} width={150} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Lượt mượn" radius={[0, 6, 6, 0]} fill="url(#barGrad)">
                                {topBooksFormatted.map((_, i) => (
                                    <Cell key={i} fill={i === 0 ? '#A52422' : i === 1 ? '#C5973E' : '#3A7CA5'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Chart 2 & 3: Side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Chart 2: Line chart – lượt mượn theo ngày */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <SectionTitle
                        icon={<BookOpen size={16} />}
                        title="Xu hướng 30 ngày qua"
                        subtitle="Lượt mượn và trả theo ngày"
                    />
                    {stats.dailyBorrows.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={stats.dailyBorrows} margin={{ left: -16, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="borrowed" name="Mượn" stroke="#3A7CA5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                <Line type="monotone" dataKey="returned" name="Trả" stroke="#2D6A4F" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Chart 3: Pie chart – phân bổ thể loại */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <SectionTitle
                        icon={<PieIcon size={16} />}
                        title="Phân bổ theo thể loại"
                        subtitle={`Lượt mượn ${monthLabel} theo thể loại sách`}
                    />
                    {pieData.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Chưa có dữ liệu.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="45%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number | undefined) => [`${v ?? 0} lượt`, '']} />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{ fontSize: 11 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookStatsCharts;
