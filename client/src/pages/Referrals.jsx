import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Users, Search, MapPin, Briefcase, Star, Send, Check, X,
  ChevronDown, MessageSquare, Clock,
} from 'lucide-react';
import { referralsApi } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

const SPECIALTY_OPTIONS = [
  'Multifamily', 'Office', 'Industrial', 'Retail', 'Mixed-Use',
  'Land', 'Hospitality', 'Self-Storage', 'Medical Office', 'NNN Lease',
  'Senior Housing', 'Student Housing', 'Data Centers', 'Cold Storage',
  'Car Wash', 'Gas Stations', 'Restaurant', 'Shopping Centers', 'Flex/R&D', 'Other',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

function AgentCard({ profile, onContact }) {
  const initials = (profile.user?.name || 'A')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="card p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-sm">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-charcoal-900 truncate">{profile.user?.name || 'Agent'}</p>
          <div className="flex items-center gap-1.5 text-xs text-charcoal-600/60 mt-0.5">
            {profile.state && (
              <span className="flex items-center gap-1"><MapPin size={10} /> {profile.state}</span>
            )}
            {profile.yearsExperience && (
              <span>· {profile.yearsExperience}yr exp</span>
            )}
          </div>
          {profile.bio && (
            <p className="text-xs text-charcoal-600/60 mt-1.5 line-clamp-2">{profile.bio}</p>
          )}
          {profile.specialty?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.specialty.map(s => (
                <span key={s} className="text-xs bg-cream-200 text-charcoal-700 px-1.5 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onContact(profile)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all flex-shrink-0"
        >
          <Send size={12} /> Contact
        </button>
      </div>
    </div>
  );
}

function ContactModal({ profile, onClose }) {
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await referralsApi.sendRequest({ toUserId: profile.userId, dealDescription: description });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="h-1 bg-accent rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-serif text-xl text-charcoal-900">Send Introduction</h2>
              <p className="text-xs text-charcoal-600/60 mt-1">To: {profile.user?.name}</p>
            </div>
            <button onClick={onClose} className="text-charcoal-600/40 hover:text-charcoal-900 p-1">
              <X size={18} />
            </button>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-emerald-500" />
              </div>
              <p className="font-semibold text-charcoal-900 mb-1">Request sent!</p>
              <p className="text-sm text-charcoal-600/60">{profile.user?.name} will be notified.</p>
              <button onClick={onClose} className="btn-primary mt-4">Done</button>
            </div>
          ) : (
            <>
              {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              <div className="mb-4">
                <label className="label">Deal Description (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Brief description of the deal or how you'd like to collaborate..."
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSend} disabled={sending} className="btn-primary flex-1 justify-center">
                  <Send size={14} /> {sending ? 'Sending...' : 'Send Request'}
                </button>
                <button onClick={onClose} className="btn-secondary">Cancel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Referrals() {
  const { user } = useUser();
  const { settings } = useSettings();
  const [network, setNetwork] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [myRequests, setMyRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactProfile, setContactProfile] = useState(null);
  const [tab, setTab] = useState('network'); // network | requests | profile

  // Filters
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterState, setFilterState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    isVisible: true,
    isOptedIn: true,
    specialty: [],
    state: '',
    yearsExperience: '',
    bio: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    Promise.all([
      referralsApi.network().catch(() => ({ profiles: [] })),
      referralsApi.myProfile().catch(() => ({ profile: null })),
      referralsApi.myRequests().catch(() => ({ sent: [], received: [] })),
    ]).then(([networkData, profileData, requestsData]) => {
      setNetwork(networkData.profiles || []);
      const p = profileData.profile;
      setMyProfile(p);
      if (p) {
        setProfileForm({
          isVisible: p.isVisible ?? true,
          isOptedIn: p.isOptedIn ?? true,
          specialty: p.specialty || [],
          state: p.state || '',
          yearsExperience: p.yearsExperience || '',
          bio: p.bio || '',
        });
      }
      setMyRequests(requestsData);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const filteredNetwork = network.filter(p => {
    if (filterSpecialty && !p.specialty?.includes(filterSpecialty)) return false;
    if (filterState && p.state !== filterState) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.user?.name?.toLowerCase().includes(q)
        || p.bio?.toLowerCase().includes(q)
        || p.specialty?.some(s => s.toLowerCase().includes(q));
    }
    return true;
  });

  const toggleSpecialty = (s) => {
    setProfileForm(prev => ({
      ...prev,
      specialty: prev.specialty.includes(s)
        ? prev.specialty.filter(x => x !== s)
        : prev.specialty.length >= 3 ? prev.specialty : [...prev.specialty, s],
    }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const result = await referralsApi.updateProfile({
        ...profileForm,
        yearsExperience: profileForm.yearsExperience ? parseInt(profileForm.yearsExperience) : null,
      });
      setMyProfile(result.profile);
      setEditingProfile(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRespondRequest = async (id, status) => {
    try {
      await referralsApi.respondRequest(id, status);
      setMyRequests(prev => ({
        ...prev,
        received: prev.received.map(r => r.id === id ? { ...r, status } : r),
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingReceived = myRequests.received.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-charcoal-900">Referral Network</h1>
        <p className="text-charcoal-600 text-sm mt-1">Connect with licensed commercial real estate agents</p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-cream-100 rounded-xl p-1 w-fit">
        {[
          { id: 'network', label: 'Network' },
          { id: 'requests', label: `Requests${pendingReceived > 0 ? ` (${pendingReceived})` : ''}` },
          { id: 'profile', label: 'My Profile' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-600/70 hover:text-charcoal-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card shimmer h-28" />)}
        </div>
      ) : (
        <>
          {tab === 'network' && (
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
              {/* Filters */}
              <div className="space-y-4">
                <div className="card p-4">
                  <h3 className="font-semibold text-charcoal-900 text-sm mb-3">Filter Agents</h3>

                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-600/40" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search name, bio..."
                      className="input-field pl-8 text-sm py-2"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="label text-xs">Specialty</label>
                    <select
                      value={filterSpecialty}
                      onChange={e => setFilterSpecialty(e.target.value)}
                      className="input-field text-sm py-2"
                    >
                      <option value="">All Specialties</option>
                      {SPECIALTY_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="label text-xs">State</label>
                    <select
                      value={filterState}
                      onChange={e => setFilterState(e.target.value)}
                      className="input-field text-sm py-2"
                    >
                      <option value="">All States</option>
                      {US_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {(filterSpecialty || filterState || searchQuery) && (
                    <button
                      onClick={() => { setFilterSpecialty(''); setFilterState(''); setSearchQuery(''); }}
                      className="mt-3 text-xs text-accent font-semibold w-full text-center"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="card p-4 bg-charcoal-900 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-accent" />
                    <p className="text-sm font-semibold">{filteredNetwork.length} agents</p>
                  </div>
                  <p className="text-xs text-white/60">visible in the network</p>
                </div>
              </div>

              {/* Agent cards */}
              <div className="space-y-3">
                {filteredNetwork.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Users size={36} className="text-cream-300 mx-auto mb-3" />
                    <p className="text-charcoal-600/60 text-sm">No agents match your filters</p>
                  </div>
                ) : (
                  filteredNetwork.map(p => (
                    <AgentCard key={p.id} profile={p} onContact={setContactProfile} />
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Received */}
              <div>
                <h2 className="font-serif text-lg text-charcoal-900 mb-3">Received</h2>
                {myRequests.received.length === 0 ? (
                  <div className="card p-8 text-center">
                    <MessageSquare size={28} className="text-cream-300 mx-auto mb-2" />
                    <p className="text-sm text-charcoal-600/50">No requests received yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.received.map(req => (
                      <div key={req.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-charcoal-900 text-sm">{req.fromUser?.name || 'Agent'}</p>
                            <p className="text-xs text-charcoal-600/60">{req.fromUser?.email}</p>
                            {req.dealDescription && (
                              <p className="text-xs text-charcoal-600/70 mt-1.5 bg-cream-50 rounded-lg p-2">
                                "{req.dealDescription}"
                              </p>
                            )}
                            <p className="text-xs text-charcoal-600/40 mt-1.5 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {req.status === 'pending' ? (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleRespondRequest(req.id, 'accepted')}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => handleRespondRequest(req.id, 'declined')}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                              }`}>
                                {req.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent */}
              <div>
                <h2 className="font-serif text-lg text-charcoal-900 mb-3">Sent</h2>
                {myRequests.sent.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Send size={28} className="text-cream-300 mx-auto mb-2" />
                    <p className="text-sm text-charcoal-600/50">No requests sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.sent.map(req => (
                      <div key={req.id} className="card p-4">
                        <p className="font-semibold text-charcoal-900 text-sm">{req.toUser?.name || 'Agent'}</p>
                        <p className="text-xs text-charcoal-600/60">{req.toUser?.email}</p>
                        {req.dealDescription && (
                          <p className="text-xs text-charcoal-600/70 mt-1.5 bg-cream-50 rounded-lg p-2">
                            "{req.dealDescription}"
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-charcoal-600/40 flex items-center gap-1">
                            <Clock size={10} /> {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700'
                            : req.status === 'declined' ? 'bg-red-100 text-red-600'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="max-w-2xl">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-xl text-charcoal-900">My Referral Profile</h2>
                  {!editingProfile && (
                    <button onClick={() => setEditingProfile(true)} className="btn-secondary text-sm py-2">
                      Edit Profile
                    </button>
                  )}
                </div>

                {!myProfile && !editingProfile && (
                  <div className="text-center py-8">
                    <Users size={32} className="text-cream-300 mx-auto mb-3" />
                    <p className="text-charcoal-600 text-sm mb-4">You haven't joined the referral network yet.</p>
                    <button onClick={() => setEditingProfile(true)} className="btn-primary">
                      Create Profile
                    </button>
                  </div>
                )}

                {!editingProfile && myProfile && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${myProfile.isVisible ? 'bg-emerald-500' : 'bg-charcoal-600/30'}`} />
                      <span className="text-sm text-charcoal-700">
                        {myProfile.isVisible ? 'Visible in network' : 'Hidden from network'}
                      </span>
                    </div>
                    {myProfile.state && (
                      <div className="flex items-center gap-2 text-sm text-charcoal-700">
                        <MapPin size={14} className="text-accent" /> {myProfile.state}
                      </div>
                    )}
                    {myProfile.yearsExperience && (
                      <div className="flex items-center gap-2 text-sm text-charcoal-700">
                        <Briefcase size={14} className="text-accent" /> {myProfile.yearsExperience} years experience
                      </div>
                    )}
                    {myProfile.bio && (
                      <p className="text-sm text-charcoal-600 bg-cream-50 rounded-xl p-3">{myProfile.bio}</p>
                    )}
                    {myProfile.specialty?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {myProfile.specialty.map(s => (
                          <span key={s} className="text-xs font-semibold bg-accent/10 text-accent px-3 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {editingProfile && (
                  <div className="space-y-5">
                    {/* Visibility toggle */}
                    <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900">Visible in Network</p>
                        <p className="text-xs text-charcoal-600/60">Other agents can find and contact you</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileForm(p => ({ ...p, isVisible: !p.isVisible }))}
                        className={`w-11 h-6 rounded-full transition-colors ${profileForm.isVisible ? 'bg-accent' : 'bg-charcoal-600/20'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${profileForm.isVisible ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* State */}
                    <div>
                      <label className="label">State</label>
                      <select
                        value={profileForm.state}
                        onChange={e => setProfileForm(p => ({ ...p, state: e.target.value }))}
                        className="input-field"
                      >
                        <option value="">Select State</option>
                        {US_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Years experience */}
                    <div>
                      <label className="label">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={profileForm.yearsExperience}
                        onChange={e => setProfileForm(p => ({ ...p, yearsExperience: e.target.value }))}
                        className="input-field"
                        placeholder="e.g. 12"
                      />
                    </div>

                    {/* Specialty */}
                    <div>
                      <label className="label">Specialties (up to 3)</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SPECIALTY_OPTIONS.map(s => {
                          const selected = profileForm.specialty.includes(s);
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
                      <p className="text-xs text-charcoal-600/40 mt-1">{profileForm.specialty.length}/3 selected</p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="label">Bio <span className="text-charcoal-600/40 font-normal">(max 300 chars)</span></label>
                      <textarea
                        value={profileForm.bio}
                        onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value.slice(0, 300) }))}
                        className="input-field h-24 resize-none"
                        placeholder="Brief description of your background and focus areas..."
                      />
                      <p className="text-xs text-charcoal-600/40 text-right">{profileForm.bio.length}/300</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="btn-primary flex-1 justify-center"
                      >
                        {savingProfile ? 'Saving...' : 'Save Profile'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {contactProfile && (
        <ContactModal profile={contactProfile} onClose={() => setContactProfile(null)} />
      )}
    </div>
  );
}
