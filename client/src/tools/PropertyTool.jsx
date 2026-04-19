import React, { useState } from 'react';
import { Search, AlertTriangle, Home, MapPin, DollarSign, Droplets, RefreshCw, Building2, TrendingUp, BarChart2, Clock, Landmark } from 'lucide-react';
import ToolHeader from '../components/ToolHeader.jsx';
import DealSelector from '../components/DealSelector.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import GooglePlacesInput from '../components/GooglePlacesInput.jsx';
import { propertyApi } from '../lib/api.js';

function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="shimmer w-4 h-4 rounded" />
        <div className="shimmer h-4 w-28 rounded" />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex justify-between py-1.5 border-b border-cream-100">
          <div className="shimmer h-3 w-24 rounded" />
          <div className="shimmer h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

function DataCard({ title, icon: Icon, children, success = true, loading, onRetry, source }) {
  if (loading) return <SkeletonCard />;
  return (
    <div className={`card p-5 ${!success ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className={success ? 'text-accent' : 'text-charcoal-600/40'} />
        <h3 className="font-semibold text-sm text-charcoal-800 flex-1">{title}</h3>
        {!success && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500">Unavailable</span>
            {onRetry && (
              <button
                onClick={onRetry}
                title="Retry"
                className="text-charcoal-600/50 hover:text-accent transition-colors"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-cream-100 last:border-0">
      <span className="text-xs text-charcoal-600/70">{label}</span>
      <span className="text-sm font-medium text-charcoal-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function PropertyTool() {
  const [dealId, setDealId] = useState(null);
  const [confirmedPlace, setConfirmedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runLookup = async (address) => {
    setLoading(true);
    setLoadingSources({ bridge: true, attom: true, geocode: true, flood: true, census: true });
    setError(null);
    setResult(null);

    const sourceDelay = (src, ms) => setTimeout(() => {
      setLoadingSources(p => ({ ...p, [src]: false }));
    }, ms);

    sourceDelay('geocode', 600);
    sourceDelay('bridge', 1000);
    sourceDelay('flood', 1400);
    sourceDelay('census', 1900);
    sourceDelay('attom', 2600);

    try {
      const data = await propertyApi.lookup({ address, dealId });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setLoadingSources({});
    }
  };

  const handleConfirm = (place) => {
    setConfirmedPlace(place);
    runLookup(place.fullAddress);
  };

  const handleRetrySource = (source) => {
    if (!confirmedPlace) return;
    setLoadingSources(p => ({ ...p, [source]: true }));
    // Re-run the full lookup (server fetches all sources)
    runLookup(confirmedPlace.fullAddress);
  };

  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : null;
  const fmtSF = (n) => n != null ? `${Number(n).toLocaleString()} SF` : null;

  const isLoading = (src) => loading || !!loadingSources[src];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <ToolHeader
        title="Property Intelligence"
        description="Pull owner records, assessed value, flood zone, and census demographics for any address."
        icon={Search}
      />

      <div className="card p-6 mb-8">
        <div className="space-y-4">
          <DealSelector selectedDealId={dealId} onSelect={setDealId} />
          <GooglePlacesInput onConfirm={handleConfirm} />
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Loading state — skeleton grid */}
      {loading && !result && (
        <div className="space-y-6">
          {/* AI summary skeleton */}
          <div className="bg-cream-50 border border-cream-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="shimmer w-5 h-5 rounded-full" />
              <div className="shimmer h-4 w-32 rounded" />
            </div>
            {[1, 2, 3].map(i => <div key={i} className="shimmer h-3 rounded mb-2" style={{ width: `${80 + i * 5}%` }} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Source errors */}
          {result.errors?.length > 0 && (
            <div className="space-y-2">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span><strong>{err.source}:</strong> {err.error}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {result.aiSummary && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-accent">AI</span>
                </div>
                <span className="text-sm font-semibold text-charcoal-800">Property Intelligence Summary</span>
              </div>
              <p className="text-sm text-charcoal-700 leading-relaxed">{result.aiSummary}</p>
            </div>
          )}

          {/* Data grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Bridge — Ownership */}
            <DataCard
              title="Ownership Record"
              icon={Home}
              success={!!result.data.bridge}
              loading={isLoading('bridge')}
              onRetry={() => handleRetrySource('bridge')}
              source="Bridge"
            >
              {result.data.bridge ? (
                <>
                  <DataRow label="Owner" value={result.data.bridge.ownerName} />
                  <DataRow label="Owner Type" value={result.data.bridge.ownershipType} />
                  <DataRow label="Mailing Address" value={result.data.bridge.ownerMailingAddress} />
                  <DataRow label="Parcel ID" value={result.data.bridge.parcelId} />
                  <DataRow label="Zoning" value={result.data.bridge.zoningCode} />
                  <DataRow label="Property Type" value={result.data.bridge.propertyType} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Ownership data not available</p>
              )}
            </DataCard>

            {/* Bridge — Valuation */}
            <DataCard
              title="Valuation"
              icon={DollarSign}
              success={!!result.data.bridge}
              loading={isLoading('bridge')}
              source="Bridge"
            >
              {result.data.bridge ? (
                <>
                  <DataRow label="Assessed Value" value={fmt(result.data.bridge.assessedValue)} />
                  <DataRow label="Market Value" value={fmt(result.data.bridge.marketValue)} />
                  <DataRow label="Annual Taxes" value={fmt(result.data.bridge.taxAmount)} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Valuation data not available</p>
              )}
            </DataCard>

            {/* Bridge — Physical Characteristics */}
            <DataCard
              title="Physical Characteristics"
              icon={Building2}
              success={!!result.data.bridge}
              loading={isLoading('bridge')}
              source="Bridge"
            >
              {result.data.bridge ? (
                <>
                  <DataRow label="Year Built" value={result.data.bridge.yearBuilt} />
                  <DataRow label="Building SF" value={fmtSF(result.data.bridge.buildingSF)} />
                  <DataRow label="Lot SF" value={fmtSF(result.data.bridge.lotSizeSF)} />
                  <DataRow label="Lot Acres" value={result.data.bridge.lotAcres ? `${result.data.bridge.lotAcres} ac` : null} />
                  <DataRow label="Units" value={result.data.bridge.numUnits} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Physical data not available</p>
              )}
            </DataCard>

            {/* Bridge — Sale History */}
            <DataCard
              title="Sale History"
              icon={Clock}
              success={!!(result.data.bridgeHistory?.length || result.data.bridge?.lastSalePrice)}
              loading={isLoading('bridge')}
              source="Bridge"
            >
              {result.data.bridgeHistory?.length > 0 ? (
                <div className="space-y-2">
                  {result.data.bridgeHistory.slice(0, 5).map((sale, i) => (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-cream-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-charcoal-900">{sale.date || 'Unknown date'}</p>
                        <p className="text-xs text-charcoal-600/60">{sale.documentType || 'Transfer'}</p>
                      </div>
                      <span className="text-sm font-semibold text-charcoal-900">
                        {sale.price ? fmt(sale.price) : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : result.data.bridge?.lastSalePrice ? (
                <>
                  <DataRow label="Last Sale Price" value={fmt(result.data.bridge.lastSalePrice)} />
                  <DataRow label="Last Sale Date" value={result.data.bridge.lastSaleDate} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Sale history not available</p>
              )}
            </DataCard>

            {/* Bridge — Market Context */}
            <DataCard
              title="Market Context"
              icon={TrendingUp}
              success={!!result.data.bridgeMarket}
              loading={isLoading('bridge')}
              source="Bridge"
            >
              {result.data.bridgeMarket ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      result.data.bridgeMarket.heatLabel === 'Hot' ? 'bg-red-100 text-red-700' :
                      result.data.bridgeMarket.heatLabel === 'Warm' ? 'bg-amber-100 text-amber-700' :
                      result.data.bridgeMarket.heatLabel === 'Cool' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {result.data.bridgeMarket.heatLabel || 'Unknown'} Market
                    </span>
                  </div>
                  <DataRow label="Median Sale Price" value={fmt(result.data.bridgeMarket.medianSalePrice)} />
                  <DataRow label="Price/SF" value={result.data.bridgeMarket.pricePerSF ? `$${result.data.bridgeMarket.pricePerSF}/SF` : null} />
                  <DataRow label="Days on Market" value={result.data.bridgeMarket.daysOnMarket ? `${result.data.bridgeMarket.daysOnMarket} days` : null} />
                  <DataRow label="Inventory" value={result.data.bridgeMarket.inventory} />
                  <DataRow label="Median Rent" value={fmt(result.data.bridgeMarket.medianRent)} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Market data not available</p>
              )}
            </DataCard>

            {/* Bridge — Neighborhood */}
            <DataCard
              title="Neighborhood"
              icon={Landmark}
              success={!!result.data.bridgeNeighborhood}
              loading={isLoading('bridge')}
              source="Bridge"
            >
              {result.data.bridgeNeighborhood ? (
                <>
                  <DataRow label="Walk Score" value={result.data.bridgeNeighborhood.walkScore} />
                  <DataRow label="Transit Score" value={result.data.bridgeNeighborhood.transitScore} />
                  <DataRow label="Bike Score" value={result.data.bridgeNeighborhood.bikeScore} />
                  <DataRow label="Neighborhood Type" value={result.data.bridgeNeighborhood.neighborhoodType} />
                  <DataRow label="Median Income" value={fmt(result.data.bridgeNeighborhood.medianIncome)} />
                  <DataRow label="Population" value={result.data.bridgeNeighborhood.population?.toLocaleString()} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Neighborhood data not available</p>
              )}
            </DataCard>

            {/* Location (Geocode) */}
            <DataCard
              title="Location"
              icon={MapPin}
              success={!!result.data.geocode}
              loading={isLoading('geocode')}
              onRetry={() => handleRetrySource('geocode')}
            >
              {result.data.geocode ? (
                <>
                  <DataRow label="Full Address" value={result.data.geocode.displayName?.split(',').slice(0, 3).join(',')} />
                  <DataRow label="Latitude" value={result.data.geocode.lat?.toFixed(6)} />
                  <DataRow label="Longitude" value={result.data.geocode.lon?.toFixed(6)} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Geocoding not available</p>
              )}
            </DataCard>

            {/* Flood Zone */}
            <DataCard
              title="Flood Zone"
              icon={Droplets}
              success={!!result.data.flood}
              loading={isLoading('flood')}
              onRetry={() => handleRetrySource('flood')}
            >
              {result.data.flood ? (
                <>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-3 ${
                    result.data.flood.isHighRisk
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    <Droplets size={14} />
                    Zone {result.data.flood.floodZone}
                    {result.data.flood.isHighRisk ? ' — High Risk' : ' — Low Risk'}
                  </div>
                  <DataRow label="Description" value={result.data.flood.floodZoneDescription} />
                  {result.data.flood.baseFloodElevation && (
                    <DataRow label="Base Flood Elevation" value={`${result.data.flood.baseFloodElevation} ft`} />
                  )}
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Flood zone data not available</p>
              )}
            </DataCard>

            {/* Census Demographics */}
            <DataCard
              title="Census Demographics"
              icon={BarChart2}
              success={!!result.data.census}
              loading={isLoading('census')}
              onRetry={() => handleRetrySource('census')}
            >
              {result.data.census ? (
                <>
                  <DataRow label="Census Tract" value={result.data.census.censusTract} />
                  <DataRow label="County" value={result.data.census.county} />
                  <DataRow label="Population" value={result.data.census.population?.toLocaleString()} />
                  <DataRow label="Median HH Income" value={fmt(result.data.census.medianHouseholdIncome)} />
                  <DataRow label="Median Home Value" value={fmt(result.data.census.medianHomeValue)} />
                  <DataRow label="Vacancy Rate" value={result.data.census.vacancyRate} />
                  <DataRow label="Unemployment Rate" value={result.data.census.unemploymentRate} />
                </>
              ) : (
                <p className="text-xs text-charcoal-600/60 py-2">Census data not available</p>
              )}
            </DataCard>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="card p-12 text-center border-dashed border-2 border-cream-300 flex flex-col items-center justify-center">
          <Search size={36} className="text-cream-300 mb-4" />
          <p className="text-charcoal-600/60 text-sm">Search an address above to pull property intelligence</p>
        </div>
      )}
    </div>
  );
}
