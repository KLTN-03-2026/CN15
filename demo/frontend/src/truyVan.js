/**
 * Mô-đun truy vấn API
 * VITE_API_URL (vd: http://localhost:3001) khi proxy không hoạt động - base phải có /api
 */
let BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');
// Tránh nhầm VITE_API_URL=.../api → gọi .../api/api/...
if (BASE.endsWith('/api')) BASE = BASE.slice(0, -4).replace(/\/$/, '');
const API = BASE ? `${BASE}/api` : '/api';

function layToken() {
  return localStorage.getItem('token');
}

async function guiYeuCau(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = layToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const method = (options.method || 'GET').toUpperCase();
  const fetchOpts = { ...options, headers, credentials: 'include' };
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    if (fetchOpts.body === undefined) fetchOpts.body = '{}';
  }

  const fullUrl = `${API}${url}`;
  const res = await fetch(fullUrl, fetchOpts);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg = data.error || text?.slice(0, 200) || res.statusText || 'Lỗi kết nối';
    const err = new Error(msg);
    err.status = res.status;
    err.url = fullUrl;
    if (data.code) err.code = data.code;
    throw err;
  }
  if (text && Object.keys(data).length === 0 && text.trim().startsWith('{')) {
    console.warn('[API] JSON không parse được:', fullUrl, text.slice(0, 120));
  }
  return data;
}

export const xacThuc = {
  dangNhap: (email, password) => guiYeuCau('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  dangKy: (body) => guiYeuCau('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  layThongTin: () => guiYeuCau('/auth/me'),
  quenMatKhau: (email) => guiYeuCau('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email, origin: typeof window !== 'undefined' ? window.location.origin : '' }) }),
  datLaiMatKhau: (token, newPassword) => guiYeuCau('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
};

export const nguoiDung = {
  layThongTin: () => guiYeuCau('/users/profile'),
  getProfile: () => guiYeuCau('/users/profile'),
  capNhat: (body) => guiYeuCau('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  updateProfile: (body) => guiYeuCau('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  doiMatKhau: (current, next) => guiYeuCau('/users/password', { method: 'PUT', body: JSON.stringify({ currentPassword: current, newPassword: next }) }),
  changePassword: (current, next) => guiYeuCau('/users/password', { method: 'PUT', body: JSON.stringify({ currentPassword: current, newPassword: next }) }),
  danhSach: () => guiYeuCau('/users'),
  list: () => guiYeuCau('/users'),
  layTheoId: (id) => guiYeuCau(`/users/${id}`),
  get: (id) => guiYeuCau(`/users/${id}`),
  tao: (body) => guiYeuCau('/users', { method: 'POST', body: JSON.stringify(body) }),
  create: (body) => guiYeuCau('/users', { method: 'POST', body: JSON.stringify(body) }),
  capNhatId: (id, body) => guiYeuCau(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  update: (id, body) => guiYeuCau(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  xoa: (id) => guiYeuCau(`/users/${id}`, { method: 'DELETE' }),
  delete: (id) => guiYeuCau(`/users/${id}`, { method: 'DELETE' }),
};

export const loaiRac = {
  danhSach: (tatCa) => guiYeuCau(tatCa ? '/waste-types?all=1' : '/waste-types'),
  list: (tatCa) => guiYeuCau(tatCa ? '/waste-types?all=1' : '/waste-types'),
  tao: (body) => guiYeuCau('/waste-types', { method: 'POST', body: JSON.stringify(body) }),
  create: (body) => guiYeuCau('/waste-types', { method: 'POST', body: JSON.stringify(body) }),
  capNhat: (id, body) => guiYeuCau(`/waste-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  update: (id, body) => guiYeuCau(`/waste-types/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  xoa: (id) => guiYeuCau(`/waste-types/${id}`, { method: 'DELETE' }),
  delete: (id) => guiYeuCau(`/waste-types/${id}`, { method: 'DELETE' }),
};

const taoYeuCau = (body, fileAnh) => {
  const form = new FormData();
  Object.entries(body).forEach(([k, v]) => form.append(k, v ?? ''));
  if (fileAnh) form.append('image', fileAnh);
  const headers = {};
  if (layToken()) headers.Authorization = `Bearer ${layToken()}`;
  return fetch(`${API}/collections`, { method: 'POST', body: form, headers }).then((r) => r.json()).then((d) => { if (!d.error) return d; throw new Error(d.error); });
};

export const yeuCauThuGom = {
  tao: taoYeuCau,
  create: taoYeuCau,
  cuaToi: (trangThai) => {
    const q = trangThai ? `?status=${encodeURIComponent(trangThai)}` : '';
    return guiYeuCau(`/collections/my${q}`);
  },
  my: (trangThai) => {
    const q = trangThai ? `?status=${encodeURIComponent(trangThai)}` : '';
    return guiYeuCau(`/collections/my${q}`);
  },
  danhSach: (trangThai, loc) => {
    const params = new URLSearchParams();
    if (trangThai) params.set('status', trangThai);
    if (loc?.createdFrom) params.set('createdFrom', loc.createdFrom);
    if (loc?.createdTo) params.set('createdTo', loc.createdTo);
    if (loc?.date) params.set('date', loc.date);
    if (loc?.period) params.set('period', loc.period);
    if (loc?.fromDate) params.set('fromDate', loc.fromDate);
    if (loc?.toDate) params.set('toDate', loc.toDate);
    if (loc?.address) params.set('address', loc.address);
    if (loc?.wasteTypeId) params.set('wasteTypeId', loc.wasteTypeId);
    return guiYeuCau(`/collections${params.toString() ? `?${params}` : ''}`);
  },
  list: (trangThai, loc) => {
    const params = new URLSearchParams();
    if (trangThai) params.set('status', trangThai);
    if (loc?.createdFrom) params.set('createdFrom', loc.createdFrom);
    if (loc?.createdTo) params.set('createdTo', loc.createdTo);
    if (loc?.date) params.set('date', loc.date);
    if (loc?.period) params.set('period', loc.period);
    if (loc?.fromDate) params.set('fromDate', loc.fromDate);
    if (loc?.toDate) params.set('toDate', loc.toDate);
    if (loc?.address) params.set('address', loc.address);
    if (loc?.wasteTypeId) params.set('wasteTypeId', loc.wasteTypeId);
    return guiYeuCau(`/collections${params.toString() ? `?${params}` : ''}`);
  },
  layTheoId: (id) => guiYeuCau(`/collections/${id}`),
  get: (id) => guiYeuCau(`/collections/${id}`),
  huy: (id) => guiYeuCau(`/collections/${id}/cancel`, { method: 'PUT' }),
  cancel: (id) => guiYeuCau(`/collections/${id}/cancel`, { method: 'PUT' }),
  nhan: (id) => guiYeuCau(`/collections/${id}/accept`, { method: 'PUT' }),
  accept: (id) => guiYeuCau(`/collections/${id}/accept`, { method: 'PUT' }),
  hoanThanh: (id, body) => guiYeuCau(`/collections/${id}/complete`, { method: 'PUT', body: JSON.stringify(body) }),
  complete: (id, body) => guiYeuCau(`/collections/${id}/complete`, { method: 'PUT', body: JSON.stringify(body) }),
};

export const phanThuong = {
  danhSach: (tatCa) => guiYeuCau(tatCa ? '/rewards?all=1' : '/rewards'),
  list: (tatCa) => guiYeuCau(tatCa ? '/rewards?all=1' : '/rewards'),
  diem: () => guiYeuCau('/rewards/points'),
  points: () => guiYeuCau('/rewards/points'),
  lichSuDoi: () => guiYeuCau('/rewards/my-redemptions'),
  myRedemptions: () => guiYeuCau('/rewards/my-redemptions'),
  doi: (id) => guiYeuCau(`/rewards/${id}/redeem`, { method: 'POST', body: '{}' }),
  redeem: (id) => guiYeuCau(`/rewards/${id}/redeem`, { method: 'POST', body: '{}' }),
  tao: (body) => guiYeuCau('/rewards', { method: 'POST', body: JSON.stringify(body) }),
  create: (body) => guiYeuCau('/rewards', { method: 'POST', body: JSON.stringify(body) }),
  capNhat: (id, body) => guiYeuCau(`/rewards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  update: (id, body) => guiYeuCau(`/rewards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  xoa: (id) => guiYeuCau(`/rewards/${id}`, { method: 'DELETE' }),
  delete: (id) => guiYeuCau(`/rewards/${id}`, { method: 'DELETE' }),
};

const phanTichRac = (file) => {
  const form = new FormData();
  form.append('image', file);
  return fetch(`${API}/ai/analyze-waste`, { method: 'POST', body: form })
    .then((r) => r.json())
    .then((d) => { if (d.error) throw new Error(d.error); return d; });
};

export const ai = {
  phanTichRac,
  analyzeWaste: phanTichRac, // Alias
};

export const thongKe = {
  lay: (boLoc) => {
    if (typeof boLoc === 'string') return guiYeuCau(boLoc ? `/stats?period=${boLoc}` : '/stats');
    const params = new URLSearchParams();
    if (boLoc?.period) params.set('period', boLoc.period);
    if (boLoc?.fromDate) params.set('fromDate', boLoc.fromDate);
    if (boLoc?.toDate) params.set('toDate', boLoc.toDate);
    return guiYeuCau(`/stats${params.toString() ? `?${params}` : ''}`);
  },
  get: (boLoc) => {
    if (typeof boLoc === 'string') return guiYeuCau(boLoc ? `/stats?period=${boLoc}` : '/stats');
    const params = new URLSearchParams();
    if (boLoc?.period) params.set('period', boLoc.period);
    if (boLoc?.fromDate) params.set('fromDate', boLoc.fromDate);
    if (boLoc?.toDate) params.set('toDate', boLoc.toDate);
    return guiYeuCau(`/stats${params.toString() ? `?${params}` : ''}`);
  },
  layCuaToi: (boLoc) => {
    if (typeof boLoc === 'string') return guiYeuCau(boLoc ? `/stats/me?period=${boLoc}` : '/stats/me');
    const params = new URLSearchParams();
    if (boLoc?.period) params.set('period', boLoc.period);
    if (boLoc?.fromDate) params.set('fromDate', boLoc.fromDate);
    if (boLoc?.toDate) params.set('toDate', boLoc.toDate);
    return guiYeuCau(`/stats/me${params.toString() ? `?${params}` : ''}`);
  },
  getMine: (boLoc) => {
    if (typeof boLoc === 'string') return guiYeuCau(boLoc ? `/stats/me?period=${boLoc}` : '/stats/me');
    const params = new URLSearchParams();
    if (boLoc?.period) params.set('period', boLoc.period);
    if (boLoc?.fromDate) params.set('fromDate', boLoc.fromDate);
    if (boLoc?.toDate) params.set('toDate', boLoc.toDate);
    return guiYeuCau(`/stats/me${params.toString() ? `?${params}` : ''}`);
  },
};

export const thongBao = {
  list: () => guiYeuCau('/notifications'),
  danhDauDoc: (id) => guiYeuCau(`/notifications/${id}/read`, { method: 'PUT' }),
  danhDauTatCaDoc: () => guiYeuCau('/notifications/read-all', { method: 'PUT' }),
  soChuaDoc: () => guiYeuCau('/notifications/unread-count'),
};

// Alias để tương thích với api cũ
export const auth = {
  ...xacThuc,
  login: xacThuc.dangNhap,
  register: xacThuc.dangKy,
  me: xacThuc.layThongTin,
};
export const users = nguoiDung;
export const wasteTypes = loaiRac;
export const collections = yeuCauThuGom;
export const rewards = phanThuong;
export const stats = thongKe;
