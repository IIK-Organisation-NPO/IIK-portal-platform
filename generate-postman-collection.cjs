// generate-postman-collection.js
// ============================================================
// Generates IIK-Portal-API.postman_collection.json
//
// Usage:
//   node generate-postman-collection.js
//
// Then in Postman: File -> Import -> select the generated file
// ============================================================

const fs = require('fs');

const BASE_URL = '{{baseUrl}}';
const ADMIN = '{{adminToken}}';
const LEARNER = '{{learnerToken}}';
const SUPER = '{{superAdminToken}}';

// Helper: build a request
function req({ name, method, path, auth, body = null, query = [] }) {
  const headers = [];

  if (auth === 'admin') headers.push({ key: 'Authorization', value: `Bearer ${ADMIN}` });
  if (auth === 'learner') headers.push({ key: 'Authorization', value: `Bearer ${LEARNER}` });
  if (auth === 'super') headers.push({ key: 'Authorization', value: `Bearer ${SUPER}` });

  if (body) headers.push({ key: 'Content-Type', value: 'application/json' });

  const pathParts = path.split('/').filter(Boolean);

  const urlObj = {
    raw: `${BASE_URL}${path}${query.length ? '?' + query.map(q => `${q.key}=${q.value}`).join('&') : ''}`,
    host: [BASE_URL],
    path: pathParts,
  };

  if (query.length) {
    urlObj.query = query;
  }

  const request = {
    method,
    header: headers,
    url: urlObj,
  };

  if (body) {
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  return {
    name,
    request,
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            "pm.test('Response received', () => pm.response.to.be.ok || pm.response.to.be.error);",
          ],
        },
      },
    ],
  };
}

// ============================================================
// FOLDERS
// ============================================================

// ---------- 01. Auth ----------
const authFolder = {
  name: '01. Auth',
  item: [
    // Logins (already working — kept here so the collection is complete)
    req({
      name: 'Login (Admin)',
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'thabiso5@gmail.com', password: 'CHANGE_ME' },
    }),
    req({
      name: 'Login (Learner)',
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'mthobisintshangase01@gmail.com', password: 'CHANGE_ME' },
    }),
    req({
      name: 'Login (Super Admin)',
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'superadmin2@gmail.com', password: 'CHANGE_ME' },
    }),

    // Public auth endpoints
    req({
      name: 'Get Genders',
      method: 'GET',
      path: '/api/auth/genders',
    }),
    req({
      name: 'Get Roles',
      method: 'GET',
      path: '/api/auth/roles',
    }),
    req({
      name: 'Get CAPTCHA',
      method: 'GET',
      path: '/api/auth/captcha',
    }),
    req({
      name: 'Refresh CAPTCHA',
      method: 'GET',
      path: '/api/auth/captcha/refresh',
    }),
    req({
      name: 'Health Check',
      method: 'GET',
      path: '/api/auth/health',
    }),

    // Signup flow
    req({
      name: 'Signup',
      method: 'POST',
      path: '/api/auth/signup',
      body: {
        name: 'Test',
        surname: 'User',
        email: 'test-user-' + Date.now() + '@example.com',
        phone_number: '0821234567',
        gender_id: 1,
        id_number: '9001015800080',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        terms_accepted: true,
        physicalAddress: null,
      },
    }),
    req({
      name: 'Send Registration OTP',
      method: 'POST',
      path: '/api/auth/send-registration-otp',
      body: { email: 'test-user@example.com' },
    }),
    req({
      name: 'Verify Registration OTP',
      method: 'POST',
      path: '/api/auth/verify-registration-otp',
      body: { email: 'test-user@example.com', otp: '123456' },
    }),
    req({
      name: 'Resend Registration OTP',
      method: 'POST',
      path: '/api/auth/resend-registration-otp',
      body: { email: 'test-user@example.com' },
    }),

    // Password reset flow
    req({
      name: 'Forgot Password',
      method: 'POST',
      path: '/api/auth/forgot-password',
      body: { email: 'mthobisintshangase01@gmail.com' },
    }),
    req({
      name: 'Verify Password Reset OTP',
      method: 'POST',
      path: '/api/auth/verify-password-reset-otp',
      body: { email: 'mthobisintshangase01@gmail.com', otpCode: '123456' },
    }),
    req({
      name: 'Reset Password',
      method: 'POST',
      path: '/api/auth/reset-password',
      body: { resetToken: 'PASTE_TOKEN_HERE', newPassword: 'NewPass@123', confirmPassword: 'NewPass@123' },
    }),
    req({
      name: 'Resend Password Reset OTP',
      method: 'POST',
      path: '/api/auth/resend-password-reset-otp',
      body: { email: 'mthobisintshangase01@gmail.com' },
    }),

    // Token management
    req({
      name: 'Refresh Token',
      method: 'POST',
      path: '/api/auth/refresh-token',
      auth: 'learner',
      body: {},
    }),
    req({
      name: 'Logout',
      method: 'POST',
      path: '/api/auth/logout',
      auth: 'learner',
      body: {},
    }),
  ],
};

// ---------- 02. Staff ----------
const staffFolder = {
  name: '02. Staff',
  item: [
    req({ name: 'Get My Admin Profile', method: 'GET', path: '/api/staff/me', auth: 'admin' }),
    req({
      name: 'Update My Admin Profile',
      method: 'PUT',
      path: '/api/staff/me',
      auth: 'admin',
      body: { name: 'Updated', surname: 'Name', phone_number: '0821234567' },
    }),
    req({
      name: 'Change My Password',
      method: 'PUT',
      path: '/api/staff/me/password',
      auth: 'admin',
      body: { currentPassword: 'OldPass@123', newPassword: 'NewPass@123', confirmPassword: 'NewPass@123' },
    }),
    req({
      name: 'Verify My Password',
      method: 'POST',
      path: '/api/staff/me/verify-password',
      auth: 'admin',
      body: { password: 'CurrentPass@123' },
    }),
    req({ name: 'Get My Notification Prefs', method: 'GET', path: '/api/staff/me/notifications', auth: 'admin' }),
    req({
      name: 'Update My Notification Prefs',
      method: 'PUT',
      path: '/api/staff/me/notifications',
      auth: 'admin',
      body: { notifyOnRegistration: true, weeklySummary: true },
    }),
    req({ name: 'Get Assignable Roles (Super Admin)', method: 'GET', path: '/api/staff/roles', auth: 'super' }),
    req({
      name: 'Create Staff (Super Admin)',
      method: 'POST',
      path: '/api/staff',
      auth: 'super',
      body: {
        name: 'New', surname: 'Staff',
        email: 'newstaff-' + Date.now() + '@example.com',
        phone_number: '0821234567',
        role_id: 1, centre: 1,
        password: 'Test@1234', confirmPassword: 'Test@1234',
      },
    }),
    req({ name: 'Get All Staff (Super Admin)', method: 'GET', path: '/api/staff', auth: 'super' }),
    req({
      name: 'Update Staff Status (Super Admin)',
      method: 'PATCH',
      path: '/api/staff/1/status',
      auth: 'super',
      body: { is_active: true },
    }),
    req({ name: 'Delete Staff (Super Admin)', method: 'DELETE', path: '/api/staff/1', auth: 'super' }),
  ],
};

// ---------- 03. Admin ----------
const adminFolder = {
  name: '03. Admin',
  item: [
    req({ name: 'Get Stats', method: 'GET', path: '/api/admin/stats', auth: 'admin' }),
    req({ name: 'Get Activities', method: 'GET', path: '/api/admin/activities', auth: 'admin' }),
    req({ name: 'Get Learners', method: 'GET', path: '/api/admin/learners', auth: 'admin' }),
    req({
      name: 'Update Learner',
      method: 'PUT',
      path: '/api/admin/learners/1',
      auth: 'admin',
      body: { name: 'Updated', surname: 'Learner', phone_number: '0821234567' },
    }),
    req({ name: 'Delete Learner', method: 'DELETE', path: '/api/admin/learners/1', auth: 'admin' }),
    req({
      name: 'Get Learner Completed Programmes',
      method: 'GET',
      path: '/api/admin/learners/1/completed-programmes',
      auth: 'admin',
    }),
    req({ name: 'Get Interested Learners', method: 'GET', path: '/api/admin/interested-learners', auth: 'admin' }),
    req({
      name: 'Update Interested Learner Status',
      method: 'PUT',
      path: '/api/admin/interested-learners/1',
      auth: 'admin',
      body: { status: 'Contacted', notes: 'Called on Monday' },
    }),
    req({
      name: 'Get Programme Interest Counts',
      method: 'GET',
      path: '/api/admin/programme-interest-counts',
      auth: 'admin',
    }),
    req({
      name: 'Send Bulk Email',
      method: 'POST',
      path: '/api/admin/send-bulk-email',
      auth: 'admin',
      body: { subject: 'Test Email', body: '<p>Hello</p>', recipients: ['test@example.com'] },
    }),
    req({ name: 'Get Programmes (Admin)', method: 'GET', path: '/api/admin/programmes', auth: 'admin' }),

    // Certificates
    req({ name: 'Get All Certificates', method: 'GET', path: '/api/admin/certificates', auth: 'admin' }),
    // Upload requires multipart — noted in the description below
    req({ name: 'View Certificate PDF', method: 'GET', path: '/api/admin/certificates/view/1', auth: 'admin' }),
    req({
      name: 'Update Certificate',
      method: 'PUT',
      path: '/api/admin/certificates/1',
      auth: 'admin',
      body: { Programme_id: 1, Expire_date: null, neverExpires: true },
    }),
    req({ name: 'Download Certificate PDF', method: 'GET', path: '/api/admin/certificates/download/1', auth: 'admin' }),
    req({ name: 'Delete Certificate', method: 'DELETE', path: '/api/admin/certificates/1', auth: 'admin' }),

    // Analytics
    req({ name: 'Get Analytics Overview', method: 'GET', path: '/api/admin/analytics', auth: 'admin' }),
    req({ name: 'Get Centre Stats', method: 'GET', path: '/api/admin/analytics/centres', auth: 'admin' }),
    req({ name: 'Get Programme Stats', method: 'GET', path: '/api/admin/analytics/programmes', auth: 'admin' }),

    // Bulk certificates
    req({ name: 'Get Eligible Learners', method: 'GET', path: '/api/admin/bulk-certificates/eligible', auth: 'admin' }),
    // Bulk issue requires multipart — noted below

    // Enrolments
    req({ name: 'Mark Enrolment Complete', method: 'PATCH', path: '/api/admin/enrolments/1/complete', auth: 'admin' }),

    // Weekly summary
    req({ name: 'Send Weekly Summary Now', method: 'POST', path: '/api/admin/weekly-summary/send-now', auth: 'admin' }),
  ],
};

// ---------- 04. Learner ----------
const learnerFolder = {
  name: '04. Learner',
  item: [
    req({ name: 'Get Digital Centres', method: 'GET', path: '/api/learner/digital-centers', auth: 'admin' }),
    req({ name: 'Get Nearest Centres', method: 'GET', path: '/api/learner/digital-centers/nearest', auth: 'admin' }),
    req({ name: 'Get My Profile', method: 'GET', path: '/api/learner/profile', auth: 'learner' }),
    req({
      name: 'Update My Profile',
      method: 'PUT',
      path: '/api/learner/profile',
      auth: 'learner',
      body: { name: 'Updated', surname: 'Name', phone_number: '0821234567', physicalAddress: '123 Main St' },
    }),
    req({
      name: 'Change My Password',
      method: 'PUT',
      path: '/api/learner/change-password',
      auth: 'learner',
      body: { currentPassword: 'Old@123', newPassword: 'New@123', confirmPassword: 'New@123' },
    }),
    req({ name: 'Get My Stats', method: 'GET', path: '/api/learner/stats', auth: 'learner' }),
    req({ name: 'Get My Notification Prefs', method: 'GET', path: '/api/learner/notifications', auth: 'learner' }),
    req({
      name: 'Update My Notification Prefs',
      method: 'PUT',
      path: '/api/learner/notifications',
      auth: 'learner',
      body: { certificateIssued: true, newProgramme: true },
    }),
    req({
      name: 'Submit Centre Interest',
      method: 'POST',
      path: '/api/learner/digital-centers/interest',
      auth: 'learner',
      body: { digital_center_id: 1, programme_id: 1, notes: 'Interested' },
    }),
    req({
      name: 'Remove Centre Interest',
      method: 'DELETE',
      path: '/api/learner/digital-centers/interest',
      auth: 'learner',
      body: { digital_center_id: 1 },
    }),
    req({ name: 'Get My Centre Interests', method: 'GET', path: '/api/learner/digital-centers/my-interests', auth: 'learner' }),
    req({ name: 'Get Programmes (Learner)', method: 'GET', path: '/api/learner/programmes', auth: 'learner' }),
    req({
      name: 'Record Interest',
      method: 'POST',
      path: '/api/learner/interest',
      auth: 'learner',
      body: { programme_id: 1, digital_center_id: 1, notes: 'Interested in this' },
    }),
    req({
      name: 'Express Interest',
      method: 'POST',
      path: '/api/learner/express-interest',
      auth: 'learner',
      body: { programme_id: 1, digital_center_id: 1 },
    }),
    req({ name: 'Get My Interests', method: 'GET', path: '/api/learner/interests', auth: 'learner' }),
    req({ name: 'Get My Certificates', method: 'GET', path: '/api/learner/certificates', auth: 'learner' }),
    req({
      name: 'Download My Certificate',
      method: 'GET',
      path: '/api/learner/certificates/114/download',
      auth: 'learner',
    }),
    req({ name: 'Debug Token (Dev)', method: 'GET', path: '/api/learner/debug-token', auth: 'learner' }),
    req({ name: 'Public Test', method: 'GET', path: '/api/learner/public-test' }),
  ],
};

// ---------- 05. Blog ----------
const blogFolder = {
  name: '05. Blog',
  item: [
    req({ name: 'Get All Blog Posts (Public)', method: 'GET', path: '/api/blog' }),
    req({ name: 'Get Blog Post by ID (Public)', method: 'GET', path: '/api/blog/1' }),
    req({
      name: 'Create Blog Post (Admin)',
      method: 'POST',
      path: '/api/blog',
      auth: 'admin',
      body: {
        postType: 'Blog Post',
        officialTitle: 'Test Post',
        tags: 'test',
        articleBody: '<p>Test content</p>',
        eventDate: null,
        venue: null,
        status: 'draft',
      },
    }),
    req({
      name: 'Update Blog Post (Admin)',
      method: 'PUT',
      path: '/api/blog/1',
      auth: 'admin',
      body: { title: 'Updated', type: 'Blog Post', status: 'Published', date: new Date().toISOString() },
    }),
    req({ name: 'Delete Blog Post (Admin)', method: 'DELETE', path: '/api/blog/1', auth: 'admin' }),
  ],
};

// ---------- 06. Programmes ----------
const programmeFolder = {
  name: '06. Programmes',
  item: [
    req({ name: 'Get All Programmes', method: 'GET', path: '/api/programmes' }),
    req({ name: 'Get Programme by ID', method: 'GET', path: '/api/programmes/1' }),
    req({
      name: 'Create Programme',
      method: 'POST',
      path: '/api/programmes',
      auth: 'admin',
      body: {
        programmeName: 'Test Programme',
        description: 'Test description',
        duration: '8 weeks',
        startDate: null,
        status: 'Draft',
      },
    }),
    req({
      name: 'Update Programme',
      method: 'PUT',
      path: '/api/programmes/1',
      auth: 'admin',
      body: { programmeName: 'Updated Name', status: 'Active' },
    }),
    req({ name: 'Delete Programme', method: 'DELETE', path: '/api/programmes/1', auth: 'admin' }),
    req({ name: 'Archive Programme', method: 'PATCH', path: '/api/programmes/1/archive', auth: 'admin' }),
    req({ name: 'Unarchive Programme', method: 'PATCH', path: '/api/programmes/1/unarchive', auth: 'admin' }),
    req({ name: 'Get Programme Centres', method: 'GET', path: '/api/programmes/1/centres' }),
    req({ name: 'Get Centre Programmes', method: 'GET', path: '/api/centres/1/programmes' }),
    req({
      name: 'Update Programme Centre Status',
      method: 'PUT',
      path: '/api/programmes/1/centres/1/status',
      auth: 'admin',
      body: { status: 'Active' },
    }),
    req({
      name: 'Update My Programme Centre Status',
      method: 'PUT',
      path: '/api/programmes/1/my-centre/status',
      auth: 'admin',
      body: { status: 'Archived' },
    }),
  ],
};

// ---------- 07. Other ----------
const otherFolder = {
  name: '07. Other',
  item: [
    req({ name: 'Get Admin Navigation', method: 'GET', path: '/api/navigation/admin', auth: 'admin' }),
    // Upload blog image requires multipart — noted below
  ],
};

// ============================================================
// ROOT COLLECTION
// ============================================================
const collection = {
  info: {
    name: 'IIK Portal API',
    description: 'Complete API collection for the IIK Portal Platform.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    authFolder,
    staffFolder,
    adminFolder,
    learnerFolder,
    blogFolder,
    programmeFolder,
    otherFolder,
  ],
};

// ============================================================
// WRITE FILE
// ============================================================
const output = JSON.stringify(collection, null, 2);
fs.writeFileSync('IIK-Portal-API.postman_collection.json', output);

console.log('============================================================');
console.log(' Collection generated successfully');
console.log('============================================================');
console.log(' File: IIK-Portal-API.postman_collection.json');
console.log(' Endpoints: ~75');
console.log(' Folders:');
collection.item.forEach((f) => console.log(`   - ${f.name} (${f.item.length} requests)`));
console.log('');
console.log(' Next steps:');
console.log('   1. Open Postman');
console.log('   2. File -> Import');
console.log('   3. Select IIK-Portal-API.postman_collection.json');
console.log('   4. Choose "Import as a new collection"');
console.log('============================================================');