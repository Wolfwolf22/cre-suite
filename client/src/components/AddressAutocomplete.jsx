import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';

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

/**
 * AddressAutocomplete — simple inline address autocomplete for form fields.
 *
 * Props:
 *   value      — current text value (controlled)
 *   onChange   — called with { fullAddress, streetNumber, street, city, state, zip, lat, lng }
 *                also called with { fullAddress: typedText, ... } while typing (lat/lng null)
 *   label      — optional label text
 *   placeholder
 *   required
 */
export default function AddressAutocomplete({
  value = '',
  onChange,
  label,
  placeholder = '123 Main St, Austin, TX 78701',
  required = false,
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const autocomplete = useRef(null);
  const geocoder = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

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
      { input: val, types: ['address'], componentRestrictions: { country: 'us' } },
      (preds, status) => {
        if (status === 'OK' && preds) { setSuggestions(preds.slice(0, 5)); setOpen(true); }
        else { setSuggestions([]); setOpen(false); }
      }
    );
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val === '') {
      onChange && onChange({ fullAddress: '', streetNumber: '', street: '', city: '', state: '', zip: '', lat: null, lng: null });
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 280);
  };

  const selectSuggestion = (pred) => {
    setOpen(false);
    setSuggestions([]);
    if (!geocoder.current) return;
    geocoder.current.geocode({ placeId: pred.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const r = results[0];
        const get = (type) => r.address_components.find(c => c.types.includes(type))?.long_name || '';
        const getShort = (type) => r.address_components.find(c => c.types.includes(type))?.short_name || '';
        const place = {
          fullAddress: r.formatted_address,
          streetNumber: get('street_number'),
          street: `${get('street_number')} ${get('route')}`.trim(),
          city: get('locality') || get('sublocality'),
          state: getShort('administrative_area_level_1'),
          zip: get('postal_code'),
          lat: r.geometry.location.lat(),
          lng: r.geometry.location.lng(),
        };
        setQuery(r.formatted_address);
        onChange && onChange(place);
      }
    });
  };

  if (noKey) {
    return (
      <div>
        {label && <label className="label">{label}</label>}
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            onChange && onChange({
              fullAddress: e.target.value, streetNumber: '', street: e.target.value,
              city: '', state: '', zip: '', lat: null, lng: null,
            });
          }}
          placeholder={placeholder}
          className="input-field"
          required={required}
        />
        <p className="text-xs text-amber-600/70 mt-1">
          Address autocomplete unavailable — please type full address manually
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && <label className="label">{label}</label>}
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-field"
        required={required}
        autoComplete="off"
      />

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
    </div>
  );
}
