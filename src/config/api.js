// src/config/api.js
const RAW_BASE = import.meta.env.VITE_API_URL;

if (!RAW_BASE) {
  throw new Error(
    '[api.js] VITE_API_URL is not set. Create a .env.local file in the project root with:\n' +
    'VITE_API_URL=http://localhost:5000'
  );
}

export const API_BASE = RAW_BASE.replace(/\/+$/, '');

const url = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

export const API = {
  auth: {
    signup:            url('/api/auth/signup'),
    login:             url('/api/auth/login'),
    loginWithCaptcha:  url('/api/auth/login-with-captcha'),
    logout:            url('/api/auth/logout'),
    refresh:           url('/api/auth/refresh-token'),
    captcha:           url('/api/auth/captcha'),
    captchaRefresh:    url('/api/auth/captcha/refresh'),
    verifyCaptcha:     url('/api/auth/verify-captcha'),
    sendOtp:           url('/api/auth/send-registration-otp'),
    verifyOtp:         url('/api/auth/verify-registration-otp'),
    resendOtp:         url('/api/auth/resend-registration-otp'),
    forgotPassword:    url('/api/auth/forgot-password'),
    verifyResetOtp:    url('/api/auth/verify-password-reset-otp'),
    resetPassword:     url('/api/auth/reset-password'),
    resendResetOtp:    url('/api/auth/resend-password-reset-otp'),
    googleAuth:        url('/api/auth/google-auth'),
    genders:           url('/api/auth/genders'),
    roles:             url('/api/auth/roles'),
  },
  staff: {
    list:            url('/api/staff'),
    roles:           url('/api/staff/roles'),
    me:              url('/api/staff/me'),
    mePassword:      url('/api/staff/me/password'),
    meVerifyPassword:url('/api/staff/me/verify-password'),
    meNotifications: url('/api/staff/me/notifications'),
    status:  (id) => url(`/api/staff/${id}/status`),
    remove:  (id) => url(`/api/staff/${id}`),
  },
  admin: {
    stats:            url('/api/admin/stats'),
    activities:       url('/api/admin/activities'),
    learners:         url('/api/admin/learners'),
    learner:     (id) => url(`/api/admin/learners/${id}`),
    completedProgs:(id) => url(`/api/admin/learners/${id}/completed-programmes`),
    interested:       url('/api/admin/interested-learners'),
    interestedById:(id) => url(`/api/admin/interested-learners/${id}`),
    programmeInterestCounts: url('/api/admin/programme-interest-counts'),
    sendBulkEmail:    url('/api/admin/send-bulk-email'),
    programmes:       url('/api/admin/programmes'),
    certificates:     url('/api/admin/certificates'),
    certUpload:       url('/api/admin/certificates/upload'),
    certView:     (id) => url(`/api/admin/certificates/view/${id}`),
    certDownload: (id) => url(`/api/admin/certificates/download/${id}`),
    certById:     (id) => url(`/api/admin/certificates/${id}`),
    analytics:        url('/api/admin/analytics'),
    analyticsCentres: url('/api/admin/analytics/centres'),
    analyticsProgrammes: url('/api/admin/analytics/programmes'),
    bulkEligible:     url('/api/admin/bulk-certificates/eligible'),
    bulkIssue:        url('/api/admin/bulk-certificates/issue'),
    markEnrolmentComplete:(id) => url(`/api/admin/enrolments/${id}/complete`),
    sendWeeklySummaryNow: url('/api/admin/weekly-summary/send-now'),
  },
  learner: {
    profile:         url('/api/learner/profile'),
    stats:           url('/api/learner/stats'),
    programmes:      url('/api/learner/programmes'),
    certificates:    url('/api/learner/certificates'),
    digitalCenters:  url('/api/learner/digital-centers'),
    nearestCenters:  url('/api/learner/digital-centers/nearest'),
    interests:       url('/api/learner/interests'),
    notifications:   url('/api/learner/notifications'),
  },
  blog: {
    list:          url('/api/blog'),
    byId:   (id) => url(`/api/blog/${id}`),
  },
};

export const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

export const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(endpoint, {
    credentials: 'include',
    ...options,
    headers: authHeaders(options.headers || {}),
  });
  return res;
};

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('[api.js] VITE_GOOGLE_CLIENT_ID is not set.');
}

export default API_BASE;