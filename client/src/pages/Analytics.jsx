import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart2, FileText, TrendingUp, Activity, Award } from 'lucide-react';
import { analyticsApi, documentsApi } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';

const TOOL_LABELS = {
  LOI: 'LOI Generator',
  LEASE_AGREEMENT: 'Lease Generator',
  CASH_FLOW_ANALYSIS: 'Cash Flow',
  DEBT_ANALYSIS: 'Debt Screener',
  PROPERTY_INTELLIGENCE: 'Property Intel',
  DEAL_ANALYSIS: 'Deal Analyzer',
};

const PIE_COLORS = ['#C8472A', '#2563EB', '#059669', '#D97706', '#7C3AED', '#0891B2'];

export default function Analytics() {
  const { settings } = useSettings();
  const [summary, setSummary] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const accentColor = settings.primaryColor || '#C8472A';

  useEffect(() => {
    Promise.all([
      analyticsApi.summary().catch(() => null),
      documentsApi.list().catch(() => ({ documents: [] })),
    ]).then(([summaryData, docData]) => {
      setSummary(summaryData);
      setDocs(docData.documents || []);
      setLoading(false);
    });
  }, []);

  // Build tool usage from docs (fallback if analytics is empty)
  const toolCounts = docs.reduce((acc, d) => {
    const label = TOOL_LABELS[d.type] || d.type;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  // summary.toolCounts values are objects { total, started, exported, saved }
  const rawToolCounts = summary?.toolCounts
    ? Object.fromEntries(
        Object.entries(summary.toolCounts)
          .map(([k, v]) => [TOOL_LABELS[k] || k, typeof v === 'object' ? v.total : v])
          .filter(([, v]) => v > 0)
      )
    : toolCounts;

  const barData = Object.entries(rawToolCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const pieData = barData.slice(0, 6).map(({ name, count }) => ({ name, value: count }));

  // Activity timeline — summary.activityByDay is { date: count } object, convert to array
  const activityData = (() => {
    if (summary?.activityByDay) {
      return Object.entries(summary.activityByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    const counts = {};
    docs.forEach(d => {
      const day = new Date(d.createdAt).toISOString().slice(0, 10);
      counts[day] = (counts[day] || 0) + 1;
    });
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: counts[key] || 0 });
    }
    return result;
  })();

  const totalDocs = docs.length;
  const totalActions = summary?.totalEvents || totalDocs;
  const mostUsed = summary?.mostUsedTool || barData[0]?.name || '—';

  const statCards = [
    { label: 'Documents Created', value: totalDocs, icon: FileText, color: 'text-accent' },
    { label: 'Total Actions', value: totalActions, icon: Activity, color: 'text-blue-600' },
    { label: 'Most Used Tool', value: mostUsed, icon: Award, color: 'text-emerald-600' },
    { label: 'Tools Used', value: barData.length, icon: BarChart2, color: 'text-purple-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-charcoal-900">Analytics</h1>
        <p className="text-charcoal-600 text-sm mt-1">Your CRE Suite usage at a glance</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="card shimmer h-24" />)}
          </div>
          <div className="card shimmer h-64" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-charcoal-600/60">{label}</p>
                  <Icon size={16} className={color} />
                </div>
                <p className={`text-2xl font-bold font-serif ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Tool Usage Bar Chart */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-serif text-lg text-charcoal-900 mb-4">Tool Usage Breakdown</h2>
              {barData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-charcoal-600/40 text-sm">
                  No usage data yet — start using tools to see stats
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4F443C' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#4F443C' }} allowDecimals={false} width={30} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDD0BB' }}
                    />
                    <Bar dataKey="count" fill={accentColor} radius={[4, 4, 0, 0]} name="Times Used" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div className="card p-5">
              <h2 className="font-serif text-lg text-charcoal-900 mb-4">Usage Share</h2>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-charcoal-600/40 text-sm text-center">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #DDD0BB' }}
                      formatter={(v, n) => [v, n]}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card p-5">
            <h2 className="font-serif text-lg text-charcoal-900 mb-4">Activity — Last 30 Days</h2>
            {activityData.every(d => d.count === 0) ? (
              <div className="flex items-center justify-center h-40 text-charcoal-600/40 text-sm">
                No activity in the past 30 days
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={activityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: '#4F443C' }}
                    tickFormatter={v => v?.slice(5)}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#4F443C' }} allowDecimals={false} width={25} />
                  <Tooltip
                    labelFormatter={v => `Date: ${v}`}
                    formatter={(v) => [v, 'Actions']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #DDD0BB' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={accentColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Actions"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
