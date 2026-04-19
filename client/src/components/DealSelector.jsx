import React, { useState } from 'react';
import { Briefcase, Plus, ChevronDown, Check } from 'lucide-react';
import { useDeals } from '../hooks/useDeals.js';

export default function DealSelector({ selectedDealId, onSelect }) {
  const { deals, loading, createDeal } = useDeals();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newType, setNewType] = useState('Multifamily');

  const selected = deals.find(d => d.id === selectedDealId);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAddress.trim()) return;
    try {
      const deal = await createDeal(newAddress.trim(), newType);
      onSelect(deal.id);
      setCreating(false);
      setNewAddress('');
      setOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <label className="label">Link to Deal (optional)</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field flex items-center justify-between text-left"
      >
        <span className={selected ? 'text-charcoal-900' : 'text-charcoal-600/50'}>
          {selected ? `${selected.address} — ${selected.propertyType}` : 'Select a deal or create new...'}
        </span>
        <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* None option */}
          <button
            type="button"
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream-50 text-left border-b border-cream-100"
          >
            <span className="text-charcoal-600/60 text-sm">No deal — run without saving</span>
          </button>

          {/* Existing deals */}
          {loading ? (
            <div className="px-4 py-3 text-sm text-charcoal-600/60">Loading deals...</div>
          ) : (
            deals.map(deal => (
              <button
                key={deal.id}
                type="button"
                onClick={() => { onSelect(deal.id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream-50 text-left"
              >
                <Briefcase size={15} className="text-charcoal-600/60 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal-900 truncate">{deal.address}</p>
                  <p className="text-xs text-charcoal-600/60">{deal.propertyType}</p>
                </div>
                {deal.id === selectedDealId && <Check size={15} className="text-accent ml-auto flex-shrink-0" />}
              </button>
            ))
          )}

          {/* Create new */}
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-cream-50 text-accent text-sm font-semibold border-t border-cream-100"
            >
              <Plus size={15} /> Create new deal
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 border-t border-cream-100 space-y-3">
              <input
                autoFocus
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="Property address"
                className="input-field text-sm"
              />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value)}
                className="input-field text-sm"
              >
                {['Multifamily', 'Office', 'Retail', 'Industrial', 'Mixed-Use', 'Other'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm py-1.5 px-3">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
