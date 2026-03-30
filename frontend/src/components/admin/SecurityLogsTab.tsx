'use client';
import React from 'react';
import { ShieldAlert, Info, AlertTriangle, Bug, Terminal, User, Clock, Globe } from 'lucide-react';

interface SecurityLog {
    _id: string;
    userId?: {
        _id: string;
        fullName: string;
        role: string;
    };
    username?: string;
    action: string;
    level: 'info' | 'warn' | 'danger';
    ip: string;
    userAgent: string;
    path: string;
    method: string;
    reason?: string;
    payload?: any;
    timestamp: string;
}

interface SecurityLogsTabProps {
    logs: SecurityLog[];
}

const SecurityLogsTab: React.FC<SecurityLogsTabProps> = ({ logs }) => {
    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'danger': return <ShieldAlert size={16} className="text-red-600" />;
            case 'warn': return <AlertTriangle size={16} className="text-amber-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const getLevelClass = (level: string) => {
        switch (level) {
            case 'danger': return 'bg-red-50 text-red-700 border-red-100';
            case 'warn': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    const fmtDate = (iso: string) => {
        return new Date(iso).toLocaleString('vi-VN');
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Giám sát Bảo mật</h2>
                    <p className="text-sm text-gray-500">Theo dõi hoạt động hệ thống và các mối đe dọa tiềm tàng</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                        <p className="text-[10px] text-red-500 font-bold uppercase">Cảnh báo Nguy hiểm</p>
                        <p className="text-xl font-bold text-red-700">{logs.filter(l => l.level === 'danger').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold text-left">
                            <tr>
                                <th className="px-6 py-4">Thời gian / IP</th>
                                <th className="px-4 py-4">Đối tượng</th>
                                <th className="px-4 py-4">Hành động / Endpoint</th>
                                <th className="px-4 py-4 text-center">Mức độ</th>
                                <th className="px-6 py-4">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map(log => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                                            <Clock size={12} className="text-gray-400" />
                                            {fmtDate(log.timestamp)}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                                            <Globe size={12} />
                                            {log.ip}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{log.userId?.fullName || log.username || 'N/A'}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{log.userId?.role || 'Guest'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-bold text-[13px] text-gray-900 capitalize">{log.action.replace(/_/g, ' ')}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${log.method === 'GET' ? 'bg-green-50 text-green-600' :
                                                    log.method === 'POST' ? 'bg-blue-50 text-blue-600' :
                                                        log.method === 'DELETE' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                {log.method}
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-mono truncate max-w-[150px]">{log.path}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${getLevelClass(log.level)}`}>
                                            {getLevelIcon(log.level)}
                                            {log.level.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-gray-600 line-clamp-2 max-w-[250px] italic">
                                            {log.reason || 'No additional details'}
                                        </p>
                                        {log.payload && Object.keys(log.payload).length > 0 && (
                                            <div className="mt-2 text-[9px] bg-gray-900 text-gray-300 p-2 rounded-lg font-mono">
                                                Payload capture: data hidden for security
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Bug size={40} className="mb-4" />
                                            <p className="text-sm">Hiện chưa có bản ghi bảo mật nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SecurityLogsTab;
