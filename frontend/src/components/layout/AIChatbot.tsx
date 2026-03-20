'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { chatAI } from '@/lib/apiClient';

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    text: string;
    timestamp: Date;
    suggestions?: string[];
}

const AIChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('library_chat_memory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const ids = new Set();
                const loadedMessages = parsed.map((m: any) => {
                    let id = m.id;
                    if (!id || ids.has(id)) id = crypto.randomUUID();
                    ids.add(id);
                    return { ...m, id, timestamp: new Date(m.timestamp) };
                });
                setMessages(loadedMessages);
                if (loadedMessages.length === 0) setUnreadCount(1);
            } catch (e) {
                setUnreadCount(1);
            }
        } else {
            setUnreadCount(1);
        }
    }, []);

    // Welcome message and saving
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: '1',
                type: 'bot',
                text: 'Xin chào! 📚 Tôi là **Thư Đồng** – Trợ lý AI của Thư viện.\n\nTôi có thể giúp bạn:\n• 🔍 Tìm sách và tác giả\n• 📖 Gợi ý tác phẩm hay\n• ✍️ Đăng ký mượn sách trực tiếp\n\nHãy hỏi tôi bất cứ điều gì!',
                timestamp: new Date(),
                suggestions: ['Tác phẩm nổi bật', 'Truyện ngắn Nam Cao', 'Sách về quê hương', 'Mượn sách như thế nào?']
            }]);
        } else {
            localStorage.setItem('library_chat_memory', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setUnreadCount(0);
        }
    }, [isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            type: 'user',
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

            if (!token) {
                const errorMsg: ChatMessage = {
                    id: crypto.randomUUID(),
                    type: 'bot',
                    text: 'Xin lỗi, bạn cần đăng nhập tài khoản thư viện để trò chuyện với Thư Đồng. Hãy mượn sách hoặc tìm kiếm thông tin sau khi đăng nhập nhé!',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMsg]);
                setIsTyping(false);
                return;
            }

            const history = messages.map(m => ({
                role: m.type === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            history.push({ role: 'user', content: text.trim() });

            const data = await chatAI(history, 'google/gemini-2.0-flash-001');

            const botMsg: ChatMessage = {
                id: crypto.randomUUID(),
                type: 'bot',
                text: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                type: 'bot',
                text: error.response?.data?.message || 'Có lỗi xảy ra khi kết nối với Thư Đồng. Vui lòng thử lại sau.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const copyToClipboard = (text: string, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const renderMarkdown = (text: string) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, i) => {
            // Horizontal rule
            if (/^[-]{3,}$/.test(line.trim()) || /^[=]{3,}$/.test(line.trim()) || line.trim() === '--------------------------------------------------') {
                return <hr key={i} className="my-4 border-gray-200 border-dashed" />;
            }

            // Headers
            if (line.startsWith('### ')) {
                return <h3 key={i} className="text-base font-bold text-vermillion mt-4 mb-2 first:mt-0">{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('#### ')) {
                return <h4 key={i} className="text-sm font-bold text-ink-light mt-3 mb-1.5">{line.replace('#### ', '')}</h4>;
            }

            // Process inline formatting (bold, italic)
            let processed = line
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-ink">$1</strong>')
                .replace(/_(.*?)_/g, '<em class="italic">$1</em>');

            // List items (bullets)
            if (line.trim().startsWith('• ') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const content = processed.trim().replace(/^[•\-*]\s+/, '');
                return (
                    <div key={i} className="flex items-start gap-2 mb-1.5 ml-1">
                        <span className="text-vermillion mt-1">•</span>
                        <span className="flex-1" dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                );
            }

            // Numbered items (simple check)
            if (/^\d+\.\s/.test(line.trim())) {
                const parts = processed.trim().split('.');
                const number = parts[0];
                const content = parts.slice(1).join('.').trim();
                return (
                    <div key={i} className="flex items-start gap-2 mb-1.5 ml-1">
                        <span className="font-bold text-vermillion mt-0.5">{number}.</span>
                        <span className="flex-1" dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                );
            }

            // Regular paragraph
            return <p key={i} className={`leading-relaxed ${line === '' ? 'h-3' : 'mb-2 last:mb-0'}`} dangerouslySetInnerHTML={{ __html: processed }} />;
        });
    };

    return (
        <>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-vermillion to-vermillion-dark text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                >
                    <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center font-sans">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-48px)] h-[620px] max-h-[calc(100vh-48px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-vermillion to-vermillion-dark text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot size={22} />
                            </div>
                            <div>
                                <h3 className="font-sans font-bold text-sm">Trợ lý Thư Đồng</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                                    <span className="text-[11px] text-white/80 font-sans">Trực tuyến</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('library_chat_memory');
                                    setMessages([]);
                                }}
                                title="Xóa bộ nhớ chat"
                                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 pl-4 space-y-5 bg-gradient-to-b from-parchment/30 to-white">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-1' : 'order-2'}`}>
                                    <div className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.type === 'user'
                                            ? 'bg-sky/10 text-sky border border-sky/20'
                                            : 'bg-vermillion/10 text-vermillion border border-vermillion/20'
                                            }`}>
                                            {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        </div>

                                        <div>
                                            <div className={`rounded-2xl px-5 py-3.5 text-[14.5px] font-sans leading-relaxed shadow-sm ${msg.type === 'user'
                                                ? 'bg-sky text-white rounded-tr-sm'
                                                : 'bg-white border border-gray-100 rounded-tl-sm text-ink-light'
                                                }`}>
                                                {renderMarkdown(msg.text)}
                                            </div>

                                            {msg.type === 'bot' && (
                                                <button
                                                    onClick={() => copyToClipboard(msg.text, msg.id)}
                                                    className={`mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-vermillion/5 transition-colors group/copy ${copiedId === msg.id ? 'text-green-600' : 'text-vermillion/40 hover:text-vermillion/70'
                                                        }`}
                                                >
                                                    {copiedId === msg.id ? (
                                                        <>
                                                            <CheckCircle2 size={11} />
                                                            <span className="text-[10px] font-sans font-medium">Đã sao chép</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={11} className="group-hover/copy:scale-110 transition-transform" />
                                                            <span className="text-[10px] font-sans font-medium">Sao chép phân tích</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {msg.suggestions && msg.suggestions.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.suggestions.map((sug, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSuggestionClick(sug)}
                                                            className="px-4 py-2 rounded-full bg-gold/5 text-gold-dark text-[12px] font-sans font-medium hover:bg-gold/15 transition-all duration-200 border border-gold/20 hover:border-gold/40 shadow-sm"
                                                        >
                                                            {sug}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-vermillion/10 text-vermillion flex items-center justify-center flex-shrink-0 shadow-sm border border-vermillion/20 mt-1">
                                    <Sparkles size={16} />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-vermillion/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-vermillion/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-vermillion/60 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-gray-100 bg-white p-3 flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxLength={500}
                                placeholder="Hỏi về sách, tác giả, mượn sách..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-parchment border border-gray-200 text-sm font-sans text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold placeholder:text-ink-light/40"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="w-10 h-10 rounded-xl bg-vermillion text-white flex items-center justify-center hover:bg-vermillion-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-ink-light/30 font-sans mt-2">
                            Trợ lý Thư Đồng · Library LMS
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbot;
