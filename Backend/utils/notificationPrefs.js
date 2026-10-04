// backend/utils/notificationPrefs.js
const fs = require('fs');
const path = require('path');

// Store in backend/data/notification-prefs.json
const FILE = path.join(__dirname, '..', 'data', 'notification-prefs.json');

const DEFAULT_PREFS = {
    certificateIssued: true,
    newProgramme: true,
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
        console.error('Read notification prefs failed:', err.message);
        return {};
    }
};

const writeAll = (data) => {
    try {
        ensureFile();
        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Write notification prefs failed:', err.message);
        return false;
    }
};

const getPrefs = (userId) => {
    const all = readAll();
    const key = String(userId);
    const stored = all[key] || {};
    return {
        certificateIssued: stored.certificateIssued ?? DEFAULT_PREFS.certificateIssued,
        newProgramme: stored.newProgramme ?? DEFAULT_PREFS.newProgramme,
    };
};

const setPrefs = (userId, prefs) => {
    const all = readAll();
    all[String(userId)] = {
        certificateIssued: !!prefs.certificateIssued,
        newProgramme: !!prefs.newProgramme,
    };
    return writeAll(all);
};

module.exports = { getPrefs, setPrefs, DEFAULT_PREFS };