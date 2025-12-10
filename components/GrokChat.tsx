import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './ui/Icons';
import { ChatMessage } from '../types';

interface GrokChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrokChat: React.FC<GrokChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Grüezi! Ich bin Grok, dein Schweizer Shopify-Assistent. Wie kann ich dir heute beim Shop-Management helfen?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Ich habe das verstanden. Soll ich die Produktbeschreibung für 'Alpenluft' auf Schweizerdeutsch umschreiben?",
        "Ich analysiere gerade deine SEO-Daten. Es sieht so aus, als könnten wir bei 5 Produkten die Meta-Tags verbessern.",
        "Das habe ich erledigt. Die Kollektion 'Winter 2024' wurde aktualisiert.",
        "Möchtest du, dass ich einen Instagram-Post für dieses neue Produkt generiere?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-[#0f0f16]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Icons.Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Grok AI</h3>
            <p className="text-xs text-indigo-300">Shopify Assistant (CH)</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
          <Icons.Close className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/5'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl p-3 rounded-bl-none flex gap-1 items-center">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-[#0a0a0f]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Frag Grok etwas..."
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            <Icons.Zap className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-full whitespace-nowrap text-slate-400">
            SEO Optimieren
          </button>
          <button className="text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-full whitespace-nowrap text-slate-400">
            Social Post generieren
          </button>
        </div>
      </div>
    </div>
  );
};