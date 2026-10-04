// backend/utils/adminNotificationPrefs.js
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'admin-notification-prefs.json');

const DEFAULT_PREFS = {
    notifyOnCertificate: true,
    notifyOnRegistration: true,
    notifyWeekly: false,
};

const ensureFile = () => {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, JSON.stringify({}, null, 2));
    }
};

const readAll = () => {
    try {
        ensureFile();
        const raw = fs.readFileSync(FILE, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (err) {
        console.error('Read admin prefs failed:', err.message);
        return {};
    }
};

const writeAll = (data) => {
    try {
        ensureFile();
        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Write admin prefs failed:', err.message);
        return false;
    }
};

const getPrefs = (adminId) => {
    const all = readAll();
    const key = String(adminId);
    const stored = all[key] || {};
    return {
        notifyOnCertificate:  stored.notifyOnCertificate  ?? DEFAULT_PREFS.notifyOnCertificate,
        notifyOnRegistration: stored.notifyOnRegistration ?? DEFAULT_PREFS.notifyOnRegistration,
        notifyWeekly:         stored.notifyWeekly         ?? DEFAULT_PREFS.notifyWeekly,
    };
};

const setPrefs = (adminId, prefs) => {
    const all = readAll();
    all[String(adminId)] = {
        notifyOnCertificate:  !!prefs.notifyOnCertificate,
        notifyOnRegistration: !!prefs.notifyOnRegistration,
        notifyWeekly:         !!prefs.notifyWeekly,
    };
    return writeAll(all);
};

module.exports = { getPrefs, setPrefs, DEFAULT_PREFS };