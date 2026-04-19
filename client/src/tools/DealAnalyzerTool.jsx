import React, { useState } from 'react';
import { TrendingUp, Download, AlertTriangle, Zap, Building2, Users, DollarSign, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ToolHeader from '../components/ToolHeader.jsx';
import DealSelector from '../components/DealSelector.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import GooglePlacesInput from '../components/GooglePlacesInput.jsx';
import { ScoreCategory, OverallScore } from '../components/ScoreCard.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { dealAnalyzerApi } from '../lib/api.js';
import { DealAnalysisPDF, downloadPDF } from '../lib/pdfExport.jsx';

const PROPERTY_TYPES = ['Multifamily', 'Office', 'Retail', 'Industrial', 'Mixed-Use', 'Other'];

const SCORE_LABELS = {
  pricing: 'Pricing',
  marketStrength: 'Market Strength',
  incomeStability: 'Income Stability',
  upsidePotential: 'Upside Potential',
  locationQuality: 'Location Quality',
};

function DataPill({ label, value, accent }) {
  if (!value) return null;
  return (
    <div className="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-charcoal-600/60 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-charcoal-900" style={accent ? { color: accent } : {}}>{value}</p>
    </div>
  );
}

export default function DealAnalyzerTool() {
  const { settings, logoUrl } = useSettings();
  const [dealId, setDealId] = useState(null);
  const [form, setForm] = useState({
    propertyAddress: '',
    askingPrice: '',
    propertyType: 'Multifamily',
    currentNoi: '',
    targetMarket: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const accentColor = settings.primaryColor || '#C8472A';

  const handleAddressConfirm = (place) => {
    setForm(p => ({
      ...p,
      propertyAddress: place.fullAddress,
      targetMarket: place.city && place.state ? `${place.city}, ${place.state}` : p.targetMarket,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.propertyAddress) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await dealAnalyzerApi.analyze({ ...form, dealId });
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
      const element = React.createElement(DealAnalysisPDF, {
        inputs: form,
        analysis: result.analysis,
        settings,
        logoUrl,
      });
      await downloadPDF(element, `DealAnalysis_${form.propertyAddress.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (err) {
      setError('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const analysis = result?.analysis;
  const realData = result?.realData;

  const impliedCap = form.askingPrice && form.currentNoi
    ? ((parseFloat(form.currentNoi) / parseFloat(form.askingPrice)) * 100).toFixed(2)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <ToolHeader
        title="Deal Analyzer"
        description="Get a 1–10 deal score with AI market research, comparable sales, vacancy trends, and a full investment memo."
        icon={TrendingUp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-serif text-lg text-charcoal-900">Deal Details</h2>
            <DealSelector selectedDealId={dealId} onSelect={setDealId} />
            <GooglePlacesInput
              onConfirm={handleAddressConfirm}
              label="Property Address"
            />
            <div>
              <label className="label">Property Type</label>
              <select value={form.propertyType} onChange={set('propertyType')} className="input-field">
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Asking Price ($)</label>
                <input type="number" value={form.askingPrice} onChange={set('askingPrice')} className="input-field" placeholder="3500000" required />
              </div>
              <div>
                <label className="label">Current NOI ($/yr)</label>
                <input type="number" value={form.currentNoi} onChange={set('currentNoi')} className="input-field" placeholder="210000" required />
              </div>
            </div>
            <div>
              <label className="label">Target Market</label>
              <input value={form.targetMarket} onChange={set('targetMarket')} className="input-field" placeholder="Austin, TX" required />
            </div>

            {impliedCap && (
              <div className="bg-cream-50 border border-cream-200 rounded-lg p-3 text-sm">
                <span className="text-charcoal-600/70">Implied cap rate: </span>
                <span className="font-bold text-charcoal-900">{impliedCap}%</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !form.propertyAddress}
            className="btn-primary w-full justify-center py-3"
            style={{ background: accentColor }}
          >
            {loading ? 'Analyzing...' : 'Analyze Deal with AI'}
          </button>
        </form>

        {/* Results */}
        <div className="space-y-6">
          {loading && <LoadingSpinner message="Researching market data and analyzing deal..." />}
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {analysis && !loading && (
            <>
              {/* Score overview */}
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <OverallScore score={analysis.dealScore} />
                  <div className="flex-1 space-y-3 w-full">
                    {Object.entries(analysis.scores || {}).map(([key, score]) => (
                      <ScoreCategory
                        key={key}
                        title={SCORE_LABELS[key] || key}
                        score={score.score}
                        rating={score.rating}
                        rationale={score.rationale}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Real data panels */}
              {realData && (
                <>
                  {/* Bridge property record */}
                  {realData.bridge && (
                    <div className="card p-5">
                      <h3 className="font-serif text-lg text-charcoal-900 mb-3 flex items-center gap-2">
                        <Building2 size={16} style={{ color: accentColor }} /> Property Record
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <DataPill label="Assessed Value" value={realData.bridge.assessedValue ? `$${Number(realData.bridge.assessedValue).toLocaleString()}` : null} accent={accentColor} />
                        <DataPill label="Market Value" value={realData.bridge.marketValue ? `$${Number(realData.bridge.marketValue).toLocaleString()}` : null} />
                        <DataPill label="Last Sale" value={realData.bridge.lastSalePrice ? `$${Number(realData.bridge.lastSalePrice).toLocaleString()}` : null} />
                        <DataPill label="Year Built" value={realData.bridge.yearBuilt} />
                        <DataPill label="Building SF" value={realData.bridge.buildingSF ? `${Number(realData.bridge.buildingSF).toLocaleString()} SF` : null} />
                        <DataPill label="Owner" value={realData.bridge.ownerName} />
                        <DataPill label="Zoning" value={realData.bridge.zoning} />
                        <DataPill label="Stories" value={realData.bridge.stories} />
                      </div>
                    </div>
                  )}

                  {/* Bridge Market Intelligence */}
                  {realData.bridgeMarket && (
                    <div className="card p-5">
                      <h3 className="font-serif text-lg text-charcoal-900 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} style={{ color: accentColor }} /> Market Intelligence
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          realData.bridgeMarket.heatLabel === 'Hot' ? 'bg-red-100 text-red-700' :
                          realData.bridgeMarket.heatLabel === 'Warm' ? 'bg-amber-100 text-amber-700' :
                          realData.bridgeMarket.heatLabel === 'Cool' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {realData.bridgeMarket.heatLabel || 'N/A'} Market
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <DataPill label="Median Sale Price" value={realData.bridgeMarket.medianSalePrice ? `$${Number(realData.bridgeMarket.medianSalePrice).toLocaleString()}` : null} accent={accentColor} />
                        <DataPill label="Price/SF" value={realData.bridgeMarket.pricePerSF ? `$${realData.bridgeMarket.pricePerSF}/SF` : null} />
                        <DataPill label="Days on Market" value={realData.bridgeMarket.daysOnMarket ? `${realData.bridgeMarket.daysOnMarket} days` : null} />
                        <DataPill label="Inventory" value={realData.bridgeMarket.inventory} />
                      </div>
                    </div>
                  )}

                  {/* Bridge 12-Month Trend Chart */}
                  {realData.bridgeTrends?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-serif text-lg text-charcoal-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} style={{ color: accentColor }} /> 12-Month Price Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={realData.bridgeTrends} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3EFE8" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(0, 7)} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, 'Median Value']} labelFormatter={(l) => l?.slice(0, 7)} />
                          <Line type="monotone" dataKey="medianValue" stroke={accentColor} strokeWidth={2} dot={false} name="Median Value" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Bridge Nearby Comps Table */}
                  {realData.bridgeComps?.length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-serif text-lg text-charcoal-900 mb-4 flex items-center gap-2">
                        <MapPin size={16} style={{ color: accentColor }} /> Nearby Comparable Sales
                        <span className="text-sm font-normal text-charcoal-600/60 ml-1">({realData.bridgeComps.length} within 1 mi)</span>
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-cream-200">
                              <th className="text-left text-charcoal-600/60 font-medium py-2 pr-4">Address</th>
                              <th className="text-right text-charcoal-600/60 font-medium py-2 pr-4">Sale Price</th>
                              <th className="text-right text-charcoal-600/60 font-medium py-2 pr-4">Price/SF</th>
                              <th className="text-right text-charcoal-600/60 font-medium py-2 pr-4">Bldg SF</th>
                              <th className="text-right text-charcoal-600/60 font-medium py-2 pr-4">Sale Date</th>
                              <th className="text-right text-charcoal-600/60 font-medium py-2">Dist</th>
                            </tr>
                          </thead>
                          <tbody>
                            {realData.bridgeComps.slice(0, 8).map((comp, i) => (
                              <tr key={i} className="border-b border-cream-100 last:border-0 hover:bg-cream-50">
                                <td className="py-2 pr-4 text-charcoal-900 font-medium max-w-[180px] truncate">{comp.address || '—'}</td>
                                <td className="py-2 pr-4 text-right text-charcoal-900">{comp.salePrice ? `$${Number(comp.salePrice).toLocaleString()}` : '—'}</td>
                                <td className="py-2 pr-4 text-right text-charcoal-600">{comp.pricePerSF ? `$${comp.pricePerSF}/SF` : '—'}</td>
                                <td className="py-2 pr-4 text-right text-charcoal-600">{comp.sf ? Number(comp.sf).toLocaleString() : '—'}</td>
                                <td className="py-2 pr-4 text-right text-charcoal-600/70">{comp.saleDate || '—'}</td>
                                <td className="py-2 text-right text-charcoal-600/70">{comp.distance ? `${comp.distance} mi` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Census demographics */}
                  {realData.census && (
                    <div className="card p-5">
                      <h3 className="font-serif text-lg text-charcoal-900 mb-3 flex items-center gap-2">
                        <Users size={16} style={{ color: accentColor }} /> Area Demographics
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <DataPill label="Median HH Income" value={realData.census.medianHouseholdIncome ? `$${Number(realData.census.medianHouseholdIncome).toLocaleString()}` : null} />
                        <DataPill label="Population" value={realData.census.population?.toLocaleString()} />
                        <DataPill label="Vacancy Rate" value={realData.census.vacancyRate} />
                        <DataPill label="Unemployment" value={realData.census.unemploymentRate} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Market cap rate */}
              {analysis.marketCapRate && (
                <div className="card p-5">
                  <h3 className="font-serif text-lg text-charcoal-900 mb-3">Market Cap Rate Range</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-charcoal-600/70 mb-1">Low</p>
                      <p className="text-2xl font-bold font-serif text-charcoal-900">{analysis.marketCapRate.low}%</p>
                    </div>
                    <div className="flex-1 h-2 bg-cream-200 rounded-full relative">
                      <div className="absolute h-2 bg-gradient-to-r from-red-400 to-emerald-400 rounded-full w-full" />
                      {impliedCap && (
                        <div
                          className="absolute w-3 h-3 bg-accent rounded-full -top-0.5 border-2 border-white shadow"
                          title={`Your cap rate: ${impliedCap}%`}
                          style={{
                            left: `${Math.min(Math.max(
                              ((parseFloat(impliedCap) - analysis.marketCapRate.low) /
                                (analysis.marketCapRate.high - analysis.marketCapRate.low)) * 100, 0
                            ), 100)}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-charcoal-600/70 mb-1">High</p>
                      <p className="text-2xl font-bold font-serif text-charcoal-900">{analysis.marketCapRate.high}%</p>
                    </div>
                  </div>
                  {analysis.marketCapRate.marketConsensus && (
                    <p className="text-xs text-charcoal-600/70 mt-3">{analysis.marketCapRate.marketConsensus}</p>
                  )}
                </div>
              )}

              {/* Comps */}
              {analysis.comparableSales?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-serif text-lg text-charcoal-900 mb-4">Comparable Sales</h3>
                  <div className="space-y-3">
                    {analysis.comparableSales.map((comp, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-cream-50 rounded-xl border border-cream-200">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: accentColor }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-charcoal-900">{comp.description}</p>
                          <div className="flex flex-wrap gap-3 mt-1">
                            {comp.capRate && <span className="text-xs text-charcoal-600">Cap Rate: <strong>{comp.capRate}%</strong></span>}
                            {comp.pricePerSF && <span className="text-xs text-charcoal-600">$/SF: <strong>${comp.pricePerSF}</strong></span>}
                            {comp.date && <span className="text-xs text-charcoal-600/60">{comp.date}</span>}
                          </div>
                          {comp.relevance && <p className="text-xs text-charcoal-600/60 mt-1">{comp.relevance}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vacancy trends */}
              {analysis.vacancyTrends && (
                <div className="rounded-xl p-4" style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
                  <h4 className="text-sm font-semibold mb-1" style={{ color: accentColor }}>Submarket Vacancy Trends</h4>
                  <p className="text-sm text-charcoal-700">{analysis.vacancyTrends}</p>
                </div>
              )}

              {/* Risks & Opportunities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.keyRisks?.length > 0 && (
                  <div className="card p-4">
                    <h4 className="text-sm font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500" /> Key Risks
                    </h4>
                    <ul className="space-y-2">
                      {analysis.keyRisks.map((risk, i) => (
                        <li key={i} className="text-xs text-charcoal-700 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span> {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.keyOpportunities?.length > 0 && (
                  <div className="card p-4">
                    <h4 className="text-sm font-semibold text-charcoal-800 mb-3 flex items-center gap-2">
                      <Zap size={14} className="text-emerald-500" /> Key Opportunities
                    </h4>
                    <ul className="space-y-2">
                      {analysis.keyOpportunities.map((opp, i) => (
                        <li key={i} className="text-xs text-charcoal-700 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span> {opp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Investment Memorandum */}
              {analysis.dealSummary && (
                <div className="card p-6">
                  <h3 className="font-serif text-xl text-charcoal-900 mb-4">Investment Memorandum</h3>
                  <div className="space-y-3">
                    {analysis.dealSummary.split('\n\n').map((para, i) => (
                      <p key={i} className="text-sm text-charcoal-700 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="btn-primary w-full justify-center"
                style={{ background: accentColor }}
              >
                <Download size={16} /> {exporting ? 'Exporting...' : 'Export Deal Report to PDF'}
              </button>
            </>
          )}

          {!result && !loading && !error && (
            <div className="card p-12 text-center border-dashed border-2 border-cream-300 h-64 flex flex-col items-center justify-center">
              <TrendingUp size={36} className="text-cream-300 mb-4" />
              <p className="text-charcoal-600/60 text-sm">Enter deal details to get your AI-powered deal score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
