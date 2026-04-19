import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Search, X, Check } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

let _google = null;
let _loaderPromise = null;

function loadGoogle() {
  if (_google) return Promise.resolve(_google);
  if (_loaderPromise) return _loaderPromise;
  if (!API_KEY || API_KEY.startsWith('your_')) {
    return Promise.reject(new Error('no-key'));
  }
  const loader = new Loader({ apiKey: API_KEY, version: 'weekly', libraries: ['places'] });
  _loaderPromise = loader.load().then(g => { _google = g; return g; });
  return _loaderPromise;
}

export default function GooglePlacesInput({
  onConfirm,
  label = 'Property Address',
  placeholder = '123 Main St, Austin, TX 78701',
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [pending, setPending] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [noKey, setNoKey] = useState(false);

  const autocomplete = useRef(null);
  const geocoder = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    loadGoogle()
      .then(google => {
        autocomplete.current = new google.maps.places.AutocompleteService();
        geocoder.current = new google.maps.Geocoder();
      })
      .catch(() => setNoKey(true));

    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback((val) => {
    if (!autocomplete.current || val.length < 3) { setSuggestions([]); setOpen(false); return; }
    autocomplete.current.getPlacePredictions(
      { input: val, types: ['address'] },
      (preds, status) => {
        if (status === 'OK' && preds) { setSuggestions(preds.slice(0, 5)); setOpen(true); }
        else { setSuggestions([]); setOpen(false); }
      }
    );
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setPending(null);
    setConfirmed(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const selectSuggestion = (pred) => {
    setOpen(false);
    setSuggestions([]);
    setResolving(true);
    geocoder.current.geocode({ placeId: pred.place_id }, (results, status) => {
      setResolving(false);
      if (status === 'OK' && results[0]) {
        const r = results[0];
        const get = (type) => r.address_components.find(c => c.types.includes(type))?.long_name || '';
        const getShort = (type) => r.address_components.find(c => c.types.includes(type))?.short_name || '';
        const place = {
          fullAddress: r.formatted_address,
          streetAddress: `${get('street_number')} ${get('route')}`.trim(),
          city: get('locality') || get('sublocality'),
          state: getShort('administrative_area_level_1'),
          zip: get('postal_code'),
          lat: r.geometry.location.lat(),
          lng: r.geometry.location.lng(),
        };
        setQuery(r.formatted_address);
        setPending(place);
      }
    });
  };

  const confirm = () => {
    setConfirmed(pending);
    setPending(null);
    onConfirm(pending);
  };

  const reset = () => {
    setQuery('');
    setPending(null);
    setConfirmed(null);
    setSuggestions([]);
  };

  const mapUrl = pending?.lat && API_KEY && !API_KEY.startsWith('your_')
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${pending.lat},${pending.lng}&zoom=15&size=500x160&scale=2&markers=color:0xC8472A%7C${pending.lat},${pending.lng}&key=${API_KEY}`
    : null;

  // Fallback: no API key → plain text input
  if (noKey) {
    return (
      <div>
        <label className="label">{label}</label>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input-field"
          onBlur={() => {
            if (query.trim()) onConfirm({ fullAddress: query.trim(), streetAddress: query.trim(), city: '', state: '', zip: '', lat: null, lng: null });
          }}
        />
        <p className="text-xs text-amber-600/70 mt-1">Autocomplete unavailable — type address manually</p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label">{label}</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-600/40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="input-field pl-9 pr-8"
          disabled={!!confirmed}
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={reset} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-600/40 hover:text-charcoal-900">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-cream-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onMouseDown={() => selectSuggestion(s)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-cream-50 text-left border-b border-cream-100 last:border-0 transition-colors"
            >
              <MapPin size={13} className="text-charcoal-600/40 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-sm text-charcoal-900 truncate block">{s.structured_formatting.main_text}</span>
                <span className="text-xs text-charcoal-600/60 truncate block">{s.structured_formatting.secondary_text}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {resolving && (
        <p className="text-xs text-charcoal-600/60 mt-1.5 flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
          Resolving address...
        </p>
      )}

      {/* Confirmation card */}
      {pending && !confirmed && (
        <div className="mt-2 border border-cream-200 rounded-xl overflow-hidden shadow-sm bg-white">
          {mapUrl && (
            <img
              src={mapUrl}
              alt="Property location"
              className="w-full h-28 object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-600/60 mb-1">Is this the right property?</p>
            <p className="text-sm font-semibold text-charcoal-900">{pending.streetAddress || pending.fullAddress}</p>
            {(pending.city || pending.state || pending.zip) && (
              <p className="text-sm text-charcoal-600/70">{[pending.city, pending.state, pending.zip].filter(Boolean).join(', ')}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={confirm} className="btn-primary flex-1 justify-center text-sm py-2">
                <Check size={13} /> Confirm & Search
              </button>
              <button type="button" onClick={reset} className="btn-secondary flex-1 justify-center text-sm py-2">
                Change Address
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          <Check size={12} /> {confirmed.fullAddress}
        </div>
      )}
    </div>
  );
}
