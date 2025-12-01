import React, { useState, useRef, useEffect } from 'react';
import { ChatService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { GenerateContentResponse } from '@google/genai';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'model', text: '你好！我可以帮你进行头脑风暴或完善你的想法。你需要什么帮助？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatServiceRef = useRef<ChatService | null>(null);

  // Initialize chat service only once
  useEffect(() => {
    chatServiceRef.current = new ChatService();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatServiceRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const stream = await chatServiceRef.current.sendMessageStream(userMsg.text);
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

      let fullText = '';
      
      for await (const chunk of stream) {
        const content = chunk as GenerateContentResponse;
        const text = content.text || '';
        fullText += text;
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: fullText } : msg
          )
        );
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "抱歉，遇到了一些错误，请重试。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-slate-900 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl border border-slate-700 flex flex-col mb-4 overflow-hidden transition-all duration-300 origin-bottom-right transform scale-100">
          {/* Header */}
          <div className="bg-slate-800 p-4 text-white border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2 text-brand-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              AI 灵感助手
            </h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-slate-700 p-1 rounded text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 custom-scrollbar space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
               <div className="flex justify-start">
               <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                 </div>
               </div>
             </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="问点什么..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-500"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white p-4 rounded-full shadow-lg shadow-brand-900/50 transition-transform hover:scale-105 flex items-center gap-2 group border border-brand-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            AI 助手
          </span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;