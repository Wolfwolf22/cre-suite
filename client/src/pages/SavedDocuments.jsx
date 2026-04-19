import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Copy, ExternalLink, Search } from 'lucide-react';
import { documentsApi } from '../lib/api.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const TYPE_LABELS = {
  LOI: 'Letter of Intent',
  LEASE_AGREEMENT: 'Lease Agreement',
  CASH_FLOW_ANALYSIS: 'Cash Flow Analysis',
  DEBT_ANALYSIS: 'Debt Analysis',
  PROPERTY_INTELLIGENCE: 'Property Intelligence',
  DEAL_ANALYSIS: 'Deal Analysis',
};

const TYPE_COLORS = {
  LOI: 'bg-purple-100 text-purple-700',
  LEASE_AGREEMENT: 'bg-indigo-100 text-indigo-700',
  CASH_FLOW_ANALYSIS: 'bg-emerald-100 text-emerald-700',
  DEBT_ANALYSIS: 'bg-cyan-100 text-cyan-700',
  PROPERTY_INTELLIGENCE: 'bg-blue-100 text-blue-700',
  DEAL_ANALYSIS: 'bg-amber-100 text-amber-700',
};

export default function SavedDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [copied, setCopied] = useState(null);
  const [preview, setPreview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    documentsApi.list()
      .then(data => { setDocuments(data.documents || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleCopy = (doc) => {
    const text = doc.content?.text || JSON.stringify(doc.content, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(doc.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id) => {
    try {
      await documentsApi.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = documents.filter(doc => {
    if (!filter) return true;
    const search = filter.toLowerCase();
    return (
      TYPE_LABELS[doc.type]?.toLowerCase().includes(search) ||
      doc.deal?.address?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-charcoal-900">Saved Documents</h1>
        <p className="text-charcoal-600 text-sm mt-1">{documents.length} document{documents.length !== 1 ? 's' : ''} saved</p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-600/40" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by type or address..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-16 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={36} className="text-cream-300 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">No documents found</h3>
          <p className="text-charcoal-600 text-sm">
            {filter ? 'Try a different search term' : 'Generated documents will appear here automatically'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="card">
              {confirmDelete === doc.id ? (
                <div className="p-4 flex items-center gap-4">
                  <p className="text-sm text-charcoal-700 flex-1">Delete this document? This cannot be undone.</p>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-600 text-sm font-semibold">Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-charcoal-600 text-sm">Cancel</button>
                </div>
              ) : (
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.type] || 'bg-cream-200 text-charcoal-700'}`}>
                        {TYPE_LABELS[doc.type] || doc.type}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-900 truncate">
                      {doc.deal?.address || 'No deal'}
                    </p>
                    <p className="text-xs text-charcoal-600/60">
                      {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreview(preview?.id === doc.id ? null : doc)}
                      className="btn-ghost text-xs py-1.5 px-3"
                    >
                      <ExternalLink size={13} /> {preview?.id === doc.id ? 'Close' : 'View'}
                    </button>
                    {doc.content?.text && (
                      <button onClick={() => handleCopy(doc)} className="btn-ghost text-xs py-1.5 px-3">
                        <Copy size={13} /> {copied === doc.id ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                    <button onClick={() => setConfirmDelete(doc.id)} className="btn-ghost text-xs py-1.5 px-2 text-red-400 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Preview panel */}
              {preview?.id === doc.id && doc.content?.text && (
                <div className="border-t border-cream-200 p-4">
                  <div className="bg-cream-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-charcoal-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {doc.content.text}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
