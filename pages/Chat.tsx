
import React, { useState, useEffect, useRef } from 'react';
import { subscribeToCollection, addDocument } from '../services/firestoreService';
import { Send, MessageSquare, Hash } from 'lucide-react';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channel, setChannel] = useState('General');
  const scrollRef = useRef<HTMLDivElement>(null);
  const user = JSON.parse(localStorage.getItem('church_mgmt_user') || '{}');

  const channels = ['General', 'Leadership', 'Ministry Heads', 'Youth', 'Worship Team'];

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToCollection('chat_messages', (data) => {
      const msgs = data
        .filter((msg: any) => msg.channel === channel)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [channel, user?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid) return;

    try {
      await addDocument('chat_messages', {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        content: newMessage,
        channel: channel,
        branchId: 'main' // Default for now
      });
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-blue-50 border-r border-blue-100 flex flex-col">
          <div className="p-6 border-b border-blue-100">
            <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} className="text-blue-600" /> Channels
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {channels.map(ch => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-bold transition-all ${
                  channel === ch 
                    ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' 
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Hash size={14} opacity={channel === ch ? 1 : 0.5} />
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-blue-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Hash size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-blue-900 uppercase tracking-tight">{channel}</h2>
                <p className="text-[10px] text-blue-500 font-bold">Official Church Communication Channel</p>
              </div>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-blue-300 space-y-4 opacity-50">
                <MessageSquare size={48} />
                <p className="text-xs font-bold uppercase tracking-widest">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group`}>
                      {!isMe && (
                        <p className="text-[9px] font-black text-blue-600 uppercase mb-1 ml-1 tracking-wider">
                          {msg.senderName}
                        </p>
                      )}
                      <div className={`px-4 py-3 rounded-2xl shadow-sm relative ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-blue-50 text-blue-900 rounded-tl-none border border-blue-100'
                      }`}>
                        <p className="text-[11px] font-medium leading-relaxed">{msg.content}</p>
                        <p className={`text-[8px] mt-1 opacity-50 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-6 bg-blue-50/50 border-t border-blue-100">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${channel.toLowerCase()}...`}
                className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-3 text-[11px] font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
