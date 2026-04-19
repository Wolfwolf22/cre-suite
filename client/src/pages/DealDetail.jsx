import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, BarChart2, Landmark, Search, TrendingUp, ScrollText, Building2, Calendar } from 'lucide-react';
import { useDeal } from '../hooks/useDeals.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const DOC_ICONS = {
  LOI: { icon: FileText, label: 'Letter of Intent', color: 'text-purple-600 bg-purple-50' },
  LEASE_AGREEMENT: { icon: ScrollText, label: 'Lease Agreement', color: 'text-indigo-600 bg-indigo-50' },
  CASH_FLOW_ANALYSIS: { icon: BarChart2, label: 'Cash Flow Analysis', color: 'text-emerald-600 bg-emerald-50' },
  DEBT_ANALYSIS: { icon: Landmark, label: 'Debt Analysis', color: 'text-cyan-600 bg-cyan-50' },
  PROPERTY_INTELLIGENCE: { icon: Search, label: 'Property Intelligence', color: 'text-blue-600 bg-blue-50' },
  DEAL_ANALYSIS: { icon: TrendingUp, label: 'Deal Analysis', color: 'text-amber-600 bg-amber-50' },
};

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deal, loading, error } = useDeal(id);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="shimmer h-8 w-64 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 shimmer" />)}
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <ErrorBanner message={error || 'Deal not found'} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate('/deals')}
        className="flex items-center gap-2 text-charcoal-600 hover:text-accent mb-6 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={16} /> Back to My Deals
      </button>

      {/* Deal header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-charcoal-900">{deal.address}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-charcoal-600">{deal.propertyType}</span>
              <span className="text-charcoal-600/30">·</span>
              <span className="text-sm text-charcoal-600 flex items-center gap-1">
                <Calendar size={13} /> Created {new Date(deal.createdAt).toLocaleDateString()}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                {deal.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <h2 className="font-serif text-xl text-charcoal-900 mb-4">Saved Documents</h2>
      {deal.documents?.length === 0 ? (
        <div className="card p-8 text-center text-charcoal-600/60">
          <FileText size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No documents yet. Run any tool with this deal selected.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deal.documents?.map(doc => {
            const cfg = DOC_ICONS[doc.type] || { icon: FileText, label: doc.type, color: 'text-charcoal-600 bg-cream-100' };
            const Icon = cfg.icon;
            const content = doc.content;
            const hasText = content?.text;

            return (
              <div key={doc.id} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-charcoal-900 text-sm">{cfg.label}</p>
                  <p className="text-xs text-charcoal-600/60">
                    {new Date(doc.createdAt).toLocaleString()}
                    {hasText && ` · ${Math.ceil(content.text.split(' ').length / 200)} min read`}
                  </p>
                </div>
                {hasText && (
                  <button
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText(content.text);
                    }}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    Copy
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cash flows */}
      {deal.cashFlows?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-xl text-charcoal-900 mb-4">Cash Flow Analyses ({deal.cashFlows.length})</h2>
          <div className="space-y-2">
            {deal.cashFlows.map(cf => (
              <div key={cf.id} className="card p-4">
                <p className="text-sm font-medium text-charcoal-900">
                  Purchase: ${Number(cf.inputs?.purchasePrice || 0).toLocaleString()} ·
                  Cap Rate: {cf.outputs?.capRate}% ·
                  CoC: {cf.outputs?.cashOnCash}%
                </p>
                <p className="text-xs text-charcoal-600/60 mt-0.5">{new Date(cf.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comps */}
      {deal.comps?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-serif text-xl text-charcoal-900 mb-4">Comparable Sales ({deal.comps.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-200">
                  <th className="text-left pb-2 text-charcoal-600/70 font-medium">Property</th>
                  <th className="text-right pb-2 text-charcoal-600/70 font-medium">Cap Rate</th>
                  <th className="text-right pb-2 text-charcoal-600/70 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {deal.comps.map(comp => (
                  <tr key={comp.id}>
                    <td className="py-2 text-charcoal-900">{comp.address}</td>
                    <td className="py-2 text-right text-charcoal-700">{comp.capRate ? `${comp.capRate}%` : '—'}</td>
                    <td className="py-2 text-right text-charcoal-600/60">{comp.source || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
