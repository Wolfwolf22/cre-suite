import React, { useState } from 'react';
import { Landmark, Check, X, AlertTriangle, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader.jsx';
import DealSelector from '../components/DealSelector.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { debtApi } from '../lib/api.js';
import { DebtAnalysisPDF, downloadPDF } from '../lib/pdfExport.jsx';

const PROPERTY_TYPES = ['Multifamily', 'Office', 'Retail', 'Industrial', 'Mixed-Use'];

const LENDER_ICONS = {
  Bridge: '🏗',
  'Agency Fannie': '🏛',
  'Agency Freddie': '🏛',
  CMBS: '📊',
  'SBA 504': '🏢',
  'Life Co': '🤝',
  'Local Bank': '🏦',
  'Debt Fund': '💼',
  HUD: '🏘',
};

const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';
const fmtPct = (n) => n != null ? `${n}%` : '—';

function QualifyBadge({ qualifies }) {
  return qualifies ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <Check size={10} /> Qualifies
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <X size={10} /> Doesn't Qualify
    </span>
  );
}

export default function DebtTool() {
  const { settings, logoUrl } = useSettings();
  const [dealId, setDealId] = useState(null);
  const [mode, setMode] = useState('basic');
  const [form, setForm] = useState({
    noi: '',
    purchasePrice: '',
    propertyType: 'Multifamily',
    requestedLtv: '75',
    loanTerm: '10',
    amortization: '30',
    // Advanced
    creditScore: '',
    yearsExperience: '',
    netWorth: '',
    liquidity: '',
    borrowerType: 'Individual',
    existingDebt: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await debtApi.analyze({ ...form, mode, dealId });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const element = React.createElement(DebtAnalysisPDF, {
        inputs: form,
        result,
        settings,
        logoUrl,
      });
      await downloadPDF(element, `DebtAnalysis_${form.propertyType.replace(/\s+/g,'_')}.pdf`);
    } catch (err) {
      setError('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const accentColor = settings.primaryColor || '#C8472A';
  const calc = result?.calculations;
  const ai = result?.aiAnalysis;
  // Advanced mode: lenderMatrix lives inside aiAnalysis
  const matrix = ai?.lenderMatrix;
  const approachStrategy = ai?.approachStrategy;
  const pitchBullets = ai?.pitchBullets;
  const primaryConcern = ai?.primaryConcern;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <ToolHeader
        title="Debt Sizing & Loan Screener"
        description="Size your loan, calculate DSCR and debt yield, then get AI-powered lender qualification across all channels."
        icon={Landmark}
      />

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        {['basic', 'advanced'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
              mode === m ? 'text-white border-transparent' : 'bg-white text-charcoal-700 border-cream-300 hover:border-charcoal-400'
            }`}
            style={mode === m ? { background: accentColor } : {}}
          >
            {m === 'basic' ? 'Basic' : 'Advanced'}
          </button>
        ))}
        {mode === 'advanced' && (
          <span className="text-xs text-charcoal-600/60 self-center ml-1">9-lender matrix + borrower profile</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Deal Parameters</h2>
            <DealSelector selectedDealId={dealId} onSelect={setDealId} />
            <div>
              <label className="label">
                Property Type
                <Tooltip title="Property Type" text="The asset class of the collateral property. Lender programs, LTV limits, and rate premiums vary significantly by type (e.g., multifamily is generally most favorable)." />
              </label>
              <select value={form.propertyType} onChange={set('propertyType')} className="input-field">
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">
                  NOI ($/yr)
                  <Tooltip title="Net Operating Income" text="Annual income remaining after all operating expenses but before debt service. NOI is used to calculate DSCR and cap rate — the two primary underwriting metrics lenders use." />
                </label>
                <input type="number" value={form.noi} onChange={set('noi')} className="input-field" placeholder="150000" required />
              </div>
              <div>
                <label className="label">
                  Purchase Price ($)
                  <Tooltip title="Purchase Price" text="The agreed acquisition price. Used to calculate LTV (loan-to-value ratio). Most lenders size the loan as the lesser of LTV on price or appraised value." />
                </label>
                <input type="number" value={form.purchasePrice} onChange={set('purchasePrice')} className="input-field" placeholder="2000000" required />
              </div>
              <div>
                <label className="label">
                  Requested LTV (%)
                  <Tooltip title="Loan-to-Value" text="The loan amount as a percentage of the property's value. Most CRE lenders cap at 65–80% LTV. Lower LTV means less risk to the lender and typically better rates." />
                </label>
                <input type="number" value={form.requestedLtv} onChange={set('requestedLtv')} className="input-field" min="0" max="100" step="0.1" required />
              </div>
              <div>
                <label className="label">
                  Loan Term (yrs)
                  <Tooltip title="Loan Term" text="How long until the loan matures and a balloon payment is due. CRE loans are typically 5–10 year terms with 25–30 year amortization schedules." />
                </label>
                <input type="number" value={form.loanTerm} onChange={set('loanTerm')} className="input-field" min="1" max="40" required />
              </div>
              <div>
                <label className="label">
                  Amortization (yrs)
                  <Tooltip title="Amortization Period" text="The number of years used to calculate monthly principal + interest payments. A 30-year amortization on a 10-year term means a large balloon at maturity." />
                </label>
                <input type="number" value={form.amortization} onChange={set('amortization')} className="input-field" min="5" max="40" required />
              </div>
            </div>
          </div>

          {mode === 'advanced' && (
            <div className="card p-6 space-y-4 border-2 border-dashed border-cream-300">
              <h2 className="font-serif text-lg text-charcoal-900">Borrower Profile</h2>
              <div>
                <label className="label">
                  Borrower Type
                  <Tooltip title="Borrower Entity Type" text="The legal structure of the borrower. LLCs and corporations limit personal liability. Some lenders (e.g., Agency, HUD) require specific entity types or may require personal guarantees from principals." />
                </label>
                <select value={form.borrowerType} onChange={set('borrowerType')} className="input-field">
                  {['Individual', 'LLC', 'Corporation', 'Partnership', 'REIT'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Credit Score
                    <Tooltip title="FICO Credit Score" text="Lenders use personal credit scores (300–850) for most commercial loans. Scores below 680 will limit options. Life companies and agency lenders typically require 700+." />
                  </label>
                  <input type="number" value={form.creditScore} onChange={set('creditScore')} className="input-field" placeholder="720" min="300" max="850" />
                </div>
                <div>
                  <label className="label">
                    Years CRE Experience
                    <Tooltip title="Commercial Real Estate Experience" text="Lenders assess the sponsor's track record managing similar properties. Life companies and agency lenders require 2–5+ years of experience with comparable asset types." />
                  </label>
                  <input type="number" value={form.yearsExperience} onChange={set('yearsExperience')} className="input-field" placeholder="5" min="0" />
                </div>
                <div>
                  <label className="label">
                    Net Worth ($)
                    <Tooltip title="Borrower Net Worth" text="Total assets minus liabilities. Most institutional lenders require net worth equal to or greater than the loan amount. This demonstrates financial stability and ability to support the asset." />
                  </label>
                  <input type="number" value={form.netWorth} onChange={set('netWorth')} className="input-field" placeholder="2000000" />
                </div>
                <div>
                  <label className="label">
                    Liquidity / Cash ($)
                    <Tooltip title="Post-Close Liquidity" text="Cash and liquid assets remaining after closing. Lenders typically require 6–12 months of debt service in reserves post-close. Low liquidity is a common loan-denial reason." />
                  </label>
                  <input type="number" value={form.liquidity} onChange={set('liquidity')} className="input-field" placeholder="300000" />
                </div>
                <div className="col-span-2">
                  <label className="label">
                    Existing Debt ($)
                    <Tooltip title="Existing Debt Obligations" text="Total outstanding debt across all properties and personal obligations. Used to calculate global debt service coverage ratio (GDSCR), which factors your total debt load against total income." />
                  </label>
                  <input type="number" value={form.existingDebt} onChange={set('existingDebt')} className="input-field" placeholder="0" />
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3" style={{ background: accentColor }}>
            {loading ? 'Analyzing...' : mode === 'advanced' ? 'Run Advanced Lender Screen' : 'Screen Lenders with AI'}
          </button>
        </form>

        {/* Results */}
        <div className="space-y-6">
          {loading && <LoadingSpinner message={mode === 'advanced' ? 'Building 9-lender matrix...' : 'Sizing loan and screening lenders...'} />}
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {result && !loading && (
            <>
              <div className="flex justify-end">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="btn-primary gap-2"
                  style={{ background: accentColor }}
                >
                  <Download size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
              {/* Loan Sizing */}
              {calc && (
                <div className="card p-6">
                  <h3 className="font-serif text-lg text-charcoal-900 mb-4">Loan Sizing Results</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      ['Max Loan Amount', fmt(calc.maxLoanAmount)],
                      ['Actual LTV', fmtPct(calc.actualLtv)],
                      ['Constrained By', calc.constrainedBy],
                      ['DSCR', calc.dscr],
                      ['Debt Yield', fmtPct(calc.debtYield)],
                      ['Cap Rate', fmtPct(calc.capRate)],
                      ['Annual Debt Service', fmt(calc.annualDebtService)],
                      ['Monthly Payment', fmt(calc.monthlyPayment)],
                      ['Benchmark Rate', `~${calc.benchmarkRate}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-cream-50 border border-cream-200 rounded-xl p-3">
                        <p className="text-xs text-charcoal-600/70 mb-1">{label}</p>
                        <p className="text-lg font-bold font-serif text-charcoal-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9-Lender Matrix (advanced) */}
              {matrix && matrix.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-cream-200">
                    <h3 className="font-serif text-lg text-charcoal-900">9-Lender Matrix</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: accentColor }}>
                          {['Lender Type', 'Rate Range', 'Max LTV', 'Recourse', 'Timeline', 'Key Requirement', 'Fit'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-white font-semibold text-left whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrix.map((lender, i) => {
                          const qualifies = lender.qualification === 'Strong Fit' || lender.qualification === 'Possible';
                          return (
                            <tr key={lender.lenderType} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                              <td className="px-3 py-3">
                                <span className="font-semibold text-charcoal-900">
                                  {LENDER_ICONS[lender.lenderType] || '🏦'} {lender.lenderType}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-charcoal-700 whitespace-nowrap">{lender.rateRange || '—'}</td>
                              <td className="px-3 py-3 text-charcoal-700">{lender.typicalLTV || lender.maxLtv || '—'}</td>
                              <td className="px-3 py-3 text-charcoal-700">{lender.recourse || '—'}</td>
                              <td className="px-3 py-3 text-charcoal-700 whitespace-nowrap">{lender.timelineToClose || lender.timeline || '—'}</td>
                              <td className="px-3 py-3 text-charcoal-700 max-w-[160px]">{lender.keyRequirement || '—'}</td>
                              <td className="px-3 py-3">
                                <QualifyBadge qualifies={qualifies} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* AI notes per lender */}
                  <div className="p-4 space-y-2 border-t border-cream-200">
                    <p className="text-xs font-semibold text-charcoal-600/70 uppercase tracking-wide mb-3">AI Notes by Lender</p>
                    {matrix.filter(l => l.aiNote).map(lender => (
                      <div key={lender.lenderType} className="flex items-start gap-2 text-xs text-charcoal-700">
                        <span className="font-semibold text-charcoal-900 min-w-[110px] flex-shrink-0">{lender.lenderType}:</span>
                        <span>{lender.aiNote}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic AI Scorecard (only shown in basic mode without matrix) */}
              {ai && !matrix && (
                <div className="card p-6 space-y-5">
                  <h3 className="font-serif text-lg text-charcoal-900">AI Lender Scorecard</h3>

                  {ai.riskRationale && (
                    <p className="text-sm text-charcoal-700 bg-cream-50 rounded-lg p-3 border border-cream-200">
                      {ai.riskRationale}
                    </p>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-800 mb-3">Qualifying Lender Types</h4>
                    <div className="space-y-2">
                      {(ai.qualifyingLenders || []).map(lender => (
                        <div key={lender} className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                          <p className="text-sm font-semibold text-emerald-800">{lender}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ai.disqualifiedLenders?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-charcoal-800 mb-2">Not Qualifying</h4>
                      <div className="space-y-1.5">
                        {ai.disqualifiedLenders.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                            <p className="text-xs text-red-700">{typeof item === 'string' ? item : JSON.stringify(item)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ai.pitchBullets?.length > 0 && (
                    <div className="bg-charcoal-900 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-white mb-3">Lender Pitch Summary</h4>
                      <ul className="space-y-2">
                        {ai.pitchBullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-cream-100">
                            <span style={{ color: accentColor }} className="mt-0.5">→</span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ai.strengthSummary && (
                    <p className="text-sm text-charcoal-700 leading-relaxed">{ai.strengthSummary}</p>
                  )}

                  {ai.primaryConcern && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{ai.primaryConcern}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Approach Strategy (advanced) */}
              {approachStrategy && (
                <div className="card p-6">
                  <h3 className="font-serif text-lg text-charcoal-900 mb-3">Lender Approach Strategy</h3>
                  {ai.riskRationale && (
                    <p className="text-sm text-charcoal-700 bg-cream-50 rounded-lg p-3 border border-cream-200 mb-4">
                      {ai.riskRationale}
                    </p>
                  )}
                  <p className="text-sm text-charcoal-700 leading-relaxed">{approachStrategy}</p>
                  {pitchBullets?.length > 0 && (
                    <div className="mt-4 bg-charcoal-900 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-white mb-3">Key Talking Points</h4>
                      <ul className="space-y-2">
                        {pitchBullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-cream-100">
                            <span style={{ color: accentColor }} className="mt-0.5">→</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {primaryConcern && (
                    <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">{primaryConcern}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!result && !loading && !error && (
            <div className="card p-12 text-center border-dashed border-2 border-cream-300 h-64 flex flex-col items-center justify-center">
              <Landmark size={36} className="text-cream-300 mb-4" />
              <p className="text-charcoal-600/60 text-sm">Enter deal parameters to screen lender options</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
