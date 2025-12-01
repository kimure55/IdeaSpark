import React, { useState } from 'react';
import { generateIdeas } from './services/geminiService';
import { Idea } from './types';
import IdeaCard from './components/IdeaCard'; // Keep for fallback or alternative view if needed
import MindMap3D from './components/MindMap3D';
import ChatWidget from './components/ChatWidget';

function App() {
  const [keyword, setKeyword] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');

  const performSearch = async (term: string) => {
    if (!term.trim()) return;

    setLoading(true);
    setError('');
    setIdeas([]);
    setSearchedKeyword(term);
    setKeyword(term); // Sync input field

    try {
      const generatedIdeas = await generateIdeas(term);
      setIdeas(generatedIdeas);
      if (generatedIdeas.length === 0) {
        setError('未能生成想法，请尝试其他关键词。');
      }
    } catch (err) {
      setError('生成失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(keyword);
  };

  const handleSetAsCore = (newKeyword: string) => {
    performSearch(newKeyword);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden text-slate-100">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-brand-900/20 to-transparent -z-10"></div>
      
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Idea<span className="text-brand-400">Spark</span> <span className="text-slate-500 font-light text-2xl">灵感火花</span>
          </h1>
          <p className="text-md md:text-lg text-slate-400 max-w-2xl mx-auto">
            用AI驱动的横向思维引擎点燃你的创造力。
            输入一个关键词，探索相关概念的3D宇宙。
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-12 relative z-10">
          <form onSubmit={handleGenerate} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-brand-700 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-900 rounded-full shadow-2xl border border-slate-700 p-2 pr-2">
              <div className="pl-6 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入关键词 (例如：创新, 梦境)..."
                className="flex-1 p-3 md:p-4 bg-transparent focus:outline-none text-lg text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className="bg-brand-600 text-white px-6 md:px-8 py-3 rounded-full font-medium hover:bg-brand-500 focus:ring-4 focus:ring-brand-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden md:inline">思考中...</span>
                  </>
                ) : (
                  <>
                    <span>生成</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 mb-8 bg-red-900/20 text-red-400 rounded-lg text-center border border-red-800/50">
            {error}
          </div>
        )}

        {ideas.length > 0 && (
          <div className="animate-fade-in w-full">
            <div className="flex items-center justify-between mb-6 px-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-200">
                <span className="text-brand-400 border-b-2 border-brand-500/30">"{searchedKeyword}"</span> 的思维宇宙
              </h2>
              <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700 shadow-sm">
                 <button 
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === '3d' ? 'bg-brand-900/50 text-brand-300 font-medium border border-brand-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   3D 视图
                 </button>
                 <button 
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'grid' ? 'bg-brand-900/50 text-brand-300 font-medium border border-brand-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   卡片视图
                 </button>
              </div>
            </div>
            
            {viewMode === '3d' ? (
              <div className="w-full animate-fade-in-up">
                <MindMap3D ideas={ideas} centerKeyword={searchedKeyword} onSetAsCore={handleSetAsCore} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {ideas.map((idea, index) => (
                  <IdeaCard key={idea.id} idea={idea} delay={index * 50} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
               <p className="text-slate-500 text-sm mb-4">想对这些想法进行深入探讨？</p>
               <button 
                onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="AI 助手"]')?.click()}
                className="text-brand-400 font-medium hover:text-brand-300 hover:underline cursor-pointer"
               >
                 点击右下角，询问 AI 助手
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Chat Widget */}
      <ChatWidget />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0; /* Start hidden for delay to work */
        }
      `}</style>
    </div>
  );
}

export default App;