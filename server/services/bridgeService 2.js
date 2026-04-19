/**
 * Bridge Data Output API Service
 * Verified endpoints:
 *  - /pub/parcels
 *  - /zgecon/marketreport
 */

import axios from 'axios';

const BASE_URL = process.env.BRIDGE_BASE_URL || 'https://api.bridgedataoutput.com/api/v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const DEFAULT_STATE = process.env.BRIDGE_DEFAULT_STATE || 'FL';
const DEFAULT_COUNTY = process.env.BRIDGE_DEFAULT_COUNTY || 'Broward';
const DEFAULT_REGION_COUNTY = process.env.BRIDGE_REGION_COUNTY || 'Broward County';
const DEFAULT_REGION_CITY = process.env.BRIDGE_REGION_CITY || 'Fort Lauderdale';
const DEFAULT_METRIC = process.env.BRIDGE_MARKET_METRIC || 'zhvi_plus_all_homes';
const cache = new Map();

function getKey(...parts) {
  return parts.join('::');
}

function fromCache(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL) return entry.result;
  return null;
}

function toCache(key, result) {
  cache.set(key, { result, fetchedAt: Date.now() });
  return result;
}

function isConfigured() {
  const key = process.env.BRIDGE_API_KEY;
  return key && !key.startsWith('your_');
}

function pick(obj, ...paths) {
  for (const path of paths) {
    const keys = path.split('.');
    let v = obj;
    for (const k of keys) {
      if (v == null) break;
      v = v[k];
    }
    if (v != null && v !== '' && v !== 0) return v;
  }
  return null;
}

function parseBridgeError(err) {
  const status = err.response?.status || 500;
  const retryAfter = err.response?.headers?.['retry-after'];
  const bodyMessage = err.response?.data?.message || err.response?.data?.error || err.message;

  if (status === 429) {
    const retryNote = retryAfter ? ` Retry after ${retryAfter}s.` : '';
    return {
      status,
      message: `Bridge API rate limit exceeded.${retryNote}`,
      rateLimited: true,
      retryAfter: retryAfter ? Number(retryAfter) : null,
      detail: bodyMessage,
    };
  }

  return {
    status,
    message: `Bridge API request failed (${status})`,
    rateLimited: false,
    retryAfter: null,
    detail: bodyMessage,
  };
}

async function bridgeGet(path, params = {}) {
  const apiKey = process.env.BRIDGE_API_KEY;
  const url = `${BASE_URL}${path}`;

  try {
    const res = await axios.get(url, {
      params,
      timeout: 12000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const bundle = Array.isArray(res.data?.bundle) ? res.data.bundle : [];
    const total = typeof res.data?.total === 'number' ? res.data.total : bundle.length;
    return { success: true, bundle, total };
  } catch (err) {
    const parsed = parseBridgeError(err);
    console.error(`Bridge API error [${path}] status=${parsed.status}: ${parsed.detail || parsed.message}`);
    return { success: false, bundle: [], total: 0, error: parsed.message, meta: parsed };
  }
}

function buildParcelsParams(address) {
  const params = {
    county: DEFAULT_COUNTY,
    state: DEFAULT_STATE,
    limit: 25,
  };
  if (address) params.address = address;
  return params;
}

function bestAddressMatch(bundle, address) {
  if (!bundle.length) return null;
  if (!address) return bundle[0];

  const q = address.toLowerCase();
  return bundle.find((item) => {
    const addr = pick(item, 'address.full', 'Address.Full', 'address', 'UnparsedAddress');
    return typeof addr === 'string' && addr.toLowerCase().includes(q.split(',')[0].trim());
  }) || bundle[0];
}

async function getMarketReportSeries(limit = 24) {
  const base = {
    limit,
    sortBy: 'timePeriodEndDateTime',
    order: 'desc',
  };

  const attempts = [
    { ...base, regionCounty: DEFAULT_REGION_COUNTY, regionCity: DEFAULT_REGION_CITY, metricTypeKey: DEFAULT_METRIC },
    { ...base, regionCounty: DEFAULT_REGION_COUNTY, metricTypeKey: DEFAULT_METRIC },
    { ...base, regionCity: DEFAULT_REGION_CITY, metricTypeKey: DEFAULT_METRIC },
    { ...base, regionCounty: DEFAULT_REGION_COUNTY, regionCity: DEFAULT_REGION_CITY },
    { ...base, regionCounty: DEFAULT_REGION_COUNTY },
    { ...base, regionCity: DEFAULT_REGION_CITY },
  ];

  let lastFailure = { success: false, bundle: [], error: 'No market data available' };
  for (const params of attempts) {
    const res = await bridgeGet('/zgecon/marketreport', params);
    if (res.success && res.bundle.length) return res;
    lastFailure = res;
  }
  return lastFailure;
}

export async function getPropertyByAddress(address) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!address) return { success: false, error: 'address required', data: null };

  const key = getKey('property', address.toLowerCase().trim(), DEFAULT_COUNTY, DEFAULT_STATE);
  const cached = fromCache(key);
  if (cached) return cached;

  const parcelsRes = await bridgeGet('/pub/parcels', buildParcelsParams(address));
  if (!parcelsRes.success || !parcelsRes.bundle.length) {
    const result = {
      success: false,
      error: parcelsRes.error || 'No property found in Bridge parcels',
      data: null,
      source: 'bridge',
      ...(parcelsRes.meta && { meta: parcelsRes.meta }),
    };
    return toCache(key, result);
  }

  const p = bestAddressMatch(parcelsRes.bundle, address);

  const data = {
    address: pick(p, 'address.full', 'Address.Full', 'address', 'UnparsedAddress'),
    lotAcres: pick(p, 'lotSizeAcres', 'lot.acres', 'LotSizeAcres'),
    lotSizeSF: pick(p, 'lotSizeSquareFeet', 'lot.sizeSquareFeet', 'LotSizeSquareFeet'),
    landUseDescription: pick(p, 'landUseDescription', 'landUse.description', 'LandUseDescription'),
    assessmentsUrl: pick(p, 'assessmentsUrl', 'assessmentHistoryUrl', 'AssessmentUrl'),
    propertyType: pick(p, 'landUseDescription', 'propertyType', 'PropertyType'),
    parcelId: pick(p, 'parcelId', 'ParcelId', 'AssessorParcelNumber', 'APN'),
    city: pick(p, 'address.city', 'city', 'City'),
    state: pick(p, 'address.state', 'state', 'StateOrProvince'),
    zip: pick(p, 'address.zip', 'address.postalCode', 'zip', 'PostalCode'),
    lat: pick(p, 'address.lat', 'latitude', 'Latitude', 'geo.lat'),
    lng: pick(p, 'address.lng', 'longitude', 'Longitude', 'geo.lon', 'geo.lng'),
  };

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

export async function getPropertyHistory(parcelId) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!parcelId) return { success: false, error: 'parcelId required', data: null };

  const key = getKey('history', parcelId);
  const cached = fromCache(key);
  if (cached) return cached;

  const parcelsRes = await bridgeGet('/pub/parcels', {
    county: DEFAULT_COUNTY,
    state: DEFAULT_STATE,
    parcelId,
    limit: 1,
  });

  if (!parcelsRes.success || !parcelsRes.bundle.length) {
    const result = {
      success: false,
      error: parcelsRes.error || 'Property history not available from parcels feed',
      data: null,
      source: 'bridge',
      ...(parcelsRes.meta && { meta: parcelsRes.meta }),
    };
    return toCache(key, result);
  }

  const p = parcelsRes.bundle[0];
  const data = {
    parcelId,
    assessmentsUrl: pick(p, 'assessmentsUrl', 'assessmentHistoryUrl', 'AssessmentUrl'),
    address: pick(p, 'address.full', 'Address.Full', 'address', 'UnparsedAddress'),
  };

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

export async function getMarketStatsByZip(zip) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };

  const key = getKey('market', zip || 'default', DEFAULT_REGION_COUNTY, DEFAULT_REGION_CITY, DEFAULT_METRIC);
  const cached = fromCache(key);
  if (cached) return cached;

  const marketRes = await getMarketReportSeries(1);
  if (!marketRes.success || !marketRes.bundle.length) {
    const result = {
      success: false,
      error: marketRes.error || 'No market data available',
      data: null,
      source: 'bridge',
      ...(marketRes.meta && { meta: marketRes.meta }),
    };
    return toCache(key, result);
  }

  const row = marketRes.bundle.find((r) => pick(r, 'metricTypeKey', 'MetricTypeKey') === DEFAULT_METRIC) || marketRes.bundle[0];
  const dataValue = pick(row, 'dataValue', 'value', 'Value');
  const metricTypeKey = pick(row, 'metricTypeKey', 'MetricTypeKey');
  const ts = pick(row, 'timePeriodEndDateTime', 'TimePeriodEndDateTime', 'date');

  const data = {
    zip: zip || null,
    regionCounty: pick(row, 'regionCounty', 'RegionCounty') || DEFAULT_REGION_COUNTY,
    regionCity: pick(row, 'regionCity', 'RegionCity') || DEFAULT_REGION_CITY,
    metricTypeKey,
    dataValue,
    timePeriodEndDateTime: ts,
    medianHomeValue: dataValue,
    date: ts,
  };

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

export async function getMarketTrends(zip, months = 12) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };

  const n = Math.min(parseInt(months, 10) || 12, 24);
  const key = getKey('trends', zip || 'default', n, DEFAULT_REGION_COUNTY, DEFAULT_REGION_CITY, DEFAULT_METRIC);
  const cached = fromCache(key);
  if (cached) return cached;

  const marketRes = await getMarketReportSeries(n);
  if (!marketRes.success || !marketRes.bundle.length) {
    const result = {
      success: false,
      error: marketRes.error || 'No trend data available',
      data: null,
      source: 'bridge',
      ...(marketRes.meta && { meta: marketRes.meta }),
    };
    return toCache(key, result);
  }

  const scopedRows = marketRes.bundle.filter(
    (r) => pick(r, 'metricTypeKey', 'MetricTypeKey') === DEFAULT_METRIC
  );

  const rows = scopedRows.length ? scopedRows : marketRes.bundle;

  const data = rows
    .map((row) => ({
      metricTypeKey: pick(row, 'metricTypeKey', 'MetricTypeKey') || DEFAULT_METRIC,
      dataValue: pick(row, 'dataValue', 'value', 'Value') || null,
      timePeriodEndDateTime: pick(row, 'timePeriodEndDateTime', 'TimePeriodEndDateTime', 'date') || '',
      date: pick(row, 'timePeriodEndDateTime', 'TimePeriodEndDateTime', 'date') || '',
      medianValue: pick(row, 'dataValue', 'value', 'Value') || null,
      medianRent: null,
      daysOnMarket: null,
      inventory: null,
    }))
    .sort((a, b) => a.timePeriodEndDateTime.localeCompare(b.timePeriodEndDateTime));

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

export async function getNearbyComps(lat, lng, radius = 1, propertyType = '') {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!lat || !lng) return { success: false, error: 'lat/lng required', data: null };

  const key = getKey('comps', lat, lng, radius, propertyType);
  const cached = fromCache(key);
  if (cached) return cached;

  const result = {
    success: false,
    error: 'Comparable sales are not exposed by the verified Bridge endpoints (/pub/parcels, /zgecon/marketreport).',
    data: null,
    source: 'bridge',
  };
  return toCache(key, result);
}

export async function getNeighborhoodData(zip) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!zip) return { success: false, error: 'zip required', data: null };

  const key = getKey('neighborhood', zip);
  const cached = fromCache(key);
  if (cached) return cached;

  const result = {
    success: false,
    error: 'Neighborhood-level stats are not exposed by the verified Bridge endpoint set.',
    data: null,
    source: 'bridge',
  };
  return toCache(key, result);
}
