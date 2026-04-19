import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Briefcase, Building2, ChevronRight, Trash2, FileText, BarChart2,
  Landmark, Search, X, Trophy, CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDeals } from '../hooks/useDeals.js';
import { dealsApi } from '../lib/api.js';
import ErrorBanner from '../components/ErrorBanner.jsx';

const PROPERTY_TYPES = ['Multifamily', 'Office', 'Retail', 'Industrial', 'Mixed-Use', 'Other'];

const STATUSES = [
  { value: 'Active', label: 'Active', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'Under Contract', label: 'Under Contract', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'Completed', label: 'Completed', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'Dead', label: 'Dead', color: 'bg-red-100 text-red-700 border-red-200' },
];

const toolLabels = {
  LOI: { label: 'LOI', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  LEASE_AGREEMENT: { label: 'Lease', icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
  CASH_FLOW_ANALYSIS: { label: 'Cash Flow', icon: BarChart2, color: 'bg-emerald-100 text-emerald-700' },
  DEBT_ANALYSIS: { label: 'Debt', icon: Landmark, color: 'bg-cyan-100 text-cyan-700' },
  PROPERTY_INTELLIGENCE: { label: 'Property', icon: Search, color: 'bg-blue-100 text-blue-700' },
  DEAL_ANALYSIS: { label: 'Deal Score', icon: BarChart2, color: 'bg-amber-100 text-amber-700' },
};

function StatusBadge({ status }) {
  const cfg = STATUSES.find(s => s.value === status) || STATUSES[0];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function CloseDealModal({ deal, onClose, onSaved }) {
  const [form, setForm] = useState({
    finalSalePrice: '',
    closingDate: '',
    commission: '',
    closingNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await dealsApi.update(deal.id, {
        status: 'Completed',
        finalSalePrice: form.finalSalePrice || null,
        closingDate: form.closingDate || null,
        commission: form.commission || null,
        closingNotes: form.closingNotes || null,
      });

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#C8472A', '#D97706', '#059669', '#2563EB', '#7C3AED'],
      });

      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="h-1 bg-emerald-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Trophy size={18} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-charcoal-900">Close Deal</h2>
                <p className="text-xs text-charcoal-600/60 truncate max-w-[200px]">{deal.address}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-charcoal-600/40 hover:text-charcoal-900 p-1">
              <X size={18} />
            </button>
          </div>

          {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Final Sale Price ($)</label>
                <input
                  type="number"
                  value={form.finalSalePrice}
                  onChange={set('finalSalePrice')}
                  className="input-field"
                  placeholder="2,500,000"
                />
              </div>
              <div>
                <label className="label">Closing Date</label>
                <input
                  type="date"
                  value={form.closingDate}
                  onChange={set('closingDate')}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label">Commission / Fee ($)</label>
              <input
                type="number"
                value={form.commission}
                onChange={set('commission')}
                className="input-field"
                placeholder="75,000"
              />
            </div>

            <div>
              <label className="label">Closing Notes (optional)</label>
              <textarea
                value={form.closingNotes}
                onChange={set('closingNotes')}
                className="input-field h-20 resize-none"
                placeholder="Any final notes about the deal..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                <CheckCircle size={15} />
                {saving ? 'Closing...' : 'Mark as Closed'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MyDeals() {
  const { deals, loading, error, createDeal, deleteDeal, updateDeal } = useDeals();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState('Multifamily');
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [closingDeal, setClosingDeal] = useState(null);
  const [statusChanging, setStatusChanging] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setCreating(true);
    try {
      const deal = await createDeal(address.trim(), propertyType);
      setAddress('');
      setShowForm(false);
      navigate(`/deals/${deal.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeal(id);
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (deal, newStatus) => {
    if (newStatus === 'Completed') {
      setClosingDeal(deal);
      return;
    }
    setStatusChanging(deal.id);
    try {
      await updateDeal(deal.id, { status: newStatus });
    } catch (err) {
      console.error(err);
    } finally {
      setStatusChanging(null);
    }
  };

  const handleCloseDealSaved = async () => {
    try {
      await updateDeal(closingDeal.id, { status: 'Completed' });
    } catch (err) {
      console.error(err);
    }
    setClosingDeal(null);
  };

  // Stats
  const activeCount = deals.filter(d => d.status === 'Active').length;
  const contractCount = deals.filter(d => d.status === 'Under Contract').length;
  const closedCount = deals.filter(d => d.status === 'Completed').length;
  const totalCommission = deals
    .filter(d => d.commission)
    .reduce((sum, d) => sum + d.commission, 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-charcoal-900">My Deals</h1>
          <p className="text-charcoal-600 text-sm mt-1">{deals.length} deal{deals.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> New Deal
        </button>
      </div>

      {/* Stats bar */}
      {deals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active', value: activeCount, color: 'text-emerald-600' },
            { label: 'Under Contract', value: contractCount, color: 'text-blue-600' },
            { label: 'Closed', value: closedCount, color: 'text-purple-600' },
            { label: 'Total Commission', value: totalCommission > 0 ? `$${totalCommission.toLocaleString()}` : '—', color: 'text-accent' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <p className="text-xs text-charcoal-600/50 mb-1">{label}</p>
              <p className={`text-lg font-bold font-serif ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <ErrorBanner message={error} />

      {/* Create form */}
      {showForm && (
        <div className="card p-6 mb-6 border-accent/30">
          <h3 className="font-serif text-lg text-charcoal-900 mb-4">Create New Deal</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Property Address</label>
              <input
                autoFocus
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Austin, TX 78701"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Property Type</label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="input-field">
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create Deal'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deals list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 shimmer h-24" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 card">
          <Briefcase size={40} className="text-cream-300 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-charcoal-700 mb-2">No deals yet</h3>
          <p className="text-charcoal-600 text-sm mb-6">Create your first deal to start tracking analysis</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
            <Plus size={16} /> Create First Deal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => {
            const docTypes = [...new Set((deal.documents || []).map(d => d.type))];
            const status = deal.status || 'Active';

            return (
              <div key={deal.id} className="card p-5 hover:shadow-md transition-all group">
                {confirmDelete === deal.id ? (
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-charcoal-700 flex-1">Delete <strong>{deal.address}</strong>? This cannot be undone.</p>
                    <button onClick={() => handleDelete(deal.id)} className="text-red-600 text-sm font-semibold hover:text-red-700">Delete</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-charcoal-600 text-sm hover:text-charcoal-900">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Building2 size={18} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <button
                          onClick={() => navigate(`/deals/${deal.id}`)}
                          className="text-left group/link flex-1 min-w-0"
                        >
                          <p className="font-semibold text-charcoal-900 truncate group-hover/link:text-accent transition-colors">
                            {deal.address}
                          </p>
                        </button>
                        <StatusBadge status={status} />
                      </div>
                      <p className="text-xs text-charcoal-600/70 mb-1">
                        {deal.propertyType} · {new Date(deal.createdAt).toLocaleDateString()}
                        {deal.finalSalePrice && ` · Sold: $${deal.finalSalePrice.toLocaleString()}`}
                      </p>
                      {docTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {docTypes.map(type => {
                            const cfg = toolLabels[type] || { label: type, color: 'bg-cream-200 text-charcoal-700' };
                            return (
                              <span key={type} className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {/* Status dropdown */}
                      <select
                        value={status}
                        onChange={e => handleStatusChange(deal, e.target.value)}
                        disabled={statusChanging === deal.id}
                        className="text-xs border border-cream-200 rounded-lg px-2 py-1 bg-white text-charcoal-700 cursor-pointer focus:outline-none focus:border-accent opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        {STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setConfirmDelete(deal.id)}
                        className="p-2 text-charcoal-600/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/deals/${deal.id}`)}
                        className="p-2 text-charcoal-600/60 hover:text-accent transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {closingDeal && (
        <CloseDealModal
          deal={closingDeal}
          onClose={() => setClosingDeal(null)}
          onSaved={handleCloseDealSaved}
        />
      )}
    </div>
  );
}
