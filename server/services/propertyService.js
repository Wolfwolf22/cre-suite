import axios from 'axios';

// ─── Geocoding via OpenStreetMap Nominatim ────────────────────────────────────

export async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        addressdetails: 1,
        limit: 1,
      },
      headers: { 'User-Agent': 'CRE-Suite/1.0 (commercial-real-estate-app)' },
      timeout: 8000,
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        success: true,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name,
        addressComponents: result.address,
      };
    }
    return { success: false, error: 'Address not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── ATTOM Data API ───────────────────────────────────────────────────────────

export async function fetchAttomData(address) {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey || apiKey === 'your_attom_api_key_here') {
    return { success: false, error: 'ATTOM API key not configured' };
  }

  try {
    // Parse address for ATTOM format
    const parts = address.split(',');
    const street = parts[0]?.trim();
    const cityState = parts.slice(1).join(',').trim();

    const response = await axios.get('https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/detail', {
      params: {
        address1: street,
        address2: cityState,
      },
      headers: {
        apikey: apiKey,
        Accept: 'application/json',
      },
      timeout: 10000,
    });

    const property = response.data?.property?.[0];
    if (!property) return { success: false, error: 'Property not found in ATTOM' };

    const building = property.building || {};
    const lot = property.lot || {};
    const assessment = property.assessment || {};
    const sale = property.sale || {};
    const summary = property.summary || {};

    return {
      success: true,
      data: {
        ownerName: property.owner?.owner1?.lastname
          ? `${property.owner.owner1.firstname || ''} ${property.owner.owner1.lastname}`.trim()
          : property.owner?.mailingaddress?.oneLine || 'Not available',
        lastSaleDate: sale.salesearchdate || null,
        lastSalePrice: sale.amount?.saleamt || null,
        assessedValue: assessment.assessed?.assdttlvalue || null,
        marketValue: assessment.market?.mktttlvalue || null,
        lotSize: lot.lotsize2 ? `${lot.lotsize2.toLocaleString()} SF` : null,
        lotAcres: lot.lotsize1 ? `${lot.lotsize1} acres` : null,
        buildingSF: building.size?.universalsize || null,
        yearBuilt: summary.yearbuilt || null,
        propertyType: summary.proptype || null,
        zoningCode: summary.legal1 || null,
        bedrooms: building.rooms?.beds || null,
        bathrooms: building.rooms?.bathstotal || null,
        stories: building.summary?.storyDesc || null,
        apn: property.identifier?.apn || null,
      },
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return { success: false, error: 'Property not found in ATTOM database' };
    }
    if (err.response?.status === 401 || err.response?.status === 403) {
      return { success: false, error: 'ATTOM API authentication failed - check your API key' };
    }
    return { success: false, error: `ATTOM API error: ${err.message}` };
  }
}

// ─── Census Bureau API ────────────────────────────────────────────────────────

export async function fetchCensusData(lat, lon, address = null) {
  const apiKey = process.env.CENSUS_API_KEY;

  try {
    let geographies = null;

    // Try onelineaddress geocoder first (more reliable for street addresses)
    if (address) {
      try {
        const addrRes = await axios.get(
          'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress',
          {
            params: {
              address,
              benchmark: 'Public_AR_Current',
              vintage: 'Current_Current',
              format: 'json',
            },
            timeout: 8000,
          }
        );
        const matches = addrRes.data?.result?.addressMatches;
        if (matches?.length) {
          geographies = matches[0].geographies;
        }
      } catch (_) { /* fall through to coordinates */ }
    }

    // Fall back to coordinates geocoder
    if (!geographies) {
      const geoResponse = await axios.get(
        'https://geocoding.geo.census.gov/geocoder/geographies/coordinates',
        {
          params: {
            x: lon,
            y: lat,
            benchmark: 'Public_AR_Current',
            vintage: 'Current_Current',
            format: 'json',
          },
          timeout: 8000,
        }
      );
      geographies = geoResponse.data?.result?.geographies;
    }

    const tractInfo = geographies?.['Census Tracts']?.[0];
    const countyInfo = geographies?.Counties?.[0];
    const stateInfo = geographies?.States?.[0];

    if (!tractInfo) return { success: false, error: 'Census tract not found' };

    const state = tractInfo.STATE;
    const county = tractInfo.COUNTY;
    const tract = tractInfo.TRACT;

    // Fetch ACS 5-year data for the census tract
    const acsUrl = `https://api.census.gov/data/2022/acs/acs5`;
    const variables = [
      'B01003_001E', // Total population
      'B19013_001E', // Median household income
      'B25077_001E', // Median home value
      'B25002_002E', // Occupied housing units
      'B25002_003E', // Vacant housing units
      'B08303_001E', // Total commuters
      'B23025_003E', // Employed
      'B23025_005E', // Unemployed
    ].join(',');

    const params = {
      get: variables,
      'for': `tract:${tract}`,
      'in': `state:${state} county:${county}`,
    };
    if (apiKey && apiKey !== 'your_census_api_key_here') {
      params.key = apiKey;
    }

    const acsResponse = await axios.get(acsUrl, { params, timeout: 10000 });
    const [headers, values] = acsResponse.data;

    const dataMap = {};
    headers.forEach((h, i) => { dataMap[h] = values[i]; });

    const occupied = parseInt(dataMap.B25002_002E) || 0;
    const vacant = parseInt(dataMap.B25002_003E) || 0;
    const total = occupied + vacant;
    const employed = parseInt(dataMap.B23025_003E) || 0;
    const unemployed = parseInt(dataMap.B23025_005E) || 0;
    const laborForce = employed + unemployed;

    return {
      success: true,
      data: {
        censusTract: `${state}-${county}-${tract}`,
        tractName: tractInfo.NAME,
        county: countyInfo?.NAME || 'N/A',
        state: stateInfo?.NAME || 'N/A',
        population: parseInt(dataMap.B01003_001E) || null,
        medianHouseholdIncome: parseInt(dataMap.B19013_001E) || null,
        medianHomeValue: parseInt(dataMap.B25077_001E) || null,
        occupiedUnits: occupied,
        vacantUnits: vacant,
        vacancyRate: total > 0 ? ((vacant / total) * 100).toFixed(1) + '%' : null,
        unemploymentRate: laborForce > 0 ? ((unemployed / laborForce) * 100).toFixed(1) + '%' : null,
      },
    };
  } catch (err) {
    return { success: false, error: `Census API error: ${err.message}` };
  }
}

// ─── FEMA Flood Zone ──────────────────────────────────────────────────────────

export async function fetchFloodZoneData(lat, lon) {
  try {
    const response = await axios.get(
      'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query',
      {
        params: {
          geometry: `${lon},${lat}`,
          geometryType: 'esriGeometryPoint',
          inSR: 4326,
          spatialRel: 'esriSpatialRelIntersects',
          outFields: 'FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE,STUDY_TYP',
          returnGeometry: false,
          f: 'json',
        },
        timeout: 10000,
      }
    );

    const features = response.data?.features;
    if (features && features.length > 0) {
      const attrs = features[0].attributes;
      const zone = attrs.FLD_ZONE;
      const isHighRisk = attrs.SFHA_TF === 'T' || ['A', 'AE', 'AH', 'AO', 'V', 'VE'].some(z => zone?.startsWith(z));

      return {
        success: true,
        data: {
          floodZone: zone || 'Unknown',
          zoneSubtype: attrs.ZONE_SUBTY || null,
          isHighRisk,
          floodZoneDescription: getFloodZoneDescription(zone),
          studyType: attrs.STUDY_TYP || null,
          baseFloodElevation: attrs.STATIC_BFE || null,
        },
      };
    }

    return {
      success: true,
      data: {
        floodZone: 'X',
        isHighRisk: false,
        floodZoneDescription: 'Zone X - Minimal flood hazard area',
      },
    };
  } catch (err) {
    return { success: false, error: `FEMA flood data error: ${err.message}` };
  }
}

function getFloodZoneDescription(zone) {
  if (!zone) return 'Unknown';
  if (zone.startsWith('A')) {
    if (zone === 'A') return 'Zone A - Special Flood Hazard Area (1% annual chance flood)';
    if (zone === 'AE') return 'Zone AE - Special Flood Hazard Area with Base Flood Elevations';
    if (zone === 'AH') return 'Zone AH - Shallow flooding SFHA (ponding)';
    if (zone === 'AO') return 'Zone AO - Shallow flooding SFHA (sheet flow)';
    return `Zone ${zone} - Special Flood Hazard Area`;
  }
  if (zone.startsWith('V')) return `Zone ${zone} - Coastal High Hazard Area`;
  if (zone === 'X') return 'Zone X - Minimal flood hazard (outside 500-year floodplain)';
  if (zone === 'B') return 'Zone B - Moderate flood hazard (500-year floodplain)';
  if (zone === 'C') return 'Zone C - Minimal flood hazard';
  return `Zone ${zone}`;
}
