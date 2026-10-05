// backend/services/weeklySummaryService.js
const { pool } = require('../config/database');

// ---------------------------------------------------------------------------
// Compute the Monday-Sunday range ending today (or a custom reference date).
// Returns { startDate, endDate } as YYYY-MM-DD strings for MySQL.
//
// When called on a Monday (the cron day), "last week" is the Mon-Sun that
// just ended. When called any other day (e.g. the manual trigger), it uses
// the Mon-Sun that contains the reference date.
// ---------------------------------------------------------------------------
const getWeekRange = (referenceDate = new Date()) => {
    const d = new Date(referenceDate);
    d.setHours(0, 0, 0, 0);

    // JS: Sunday=0, Monday=1, ... Saturday=6
    const day = d.getDay();
    // Distance back to Monday
    const diffToMonday = day === 0 ? 6 : day - 1;

    const monday = new Date(d);
    monday.setDate(d.getDate() - diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (x) => {
        const yyyy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, '0');
        const dd = String(x.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    return {
        startDate: fmt(monday),
        endDate: fmt(sunday),
        periodStart: monday,
        periodEnd: sunday,
    };
};

// ---------------------------------------------------------------------------
// Centre-scoped summary for a regular admin.
// Note: NO new-registration count here — that's a system-wide metric,
// reserved for super admins.
// ---------------------------------------------------------------------------
const getCentreSummary = async (centreId) => {
    const { startDate, endDate, periodStart, periodEnd } = getWeekRange();

    const summary = {
        scope: 'centre',
        centreId,
        centreName: null,
        periodStart,
        periodEnd,
        periodStartStr: startDate,
        periodEndStr: endDate,
        newInterests: 0,
        newEnrolments: 0,
        completions: 0,
        certificatesIssued: 0,
        totalActiveLearners: 0,
    };

    // Centre name (used in the subject and header)
    try {
        const [centreRows] = await pool.execute(
            'SELECT center_name FROM Digital_Center WHERE digital_center_id = ? LIMIT 1',
            [centreId]
        );
        summary.centreName = centreRows[0]?.center_name || 'Your Centre';
    } catch (err) {
        console.log('Weekly summary: centre name lookup failed:', err.message);
    }

    // New interests this week (status != Not Interested, created in range)
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM learner_interests
             WHERE digital_center_id = ?
               AND status != 'Not Interested'
               AND DATE(interest_date) BETWEEN ? AND ?`,
            [centreId, startDate, endDate]
        );
        summary.newInterests = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: new interests query failed:', err.message);
    }

    // New enrolments this week (status = Enrolled, enrolled_date in range)
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM learner_interests
             WHERE digital_center_id = ?
               AND status = 'Enrolled'
               AND DATE(enrolled_date) BETWEEN ? AND ?`,
            [centreId, startDate, endDate]
        );
        summary.newEnrolments = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: new enrolments query failed:', err.message);
    }

    // Completions this week (Enrolment flipped to Completed in range)
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM Enrolment
             WHERE digital_center_id = ?
               AND Completion_status = 'Completed'
               AND DATE(Completion_date) BETWEEN ? AND ?`,
            [centreId, startDate, endDate]
        );
        summary.completions = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: completions query failed:', err.message);
    }

    // Certificates issued this week (via matching Completion at the centre)
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM Certificate c
             INNER JOIN Enrolment e
                 ON e.User_id = c.User_id
                AND e.Programme_id = c.Programme_id
                AND e.Completion_status = 'Completed'
             WHERE e.digital_center_id = ?
               AND DATE(c.Date_issued) BETWEEN ? AND ?`,
            [centreId, startDate, endDate]
        );
        summary.certificatesIssued = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: certificates query failed:', err.message);
    }

    // Total active learners at this centre (running count, not week-scoped)
    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(DISTINCT user_id) AS count
             FROM learner_interests
             WHERE digital_center_id = ?
               AND status = 'Enrolled'`,
            [centreId]
        );
        summary.totalActiveLearners = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: active learners query failed:', err.message);
    }

    return summary;
};

// ---------------------------------------------------------------------------
// Global summary for a super admin.
// Includes new registrations and total centres, which are system-wide.
// ---------------------------------------------------------------------------
const getGlobalSummary = async () => {
    const { startDate, endDate, periodStart, periodEnd } = getWeekRange();

    const summary = {
        scope: 'global',
        centreId: null,
        centreName: null,
        periodStart,
        periodEnd,
        periodStartStr: startDate,
        periodEndStr: endDate,
        newRegistrations: 0,
        newInterests: 0,
        newEnrolments: 0,
        completions: 0,
        certificatesIssued: 0,
        totalActiveLearners: 0,
        totalCentres: 0,
    };

    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM user
             WHERE role_id = 2
               AND DATE(register_at) BETWEEN ? AND ?`,
            [startDate, endDate]
        );
        summary.newRegistrations = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: registrations query failed:', err.message);
    }

    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM learner_interests
             WHERE status != 'Not Interested'
               AND DATE(interest_date) BETWEEN ? AND ?`,
            [startDate, endDate]
        );
        summary.newInterests = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: new interests query failed:', err.message);
    }

    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM learner_interests
             WHERE status = 'Enrolled'
               AND DATE(enrolled_date) BETWEEN ? AND ?`,
            [startDate, endDate]
        );
        summary.newEnrolments = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: new enrolments query failed:', err.message);
    }

    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM Enrolment
             WHERE Completion_status = 'Completed'
               AND DATE(Completion_date) BETWEEN ? AND ?`,
            [startDate, endDate]
        );
        summary.completions = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: completions query failed:', err.message);
    }

    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count
             FROM Certificate
             WHERE DATE(Date_issued) BETWEEN ? AND ?`,
            [startDate, endDate]
        );
        summary.certificatesIssued = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: certificates query failed:', err.message);
    }

    try {
        const [rows] = await pool.execute(
            `SELECT COUNT(DISTINCT user_id) AS count
             FROM learner_interests
             WHERE status = 'Enrolled'`
        );
        summary.totalActiveLearners = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: active learners query failed:', err.message);
    }

    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) AS count FROM Digital_Center'
        );
        summary.totalCentres = rows[0]?.count || 0;
    } catch (err) {
        console.log('Weekly summary: centres query failed:', err.message);
    }

    return summary;
};

// ---------------------------------------------------------------------------
// Empty-week check: if every activity counter is zero, skip the email.
// (Running totals like active learners or total centres don't count —
//  they're not "activity".)
// ---------------------------------------------------------------------------
const isEmptyWeek = (summary) => {
    return (
        (summary.newRegistrations || 0) === 0 &&
        (summary.newInterests || 0) === 0 &&
        (summary.newEnrolments || 0) === 0 &&
        (summary.completions || 0) === 0 &&
        (summary.certificatesIssued || 0) === 0
    );
};

module.exports = {
    getWeekRange,
    getCentreSummary,
    getGlobalSummary,
    isEmptyWeek,
};