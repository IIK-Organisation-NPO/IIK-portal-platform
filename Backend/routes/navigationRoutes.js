// backend/routes/navigationRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/* ============================================================
   NAV ITEM DEFINITIONS
   role_ID 1 = Admin
   role_ID 3 = Super Admin
============================================================ */
const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',         icon: 'fa-th-large',   path: '/admin-dashboard',        roles: [1, 3] },
  { id: 'analytics',    label: 'Analytics',         icon: 'fa-chart-line', path: '/admin-analytics',        roles: [1, 3] },
  { id: 'learners',     label: 'Learners',          icon: 'fa-users',      path: '/admin/learners',         roles: [1, 3] },
  { id: 'certificates', label: 'Certificates',      icon: 'fa-certificate',path: '/admin-certificates',     roles: [1, 3] },
  { id: 'programmes',   label: 'Programmes',        icon: 'fa-book-open',  path: '/admin/programmes',       roles: [1, 3] },
  { id: 'blog',         label: 'Blog & News',       icon: 'fa-newspaper',  path: '/admin/blog-management',  roles: [1, 3] },
  { id: 'staff',        label: 'Staff Management',  icon: 'fa-user-cog',   path: '/admin/staff',            roles: [3]    }, // Super Admin only
  { id: 'settings',     label: 'Settings',          icon: 'fa-cog',        path: '/admin/settings',         roles: [1, 3] },
];

/* ============================================================
   Middleware: extract the JWT and attach the decoded payload
   ============================================================ */
function extractJwt(req, res, next) {
  // Token can come from:
  //   1. HTTP-only cookie  `accessToken`   (what your login sets)
  //   2. Authorization header `Bearer ...` (if frontend sends one)
  //   3. Query/body fallback (dev convenience — remove for production)
  const cookieToken = req.cookies?.accessToken;
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const raw = cookieToken || headerToken || null;

  if (!raw) {
    req.jwtUser = null;
    return next();
  }

  try {
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    req.jwtUser = decoded;
  } catch (err) {
    // Expired or tampered token — treat as unauthenticated
    req.jwtUser = null;
  }
  next();
}

/* ============================================================
   GET /api/navigation/admin
   ============================================================ */
router.get('/admin', extractJwt, (req, res) => {
  try {
    const user = req.jwtUser;

    // 🔍 Debug: uncomment if it's still not working
    // console.log('[navigation] decoded JWT:', user);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Only admins get an admin sidebar. Learners shouldn't call this.
    if (user.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // The token carries `roleId` — that's our source of truth.
    const roleId = Number(user.roleId);

    if (!roleId) {
      return res.status(400).json({ success: false, message: 'No role in token' });
    }

    const allowedItems = NAV_ITEMS.filter((item) => item.roles.includes(roleId));

    res.json({
      success: true,
      role_id: roleId,
      role: user.role,        // 'Super Admin' or 'ADMIN'
      data: allowedItems,
    });
  } catch (err) {
    console.error('[GET /api/navigation/admin]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;