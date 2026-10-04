// backend/jobs/weeklySummaryJob.js
const cron = require('node-cron');
const { pool } = require('../config/database');
const emailService = require('../services/emailService');
const { getPrefs: getAdminPrefs } = require('../utils/adminNotificationPrefs');
const {
    getCentreSummary,
    getGlobalSummary,
} = require('../services/weeklySummaryService');

const getWeeklySummaryRecipients = async () => {
    const [admins] = await pool.execute(
        `SELECT Admin_ID, Name, Surname, Email_address, role_ID, Centre_ID
         FROM Admin
         WHERE Email_address IS NOT NULL
           AND Email_address != ''`
    );

    return admins.filter(
        (a) => getAdminPrefs(a.Admin_ID).notifyWeekly === true
    );
};

const runWeeklySummaryJob = async () => {
    console.log('📊 Weekly summary job starting...');

    try {
        const recipients = await getWeeklySummaryRecipients();

        if (recipients.length === 0) {
            console.log('📊 No admins opted in to weekly summaries. Nothing to do.');
            return { sent: [], skipped: [], failed: [] };
        }

        
        const resolver = async (admin) => {
            const isSuperAdmin = Number(admin.role_ID) === 3;
            if (isSuperAdmin) {
                return getGlobalSummary();
            }
            if (!admin.Centre_ID) {
               
                return null;
            }
            return getCentreSummary(admin.Centre_ID);
        };

        const results = await emailService.sendWeeklySummaryToMany(
            recipients,
            resolver
        );

        return results;
    } catch (err) {
        console.error('Weekly summary job failed:', err.message);
        throw err;
    } finally {
        console.log('Weekly summary job finished.');
    }
};


const startWeeklySummaryJob = () => {
    if (process.env.ENABLE_WEEKLY_SUMMARY !== 'true') {
        console.log(
            ' Weekly summary job disabled — set ENABLE_WEEKLY_SUMMARY=true to enable.'
        );
        return;
    }

    // Monday at 08:00, Johannesburg time
    cron.schedule(
        '0 8 * * 1',
        () => {
            runWeeklySummaryJob().catch((err) =>
                console.error('Scheduled weekly summary error:', err.message)
            );
        },
        { timezone: 'Africa/Johannesburg' }
    );

    console.log('Weekly summary job scheduled — Mondays at 08:00 (SAST)');
};

module.exports = {
    startWeeklySummaryJob,
    runWeeklySummaryJob,
    getWeeklySummaryRecipients,
};