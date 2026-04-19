import React, { useState } from 'react';
import { ScrollText, Copy, Check, Download, Plus, Trash2 } from 'lucide-react';
import ToolHeader from '../components/ToolHeader.jsx';
import DealSelector from '../components/DealSelector.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import AddressAutocomplete from '../components/AddressAutocomplete.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { leaseApi } from '../lib/api.js';
import { LeasePDF, downloadPDF } from '../lib/pdfExport.jsx';

export default function LeaseTool() {
  const { settings, logoUrl } = useSettings();
  const [dealId, setDealId] = useState(null);
  const [form, setForm] = useState({
    landlordName: '',
    tenantName: '',
    propertyAddress: '',
    suiteNumber: '',
    leaseType: 'NNN',
    baseRent: '',
    leaseStartDate: '',
    leaseEndDate: '',
    rentEscalation: 'fixed',
    escalationValue: '3',
    securityDeposit: '',
    permittedUse: '',
    camCap: '5',
    renewalOptions: '',
    tiAllowance: '',
    personalGuarantee: false,
  });
  const [customClauses, setCustomClauses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const addClause = () => setCustomClauses(c => [...c, { title: '', body: '' }]);
  const removeClause = (i) => setCustomClauses(c => c.filter((_, idx) => idx !== i));
  const updateClause = (i, field, val) => setCustomClauses(c => c.map((cl, idx) => idx === i ? { ...cl, [field]: val } : cl));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await leaseApi.generate({ ...form, customClauses, dealId });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = React.createElement(LeasePDF, {
        form,
        content: result.content,
        customClauses,
        settings,
        logoUrl,
      });
      await downloadPDF(element, `Lease_${form.propertyAddress.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (err) {
      setError('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <ToolHeader
        title="Commercial Lease Generator"
        description="Generate complete NNN, Gross, or Modified Gross commercial lease agreements with all standard clauses."
        icon={ScrollText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Parties & Property</h2>
            <DealSelector selectedDealId={dealId} onSelect={setDealId} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Landlord Name</label>
                <input value={form.landlordName} onChange={set('landlordName')} className="input-field" placeholder="Smith Properties LLC" required />
              </div>
              <div>
                <label className="label">Tenant Name</label>
                <input value={form.tenantName} onChange={set('tenantName')} className="input-field" placeholder="Jones Dental Group" required />
              </div>
            </div>
            <AddressAutocomplete
              label="Property Address"
              value={form.propertyAddress}
              onChange={(place) => setForm(p => ({ ...p, propertyAddress: place.fullAddress }))}
              required
            />
            <div>
              <label className="label">Suite / Unit Number</label>
              <input value={form.suiteNumber} onChange={set('suiteNumber')} className="input-field" placeholder="Suite 200" />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Lease Terms</h2>
            <div>
              <label className="label">Lease Type</label>
              <div className="flex gap-2">
                {['NNN', 'Gross', 'Modified Gross'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, leaseType: t }))}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition-all ${
                      form.leaseType === t
                        ? 'bg-charcoal-900 text-white border-charcoal-900'
                        : 'bg-white text-charcoal-700 border-cream-300 hover:border-charcoal-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Base Rent ($/month)</label>
              <input type="number" value={form.baseRent} onChange={set('baseRent')} className="input-field" placeholder="5000" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Lease Start Date</label>
                <input type="date" value={form.leaseStartDate} onChange={set('leaseStartDate')} className="input-field" required />
              </div>
              <div>
                <label className="label">Lease End Date</label>
                <input type="date" value={form.leaseEndDate} onChange={set('leaseEndDate')} className="input-field" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Rent Escalation Type</label>
                <select value={form.rentEscalation} onChange={set('rentEscalation')} className="input-field">
                  <option value="fixed">Fixed %</option>
                  <option value="cpi">CPI-Based</option>
                </select>
              </div>
              <div>
                <label className="label">Rate / Cap (%)</label>
                <input type="number" value={form.escalationValue} onChange={set('escalationValue')} className="input-field" step="0.1" placeholder="3" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Security Deposit ($)</label>
                <input type="number" value={form.securityDeposit} onChange={set('securityDeposit')} className="input-field" placeholder="10000" required />
              </div>
              <div>
                <label className="label">TI Allowance ($, optional)</label>
                <input type="number" value={form.tiAllowance} onChange={set('tiAllowance')} className="input-field" placeholder="0" />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Additional Provisions</h2>
            <div>
              <label className="label">Permitted Use</label>
              <input value={form.permittedUse} onChange={set('permittedUse')} className="input-field" placeholder="General dental office practice" required />
            </div>
            {form.leaseType === 'NNN' && (
              <div>
                <label className="label">CAM Reconciliation Cap (%)</label>
                <input type="number" value={form.camCap} onChange={set('camCap')} className="input-field" step="0.5" />
              </div>
            )}
            <div>
              <label className="label">Renewal Options (optional)</label>
              <input value={form.renewalOptions} onChange={set('renewalOptions')} className="input-field" placeholder="Two (2) options to renew for five (5) years each" />
            </div>
            <div className="flex items-center gap-3 p-4 bg-cream-50 rounded-xl border border-cream-200">
              <input
                id="guarantee"
                type="checkbox"
                checked={form.personalGuarantee}
                onChange={set('personalGuarantee')}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="guarantee" className="text-sm font-medium text-charcoal-800 cursor-pointer">
                Require personal guarantee from tenant
              </label>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-charcoal-900">Custom Clauses</h2>
              <button
                type="button"
                onClick={addClause}
                className="btn-secondary text-xs gap-1.5 py-1.5 px-3"
              >
                <Plus size={12} /> Add Clause
              </button>
            </div>
            {customClauses.length === 0 && (
              <p className="text-xs text-charcoal-600/50">
                Add custom clauses to be included in the lease agreement (e.g., Right of First Refusal, Co-Tenancy, Exclusivity).
              </p>
            )}
            {customClauses.map((clause, i) => (
              <div key={i} className="border border-cream-200 rounded-xl p-4 space-y-3 bg-cream-50/40">
                <div className="flex items-center justify-between gap-2">
                  <input
                    value={clause.title}
                    onChange={(e) => updateClause(i, 'title', e.target.value)}
                    className="input-field flex-1 text-sm font-semibold"
                    placeholder="Clause Title (e.g. Right of First Refusal)"
                  />
                  <button type="button" onClick={() => removeClause(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={clause.body}
                  onChange={(e) => updateClause(i, 'body', e.target.value)}
                  className="input-field h-20 resize-none text-sm"
                  placeholder="Describe the clause terms, or leave blank for AI to draft it..."
                />
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Drafting...' : 'Generate Lease Agreement'}
          </button>
        </form>

        {/* Result */}
        <div>
          {loading && <LoadingSpinner message="Drafting your lease agreement..." />}
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {result && !loading && (
            <div className="space-y-4">
              {result.documentId && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  <Check size={13} /> Auto-saved to deal
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleCopy} className="btn-secondary flex-1 justify-center text-sm py-2">
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Text</>}
                </button>
                <button onClick={handleExportPDF} disabled={exporting} className="btn-primary flex-1 justify-center text-sm py-2">
                  <Download size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
              <div className="card p-6 max-h-[700px] overflow-y-auto">
                <pre className="text-sm text-charcoal-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {result.content}
                </pre>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card p-10 text-center border-dashed border-2 border-cream-300 h-64 flex flex-col items-center justify-center">
              <ScrollText size={36} className="text-cream-300 mb-4" />
              <p className="text-charcoal-600/60 text-sm">Your lease agreement will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
