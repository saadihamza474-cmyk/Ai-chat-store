/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, ShoppingBag, Truck, User, Bot, MessageSquare, Settings, Plus, Trash2, Save, Eye, Layout, Code, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessage, StoreConfig } from './services/geminiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const DEFAULT_CONFIG: StoreConfig = {
  name: 'متجري الجديد',
  deliveryTime: '3 أيام عمل',
  products: [
    { name: 'قميص قطني', price: '50 ريال', material: 'قطن 100%', imageUrl: 'https://picsum.photos/seed/shirt/200/200' }
  ],
  additionalInfo: 'سياسة الاستبدال متاحة خلال 7 أيام.'
};

export default function App() {
  const [view, setView] = useState<'admin' | 'customer' | 'integration'>('admin');
  const [isWidget, setIsWidget] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'widget') {
      setIsWidget(true);
      setView('customer');
    }
  }, []);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  const shopifySnippet = `<!-- AI Assistant Widget by Elegant Store -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = "${window.location.origin}/widget.js";
    script.async = true;
    script.dataset.storeName = "${storeConfig.name}";
    document.head.appendChild(script);
  })();
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shopifySnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `مرحباً بك في ${DEFAULT_CONFIG.name}! كيف يمكنني مساعدتك اليوم؟`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'customer') {
      scrollToBottom();
    }
  }, [messages, view]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }],
    }));

    const botResponseText = await sendMessage(input, storeConfig, history);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponseText,
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const addProduct = () => {
    setStoreConfig({
      ...storeConfig,
      products: [...storeConfig.products, { name: '', price: '' }]
    });
  };

  const updateProduct = (index: number, field: keyof StoreConfig['products'][0], value: string) => {
    const newProducts = [...storeConfig.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setStoreConfig({ ...storeConfig, products: newProducts });
  };

  const removeProduct = (index: number) => {
    setStoreConfig({
      ...storeConfig,
      products: storeConfig.products.filter((_, i) => i !== index)
    });
  };

  const renderMessageContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <div className="space-y-3">
        {parts.map((part, idx) => {
          if (part.match(urlRegex)) {
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl overflow-hidden border border-white/20 shadow-inner mt-2"
              >
                <img 
                  src={part} 
                  alt="Product" 
                  className="w-full h-40 object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            );
          }
          return part.trim() ? <p key={idx}>{part}</p> : null;
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] flex flex-col items-center ${isWidget ? 'p-0 justify-end' : 'p-4 md:p-8'}`} dir="rtl">
      {/* SaaS Navigation */}
      {!isWidget && (
        <nav className="w-full max-w-4xl mb-8 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Layout size={20} />
            </div>
            <h2 className="font-bold text-lg">لوحة تحكم الذكاء الاصطناعي</h2>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setView('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'admin' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
            >
              <Settings size={16} /> الإعدادات
            </button>
            <button 
              onClick={() => setView('integration')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'integration' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
            >
              <Code size={16} /> التفعيل (Shopify)
            </button>
            <button 
              onClick={() => setView('customer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'customer' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
            >
              <Eye size={16} /> معاينة
            </button>
          </div>
        </nav>
      )}

      <AnimatePresence mode="wait">
        {view === 'admin' ? (
          <motion.div 
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Store Settings Form */}
            <div className="md:col-span-2 space-y-6">
              <section className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag size={20} /> معلومات المتجر
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">اسم المتجر</label>
                    <input 
                      type="text" 
                      value={storeConfig.name}
                      onChange={(e) => setStoreConfig({ ...storeConfig, name: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">مدة التوصيل</label>
                    <input 
                      type="text" 
                      value={storeConfig.deliveryTime}
                      onChange={(e) => setStoreConfig({ ...storeConfig, deliveryTime: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">معلومات إضافية (سياسات، عروض)</label>
                  <textarea 
                    value={storeConfig.additionalInfo}
                    onChange={(e) => setStoreConfig({ ...storeConfig, additionalInfo: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none h-24 resize-none"
                  />
                </div>
              </section>

              <section className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Plus size={20} /> المنتجات
                  </h3>
                  <button 
                    onClick={addProduct}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all flex items-center gap-2"
                  >
                    إضافة منتج
                  </button>
                </div>
                <div className="space-y-4">
                  {storeConfig.products.map((product, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-black/5 space-y-4 relative group">
                      <button 
                        onClick={() => removeProduct(idx)}
                        className="absolute top-4 left-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          placeholder="اسم المنتج"
                          value={product.name}
                          onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                          className="bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                        />
                        <input 
                          placeholder="السعر"
                          value={product.price}
                          onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                          className="bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                        />
                        <input 
                          placeholder="رابط الصورة (اختياري)"
                          value={product.imageUrl}
                          onChange={(e) => updateProduct(idx, 'imageUrl', e.target.value)}
                          className="bg-white border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black/5 outline-none md:col-span-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar / Tips */}
            <div className="space-y-6">
              <div className="bg-black text-white p-8 rounded-[32px] shadow-lg">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Save size={18} /> نصيحة احترافية
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  كلما أضفت تفاصيل أكثر عن منتجاتك (الخامة، المقاسات، الصور)، كلما كان المساعد الذكي أكثر دقة في الرد على عملائك.
                </p>
                <button className="mt-6 w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all">
                  حفظ الإعدادات
                </button>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px]">
                <h4 className="font-bold text-emerald-900 mb-2">الحالة</h4>
                <p className="text-sm text-emerald-700">الذكاء الاصطناعي جاهز للعمل على متجرك الحالي.</p>
              </div>
            </div>
          </motion.div>
        ) : view === 'integration' ? (
          <motion.div 
            key="integration"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-3xl space-y-8"
          >
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Code size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">تفعيل المساعد في Shopify</h3>
                  <p className="text-gray-500">انسخ الكود أدناه وضعه في متجرك بضغطة زر.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-gray-900 rounded-2xl relative group">
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copied ? 'تم النسخ!' : 'نسخ الكود'}
                  </button>
                  <pre className="text-indigo-300 text-sm font-mono overflow-x-auto pt-4 leading-relaxed">
                    {shopifySnippet}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <ExternalLink size={18} /> الخطوة 1: Shopify Admin
                    </h4>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                      اذهب إلى لوحة تحكم شوبيفاي {'>'} Online Store {'>'} Themes {'>'} Edit Code.
                    </p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                      <Save size={18} /> الخطوة 2: لصق الكود
                    </h4>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                      ابحث عن ملف <code className="bg-white/50 px-1 rounded">theme.liquid</code> والصق الكود قبل وسم <code className="bg-white/50 px-1 rounded">{'</body>'}</code> مباشرة.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black text-white p-8 rounded-[32px] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg mb-1">هل تحتاج مساعدة في الربط؟</h4>
                <p className="text-gray-400 text-sm">فريقنا جاهز لمساعدتك في إعداد المساعد لمتجرك مجاناً.</p>
              </div>
              <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all">
                تواصل معنا
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="customer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`w-full max-w-2xl bg-white shadow-xl overflow-hidden flex flex-col border border-black/5 ${isWidget ? 'h-screen rounded-none' : 'h-[80vh] rounded-[32px]'}`}
          >
            {/* Chat Header */}
            <header className="px-8 py-6 border-bottom border-black/5 bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{storeConfig.name}</h1>
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    متصل الآن
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <Truck size={20} className="text-gray-500" />
                </button>
              </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.sender === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-black text-white'
                      }`}>
                        {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div className={`px-5 py-3 rounded-[24px] text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-white border border-black/5 shadow-sm rounded-tr-none' 
                          : 'bg-black text-white rounded-tl-none'
                      }`}>
                        {msg.sender === 'bot' ? renderMessageContent(msg.text) : msg.text}
                        <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-gray-500' : 'text-gray-300'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
                >
                  <div className="bg-black/5 px-4 py-2 rounded-full flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-6 bg-white border-top border-black/5">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اكتب استفسارك هنا..."
                  className="flex-1 bg-[#F5F5F5] border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black/5 transition-all outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
                >
                  <Send size={20} className="rotate-180" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {storeConfig.products.slice(0, 3).map((p, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setInput(`بكم ${p.name}؟`)}
                    className="text-[11px] font-medium text-gray-500 hover:text-black bg-black/5 px-3 py-1.5 rounded-full transition-colors"
                  >
                    سعر {p.name}
                  </button>
                ))}
                <button 
                  onClick={() => setInput('متى يصل الطلب؟')}
                  className="text-[11px] font-medium text-gray-500 hover:text-black bg-black/5 px-3 py-1.5 rounded-full transition-colors"
                >
                  موعد التوصيل
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
