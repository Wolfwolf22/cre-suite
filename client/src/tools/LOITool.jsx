import React, { useState } from 'react';
import { FileSignature, Copy, Check, Download } from 'lucide-react';
import ToolHeader from '../components/ToolHeader.jsx';
import DealSelector from '../components/DealSelector.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import AddressAutocomplete from '../components/AddressAutocomplete.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { loiApi } from '../lib/api.js';
import { LOIPDF, TextDocumentPDF, downloadPDF } from '../lib/pdfExport.jsx';

export default function LOITool() {
  const { settings, logoUrl } = useSettings();
  const [dealId, setDealId] = useState(null);
  const [form, setForm] = useState({
    buyerName: '',
    buyerAddress: '',
    sellerName: '',
    sellerAddress: '',
    sellerContact: '',
    propertyAddress: '',
    purchasePrice: '',
    earnestMoney: '',
    dueDiligencePeriod: '30',
    closingPeriod: '30',
    financingContingency: false,
    includeNotary: false,
    specialConditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await loiApi.generate({ ...form, dealId });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const structured = result.structured;
      let element;

      if (structured && !structured.error && structured.sections?.length) {
        // merge includeNotary from form in case AI didn't echo it
        const mergedStructured = { ...structured, includeNotary: structured.includeNotary ?? form.includeNotary };
        element = React.createElement(LOIPDF, { structured: mergedStructured, settings, logoUrl });
      } else {
        element = React.createElement(TextDocumentPDF, {
          title: 'Letter of Intent',
          subtitle: `${form.propertyAddress} — ${form.buyerName} → ${form.sellerName}`,
          content: result.content,
          date: new Date().toLocaleDateString(),
          settings,
          logoUrl,
        });
      }

      await downloadPDF(element, `LOI_${form.propertyAddress.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (err) {
      setError('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Format the structured LOI for display
  const sanitize = (s) => (s || '').replace(/\*+/g, '').replace(/#+/g, '').trim();

  const renderStructured = (d) => {
    if (!d || d.error) return null;
    const lines = [];

    // Date + delivery
    lines.push(
      <div key="date-row" className="flex justify-between text-xs text-charcoal-600/60 mb-5">
        <span>{d.date || ''}</span>
        {d.methodOfDelivery && <span>{d.methodOfDelivery}</span>}
      </div>
    );

    // Seller address block
    if (d.sellerName || d.sellerAddress) {
      lines.push(
        <div key="seller-addr" className="text-sm mb-5">
          {d.sellerName && <p className="font-medium">{sanitize(d.sellerName)}</p>}
          {d.sellerContact && <p>Attn: {sanitize(d.sellerContact)}</p>}
          {d.sellerAddress && <p className="text-charcoal-600/70">{sanitize(d.sellerAddress)}</p>}
        </div>
      );
    }

    lines.push(<h2 key="title" className="text-center font-bold text-base mb-4 tracking-widest">LETTER OF INTENT</h2>);
    if (d.re) lines.push(<p key="re" className="font-semibold text-sm mb-3">{sanitize(d.re)}</p>);
    if (d.salutation) lines.push(<p key="sal" className="text-sm mb-3">{sanitize(d.salutation)}</p>);
    if (d.intro) lines.push(<p key="intro" className="text-sm leading-relaxed mb-4">{sanitize(d.intro)}</p>);

    (d.sections || []).forEach(sec => {
      lines.push(
        <div key={sec.number} className="mb-4">
          <p className="font-bold text-sm mb-1">{sec.number}. {sanitize(sec.title)}</p>
          {sec.body && <p className="text-sm leading-relaxed mb-1 text-charcoal-700">{sanitize(sec.body)}</p>}
          {(sec.subsections || []).map(sub => (
            <div key={sub.number} className="ml-4 mb-1">
              <p className="font-semibold text-sm">{sub.number} {sanitize(sub.title)}</p>
              {sub.body && <p className="text-sm leading-relaxed text-charcoal-700">{sanitize(sub.body)}</p>}
            </div>
          ))}
        </div>
      );
    });

    if (d.closingText) lines.push(<p key="closing" className="text-sm leading-relaxed mt-4 mb-6">{sanitize(d.closingText)}</p>);

    lines.push(
      <div key="sig" className="grid grid-cols-2 gap-6 mt-4">
        {[
          { label: 'BUYER', name: d.buyerName, addr: d.buyerAddress },
          { label: 'SELLER', name: d.sellerName, addr: d.sellerAddress },
        ].map(({ label, name, addr }) => (
          <div key={label}>
            <p className="font-bold text-xs mb-1">{label}:</p>
            {addr && <p className="text-xs text-charcoal-600/60 mb-2">{sanitize(addr)}</p>}
            <div className="border-b border-charcoal-900 mb-1 mt-2" />
            <p className="text-xs text-charcoal-600/50 mb-2">Signature</p>
            <div className="border-b border-charcoal-900 mb-1" />
            <p className="text-xs text-charcoal-600/50 mb-2">Printed Name: {sanitize(name || '')}</p>
            <div className="border-b border-charcoal-900 w-2/3 mb-1" />
            <p className="text-xs text-charcoal-600/50">Date</p>
          </div>
        ))}
      </div>
    );

    // Notary block — only if requested
    const showNotary = d.includeNotary ?? form.includeNotary;
    if (showNotary) {
      lines.push(
        <div key="notary" className="mt-6 border border-cream-200 rounded-xl p-4">
          <p className="font-bold text-xs mb-3 tracking-wide">NOTARY ACKNOWLEDGMENT</p>
          <p className="text-xs text-charcoal-700 mb-2">State of _____________________, County of _____________________</p>
          <p className="text-xs text-charcoal-700 leading-relaxed mb-4">
            On this _____ day of _____________________, 20____, before me appeared ___________________________________,
            personally known to me to be the person whose name is subscribed to this instrument and acknowledged to me
            that they executed the same in their authorized capacity.
          </p>
          <div className="border-b border-charcoal-900 w-1/2 mb-1" />
          <p className="text-xs text-charcoal-600/50 mb-1">Notary Public · My Commission Expires: ______________</p>
          <p className="text-xs text-charcoal-600/40">[NOTARY SEAL]</p>
        </div>
      );
    }

    return lines;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <ToolHeader
        title="LOI Generator"
        description="Generate a complete, professional Letter of Intent drafted by AI with commercial real estate legal expertise."
        icon={FileSignature}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-5">
            <h2 className="font-serif text-lg text-charcoal-900">Deal Information</h2>

            <DealSelector selectedDealId={dealId} onSelect={setDealId} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Buyer Name</label>
                <input value={form.buyerName} onChange={set('buyerName')} className="input-field" placeholder="Acme Capital LLC" required />
              </div>
              <div>
                <label className="label">Seller Name</label>
                <input value={form.sellerName} onChange={set('sellerName')} className="input-field" placeholder="Smith Family Trust" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Buyer Address</label>
                <input value={form.buyerAddress} onChange={set('buyerAddress')} className="input-field" placeholder="100 Commerce Blvd, Austin, TX" />
              </div>
              <div>
                <label className="label">Seller Contact (Attn)</label>
                <input value={form.sellerContact} onChange={set('sellerContact')} className="input-field" placeholder="John Smith, Principal" />
              </div>
            </div>

            <div>
              <label className="label">Seller Address</label>
              <input value={form.sellerAddress} onChange={set('sellerAddress')} className="input-field" placeholder="200 Trust Ave, Dallas, TX 75201" />
            </div>

            <AddressAutocomplete
              label="Property Address"
              value={form.propertyAddress}
              onChange={(place) => setForm(p => ({ ...p, propertyAddress: place.fullAddress }))}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Purchase Price ($)</label>
                <input type="number" value={form.purchasePrice} onChange={set('purchasePrice')} className="input-field" placeholder="2500000" required />
              </div>
              <div>
                <label className="label">Earnest Money ($)</label>
                <input type="number" value={form.earnestMoney} onChange={set('earnestMoney')} className="input-field" placeholder="50000" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Due Diligence Period (days)</label>
                <input type="number" value={form.dueDiligencePeriod} onChange={set('dueDiligencePeriod')} className="input-field" min="1" required />
              </div>
              <div>
                <label className="label">Closing Period (days)</label>
                <input type="number" value={form.closingPeriod} onChange={set('closingPeriod')} className="input-field" min="1" required />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-cream-50 rounded-xl border border-cream-200">
              <input
                id="financing"
                type="checkbox"
                checked={form.financingContingency}
                onChange={set('financingContingency')}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="financing" className="text-sm font-medium text-charcoal-800 cursor-pointer">
                Subject to financing contingency
              </label>
            </div>

            <div>
              <label className="label">Special Conditions (optional)</label>
              <textarea
                value={form.specialConditions}
                onChange={set('specialConditions')}
                className="input-field h-24 resize-none"
                placeholder="e.g. Subject to satisfactory Phase I environmental report..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-cream-50 rounded-xl border border-cream-200">
            <input
              id="includeNotary"
              type="checkbox"
              checked={form.includeNotary}
              onChange={set('includeNotary')}
              className="w-4 h-4 accent-accent"
            />
            <label htmlFor="includeNotary" className="text-sm font-medium text-charcoal-800 cursor-pointer">
              Include Notary Block
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Generating...' : 'Generate LOI with AI'}
          </button>
        </form>

        {/* Result panel */}
        <div>
          {loading && <LoadingSpinner message="Drafting your LOI..." />}

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {result && !loading && (
            <div className="space-y-4">
              {result.documentId && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                  <Check size={13} /> Auto-saved to deal
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleCopy} className="btn-secondary flex-1 justify-center text-sm py-2">
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Text</>}
                </button>
                <button onClick={handleExportPDF} disabled={exporting} className="btn-primary flex-1 justify-center text-sm py-2">
                  <Download size={14} /> {exporting ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>

              <div className="card p-6 max-h-[600px] overflow-y-auto font-serif text-charcoal-900">
                {result.structured && !result.structured.error
                  ? renderStructured(result.structured)
                  : (
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {result.content}
                    </pre>
                  )
                }
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="card p-10 text-center border-dashed border-2 border-cream-300">
              <FileSignature size={36} className="text-cream-300 mx-auto mb-4" />
              <p className="text-charcoal-600/60 text-sm">
                Fill out the form and click Generate to create your LOI
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
