import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiTutor: React.FC = () => {
  // Check if API Key is present (Vite replaces process.env.API_KEY during build)
  const hasApiKey = typeof process.env.API_KEY === 'string' && process.env.API_KEY.length > 0;

  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: hasApiKey 
        ? '你好！我是婷婷老师。关于彩虹、光线或者物理，你有什么想问的吗？(Hi! I am Teacher TingTing. Ask me anything about rainbows!)' 
        : '你好！我是婷婷老师。由于未配置 API Key，我目前处于离线模式。不过你依然可以尽情探索上方的物理实验！(AI Offline mode)'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    
    // Graceful fallback if no key
    if (!hasApiKey) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
            role: 'model', 
            text: '💡 这是一个模拟回复：AI 功能目前未激活（缺少 API Key）。请在部署设置中配置 Google Gemini API Key 以解锁智能问答。' 
        }]);
      }, 500);
      return;
    }

    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview'; // Or gemini-1.5-flash-latest if preferred

      const systemPrompt = `
        You are a friendly, enthusiastic physics tutor for teenagers named "Teacher TingTing". 
        Your goal is to explain optical physics (rainbows, light, reflection, refraction) in simple, engaging Chinese.
        Keep answers short (under 100 words), use emojis, and encourage curiosity.
        If the user asks about something unrelated to science, politely steer them back to rainbows or light.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\nUser question: " + userMsg }] }
        ]
      });

      const text = response.text || "Sorry, I couldn't think of an answer right now.";
      
      setMessages(prev => [...prev, { role: 'model', text }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: '哎呀，我的大脑短路了。请检查网络或 API Key 配置。(Error connecting to AI)' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg overflow-hidden">
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
          {hasApiKey ? '👩‍🏫 提问婷婷老师' : '👩‍🏫 婷婷老师 (离线)'}
        </h3>
        <span className="text-[10px] text-slate-500">Ask Teacher TingTing</span>
      </div>
      
      {/* Messages - Compact */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-xl px-3 py-1.5 text-xs md:text-sm ${
              m.role === 'user' 
                ? 'bg-sky-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-400 px-3 py-1.5 rounded-xl rounded-bl-none text-[10px] animate-pulse">
              婷婷老师正在思考...
            </div>
          </div>
        )}
      </div>

      {/* Input - Compact */}
      <div className="p-2 bg-slate-900/50 border-t border-slate-700">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={hasApiKey ? "为什么天空是蓝色的？" : "AI 暂不可用，仅供预览 UI"}
            disabled={!hasApiKey && messages.length > 2} // Optional: limit interaction if offline
            className={`flex-1 bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500 ${!hasApiKey ? 'opacity-50' : ''}`}
          />
          <button 
            onClick={handleSend}
            disabled={loading || (!hasApiKey && messages.length > 2)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${
                hasApiKey 
                ? 'bg-sky-600 hover:bg-sky-500 text-white' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;