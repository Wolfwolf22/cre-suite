import React from 'react';

const ratingConfig = {
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-800', label: 'Strong' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-800', label: 'Moderate' },
  red: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-800', label: 'Weak' },
};

export function RatingBadge({ rating, label }) {
  const cfg = ratingConfig[rating] || ratingConfig.yellow;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label || cfg.label}
    </span>
  );
}

export function ScoreBar({ score, maxScore = 10 }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-cream-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-charcoal-900 w-12 text-right">{score}/{maxScore}</span>
    </div>
  );
}

export function ScoreCategory({ title, score, rating, rationale }) {
  const cfg = ratingConfig[rating] || ratingConfig.yellow;
  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-semibold text-sm ${cfg.text}`}>{title}</h4>
        <RatingBadge rating={rating} label={`${score}/10`} />
      </div>
      <ScoreBar score={score} />
      {rationale && <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">{rationale}</p>}
    </div>
  );
}

export function OverallScore({ score }) {
  const color = score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-600';
  const ring = score >= 7 ? 'stroke-emerald-500' : score >= 5 ? 'stroke-amber-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#DDD0BB" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            className={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold font-serif ${color}`}>{score}</span>
          <span className="text-xs text-charcoal-600">/ 10</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-charcoal-700 mt-2">Deal Score</p>
    </div>
  );
}
