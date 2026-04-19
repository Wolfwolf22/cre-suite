import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Tooltip — small ? button next to a label that shows a definition popup.
 * Usage: <label className="label">NOI <Tooltip title="NOI" text="..." /></label>
 */
export default function Tooltip({ title, text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center ml-1.5 align-middle">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-charcoal-900/10 flex items-center justify-center text-charcoal-600/60 hover:bg-charcoal-900/20 hover:text-charcoal-800 transition-colors"
        tabIndex={-1}
        aria-label={`Info: ${title}`}
      >
        <HelpCircle size={11} />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white border border-cream-200 rounded-xl shadow-xl p-3 text-left pointer-events-none">
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-cream-200 rotate-45"
            style={{ zIndex: -1 }}
          />
          {title && <p className="text-xs font-bold text-charcoal-900 mb-1.5">{title}</p>}
          <p className="text-xs text-charcoal-700 leading-relaxed">{text}</p>
        </div>
      )}
    </span>
  );
}
