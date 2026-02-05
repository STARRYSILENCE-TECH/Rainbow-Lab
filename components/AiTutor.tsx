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
        : '你好！我是婷婷老师。目前处于离线演示模式，但我依然可以回答关于彩虹的基础问题哦！(Offline Demo Mode)'
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

  // Simple keyword matching for offline mode
  const getOfflineResponse = (query: string): string => {
      const q = query.toLowerCase();
      if (q.includes('圆') || q.includes('弯') || q.includes('形状') || q.includes('circle') || q.includes('round')) {
          return "这是一个非常棒的问题！彩虹之所以是圆的，是因为水滴是球形的。当阳光照射到球形水滴上时，反射出的光线形成一个圆锥体（42度角）。我们站在地面上，通常只能看到这个圆锥的上半部分，所以就是一个拱形。如果你在飞机上，是有机会看到完整的圆形彩虹的！🌈";
      }
      if (q.includes('颜') || q.includes('色') || q.includes('color') || q.includes('七')) {
          return "彩虹主要由红、橙、黄、绿、蓝、靛、紫七种颜色组成。这是因为阳光（白光）中包含了所有这些颜色，但不同颜色的光穿过水滴时“转弯”（折射）的角度不一样。红色转弯最少，紫色转弯最多，它们就散开了！";
      }
      if (q.includes('主虹') || q.includes('副虹') || q.includes('双') || q.includes('primary') || q.includes('secondary')) {
          return "观察得很仔细！主虹（内侧的那条）颜色鲜艳，外红内紫，光线在水滴里反射了1次。副虹（外侧的那条）比较暗，外紫内红，光线在水滴里反射了2次。因为多反射了一次，光线损失了更多能量，所以副虹看起来淡淡的。";
      }
      if (q.includes('你好') || q.includes('hi') || q.includes('hello')) {
          return "你好呀！我是专门研究彩虹的物理老师。你可以问我“为什么彩虹是圆的？”或者“副虹是怎么产生的？”";
      }
      return "我现在处于离线模式，大脑连接不到云端，只能回答一些预设的基础物理问题。不过上方的物理实验模拟是完全准确的，快去试试拖动滑块吧！✨";
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    
    // Graceful fallback / Demo Mode if no key
    if (!hasApiKey) {
      setTimeout(() => {
        const reply = getOfflineResponse(userMsg);
        setMessages(prev => [...prev, { role: 'model', text: reply }]);
        setLoading(false);
      }, 800); // Simulate a little "thinking" delay
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview'; 

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
      setMessages(prev => [...prev, { role: 'model', text: '哎呀，网络有点波动。请检查网络连接。(Connection Error)' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg overflow-hidden">
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
          {hasApiKey ? '👩‍🏫 提问婷婷老师' : '👩‍🏫 婷婷老师 (演示模式)'}
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
            placeholder={hasApiKey ? "为什么天空是蓝色的？" : "试着问我：为什么彩虹是圆的？"}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50`}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;