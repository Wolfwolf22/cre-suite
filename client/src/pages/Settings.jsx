import React, { useState, useRef } from 'react';
import { Check, Upload, Palette } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

const PRESET_COLORS = ['#C8472A', '#1A1612', '#2563EB', '#059669', '#7C3AED', '#D97706', '#DC2626', '#0891B2'];

const SPECIALTY_OPTIONS = [
  'Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed-Use',
  'Land', 'Hospitality', 'Self-Storage', 'Medical Office', 'NNN Lease',
  'Senior Housing', 'Student Housing', 'Data Centers', 'Cold Storage',
  'Car Wash', 'Gas Stations', 'Restaurant', 'Shopping Centers', 'Flex/R&D', 'Other',
];

function Field({ label, value, onChange, placeholder, type = 'text', half }) {
  return (
    <div className={half ? 'col-span-1' : 'col-span-2 sm:col-span-1'}>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}

export default function Settings() {
  const { settings, loading, updateSettings, uploadLogo, logoUrl } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef(null);

  // Initialize form from settings once loaded
  React.useEffect(() => {
    if (!loading && form === null) {
      setForm({ ...settings });
    }
  }, [loading, settings]);

  const set = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  const toggleSpecialty = (s) => {
    setForm(p => {
      const current = p.specialty || [];
      return {
        ...p,
        specialty: current.includes(s)
          ? current.filter(x => x !== s)
          : current.length >= 3 ? current : [...current, s],
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      await uploadLogo(file);
    } catch (err) {
      setError('Logo upload failed: ' + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="shimmer h-8 w-48 rounded mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card shimmer h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-charcoal-900">Settings</h1>
        <p className="text-charcoal-600 text-sm mt-1">Office branding applied to all PDF exports</p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <form onSubmit={handleSave} className="space-y-6">

        {/* Office Profile */}
        <div className="card p-6">
          <h2 className="font-serif text-xl text-charcoal-900 mb-5">Office Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company / Office Name" value={form.companyName} onChange={set('companyName')} placeholder="Acme Commercial Realty" />
            <Field label="Your Name / Agent Name" value={form.agentName} onChange={set('agentName')} placeholder="Jane Smith" />
            <Field label="License Number" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="DRE #12345678" />
            <Field label="Phone Number" value={form.phone} onChange={set('phone')} placeholder="(512) 555-0100" type="tel" />
            <div className="col-span-1 sm:col-span-2">
              <Field label="Office Address" value={form.officeAddress} onChange={set('officeAddress')} placeholder="123 Main Street" />
            </div>
            <Field label="City" value={form.city} onChange={set('city')} placeholder="Austin" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <input value={form.state || ''} onChange={e => set('state')(e.target.value)} placeholder="TX" className="input-field" maxLength={2} style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="label">ZIP</label>
                <input value={form.zip || ''} onChange={e => set('zip')(e.target.value)} placeholder="78701" className="input-field" />
              </div>
            </div>
            <Field label="Email Address" value={form.email} onChange={set('email')} placeholder="jane@acmecre.com" type="email" />
            <Field label="Website" value={form.website} onChange={set('website')} placeholder="www.acmecre.com" />
          </div>
        </div>

        {/* Branding */}
        <div className="card p-6">
          <h2 className="font-serif text-xl text-charcoal-900 mb-5">Branding</h2>
          <div className="space-y-6">

            {/* Logo upload */}
            <div>
              <label className="label">Office Logo</label>
              <div className="flex items-start gap-5">
                <div className="w-24 h-24 border-2 border-dashed border-cream-300 rounded-xl flex items-center justify-center overflow-hidden bg-cream-50 flex-shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Upload size={24} className="text-cream-300" />
                  )}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/png,image/jpg,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={logoUploading}
                    className="btn-secondary text-sm py-2"
                  >
                    <Upload size={14} /> {logoUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </button>
                  <p className="text-xs text-charcoal-600/50 mt-2">PNG or JPG, max 5MB. Appears in PDF headers.</p>
                </div>
              </div>
            </div>

            {/* Primary color */}
            <div>
              <label className="label">Brand Color</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => set('primaryColor')(color)}
                    className="w-9 h-9 rounded-full border-2 transition-all"
                    style={{
                      background: color,
                      borderColor: form.primaryColor === color ? '#1A1612' : 'transparent',
                      transform: form.primaryColor === color ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={color}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor || '#C8472A'}
                    onChange={e => set('primaryColor')(e.target.value)}
                    className="w-9 h-9 rounded-full border-2 border-cream-300 cursor-pointer"
                    title="Custom color"
                  />
                  <span className="text-xs text-charcoal-600/60 font-mono">{form.primaryColor || '#C8472A'}</span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full mt-1" style={{ background: form.primaryColor || '#C8472A', opacity: 0.7 }} />
            </div>

            {/* Tagline */}
            <div>
              <label className="label">PDF Tagline (optional)</label>
              <input
                value={form.tagline || ''}
                onChange={e => set('tagline')(e.target.value)}
                placeholder="Your trusted commercial real estate partner"
                className="input-field"
              />
              <p className="text-xs text-charcoal-600/50 mt-1">Appears in the footer of every PDF export.</p>
            </div>
          </div>
        </div>

        {/* Referral Network Profile */}
        <div className="card p-6">
          <h2 className="font-serif text-xl text-charcoal-900 mb-2">Referral Network</h2>
          <p className="text-sm text-charcoal-600/60 mb-5">Your profile details for the agent referral network</p>

          {/* Referral toggle */}
          <div className="flex items-center justify-between p-4 bg-cream-50 rounded-xl border border-cream-200 mb-5">
            <div>
              <p className="text-sm font-semibold text-charcoal-900">Visible in Referral Network</p>
              <p className="text-xs text-charcoal-600/60">Other agents can find and contact you</p>
            </div>
            <button
              type="button"
              onClick={() => set('referralVisible')(!form.referralVisible)}
              className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.referralVisible ? 'bg-accent' : 'bg-charcoal-600/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${form.referralVisible ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="label">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.yearsExperience || ''}
                onChange={e => set('yearsExperience')(e.target.value || null)}
                placeholder="e.g. 12"
                className="input-field"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="label">Specialties <span className="text-charcoal-600/40 font-normal">(up to 3)</span></label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SPECIALTY_OPTIONS.map(s => {
                const selected = (form.specialty || []).includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      selected
                        ? 'bg-accent text-white border-accent'
                        : 'bg-white text-charcoal-700 border-cream-200 hover:border-accent/50'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-charcoal-600/40 mt-1">{(form.specialty || []).length}/3 selected</p>
          </div>

          <div>
            <label className="label">Bio <span className="text-charcoal-600/40 font-normal">(max 300 chars)</span></label>
            <textarea
              value={form.bio || ''}
              onChange={e => set('bio')(e.target.value.slice(0, 300))}
              placeholder="Brief description of your background and focus areas..."
              className="input-field h-24 resize-none"
            />
            <p className="text-xs text-charcoal-600/40 text-right mt-1">{(form.bio || '').length}/300</p>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <h2 className="font-serif text-xl text-charcoal-900 mb-4">PDF Header Preview</h2>
          <div className="border border-cream-200 rounded-xl overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ background: form.primaryColor || '#C8472A' }}
            />
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-charcoal-900" style={{ fontFamily: '"DM Serif Display", serif' }}>
                  {form.companyName || 'Your Company Name'}
                </p>
                <p className="text-sm text-charcoal-600">{form.agentName || 'Agent Name'}</p>
                {form.licenseNumber && <p className="text-xs text-charcoal-600/60">Lic. {form.licenseNumber}</p>}
              </div>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo preview" className="h-12 object-contain" />
              ) : (
                <div className="w-14 h-14 bg-cream-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-charcoal-600/40">Logo</span>
                </div>
              )}
            </div>
            <div className="px-5 py-2 border-t border-cream-100 flex items-center justify-between">
              <p className="text-xs text-charcoal-600/50">{form.tagline || 'Your tagline here'}</p>
              <p className="text-xs text-charcoal-600/50">{form.phone || 'Phone'} · {form.email || 'Email'}</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 text-base">
          {saving ? 'Saving...' : saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
