import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fredApi, bridgeApi } from '../lib/api.js';

const TABS = [
  { id: 'DGS10', label: '10-Yr Treasury', unit: '%', color: '#2563EB' },
  { id: 'LOAN_RATES', label: 'Loan Rates', unit: '', static: true },
  { id: 'CAP_RATES', label: 'Cap Rates', unit: '%', multi: true },
  { id: 'OFFICE_VACANCY', label: 'Office Vacancy', unit: '%', color: '#7C3AED' },
  { id: 'RETAIL_VACANCY', label: 'Retail Vacancy', unit: '%', color: '#D97706' },
  { id: 'INDUSTRIAL_VACANCY', label: 'Industrial Vacancy', unit: '%', color: '#059669' },
  { id: 'MULTIFAMILY_VACANCY', label: 'Multifamily Vacancy', unit: '%', color: '#0891B2' },
];

const LOAN_RATE_TABLE = [
  { product: 'Agency (Fannie/Freddie) — Multifamily', ltv: '80%', term: '10 yr', spread: '+125–175 bps', typical: '5.75–6.25%', recourse: 'Non-recourse' },
  { product: 'CMBS / Conduit', ltv: '75%', term: '10 yr', spread: '+150–250 bps', typical: '6.00–7.00%', recourse: 'Non-recourse' },
  { product: 'Life Insurance Company', ltv: '60–65%', term: '10–15 yr', spread: '+100–150 bps', typical: '5.50–6.00%', recourse: 'Non-recourse' },
  { product: 'SBA 504 (Owner-Occupied)', ltv: '90%', term: '20–25 yr', spread: 'Fixed + SBA debenture', typical: '6.50–7.50%', recourse: 'Full recourse' },
  { product: 'Conventional Bank / Regional', ltv: '70–75%', term: '3–7 yr', spread: '+200–300 bps', typical: '6.50–7.50%', recourse: 'Full recourse' },
  { product: 'Bridge Loan', ltv: '70–80%', term: '1–3 yr', spread: 'SOFR + 300–550 bps', typical: '7.50–9.50%', recourse: 'Full recourse' },
  { product: 'Debt Fund / Mezz', ltv: '80–90%', term: '2–5 yr', spread: 'Fixed or floating', typical: '9.00–14.00%', recourse: 'Varies' },
  { product: 'HUD 223(f) — Multifamily Refi', ltv: '87%', term: '35 yr', spread: '+80–120 bps', typical: '5.25–5.75%', recourse: 'Non-recourse' },
];

function ChangeChip({ value }) {
  if (value == null) return null;
  const positive = value > 0;
  const neutral = value === 0;
  const Icon = neutral ? Minus : positive ? TrendingUp : TrendingDown;
  const color = neutral ? 'text-charcoal-600' : positive ? 'text-red-500' : 'text-emerald-600';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      <Icon size={12} />
      {positive ? '+' : ''}{value}%
    </span>
  );
}

function SingleChart({ data, color, label, unit }) {
  if (!data?.observations?.length) {
    return <p className="text-sm text-charcoal-600/50 py-8 text-center">Data not available</p>;
  }

  const chartData = data.observations.map(o => ({
    date: o.date,
    value: typeof o.value === 'number' ? o.value : parseFloat(o.value),
  }));

  return (
    <div>
      {/* Summary stats */}
      <div className="flex gap-6 mb-6">
        <div>
          <p className="text-xs text-charcoal-600/50 mb-1">Current</p>
          <p className="text-2xl font-bold font-serif text-charcoal-900">{data.current}{unit}</p>
        </div>
        <div>
          <p className="text-xs text-charcoal-600/50 mb-1">3-Month Change</p>
          <ChangeChip value={data.change3m} />
        </div>
        <div>
          <p className="text-xs text-charcoal-600/50 mb-1">1-Year Change</p>
          <ChangeChip value={data.change1y} />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#4F443C' }}
            tickFormatter={v => v?.slice(0, 7)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#4F443C' }}
            tickFormatter={v => `${v}${unit}`}
            width={45}
          />
          <Tooltip
            formatter={(v) => [`${v}${unit}`, label]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDD0BB' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="text-xs text-charcoal-600/40 mt-3">Source: {data.source} · Last updated: {data.lastUpdated}</p>
    </div>
  );
}

function MultiChart({ data }) {
  if (!data?.series?.length) {
    return <p className="text-sm text-charcoal-600/50 py-8 text-center">Data not available</p>;
  }

  // Merge all dates
  const allDates = [...new Set(data.series.flatMap(s => s.data.map(d => d.date)))].sort();
  const chartData = allDates.map(date => {
    const point = { date };
    data.series.forEach(s => {
      const obs = s.data.find(d => d.date === date);
      if (obs) point[s.name] = obs.value;
    });
    return point;
  });

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#4F443C' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#4F443C' }}
            tickFormatter={v => `${v}%`}
            width={45}
          />
          <Tooltip
            formatter={(v, name) => [`${v}%`, name]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #DDD0BB' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {data.series.map(s => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-charcoal-600/40 mt-3">Source: {data.source} · Last updated: {data.lastUpdated}</p>
    </div>
  );
}

export default function MarketPulseModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('DGS10');
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);

  // Bridge zip state
  const [zip, setZip] = useState('');
  const [bridgeSnapshot, setBridgeSnapshot] = useState(null);
  const [bridgeTrends, setBridgeTrends] = useState(null);
  const [bridgeComps, setBridgeComps] = useState(null);
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [zipError, setZipError] = useState(null);

  const tab = TABS.find(t => t.id === activeTab);

  useEffect(() => {
    if (activeTab === 'BRIDGE_TRENDS') return;
    const fetchId = activeTab === 'LOAN_RATES' ? 'DGS10' : activeTab;
    if (cache[fetchId]) return;
    setLoading(true);
    fredApi.series(fetchId)
      .then(data => setCache(prev => ({ ...prev, [fetchId]: data })))
      .catch(() => setCache(prev => ({ ...prev, [fetchId]: { error: true, observations: [] } })))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const fetchBridgeData = async () => {
    const z = zip.trim();
    if (!z) return;
    if (z.length !== 5 || !/^\d+$/.test(z)) {
      setZipError('Please enter a valid 5-digit ZIP code');
      setBridgeSnapshot(null);
      setBridgeTrends(null);
      return;
    }
    setZipError(null);
    setBridgeLoading(true);
    try {
      const [mkt, trends] = await Promise.all([
        bridgeApi.market(z),
        bridgeApi.trends(z, 24),
      ]);
      const hasData = mkt.success && mkt.data;
      setBridgeSnapshot(hasData ? mkt.data : null);
      setBridgeTrends(trends.success ? trends.data : null);
      if (!hasData) setZipError('No market data found for this ZIP code');
    } catch {
      setBridgeSnapshot(null);
      setBridgeTrends(null);
      setZipError('No market data found for this ZIP code');
    } finally {
      setBridgeLoading(false);
    }
  };

  const data = cache[activeTab];

  // Build dual-line chart data from Bridge trends
  const dualChartData = (() => {
    if (!bridgeTrends?.length) return null;
    return bridgeTrends.map(pt => ({
      date: pt.date?.slice(0, 7),
      medianPrice: pt.medianValue,
      daysOnMarket: pt.daysOnMarket,
      inventory: pt.inventory,
    }));
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <div>
            <h2 className="font-serif text-xl text-charcoal-900">Market Pulse</h2>
            <p className="text-xs text-charcoal-600/50">Live commercial real estate market data</p>
          </div>
          <button onClick={onClose} className="text-charcoal-600/40 hover:text-charcoal-900 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* ZIP Lookup Row */}
        <div className="px-6 pt-3 pb-2 border-b border-cream-200">
          <div className="flex items-center gap-3">
            <Search size={14} className="text-charcoal-600/50 flex-shrink-0" />
            <input
              type="text"
              value={zip}
              onChange={(e) => { setZip(e.target.value); setZipError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && fetchBridgeData()}
              placeholder="Enter ZIP for local market snapshot..."
              className="flex-1 text-sm outline-none text-charcoal-900 placeholder:text-charcoal-600/40 bg-transparent"
              maxLength={5}
            />
            <button
              onClick={fetchBridgeData}
              disabled={bridgeLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-charcoal-900 text-white disabled:opacity-50"
            >
              {bridgeLoading ? '...' : 'Search'}
            </button>
          </div>
          {zipError && (
            <p className="text-xs text-red-600 mt-1.5 ml-5">{zipError}</p>
          )}
        </div>

        {/* Bridge Snapshot Bar */}
        {bridgeSnapshot && (
          <div className="px-6 py-3 bg-cream-50 border-b border-cream-200 flex flex-wrap gap-4 items-center">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              bridgeSnapshot.heatLabel === 'Hot' ? 'bg-red-100 text-red-700' :
              bridgeSnapshot.heatLabel === 'Warm' ? 'bg-amber-100 text-amber-700' :
              bridgeSnapshot.heatLabel === 'Cool' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-700'
            }`}>{bridgeSnapshot.heatLabel || 'N/A'} Market — {zip}</span>
            {bridgeSnapshot.medianSalePrice && (
              <span className="text-xs text-charcoal-700">Median: <strong>${Number(bridgeSnapshot.medianSalePrice).toLocaleString()}</strong></span>
            )}
            {bridgeSnapshot.pricePerSF && (
              <span className="text-xs text-charcoal-700">PSF: <strong>${bridgeSnapshot.pricePerSF}</strong></span>
            )}
            {bridgeSnapshot.daysOnMarket && (
              <span className="text-xs text-charcoal-700">DOM: <strong>{bridgeSnapshot.daysOnMarket} days</strong></span>
            )}
            {bridgeSnapshot.inventory != null && (
              <span className="text-xs text-charcoal-700">Inventory: <strong>{bridgeSnapshot.inventory}</strong></span>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-cream-200 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-charcoal-900 text-white'
                  : 'text-charcoal-600/70 hover:bg-cream-100'
              }`}
            >
              {t.label}
            </button>
          ))}
          {dualChartData && (
            <button
              onClick={() => setActiveTab('BRIDGE_TRENDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'BRIDGE_TRENDS'
                  ? 'bg-charcoal-900 text-white'
                  : 'text-charcoal-600/70 hover:bg-cream-100'
              }`}
            >
              Local Trends ({zip})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && activeTab !== 'BRIDGE_TRENDS' && activeTab !== 'LOAN_RATES' && (
            <div className="space-y-3">
              <div className="h-6 shimmer rounded w-48" />
              <div className="h-[220px] shimmer rounded-xl" />
            </div>
          )}

          {/* Commercial Loan Rates reference table */}
          {activeTab === 'LOAN_RATES' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-charcoal-800">Commercial Loan Rate Reference</p>
                  <p className="text-xs text-charcoal-600/50 mt-0.5">Typical ranges as of early 2026 · Spreads over 10-Year Treasury</p>
                </div>
                {cache['DGS10']?.current && (
                  <div className="text-right">
                    <p className="text-xs text-charcoal-600/50">10-Yr Treasury</p>
                    <p className="text-xl font-bold font-serif text-blue-600">{cache['DGS10'].current}%</p>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-charcoal-900 text-white">
                      {['Loan Product', 'Max LTV', 'Term', 'Spread', 'Typical Rate', 'Recourse'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LOAN_RATE_TABLE.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                        <td className="px-3 py-2.5 font-medium text-charcoal-900">{row.product}</td>
                        <td className="px-3 py-2.5 text-charcoal-700">{row.ltv}</td>
                        <td className="px-3 py-2.5 text-charcoal-700 whitespace-nowrap">{row.term}</td>
                        <td className="px-3 py-2.5 text-charcoal-700">{row.spread}</td>
                        <td className="px-3 py-2.5 font-semibold text-charcoal-900">{row.typical}</td>
                        <td className="px-3 py-2.5 text-charcoal-600/70">{row.recourse}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-charcoal-600/40 mt-3">Reference rates only · Actual rates depend on property type, LTV, DSCR, borrower profile, and market conditions</p>
            </div>
          )}

          {/* FRED charts */}
          {!loading && data && activeTab !== 'BRIDGE_TRENDS' && activeTab !== 'LOAN_RATES' && (
            tab?.multi
              ? <MultiChart data={data} />
              : <SingleChart data={data} color={tab.color} label={tab.label} unit={tab.unit} />
          )}

          {/* Bridge local trends chart */}
          {activeTab === 'BRIDGE_TRENDS' && dualChartData && (
            <div>
              <div className="flex gap-6 mb-5">
                {bridgeSnapshot?.medianSalePrice && (
                  <div>
                    <p className="text-xs text-charcoal-600/50 mb-1">Median Sale Price</p>
                    <p className="text-2xl font-bold font-serif text-charcoal-900">${Number(bridgeSnapshot.medianSalePrice).toLocaleString()}</p>
                  </div>
                )}
                {bridgeSnapshot?.inventory != null && (
                  <div>
                    <p className="text-xs text-charcoal-600/50 mb-1">Inventory</p>
                    <p className="text-2xl font-bold font-serif text-charcoal-900">{bridgeSnapshot.inventory}</p>
                  </div>
                )}
                {bridgeSnapshot?.daysOnMarket && (
                  <div>
                    <p className="text-xs text-charcoal-600/50 mb-1">Avg Days on Market</p>
                    <p className="text-2xl font-bold font-serif text-charcoal-900">{bridgeSnapshot.daysOnMarket}</p>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dualChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4F443C' }} interval="preserveStartEnd" />
                  <YAxis yAxisId="price" tick={{ fontSize: 10, fill: '#4F443C' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={55} />
                  <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 10, fill: '#4F443C' }} width={35} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #DDD0BB' }}
                    formatter={(v, name) => name === 'medianPrice' ? [`$${Number(v).toLocaleString()}`, 'Median Value'] : [v, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="price" type="monotone" dataKey="medianPrice" stroke="#C8472A" strokeWidth={2} dot={false} name="Median Value" />
                  <Line yAxisId="count" type="monotone" dataKey="inventory" stroke="#6366f1" strokeWidth={2} dot={false} name="Inventory" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-charcoal-600/40 mt-3">Source: Bridge Data Output · ZIP {zip}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
