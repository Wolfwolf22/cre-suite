import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120000, // 2 min for AI calls
});

// Inject Clerk auth headers on every request
export function setAuthHeaders(userId, email, name) {
  api.defaults.headers.common['x-clerk-user-id'] = userId || '';
  api.defaults.headers.common['x-clerk-user-email'] = email || '';
  api.defaults.headers.common['x-clerk-user-name'] = name || '';
}

// ─── Deals ────────────────────────────────────────────────────────────────────

export const dealsApi = {
  list: () => api.get('/deals').then(r => r.data),
  get: (id) => api.get(`/deals/${id}`).then(r => r.data),
  create: (data) => api.post('/deals', data).then(r => r.data),
  update: (id, data) => api.put(`/deals/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/deals/${id}`).then(r => r.data),
};

// ─── LOI ─────────────────────────────────────────────────────────────────────

export const loiApi = {
  generate: (data) => api.post('/loi/generate', data).then(r => r.data),
};

// ─── Property ─────────────────────────────────────────────────────────────────

export const propertyApi = {
  lookup: (data) => api.post('/property/lookup', data).then(r => r.data),
};

// ─── Cash Flow ────────────────────────────────────────────────────────────────

export const cashflowApi = {
  analyze: (data) => api.post('/cashflow/analyze', data).then(r => r.data),
};

// ─── Debt ─────────────────────────────────────────────────────────────────────

export const debtApi = {
  analyze: (data) => api.post('/debt/analyze', data).then(r => r.data),
};

// ─── Lease ────────────────────────────────────────────────────────────────────

export const leaseApi = {
  generate: (data) => api.post('/lease/generate', data).then(r => r.data),
};

// ─── Deal Analyzer ────────────────────────────────────────────────────────────

export const dealAnalyzerApi = {
  analyze: (data) => api.post('/deal-analyzer/analyze', data).then(r => r.data),
};

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentsApi = {
  list: (type) => api.get('/documents', { params: type ? { type } : {} }).then(r => r.data),
  get: (id) => api.get(`/documents/${id}`).then(r => r.data),
  delete: (id) => api.delete(`/documents/${id}`).then(r => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  me: () => api.get('/users/me').then(r => r.data),
  stats: () => api.get('/users/stats').then(r => r.data),
  seenReferralModal: (data) => api.post('/users/seen-referral-modal', data).then(r => r.data),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => api.get('/settings').then(r => r.data),
  update: (data) => api.put('/settings', data).then(r => r.data),
  uploadLogo: (file) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post('/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};

// ─── Market Pulse ─────────────────────────────────────────────────────────────

export const marketPulseApi = {
  get: () => api.get('/market-pulse').then(r => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  event: (data) => api.post('/analytics/event', data).then(r => r.data),
  summary: () => api.get('/analytics/summary').then(r => r.data),
};

// ─── News ─────────────────────────────────────────────────────────────────────

export const newsApi = {
  get: () => api.get('/news').then(r => r.data),
};

// ─── Referrals ────────────────────────────────────────────────────────────────

export const referralsApi = {
  network: (params) => api.get('/referrals/network', { params }).then(r => r.data),
  myProfile: () => api.get('/referrals/my-profile').then(r => r.data),
  updateProfile: (data) => api.put('/referrals/my-profile', data).then(r => r.data),
  sendRequest: (data) => api.post('/referrals/request', data).then(r => r.data),
  respondRequest: (id, status) => api.put(`/referrals/request/${id}`, { status }).then(r => r.data),
  myRequests: () => api.get('/referrals/my-requests').then(r => r.data),
};

// ─── FRED Data ────────────────────────────────────────────────────────────────

export const fredApi = {
  series: (seriesId) => api.get(`/fred/${seriesId}`).then(r => r.data),
};

// ─── Bridge Data ──────────────────────────────────────────────────────────────

export const bridgeApi = {
  property: (address) => api.get('/bridge/property', { params: { address } }).then(r => r.data),
  history: (parcelId) => api.get('/bridge/history', { params: { parcelId } }).then(r => r.data),
  market: (zip) => api.get('/bridge/market', { params: { zip } }).then(r => r.data),
  trends: (zip, months = 12) => api.get('/bridge/trends', { params: { zip, months } }).then(r => r.data),
  comps: (lat, lng, radius = 1, type = '') => api.get('/bridge/comps', { params: { lat, lng, radius, type } }).then(r => r.data),
  neighborhood: (zip) => api.get('/bridge/neighborhood', { params: { zip } }).then(r => r.data),
};

export default api;
