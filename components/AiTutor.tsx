import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '你好！我是光之博士。关于彩虹、光线或者物理，你有什么想问的吗？(Hi! I am Dr. Light. Ask me anything about rainbows!)' }
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
    setLoading(true);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key is missing");
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-flash-preview'; 

      const systemPrompt = `
        You are a friendly, enthusiastic physics tutor for teenagers named "Dr. Light". 
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
      setMessages(prev => [...prev, { role: 'model', text: '哎呀，我的大脑短路了。请检查API Key配置。(Error connecting to AI)' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-full shadow-lg overflow-hidden">
      {/* Header - Compact */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2">
          🤖 提问 AI 博士
        </h3>
        <span className="text-[10px] text-slate-500">Ask Dr. Light</span>
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
              博士正在思考...
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
            placeholder="为什么天空是蓝色的？"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;