/**
 * Bridge Data Output API Service
 * Datasets: pub (Zillow Public Records), zgecon (Zillow Economic Data)
 * Docs: https://bridgedataoutput.com
 *
 * All functions:
 *  - Cache responses for 1 hour
 *  - Return { success, data, source, cachedAt } or { success: false, error }
 *  - Never throw — always return null/error safely
 */

import axios from 'axios';

const BASE_URL = process.env.BRIDGE_BASE_URL || 'https://api.bridgedataoutput.com/api/v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map(); // key → { result, fetchedAt }

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

async function bridgeGet(dataset, endpoint, params = {}) {
  const apiKey = process.env.BRIDGE_API_KEY;
  const url = `${BASE_URL}/${dataset}/${endpoint}`;
  try {
    const res = await axios.get(url, {
      params: { access_token: apiKey, ...params },
      timeout: 12000,
    });
    if (res.data?.status && res.data.status !== 200) {
      console.error(`Bridge API ${dataset}/${endpoint} status ${res.data.status}`);
      return { success: false, bundle: [], total: 0 };
    }
    return { success: true, bundle: res.data?.bundle || [], total: res.data?.total || 0 };
  } catch (err) {
    const status = err.response?.status;
    console.error(`Bridge API error [${dataset}/${endpoint}] status=${status}: ${err.message}`);
    return { success: false, bundle: [], total: 0, error: err.message };
  }
}

// Helper: pick first non-null value from a list of paths
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

// ─── 1. getPropertyByAddress ─────────────────────────────────────────────────

export async function getPropertyByAddress(address) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };

  const key = getKey('property', address.toLowerCase().trim());
  const cached = fromCache(key);
  if (cached) return cached;

  console.log(`[Bridge] getPropertyByAddress: ${address}`);

  // Try assessments endpoint first (public records), then fall back to listings
  let bundle = [];
  for (const endpoint of ['assessments', 'listings']) {
    const res = await bridgeGet('pub', endpoint, {
      address: encodeURIComponent(address),
      limit: 1,
    });
    console.log(`[Bridge] ${endpoint} → success=${res.success}, count=${res.bundle?.length ?? 0}`);
    if (res.success && res.bundle?.length) {
      bundle = res.bundle;
      break;
    }
  }

  if (!bundle.length) {
    const result = { success: false, error: 'No property found', data: null, source: 'bridge' };
    return toCache(key, result);
  }

  const p = bundle[0];

  // Build sale history from saleHistory field or embedded sales
  const saleHistory = (p.saleHistory || p.SaleHistory || []).map(s => ({
    date: s.saleDate || s.SaleDate || s.CloseDate || s.closeDate || null,
    price: s.salePrice || s.SalePrice || s.ClosePrice || s.closePrice || null,
    buyer: s.buyerName || s.BuyerName || null,
    seller: s.sellerName || s.SellerName || null,
    documentType: s.documentType || s.DocumentType || null,
    recordingDate: s.recordingDate || s.RecordingDate || null,
  }));

  const data = {
    // Ownership
    ownerName: pick(p, 'ownership.ownerName', 'OwnerName', 'owner.name', 'ownership.name'),
    ownerMailingAddress: pick(p, 'ownership.mailingAddress.full', 'ownership.mailingAddress', 'OwnerAddress'),
    ownershipType: pick(p, 'ownership.ownershipType', 'OwnershipType', 'ownership.type'),
    // Sale
    lastSalePrice: pick(p, 'lastSalePrice', 'LastSalePrice', 'ClosePrice', 'closePrice', 'salePrice'),
    lastSaleDate: pick(p, 'lastSaleDate', 'LastSaleDate', 'CloseDate', 'closeDate', 'saleDate'),
    // Assessment
    assessedValue: pick(p, 'assessment.assessedValue', 'AssessedValue', 'assessment.total', 'assessment.value'),
    marketValue: pick(p, 'assessment.marketValue', 'MarketValue', 'assessedMarketValue'),
    taxAmount: pick(p, 'taxInfo.taxAmount', 'TaxAmount', 'annualTax', 'AnnualTax'),
    // Physical
    buildingSF: pick(p, 'characteristics.buildingArea', 'BuildingAreaTotal', 'LivingArea', 'characteristics.livingArea', 'buildingArea'),
    lotSizeSF: pick(p, 'lot.lotSize', 'LotSizeSquareFeet', 'lotSizeSquareFeet', 'lot.area'),
    lotAcres: pick(p, 'lot.lotAcres', 'LotSizeAcres', 'lotAcres'),
    yearBuilt: pick(p, 'characteristics.yearBuilt', 'YearBuilt', 'yearBuilt'),
    propertyType: pick(p, 'PropertyType', 'propertyType', 'characteristics.propertyType', 'PropertySubType'),
    numUnits: pick(p, 'characteristics.units', 'UnitsTotal', 'BedroomsTotal'),
    zoningCode: pick(p, 'Zoning', 'zoning', 'zoningCode', 'ZoningCode'),
    parcelId: pick(p, 'AssessorParcelNumber', 'parcelId', 'ParcelNumber', 'apn', 'APN'),
    // Address
    address: pick(p, 'UnparsedAddress', 'address.full', 'StreetAddress', 'fullAddress'),
    city: pick(p, 'City', 'city', 'address.city'),
    state: pick(p, 'StateOrProvince', 'state', 'address.state'),
    zip: pick(p, 'PostalCode', 'zip', 'address.postalCode', 'address.zip'),
    lat: pick(p, 'Latitude', 'latitude', 'geo.lat'),
    lng: pick(p, 'Longitude', 'longitude', 'geo.lon', 'geo.lng'),
    saleHistory,
  };

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

// ─── 2. getPropertyHistory ────────────────────────────────────────────────────

export async function getPropertyHistory(parcelId) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!parcelId) return { success: false, error: 'parcelId required', data: null };

  const key = getKey('history', parcelId);
  const cached = fromCache(key);
  if (cached) return cached;

  console.log(`[Bridge] getPropertyHistory: parcelId=${parcelId}`);
  const { success, bundle } = await bridgeGet('pub', 'transactions', {
    parcelId,
    limit: 10,
    sortBy: 'transactionDate',
    order: 'desc',
  });
  console.log(`[Bridge] transactions → success=${success}, count=${bundle?.length ?? 0}`);

  if (!success) {
    const result = { success: false, error: 'Transaction history not found', data: null, source: 'bridge' };
    return toCache(key, result);
  }

  const data = bundle.map(t => ({
    date: pick(t, 'saleDate', 'SaleDate', 'CloseDate', 'transactionDate'),
    price: pick(t, 'salePrice', 'SalePrice', 'ClosePrice', 'amount'),
    buyer: pick(t, 'buyerName', 'BuyerName', 'buyer'),
    seller: pick(t, 'sellerName', 'SellerName', 'seller'),
    documentType: pick(t, 'documentType', 'DocumentType', 'type'),
    recordingDate: pick(t, 'recordingDate', 'RecordingDate'),
  }));

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

// ─── 3. getMarketStatsByZip ───────────────────────────────────────────────────

export async function getMarketStatsByZip(zip) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!zip) return { success: false, error: 'zip required', data: null };

  const key = getKey('market', zip);
  const cached = fromCache(key);
  if (cached) return cached;

  console.log(`[Bridge] getMarketStatsByZip: zip=${zip}`);
  const { success, bundle } = await bridgeGet('zgecon', 'statistics', {
    zip,
    limit: 1,
  });
  console.log(`[Bridge] statistics → success=${success}, count=${bundle?.length ?? 0}`);

  if (!success || !bundle.length) {
    const result = { success: false, error: `No market data found for zip ${zip}`, data: null, source: 'bridge' };
    return toCache(key, result);
  }

  const s = bundle[0];

  const data = {
    zip,
    medianHomeValue: pick(s, 'MedianValuePerSqFt', 'medianValue', 'MedianValue', 'ZHVIAllHomes'),
    medianListPrice: pick(s, 'MedianListingPrice', 'medianListPrice', 'MedianListingPricePerSqFt'),
    medianSalePrice: pick(s, 'MedianSalePrice', 'medianSalePrice', 'SalePrice'),
    medianRent: pick(s, 'MedianRentPrice', 'medianRentPrice', 'MedianRent', 'medianRent', 'ZRIAllHomes'),
    daysOnMarket: pick(s, 'DaysOnMarket', 'daysOnMarket', 'MedianDaysOnMarket', 'medianDOM'),
    inventory: pick(s, 'Inventory', 'inventory', 'ActiveListings', 'activeListings'),
    priceReducedPercent: pick(s, 'PriceReducedPercent', 'priceReducedPercent', 'ReducedPercent'),
    heatIndex: pick(s, 'MarketHeatIndex', 'heatIndex', 'HeatIndex'),
    appreciation1yr: pick(s, 'Appreciation1YearChange', 'appreciation1Year', 'YoYAppreciation', 'yoyAppreciation'),
    appreciation3yr: pick(s, 'Appreciation3YearChange', 'appreciation3Year'),
    pricePerSF: pick(s, 'MedianListingPricePerSqFt', 'pricePerSF', 'PricePerSquareFoot', 'medianPricePerSqFt'),
    date: pick(s, 'Date', 'date', 'Period'),
  };

  // Compute heat label
  if (data.heatIndex != null) {
    const h = parseFloat(data.heatIndex);
    data.heatLabel = h >= 75 ? 'Hot' : h >= 50 ? 'Warm' : h >= 25 ? 'Cool' : 'Cold';
  }

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

// ─── 4. getMarketTrends ───────────────────────────────────────────────────────

export async function getMarketTrends(zip, months = 12) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!zip) return { success: false, error: 'zip required', data: null };

  const n = Math.min(parseInt(months) || 12, 24);
  const key = getKey('trends', zip, n);
  const cached = fromCache(key);
  if (cached) return cached;

  const { success, bundle } = await bridgeGet('zgecon', 'statistics', {
    zip,
    limit: n,
    sortBy: 'date',
    order: 'desc',
  });

  if (!success || !bundle.length) {
    const result = { success: false, error: `No trend data found for zip ${zip}`, data: null, source: 'bridge' };
    return toCache(key, result);
  }

  const data = bundle
    .map(s => ({
      date: pick(s, 'Date', 'date', 'Period') || '',
      medianValue: pick(s, 'MedianValue', 'medianValue', 'ZHVIAllHomes', 'MedianSalePrice') || null,
      medianRent: pick(s, 'MedianRentPrice', 'medianRentPrice', 'MedianRent', 'ZRIAllHomes') || null,
      daysOnMarket: pick(s, 'DaysOnMarket', 'daysOnMarket') || null,
      inventory: pick(s, 'Inventory', 'inventory') || null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // ascending for charts

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

// ─── 5. getNearbyComps ────────────────────────────────────────────────────────

export async function getNearbyComps(lat, lng, radius = 1, propertyType = '') {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!lat || !lng) return { success: false, error: 'lat/lng required', data: null };

  const key = getKey('comps', lat, lng, radius, propertyType);
  const cached = fromCache(key);
  if (cached) return cached;

  const params = {
    near: `${lat},${lng}`,
    radius: radius.toString(),
    limit: 10,
    sortBy: 'transactionDate',
    order: 'desc',
  };
  if (propertyType) params.propertyType = propertyType;

  const { success, bundle } = await bridgeGet('pub', 'transactions', params);

  if (!success || !bundle.length) {
    const result = { success: false, error: 'No comparable sales found nearby', data: null, source: 'bridge' };
    return toCache(key, result);
  }

  const data = bundle.map(t => {
    const salePrice = pick(t, 'salePrice', 'SalePrice', 'ClosePrice', 'amount') || null;
    const sf = pick(t, 'BuildingAreaTotal', 'buildingArea', 'LivingArea', 'characteristics.buildingArea') || null;
    const priceSF = salePrice && sf ? Math.round(salePrice / sf) : null;
    const saleLat = pick(t, 'Latitude', 'latitude', 'geo.lat');
    const saleLng = pick(t, 'Longitude', 'longitude', 'geo.lon', 'geo.lng');

    let distance = null;
    if (saleLat && saleLng) {
      const R = 3958.8; // miles
      const dLat = ((parseFloat(saleLat) - lat) * Math.PI) / 180;
      const dLon = ((parseFloat(saleLng) - lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos((lat * Math.PI) / 180) * Math.cos((parseFloat(saleLat) * Math.PI) / 180)
        * Math.sin(dLon / 2) ** 2;
      distance = +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
    }

    return {
      address: pick(t, 'UnparsedAddress', 'address.full', 'StreetAddress', 'address') || 'Unknown',
      saleDate: pick(t, 'saleDate', 'SaleDate', 'CloseDate', 'transactionDate') || null,
      salePrice,
      sf,
      pricePerSF: priceSF,
      propertyType: pick(t, 'PropertyType', 'propertyType') || null,
      distance,
      daysSinceSale: (() => {
        const d = pick(t, 'saleDate', 'SaleDate', 'CloseDate', 'transactionDate');
        if (!d) return null;
        return Math.round((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
      })(),
    };
  });

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}

// ─── 6. getNeighborhoodData ───────────────────────────────────────────────────

export async function getNeighborhoodData(zip) {
  if (!isConfigured()) return { success: false, error: 'Bridge API key not configured', data: null };
  if (!zip) return { success: false, error: 'zip required', data: null };

  const key = getKey('neighborhood', zip);
  const cached = fromCache(key);
  if (cached) return cached;

  const { success, bundle } = await bridgeGet('zgecon', 'neighborhoods', { zip });

  if (!success || !bundle.length) {
    const result = { success: false, error: `No neighborhood data for zip ${zip}`, data: null, source: 'bridge' };
    return toCache(key, result);
  }

  const n = bundle[0];

  const data = {
    name: pick(n, 'name', 'Name', 'neighborhoodName', 'NeighborhoodName') || null,
    medianIncome: pick(n, 'medianIncome', 'MedianIncome', 'MedianHouseholdIncome', 'medianHouseholdIncome') || null,
    population: pick(n, 'population', 'Population') || null,
    employmentRate: pick(n, 'employmentRate', 'EmploymentRate', 'employment') || null,
    walkScore: pick(n, 'walkScore', 'WalkScore', 'walkability') || null,
    crimeIndex: pick(n, 'crimeIndex', 'CrimeIndex', 'crime') || null,
    schoolRating: pick(n, 'schoolRating', 'SchoolRating', 'schools') || null,
  };

  const result = { success: true, data, source: 'bridge', cachedAt: Date.now() };
  return toCache(key, result);
}
