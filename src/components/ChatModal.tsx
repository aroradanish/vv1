'use client';

import { useEffect, useRef, useState } from 'react';
import { api, Message } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ChatModal({
  bookingId,
  onClose,
  title,
}: {
  bookingId: string;
  onClose: () => void;
  title: string;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const msgs = await api.getMessages(bookingId);
        setMessages(msgs);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [bookingId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const text = content.trim();
    setContent('');
    try {
      const msg = await api.sendMessage(bookingId, text);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      alert('Failed to send message: ' + (err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:!bg-[#0f0003] w-full max-w-[450px] h-[600px] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-line animate-modalUp">
        {/* Header */}
        <div className="p-5 border-b border-line flex justify-between items-center bg-primary text-white">
          <div>
            <h3 className="m-0 font-bold text-lg">{title}</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">Direct Interaction</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/40 transition-colors text-white font-bold">×</button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-section dark:!bg-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="neu-spinner !w-8 !h-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-ink-muted">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-medium">No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[14px] font-medium shadow-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-white/10 text-ink-main dark:text-white rounded-tl-none border border-line'
                  }`}>
                    {m.content}
                    <div className={`text-[9px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={send} className="p-4 border-t border-line bg-white dark:!bg-[#0f0003] flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-line bg-section outline-none text-sm font-medium focus:border-primary"
          />
          <button type="submit" disabled={!content.trim()} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 -rotate-45 translate-x-0.5">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
