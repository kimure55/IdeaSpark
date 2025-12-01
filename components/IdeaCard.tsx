import React from 'react';
import { Idea } from '../types';

interface IdeaCardProps {
  idea: Idea;
  delay: number;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, delay }) => {
  return (
    <div 
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-5 hover:shadow-brand-500/10 hover:border-brand-500/50 transition-all duration-300 hover:-translate-y-1 group animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold tracking-wider text-brand-300 bg-brand-900/30 px-2 py-1 rounded-full border border-brand-500/20 uppercase">
          {idea.category}
        </span>
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-brand-400 transition-colors">
        {idea.phrase}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300">
        {idea.description}
      </p>
    </div>
  );
};

export default IdeaCard;