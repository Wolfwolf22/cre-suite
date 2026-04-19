import React, { useState } from 'react';
import { BarChart2, Download, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ToolHeader from '../components/ToolHeader.jsx';
import DealSelector from '../components/DealSelector.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { cashflowApi, bridgeApi } from '../lib/api.js';
import { CashFlowPDF, downloadPDF } from '../lib/pdfExport.jsx';

function MetricBox({ label, value, sub }) {
  return (
    <div className="bg-cream-50 border border-cream-200 rounded-xl p-4">
      <p className="text-xs font-medium text-charcoal-600/70 mb-1">{label}</p>
      <p className="text-2xl font-bold font-serif text-charcoal-900">{value}</p>
      {sub && <p className="text-xs text-charcoal-600/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function Field({ label, k, form, set, type = 'number', placeholder = '0', step, half = false }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={form[k] ?? ''}
        onChange={set(k)}
        className="input-field"
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
}

const PROPERTY_TYPES = ['Multifamily', 'Office', 'Retail', 'Industrial', 'Mixed-Use'];

const fmt = (n) => n != null
  ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  : '—';
const fmtNum = (n) => n != null ? Number(n).toLocaleString('en-US') : '—';
const fmtPct = (n) => n != null ? `${n}%` : '—';

// Defined at module level to prevent re-mounting on every render (focus-loss bug fix)
function AdvancedFields({ form, set }) {
  return (
    <div className="card p-6 space-y-4 border-2 border-dashed border-cream-300">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-accent">Advanced Fields</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Other Income ($/yr)</label>
          <input type="number" value={form.otherIncome} onChange={set('otherIncome')} className="input-field" placeholder="0" />
        </div>
        <div>
          <label className="label">Exit Cap Rate (%)</label>
          <input type="number" value={form.exitCapRate} onChange={set('exitCapRate')} className="input-field" placeholder="6.5" step="0.1" />
        </div>
        <div>
          <label className="label">Expense Ratio (% of EGI)</label>
          <input type="number" value={form.expenseRatio} onChange={set('expenseRatio')} className="input-field" placeholder="40" step="0.5" />
        </div>
      </div>

      {form.propertyType === 'Multifamily' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Number of Units</label>
            <input type="number" value={form.numUnits} onChange={set('numUnits')} className="input-field" placeholder="24" />
          </div>
          <div>
            <label className="label">Avg Rent/Unit ($/mo)</label>
            <input type="number" value={form.avgUnitRent} onChange={set('avgUnitRent')} className="input-field" placeholder="1800" />
          </div>
          <div>
            <label className="label">Parking Income ($/yr)</label>
            <input type="number" value={form.parkingIncome} onChange={set('parkingIncome')} className="input-field" placeholder="0" />
          </div>
        </div>
      )}

      {form.propertyType === 'Office' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Rentable SF</label>
            <input type="number" value={form.rentableSF} onChange={set('rentableSF')} className="input-field" placeholder="15000" />
          </div>
          <div>
            <label className="label">Rent per SF ($/yr)</label>
            <input type="number" value={form.rentPerSF} onChange={set('rentPerSF')} className="input-field" placeholder="28" step="0.5" />
          </div>
          <div>
            <label className="label">Parking Income ($/yr)</label>
            <input type="number" value={form.parkingIncome} onChange={set('parkingIncome')} className="input-field" placeholder="0" />
          </div>
        </div>
      )}

      {form.propertyType === 'Retail' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Rentable SF</label>
            <input type="number" value={form.rentableSF} onChange={set('rentableSF')} className="input-field" placeholder="8000" />
          </div>
          <div>
            <label className="label">Anchor Tenant Name</label>
            <input type="text" value={form.anchorTenant} onChange={set('anchorTenant')} className="input-field" placeholder="Starbucks" />
          </div>
        </div>
      )}

      {form.propertyType === 'Industrial' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Warehouse SF</label>
            <input type="number" value={form.warehouseSF} onChange={set('warehouseSF')} className="input-field" placeholder="40000" />
          </div>
          <div>
            <label className="label">Office SF</label>
            <input type="number" value={form.officeSF} onChange={set('officeSF')} className="input-field" placeholder="2000" />
          </div>
        </div>
      )}

      {form.propertyType === 'Mixed-Use' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Retail SF</label>
            <input type="number" value={form.rentableSF} onChange={set('rentableSF')} className="input-field" placeholder="3000" />
          </div>
          <div>
            <label className="label">Residential Units</label>
            <input type="number" value={form.numUnits} onChange={set('numUnits')} className="input-field" placeholder="12" />
          </div>
          <div>
            <label className="label">Avg Residential Rent ($/mo)</label>
            <input type="number" value={form.avgUnitRent} onChange={set('avgUnitRent')} className="input-field" placeholder="1600" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CashFlowTool() {
  const { settings, logoUrl } = useSettings();
  const [dealId, setDealId] = useState(null);
  const [mode, setMode] = useState('basic'); // 'basic' | 'advanced'
  const [marketZip, setMarketZip] = useState('');
  const [bridgeMarket, setBridgeMarket] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [zipError, setZipError] = useState(null);
  const [form, setForm] = useState({
    purchasePrice: '',
    downPaymentPercent: '25',
    interestRate: '6.75',
    loanTerm: '30',
    grossRentalIncome: '',
    vacancyRate: '5',
    taxes: '',
    insurance: '',
    management: '',
    maintenance: '',
    capexReserve: '',
    rentGrowthYear1: '3',
    rentGrowthYear2: '3',
    rentGrowthYear3: '3',
    rentGrowthYear4: '3',
    rentGrowthYear5: '3',
    propertyType: 'Multifamily',
    // Advanced fields
    otherIncome: '',
    exitCapRate: '',
    numUnits: '',
    avgUnitRent: '',
    parkingIncome: '',
    rentableSF: '',
    rentPerSF: '',
    anchorTenant: '',
    warehouseSF: '',
    officeSF: '',
    expenseRatio: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null); // 'basic' | 'advanced' | null

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const fetchMarket = async () => {
    const zip = marketZip.trim();
    if (!zip) return;
    if (zip.length !== 5 || !/^\d+$/.test(zip)) {
      setZipError('Please enter a valid 5-digit ZIP code');
      setBridgeMarket(null);
      return;
    }
    setZipError(null);
    setMarketLoading(true);
    try {
      const data = await bridgeApi.market(zip);
      if (data.success && data.data) {
        setBridgeMarket(data.data);
      } else {
        setBridgeMarket(null);
        setZipError('No market data found for this ZIP code');
      }
    } catch {
      setBridgeMarket(null);
      setZipError('No market data found for this ZIP code');
    } finally {
      setMarketLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await cashflowApi.analyze({ ...form, mode, dealId });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (exportMode) => {
    setExporting(exportMode);
    try {
      const element = React.createElement(CashFlowPDF, {
        inputs: { ...form, mode: exportMode },
        outputs: result.outputs,
        aiSummary: exportMode === 'advanced' ? result.aiSummary : null,
        settings,
        logoUrl,
      });
      await downloadPDF(element, `CashFlow_${exportMode === 'advanced' ? 'Advanced_' : ''}Analysis.pdf`);
    } catch (err) {
      setError('PDF export failed: ' + err.message);
    } finally {
      setExporting(null);
    }
  };

  const chartData = result?.outputs?.yearlyProjections?.map(y => ({
    name: `Yr ${y.year}`,
    'NOI': y.noi,
    'Cash Flow': y.cashFlowAfterDebt,
    'EGI': y.effectiveGrossIncome,
  }));

  const accentColor = settings.primaryColor || '#C8472A';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <ToolHeader
        title="Cash Flow Analyzer"
        description="Model NOI, cap rate, DSCR, 5-year IRR, and equity multiple with a full 5-year projection."
        icon={BarChart2}
      />

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        {['basic', 'advanced'].map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold border transition-all ${
              mode === m
                ? 'text-white border-transparent'
                : 'bg-white text-charcoal-700 border-cream-300 hover:border-charcoal-400'
            }`}
            style={mode === m ? { background: accentColor } : {}}
          >
            {m === 'basic' ? 'Basic' : 'Advanced'}
          </button>
        ))}
        {mode === 'advanced' && (
          <span className="text-xs text-charcoal-600/60 self-center ml-1">Property-type-specific fields + exit analysis</span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Acquisition & Financing</h2>
            <DealSelector selectedDealId={dealId} onSelect={setDealId} />
            <div>
              <label className="label">Property Type</label>
              <select value={form.propertyType} onChange={set('propertyType')} className="input-field">
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Purchase Price ($)</label>
                <input type="number" value={form.purchasePrice} onChange={set('purchasePrice')} className="input-field" placeholder="2000000" required />
              </div>
              <div>
                <label className="label">Down Payment (%)</label>
                <input type="number" value={form.downPaymentPercent} onChange={set('downPaymentPercent')} className="input-field" min="0" max="100" step="0.1" required />
              </div>
              <div>
                <label className="label">Interest Rate (%)</label>
                <input type="number" value={form.interestRate} onChange={set('interestRate')} className="input-field" step="0.01" required />
              </div>
              <div>
                <label className="label">Loan Term (yrs)</label>
                <input type="number" value={form.loanTerm} onChange={set('loanTerm')} className="input-field" min="1" required />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Market Context (Optional)</h2>
            <div>
              <label className="label">Property ZIP Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={marketZip}
                  onChange={(e) => { setMarketZip(e.target.value); setZipError(null); }}
                  onBlur={fetchMarket}
                  className="input-field flex-1"
                  placeholder="e.g. 90210"
                  maxLength={5}
                />
                <button
                  type="button"
                  onClick={fetchMarket}
                  disabled={marketLoading}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  {marketLoading ? '...' : 'Fetch'}
                </button>
              </div>
              {zipError && (
                <p className="text-xs text-red-600 mt-1">{zipError}</p>
              )}
              {bridgeMarket && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {bridgeMarket.heatLabel && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      bridgeMarket.heatLabel === 'Hot' ? 'bg-red-100 text-red-700' :
                      bridgeMarket.heatLabel === 'Warm' ? 'bg-amber-100 text-amber-700' :
                      bridgeMarket.heatLabel === 'Cool' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{bridgeMarket.heatLabel} Market</span>
                  )}
                  {bridgeMarket.medianSalePrice && (
                    <span className="text-xs text-charcoal-600/70 bg-cream-100 px-2 py-1 rounded-full">
                      Median: ${Number(bridgeMarket.medianSalePrice).toLocaleString()}
                    </span>
                  )}
                  {bridgeMarket.pricePerSF && (
                    <span className="text-xs text-charcoal-600/70 bg-cream-100 px-2 py-1 rounded-full">
                      ${fmtNum(bridgeMarket.pricePerSF)}/SF
                    </span>
                  )}
                  {bridgeMarket.daysOnMarket && (
                    <span className="text-xs text-charcoal-600/70 bg-cream-100 px-2 py-1 rounded-full">
                      {bridgeMarket.daysOnMarket} avg days on mkt
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Income & Vacancy</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Gross Rental Income ($/yr)</label>
                <input type="number" value={form.grossRentalIncome} onChange={set('grossRentalIncome')} className="input-field" placeholder="180000" required />
              </div>
              <div>
                <label className="label">Vacancy Rate (%)</label>
                <input type="number" value={form.vacancyRate} onChange={set('vacancyRate')} className="input-field" min="0" max="100" step="0.1" required />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Operating Expenses ($/yr)</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['taxes', 'Property Taxes'],
                ['insurance', 'Insurance'],
                ['management', 'Management'],
                ['maintenance', 'Maintenance'],
                ['capexReserve', 'CapEx Reserve'],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="label">{label}</label>
                  <input type="number" value={form[k]} onChange={set(k)} className="input-field" placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Rent Growth (% per year)</h2>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(yr => (
                <div key={yr}>
                  <label className="label text-xs">Yr {yr}</label>
                  <input
                    type="number"
                    value={form[`rentGrowthYear${yr}`]}
                    onChange={set(`rentGrowthYear${yr}`)}
                    className="input-field text-sm px-2 py-2"
                    step="0.1"
                    placeholder="3"
                  />
                </div>
              ))}
            </div>
          </div>

          {mode === 'advanced' && <AdvancedFields form={form} set={set} />}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3" style={{ background: accentColor }}>
            {loading ? 'Calculating...' : 'Run Cash Flow Analysis'}
          </button>
        </form>

        {/* Results */}
        <div className="space-y-6">
          {loading && <LoadingSpinner message="Running cash flow model..." />}
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {result && !loading && (
            <>
              {/* Market Context Bar */}
              {bridgeMarket && (
                <div className="rounded-xl p-4 flex flex-wrap items-center gap-4" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
                  <TrendingUp size={16} style={{ color: accentColor }} />
                  <span className="text-sm font-semibold text-charcoal-800">Market: {marketZip}</span>
                  {bridgeMarket.heatLabel && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      bridgeMarket.heatLabel === 'Hot' ? 'bg-red-100 text-red-700' :
                      bridgeMarket.heatLabel === 'Warm' ? 'bg-amber-100 text-amber-700' :
                      bridgeMarket.heatLabel === 'Cool' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{bridgeMarket.heatLabel}</span>
                  )}
                  {bridgeMarket.medianSalePrice && <span className="text-sm text-charcoal-700">Median <strong>${Number(bridgeMarket.medianSalePrice).toLocaleString()}</strong></span>}
                  {bridgeMarket.pricePerSF && <span className="text-sm text-charcoal-700"><strong>${fmtNum(bridgeMarket.pricePerSF)}</strong>/SF</span>}
                  {bridgeMarket.daysOnMarket && <span className="text-sm text-charcoal-700"><strong>{bridgeMarket.daysOnMarket}</strong> avg DOM</span>}
                  {bridgeMarket.inventory != null && <span className="text-sm text-charcoal-700"><strong>{fmtNum(bridgeMarket.inventory)}</strong> inventory</span>}
                </div>
              )}

              {/* AI Summary */}
              {result.aiSummary && (
                <div className="rounded-xl p-5" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}30` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${accentColor}30` }}>
                      <span className="text-xs font-bold" style={{ color: accentColor }}>AI</span>
                    </div>
                    <span className="text-sm font-semibold text-charcoal-800">Deal Summary</span>
                  </div>
                  <p className="text-sm text-charcoal-700 leading-relaxed">{result.aiSummary}</p>
                </div>
              )}

              {/* Key metrics */}
              <div>
                <h3 className="font-serif text-lg text-charcoal-900 mb-3">Key Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricBox label="NOI" value={fmt(result.outputs.noi)} sub="Year 1" />
                  <MetricBox label="Cap Rate" value={fmtPct(result.outputs.capRate)} sub="Going-in" />
                  <MetricBox label="Cash-on-Cash" value={fmtPct(result.outputs.cashOnCash)} sub="Year 1" />
                  <MetricBox label="DSCR" value={result.outputs.dscr} sub="Year 1" />
                  <MetricBox label="5-Year IRR" value={fmtPct(result.outputs.irr)} sub="Cash flows only" />
                  <MetricBox label="Equity Multiple" value={`${result.outputs.equityMultiple}x`} sub="5-year hold" />
                  <MetricBox label="GRM" value={result.outputs.grm} sub="Gross rent mult." />
                  <MetricBox label="Debt Service" value={fmt(result.outputs.annualDebtService)} sub="Annual" />
                </div>
              </div>

              {/* Chart */}
              <div className="card p-5">
                <h3 className="font-serif text-lg text-charcoal-900 mb-4">5-Year Cash Flow Projection</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4F443C' }} />
                    <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#4F443C' }} />
                    <Tooltip
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, '']}
                      contentStyle={{ background: '#fff', border: '1px solid #DDD0BB', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="NOI" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 4 }} />
                    <Line type="monotone" dataKey="Cash Flow" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor, r: 4 }} />
                    <Line type="monotone" dataKey="EGI" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Projection table */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-cream-200">
                  <h3 className="font-serif text-lg text-charcoal-900">5-Year Projection</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: accentColor }}>
                        {['Year', 'Gross Income', 'EGI', 'Expenses', 'NOI', 'Debt Service', 'Cash Flow', 'CoC'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-xs font-semibold text-white text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.outputs.yearlyProjections.map((yr, i) => (
                        <tr key={yr.year} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                          <td className="px-4 py-2.5 font-semibold text-charcoal-900">Year {yr.year}</td>
                          <td className="px-4 py-2.5 text-charcoal-700">{fmt(yr.grossRentalIncome)}</td>
                          <td className="px-4 py-2.5 text-charcoal-700">{fmt(yr.effectiveGrossIncome)}</td>
                          <td className="px-4 py-2.5 text-charcoal-700">{fmt(yr.operatingExpenses)}</td>
                          <td className="px-4 py-2.5 font-semibold text-emerald-700">{fmt(yr.noi)}</td>
                          <td className="px-4 py-2.5 text-charcoal-700">{fmt(yr.debtService)}</td>
                          <td className={`px-4 py-2.5 font-semibold ${yr.cashFlowAfterDebt >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                            {fmt(yr.cashFlowAfterDebt)}
                          </td>
                          <td className="px-4 py-2.5 text-charcoal-700">{yr.cashOnCash}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportPDF('basic')}
                  disabled={!!exporting}
                  className="btn-secondary flex-1 justify-center"
                >
                  <Download size={15} /> {exporting === 'basic' ? 'Exporting...' : 'Export Basic PDF'}
                </button>
                <button
                  onClick={() => handleExportPDF('advanced')}
                  disabled={!!exporting}
                  className="btn-primary flex-1 justify-center"
                  style={{ background: accentColor }}
                >
                  <Download size={15} /> {exporting === 'advanced' ? 'Exporting...' : 'Export Full Report PDF'}
                </button>
              </div>
            </>
          )}

          {!result && !loading && !error && (
            <div className="card p-12 text-center border-dashed border-2 border-cream-300 h-64 flex flex-col items-center justify-center">
              <BarChart2 size={36} className="text-cream-300 mb-4" />
              <p className="text-charcoal-600/60 text-sm">Fill in the form and run analysis to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
