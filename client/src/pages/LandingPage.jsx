import React, { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOOLS = [
  { name: 'LOI Generator', desc: 'Close deals faster with AI-drafted letters of intent.' },
  { name: 'Property Intelligence', desc: 'Full property data pulled from public sources instantly.' },
  { name: 'Cash Flow Analyzer', desc: 'Underwrite any asset in minutes, not hours.' },
  { name: 'Debt Sizing & Loan Screener', desc: 'Know your financing options before you call a lender.' },
  { name: 'Lease Generator', desc: 'Professional commercial leases in minutes.' },
  { name: 'Deal Analyzer', desc: 'Score any deal against real market data.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [email, setEmail] = useState('');

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray('.stack-panel');

      // Pin each panel (except last) — stacking effect
      panels.forEach((panel, i) => {
        if (i < panels.length - 1) {
          ScrollTrigger.create({
            trigger: panel,
            start: 'top top',
            pin: true,
            pinSpacing: false,
          });
        }
      });

      // ── Panel 1: entrance fade
      gsap.from('.p1-headline', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.2,
      });
      gsap.from('.p1-sub', {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.5,
      });
      gsap.from('.p1-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.8,
      });

      // ── Panel 2: word-by-word reveal on scroll into view
      const words = gsap.utils.toArray('.reveal-word');
      gsap.from(words, {
        y: 40,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.stack-panel-2',
          start: 'top 65%',
        },
      });
      gsap.from('.p2-tagline', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.5,
        scrollTrigger: {
          trigger: '.stack-panel-2',
          start: 'top 55%',
        },
      });

      // ── Panel 3: tools slide in from left
      const toolRows = gsap.utils.toArray('.tool-row');
      gsap.from(toolRows, {
        x: -80,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.stack-panel-3',
          start: 'top 65%',
        },
      });

      // ── Panel 4: bold text scale in
      gsap.from('.p4-headline', {
        scale: 0.85,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.stack-panel-4',
          start: 'top 65%',
        },
      });
      gsap.from('.p4-sub', {
        y: 20,
        opacity: 0,
        duration: 0.7,
        delay: 0.3,
        scrollTrigger: {
          trigger: '.stack-panel-4',
          start: 'top 65%',
        },
      });

      // ── Panel 5: form fade in
      gsap.from('.p5-content', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.stack-panel-5',
          start: 'top 65%',
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const headline = 'Every deal. Every document. Every number. In one place.';
  const words = headline.split(' ');

  return (
    <div ref={wrapperRef} style={{ fontFamily: '"Instrument Sans", sans-serif' }}>

      {/* ── Panel 1: Entrance ─────────────────────────────────────── */}
      <section
        className="stack-panel stack-panel-1"
        style={{
          height: '100vh',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top nav */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#1A1612' }}>
            CRE Suite
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1A1612', background: 'none', border: '1.5px solid #1A1612', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', letterSpacing: '0.01em' }}
          >
            Sign In →
          </button>
        </div>

        <p className="p1-sub" style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1rem)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C8472A', marginBottom: '24px' }}>
          Commercial Real Estate Intelligence
        </p>
        <h1
          className="p1-headline"
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            lineHeight: 1.02,
            color: '#1A1612',
            letterSpacing: '-0.03em',
            maxWidth: '900px',
            marginBottom: '28px',
          }}
        >
          Commercial
          <br />
          <span style={{ fontStyle: 'italic', color: '#C8472A' }}>Simplified.</span>
        </h1>
        <p className="p1-sub" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#4F443C', maxWidth: '520px', lineHeight: 1.6, marginBottom: '48px' }}>
          The complete toolkit for commercial real estate professionals.
        </p>
        <div className="p1-cta" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: '#1A1612', color: '#fff', fontWeight: 700, fontSize: '1rem', padding: '14px 36px', borderRadius: '10px', border: 'none', cursor: 'pointer', letterSpacing: '0.01em' }}
          >
            Get Started Free
          </button>
          <span style={{ color: '#9C9088', fontSize: '0.85rem' }}>
            ↓ Scroll to explore
          </span>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, transparent, #C8472A)' }} />
        </div>
      </section>

      {/* ── Panel 2: Word-by-word reveal ─────────────────────────── */}
      <section
        className="stack-panel stack-panel-2"
        style={{
          height: '100vh',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 clamp(24px, 6vw, 120px)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(2rem, 5.5vw, 5rem)',
            lineHeight: 1.15,
            color: '#1A1612',
            letterSpacing: '-0.03em',
            maxWidth: '900px',
            marginBottom: '40px',
          }}
        >
          {words.map((word, i) => (
            <span key={i} className="reveal-word" style={{ display: 'inline-block', marginRight: word === 'one' ? 0 : '0.3em' }}>
              {word}
            </span>
          ))}
        </h2>
        <p className="p2-tagline" style={{ fontSize: 'clamp(1rem, 2vw, 1.375rem)', fontWeight: 500, color: '#C8472A', letterSpacing: '0.02em' }}>
          Powered by AI. Built for CRE.
        </p>
      </section>

      {/* ── Panel 3: 6 Tools ────────────────────────────────────────── */}
      <section
        className="stack-panel stack-panel-3"
        style={{
          height: '100vh',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '0 clamp(32px, 8vw, 140px)',
          position: 'relative',
          zIndex: 3,
        }}
      >
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8472A', marginBottom: '48px' }}>
          Six Tools
        </p>
        <div style={{ width: '100%' }}>
          {TOOLS.map((tool, i) => (
            <div
              key={tool.name}
              className="tool-row"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'clamp(24px, 4vw, 64px)',
                padding: '18px 0',
                borderBottom: i < TOOLS.length - 1 ? '1px solid #E8E0D5' : 'none',
              }}
            >
              <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(1.25rem, 2.5vw, 2.25rem)', color: '#1A1612', letterSpacing: '-0.02em', minWidth: 'clamp(220px, 35vw, 400px)' }}>
                {tool.name}
              </span>
              <span style={{ fontSize: 'clamp(0.8rem, 1.2vw, 1rem)', color: '#7A6E65', lineHeight: 1.5 }}>
                {tool.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Panel 4: Bold value statement ───────────────────────── */}
      <section
        className="stack-panel stack-panel-4"
        style={{
          height: '100vh',
          background: '#1A1612',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 clamp(24px, 6vw, 120px)',
          position: 'relative',
          zIndex: 4,
        }}
      >
        <h2
          className="p4-headline"
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(2.5rem, 7vw, 6.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: '900px',
            marginBottom: '28px',
          }}
        >
          Stop paying for
          <br />
          <span style={{ color: '#C8472A' }}>6 different tools.</span>
        </h2>
        <p
          className="p4-sub"
          style={{ fontSize: 'clamp(1rem, 2vw, 1.375rem)', color: 'rgba(255,255,255,0.6)', maxWidth: '520px', lineHeight: 1.6 }}
        >
          CRE Suite replaces your entire software stack.
        </p>
      </section>

      {/* ── Panel 5: Sign up ─────────────────────────────────────── */}
      <section
        className="stack-panel stack-panel-5"
        style={{
          height: '100vh',
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div className="p5-content" style={{ width: '100%', maxWidth: '480px' }}>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              lineHeight: 1.05,
              color: '#1A1612',
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            Start for free.
          </h2>
          <p style={{ color: '#7A6E65', fontSize: '1rem', marginBottom: '48px', lineHeight: 1.6 }}>
            No credit card required. All six tools unlocked immediately.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '1rem',
                border: '1.5px solid #DDD0BB',
                borderRadius: '10px',
                outline: 'none',
                fontFamily: 'inherit',
                color: '#1A1612',
                background: '#FAF7F2',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                background: '#C8472A',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.0625rem',
                padding: '16px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                fontFamily: 'inherit',
              }}
            >
              Get Access →
            </button>
          </form>

          <p style={{ marginTop: '40px', fontSize: '0.8rem', color: '#9C9088', letterSpacing: '0.05em' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/dashboard')}
              style={{ color: '#1A1612', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              Sign in
            </button>
          </p>
        </div>

        <p style={{ position: 'absolute', bottom: '32px', fontSize: '0.75rem', color: '#C0B8B0', letterSpacing: '0.05em' }}>
          © {new Date().getFullYear()} CRE Suite
        </p>
      </section>
    </div>
  );
}
