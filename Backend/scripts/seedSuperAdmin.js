// backend/scripts/seedSuperAdmin.js

// ─────────────────────────────────────────────────────────────
// Load .env from the backend folder, no matter where this script
// is run from. `__dirname` is always backend/scripts/, so `..`
// points to backend/.
// ─────────────────────────────────────────────────────────────
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// ─────────────────────────────────────────────────────────────
// All super admin details come from backend/.env.
// No hardcoded defaults — see .env.example for the keys.
// ─────────────────────────────────────────────────────────────
const SUPER_ADMIN = {
  name:     process.env.SUPER_ADMIN_NAME,
  surname:  process.env.SUPER_ADMIN_SURNAME,
  email:    process.env.SUPER_ADMIN_EMAIL,
  phone:    process.env.SUPER_ADMIN_PHONE,
  password: process.env.SUPER_ADMIN_PASSWORD,
};

// ---- Validate required env vars are present ----
const missing = Object.entries(SUPER_ADMIN)
  .filter(([, v]) => !v || !String(v).trim())
  .map(([k]) => `SUPER_ADMIN_${k.toUpperCase()}`);

if (missing.length > 0) {
  console.error('');
  console.error('❌ Missing required env vars in backend/.env:');
  missing.forEach((k) => console.error(`   - ${k}`));
  console.error('');
  console.error('Add them to backend/.env, then run this script again.');
  process.exit(1);
}

// Trim accidental whitespace (common when copying from chats/docs)
SUPER_ADMIN.name     = SUPER_ADMIN.name.trim();
SUPER_ADMIN.surname  = SUPER_ADMIN.surname.trim();
SUPER_ADMIN.email    = SUPER_ADMIN.email.toLowerCase().trim();
SUPER_ADMIN.phone    = SUPER_ADMIN.phone.trim();
SUPER_ADMIN.password = SUPER_ADMIN.password.trim();

async function seedSuperAdmin() {
  try {
    console.log('============================================================');
    console.log(' Super Admin Seed Script');
    console.log('============================================================');
    console.log(` Target email: ${SUPER_ADMIN.email}`);
    console.log('');

    // ---- 1. Check if the account already exists ----
    const [existing] = await pool.execute(
      'SELECT Admin_ID FROM admin WHERE Email_address = ? LIMIT 1',
      [SUPER_ADMIN.email]
    );

    if (existing.length > 0) {
      console.log(`ℹ️  Super admin already exists (Admin_ID: ${existing[0].Admin_ID})`);
      console.log('    Skipping seed. Nothing to do.');
      await pool.end();
      process.exit(0);
    }

    // ---- 2. Verify role 3 exists (Super Admin) ----
    const [roleCheck] = await pool.execute(
      'SELECT role_id, role_type FROM role WHERE role_id = 3 LIMIT 1'
    );

    if (roleCheck.length === 0) {
      console.error('❌ role_id = 3 (Super Admin) does not exist in the role table.');
      console.error('   Run the role seed first, or insert it manually:');
      console.error("   INSERT INTO role (role_id, role_type) VALUES (3, 'Super Admin');");
      await pool.end();
      process.exit(1);
    }

    // ---- 3. Hash the password ----
    console.log(' Hashing password...');
    const hash = await bcrypt.hash(SUPER_ADMIN.password, 10);

    // ---- 4. Insert the super admin ----
    console.log(' Inserting super admin...');
    const [result] = await pool.execute(
      `INSERT INTO admin
        (role_ID, Name, Surname, Email_address, Phone_number, Password, Centre_ID)
       VALUES (3, ?, ?, ?, ?, ?, NULL)`,
      [
        SUPER_ADMIN.name,
        SUPER_ADMIN.surname,
        SUPER_ADMIN.email,
        SUPER_ADMIN.phone,
        hash,
      ]
    );

    console.log('');
    console.log('============================================================');
    console.log(' ✅ Super admin created successfully');
    console.log('============================================================');
    console.log(`   Admin_ID : ${result.insertId}`);
    console.log(`   Name     : ${SUPER_ADMIN.name} ${SUPER_ADMIN.surname}`);
    console.log(`   Email    : ${SUPER_ADMIN.email}`);
    console.log(`   Password : (see SUPER_ADMIN_PASSWORD in backend/.env)`);
    console.log(`   Role_ID  : 3 (Super Admin)`);
    console.log(`   Centre_ID: NULL (no centre scope)`);
    console.log('');
    console.log(' ⚠️  Change the password after the first login!');
    console.log('============================================================');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('');
    console.error('❌ Seed failed:', err.message);
    console.error('');
    console.error('SQL error code:', err.code);
    console.error('SQL state:      ', err.sqlState);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

seedSuperAdmin();