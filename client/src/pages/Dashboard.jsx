import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  FileSignature, Search, BarChart2, Landmark, ScrollText, TrendingUp,
  ArrowRight, Clock, Briefcase, FileText, Activity, Building2,
  Newspaper, ExternalLink, ChevronDown,
} from 'lucide-react';
import { dealsApi, documentsApi, marketPulseApi, newsApi } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import MarketPulseModal from '../components/MarketPulseModal.jsx';

const TOOLS = [
  { to: '/tools/loi', icon: FileSignature, num: '01', name: 'LOI Generator', desc: 'AI-drafted letters of intent in seconds.', tag: 'Legal' },
  { to: '/tools/property', icon: Search, num: '02', name: 'Property Intelligence', desc: 'Pull public data on any address.', tag: 'Research' },
  { to: '/tools/cashflow', icon: BarChart2, num: '03', name: 'Cash Flow Analyzer', desc: 'Model any asset. See all the numbers.', tag: 'Finance' },
  { to: '/tools/debt', icon: Landmark, num: '04', name: 'Debt Screener', desc: 'Know your financing options instantly.', tag: 'Financing' },
  { to: '/tools/lease', icon: ScrollText, num: '05', name: 'Lease Generator', desc: 'Professional leases in minutes.', tag: 'Legal' },
  { to: '/tools/deal', icon: TrendingUp, num: '06', name: 'Deal Analyzer', desc: 'Score any deal against real market data.', tag: 'Analysis' },
];

const TYPE_LABELS = {
  LOI: 'LOI Generated',
  LEASE_AGREEMENT: 'Lease Generated',
  CASH_FLOW_ANALYSIS: 'Cash Flow Analyzed',
  DEBT_ANALYSIS: 'Debt Screened',
  PROPERTY_INTELLIGENCE: 'Property Researched',
  DEAL_ANALYSIS: 'Deal Scored',
};

const TYPE_TO_PATH = {
  LOI: '/tools/loi',
  LEASE_AGREEMENT: '/tools/lease',
  CASH_FLOW_ANALYSIS: '/tools/cashflow',
  DEBT_ANALYSIS: '/tools/debt',
  PROPERTY_INTELLIGENCE: '/tools/property',
  DEAL_ANALYSIS: '/tools/deal',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

const NEWS_PAGE_SIZE = 8;

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [deals, setDeals] = useState([]);
  const [docs, setDocs] = useState([]);
  const [pulse, setPulse] = useState(null);
  const [news, setNews] = useState([]);
  const [newsVisible, setNewsVisible] = useState(NEWS_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [showPulseModal, setShowPulseModal] = useState(false);

  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const fetchNews = useCallback(() => {
    setNewsLoading(true);
    newsApi.get()
      .then(data => setNews(data.articles || []))
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      dealsApi.list().catch(() => ({ deals: [] })),
      documentsApi.list().catch(() => ({ documents: [] })),
      marketPulseApi.get().catch(() => null),
    ]).then(([dealData, docData, pulseData]) => {
      setDeals(dealData.deals || []);
      setDocs(docData.documents || []);
      setPulse(pulseData);
      setLoading(false);
    });

    fetchNews();

    // Auto-refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const activity = [...docs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const usageCounts = docs.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  const accentColor = settings.primaryColor || '#C8472A';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs font-semibold text-charcoal-600/60 uppercase tracking-widest mb-1">{today}</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-charcoal-900">
            {greeting}, {firstName}.
          </h1>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4">
          {[
            { label: 'Total Deals', value: deals.length, icon: Briefcase },
            { label: 'Documents', value: docs.length, icon: FileText },
            { label: 'Last Activity', value: docs[0] ? timeAgo(docs[0]?.createdAt) : '—', icon: Activity },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center bg-white border border-cream-200 rounded-xl px-4 py-3 min-w-[90px]">
              <p className="text-xs text-charcoal-600/60 mb-1">{label}</p>
              <p className="text-lg font-bold font-serif text-charcoal-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
        <div>
          {/* ── 6 Tool cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {TOOLS.map(({ to, icon: Icon, num, name, desc }) => {
              const docType = Object.entries(TYPE_LABELS).find(([, v]) => v.toLowerCase().includes(name.toLowerCase().slice(0, 4)));
              const count = usageCounts[docType?.[0]] || 0;
              const lastDoc = docs.find(d => TYPE_TO_PATH[d.type] === to);

              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="card p-5 text-left group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden"
                >
                  <span
                    className="absolute top-3 right-4 font-serif text-6xl font-bold select-none pointer-events-none"
                    style={{ color: '#F5F0E8', lineHeight: 1 }}
                  >
                    {num}
                  </span>

                  <div
                    className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: accentColor }}
                  />

                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${accentColor}15` }}
                    >
                      <Icon size={18} style={{ color: accentColor }} />
                    </div>
                    <h3 className="font-serif text-lg text-charcoal-900 mb-1">{name}</h3>
                    <p className="text-charcoal-600/70 text-xs leading-relaxed mb-4">{desc}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-150" style={{ color: accentColor }}>
                        Open Tool <ArrowRight size={12} />
                      </div>
                      <div className="text-right">
                        {count > 0 && <span className="text-xs text-charcoal-600/50">Used {count}×</span>}
                        {lastDoc && <p className="text-xs text-charcoal-600/40">{timeAgo(lastDoc.createdAt)}</p>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Recent Deals ── */}
          <div className="card p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-charcoal-900">Recent Deals</h2>
              <button onClick={() => navigate('/deals')} className="text-xs font-semibold text-charcoal-600/60 hover:text-accent transition-colors">
                View All →
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-8">
                <Building2 size={28} className="text-cream-300 mx-auto mb-2" />
                <p className="text-sm text-charcoal-600/50">No deals yet — create one to track analysis</p>
                <button onClick={() => navigate('/deals')} className="btn-primary mt-3 text-sm py-2">
                  + New Deal
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {deals.slice(0, 3).map(deal => {
                  const toolsRun = [...new Set((deal.documents || []).map(d => d.type))];
                  return (
                    <button
                      key={deal.id}
                      onClick={() => navigate(`/deals/${deal.id}`)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={16} className="text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-charcoal-900 truncate group-hover:text-accent transition-colors">{deal.address}</p>
                        <p className="text-xs text-charcoal-600/60">{deal.propertyType} · {new Date(deal.createdAt).toLocaleDateString()}</p>
                        {toolsRun.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {toolsRun.slice(0, 4).map(t => (
                              <span key={t} className="text-xs bg-cream-200 text-charcoal-700 px-1.5 py-0.5 rounded">{TYPE_LABELS[t]?.split(' ')[0] || t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-charcoal-600/30 group-hover:text-accent transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── CRE News Feed ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper size={16} className="text-accent" />
                <h2 className="font-serif text-lg text-charcoal-900">CRE News</h2>
              </div>
              <span className="text-xs text-charcoal-600/40">Auto-refreshes every 30 min</span>
            </div>

            {newsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 shimmer rounded-xl" />)}
              </div>
            ) : news.length === 0 ? (
              <p className="text-sm text-charcoal-600/50 py-6 text-center">No news available</p>
            ) : (
              <>
                <div className="divide-y divide-cream-100">
                  {news.slice(0, newsVisible).map((article, i) => (
                    <a
                      key={i}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 py-4 group hover:bg-cream-50 rounded-xl px-2 -mx-2 transition-colors"
                    >
                      {article.urlToImage && (
                        <img
                          src={article.urlToImage}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-cream-200"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-charcoal-900 group-hover:text-accent transition-colors line-clamp-2 mb-1">
                          {article.title}
                        </p>
                        <p className="text-xs text-charcoal-600/60 line-clamp-1 mb-1">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-charcoal-600/40">
                          <span>{article.source?.name || article.source}</span>
                          {article.publishedAt && (
                            <>
                              <span>·</span>
                              <span>{timeAgo(article.publishedAt)}</span>
                            </>
                          )}
                          <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {newsVisible < news.length && (
                  <button
                    onClick={() => setNewsVisible(v => v + NEWS_PAGE_SIZE)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-charcoal-600/70 hover:text-accent transition-colors border border-cream-200 rounded-xl hover:border-accent/30"
                  >
                    <ChevronDown size={14} /> Load More
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Activity Feed */}
          <div className="card p-5">
            <h2 className="font-serif text-lg text-charcoal-900 mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-charcoal-600/50 py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activity.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => navigate(TYPE_TO_PATH[doc.type] || '/dashboard')}
                    className="w-full flex items-start gap-3 text-left hover:bg-cream-50 rounded-lg p-2 -mx-2 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-charcoal-800 group-hover:text-accent transition-colors truncate">
                        {TYPE_LABELS[doc.type] || doc.type}
                      </p>
                      <p className="text-xs text-charcoal-600/60 truncate">
                        {doc.deal?.address || 'No deal linked'}
                      </p>
                      <p className="text-xs text-charcoal-600/40 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {timeAgo(doc.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Market Pulse — click to open modal */}
          <button
            className="card p-5 w-full text-left hover:shadow-md transition-all cursor-pointer group"
            onClick={() => setShowPulseModal(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-charcoal-900">Market Pulse</h2>
              <span className="text-xs text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                View Charts →
              </span>
            </div>
            {!pulse ? (
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-12 shimmer rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {pulse.stats?.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
                    <div>
                      <p className="text-xs font-medium text-charcoal-600/70">{stat.label}</p>
                      <p className="text-xs text-charcoal-600/40">{stat.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold font-serif text-charcoal-900">{stat.value}</p>
                      <p className="text-xs text-charcoal-600/40">{stat.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-charcoal-600/40 mt-3 text-center">Click to see full charts →</p>
          </button>

          {/* Getting started */}
          {docs.length === 0 && (
            <div className="bg-charcoal-900 rounded-2xl p-5 text-white">
              <h3 className="font-serif text-lg mb-3">Getting Started</h3>
              <ol className="space-y-2.5 text-sm text-white/70">
                {['Create a deal in My Deals', 'Open any tool and link it to your deal', 'All outputs auto-save automatically'].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-accent rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {showPulseModal && <MarketPulseModal onClose={() => setShowPulseModal(false)} />}
    </div>
  );
}
