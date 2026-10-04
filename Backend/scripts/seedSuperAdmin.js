// backend/scripts/seedSuperAdmin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const SUPER_ADMIN = {
  name: process.env.SUPER_ADMIN_NAME || 'Mongezi',
  surname: process.env.SUPER_ADMIN_SURNAME || 'Mseleku',
  email: (process.env.SUPER_ADMIN_EMAIL || 'mongezi.mseleku@iik.co.za').toLowerCase(),
  phone: process.env.SUPER_ADMIN_PHONE || '0614963559',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@12',
};

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
    console.log(`   Password : ${SUPER_ADMIN.password}`);
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