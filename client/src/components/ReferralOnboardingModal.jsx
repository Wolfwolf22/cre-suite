import React, { useState } from 'react';
import { X, Users, CheckCircle, Star } from 'lucide-react';
import { usersApi } from '../lib/api.js';

const SPECIALTY_OPTIONS = [
  'Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed-Use',
  'Land', 'Hospitality', 'Self-Storage', 'Medical Office', 'NNN Lease',
  'Senior Housing', 'Student Housing', 'Data Centers', 'Cold Storage',
  'Car Wash', 'Gas Stations', 'Restaurant', 'Shopping Centers', 'Flex/R&D', 'Other',
];

export default function ReferralOnboardingModal({ onClose }) {
  const [step, setStep] = useState(1); // 1: intro, 2: opt-in prompt, 3: done
  const [optIn, setOptIn] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleDecision = async (join) => {
    setOptIn(join);
    setSaving(true);
    try {
      await usersApi.seenReferralModal({ referralOptIn: join });
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1 bg-accent w-full" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-charcoal-600/40 hover:text-charcoal-900 transition-colors"
        >
          <X size={20} />
        </button>

        {step === 1 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users size={28} className="text-accent" />
            </div>
            <h2 className="font-serif text-2xl text-charcoal-900 mb-3">CRE Referral Network</h2>
            <p className="text-charcoal-600 text-sm leading-relaxed mb-6">
              Connect with other licensed commercial real estate agents. Send and receive qualified deal referrals
              from trusted professionals in your market.
            </p>
            <div className="space-y-3 text-left mb-8">
              {[
                'Browse agents by specialty and state',
                'Send introduction requests with deal details',
                'Build your reputation with a public profile',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Star size={15} className="text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-charcoal-700">{item}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full justify-center py-3">
              Learn More
            </button>
            <button onClick={onClose} className="mt-3 text-sm text-charcoal-600/50 hover:text-charcoal-900 transition-colors w-full">
              Maybe later
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-8">
            <h2 className="font-serif text-2xl text-charcoal-900 mb-2">Join the Network?</h2>
            <p className="text-sm text-charcoal-600 mb-6">
              Your profile will be visible to other agents on CRE Suite. You can update your specialties
              and control visibility from Settings anytime.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleDecision(true)}
                disabled={saving}
                className="p-4 rounded-xl border-2 border-accent bg-accent/5 text-center hover:bg-accent/10 transition-colors group"
              >
                <CheckCircle size={22} className="text-accent mx-auto mb-2" />
                <p className="text-sm font-semibold text-charcoal-900">Yes, join now</p>
                <p className="text-xs text-charcoal-600/60 mt-1">Create my profile</p>
              </button>
              <button
                onClick={() => handleDecision(false)}
                disabled={saving}
                className="p-4 rounded-xl border-2 border-cream-200 text-center hover:bg-cream-50 transition-colors"
              >
                <X size={22} className="text-charcoal-600/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-charcoal-900">Not now</p>
                <p className="text-xs text-charcoal-600/60 mt-1">I'll decide later</p>
              </button>
            </div>

            <p className="text-xs text-charcoal-600/40 text-center">
              You can change this at any time in Settings → Referral Network.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <h2 className="font-serif text-2xl text-charcoal-900 mb-3">
              {optIn ? "You're in!" : 'Got it!'}
            </h2>
            <p className="text-charcoal-600 text-sm mb-6">
              {optIn
                ? 'Your profile is now visible in the Referral Network. Complete it in Settings to get discovered.'
                : 'You can join the Referral Network anytime from Settings → Referral Network.'}
            </p>
            <button onClick={onClose} className="btn-primary w-full justify-center py-3">
              {optIn ? 'View Referral Network' : 'Got it'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
