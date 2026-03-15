import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Trash2 } from 'lucide-react';

import { ChatMessage } from '../types';
import axios from 'axios';

interface AIChatbotProps {
}

const AIChatbot: React.FC<AIChatbotProps> = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const saved = localStorage.getItem('library_chat_memory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            } catch (e) {
                return [];
            }
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(messages.length === 0 ? 1 : 0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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
            id: Date.now().toString(),
            type: 'user',
            text: text.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || localStorage.getItem('userToken');

            if (!token) {
                const errorMsg: ChatMessage = {
                    id: Date.now().toString(),
                    type: 'bot',
                    text: 'Xin lỗi, bạn cần đăng nhập tài khoản thư viện để trò chuyện với Thư Đồng. Hãy mượn sách hoặc tìm kiếm thông tin sau khi đăng nhập nhé!',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMsg]);
                setIsTyping(false);
                return;
            }

            // Prepare message history for AI
            const history = messages.map(m => ({
                role: m.type === 'user' ? 'user' : 'assistant',
                content: m.text
            }));
            history.push({ role: 'user', content: text.trim() });

            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/chat`,
                { messages: history, model: 'google/gemini-2.0-flash-001' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: 'bot',
                text: response.data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            const errorMsg: ChatMessage = {
                id: (Date.now() + 2).toString(),
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

    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            let processed = line
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-ink">$1</strong>')
                .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
                .replace(/• /g, '<span class="text-vermillion mr-1.5">•</span> ');
            return <p key={i} className={`leading-relaxed ${line === '' ? 'h-3' : 'mb-2 last:mb-0'}`} dangerouslySetInnerHTML={{ __html: processed }} />;
        });
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-vermillion to-vermillion-dark text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                >
                    <div className="pulse-ring" />
                    <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center font-sans">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[560px] max-h-[calc(100vh-48px)] flex flex-col rounded-2xl overflow-hidden chatbot-container animate-chatSlideUp bg-white">
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
                    <div className="flex-1 overflow-y-auto p-5 pl-4 space-y-5 chat-messages bg-gradient-to-b from-parchment/30 to-white pb-36">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'user' ? 'animate-chatBubbleRight' : 'animate-chatBubble'
                                    } `}
                            >
                                <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-1' : 'order-2'}`}>
                                    {/* Avatar */}
                                    <div className={`flex items-start gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''} `}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.type === 'user'
                                            ? 'bg-sky/10 text-sky border border-sky/20'
                                            : 'bg-vermillion/10 text-vermillion border border-vermillion/20'
                                            } `}>
                                            {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                                        </div>

                                        <div>
                                            {/* Message Bubble */}
                                            <div className={`rounded-2xl px-5 py-3.5 text-[14.5px] font-sans leading-relaxed shadow-sm ${msg.type === 'user'
                                                ? 'bg-gradient-to-br from-sky to-sky-dark text-white rounded-tr-sm'
                                                : 'bg-white border border-parchment-dark rounded-tl-sm text-ink-light'
                                                } `}>
                                                {renderMarkdown(msg.text)}
                                            </div>

                                            {/* Suggestions */}
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

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-start gap-3 animate-chatBubble">
                                <div className="w-8 h-8 rounded-full bg-vermillion/10 text-vermillion flex items-center justify-center flex-shrink-0 shadow-sm border border-vermillion/20 mt-1">
                                    <Sparkles size={16} />
                                </div>
                                <div className="bg-white border border-parchment-dark rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                                    <div className="flex items-center gap-1.5">
                                        <div className="typing-dot bg-vermillion/60" />
                                        <div className="typing-dot bg-vermillion/60" />
                                        <div className="typing-dot bg-vermillion/60" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-parchment-dark bg-white p-3 flex-shrink-0">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                maxLength={500}
                                placeholder="Hỏi về sách, tác giả, mượn sách..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-parchment border border-parchment-dark text-sm font-sans text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold placeholder:text-ink-light/40"
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
