// Centre scoping for centre admins vs Super Admin.
// Super Admin sees all learners. A centre admin only sees learners
// who expressed interest at that admin's assigned digital centre.

function getCentreScope(req) {
    const roleId = Number(req.user?.roleId);
    const isSuperAdmin = roleId === 3 || req.user?.role === 'Super Admin';
    const raw = req.user?.centreId;
    const centreId =
        raw === undefined || raw === null || raw === ''
            ? null
            : Number(raw);
    const applyFilter = !isSuperAdmin && Number.isFinite(centreId);
    const denyAll = !isSuperAdmin && !applyFilter;

    return {
        isSuperAdmin,
        centreId: applyFilter ? centreId : null,
        applyFilter,
        denyAll
    };
}

function learnerInterestedInCentreSql(userColumn = 'u.User_id') {
    return `EXISTS (
        SELECT 1
        FROM learner_interests li_scope
        WHERE li_scope.user_id = ${userColumn}
          AND li_scope.digital_center_id = ?
          AND (li_scope.status IS NULL OR li_scope.status != 'Not Interested')
    )`;
}

async function assertLearnerInAdminCentre(pool, learnerId, scope) {
    if (scope.isSuperAdmin) return true;
    if (scope.denyAll || !scope.applyFilter) return false;

    const [rows] = await pool.execute(
        `SELECT 1
         FROM learner_interests
         WHERE user_id = ?
           AND digital_center_id = ?
           AND (status IS NULL OR status != 'Not Interested')
         LIMIT 1`,
        [learnerId, scope.centreId]
    );

    return rows.length > 0;
}

async function getCentreName(pool, centreId) {
    if (!centreId) return null;
    try {
        const [rows] = await pool.execute(
            'SELECT center_name FROM Digital_Center WHERE digital_center_id = ? LIMIT 1',
            [centreId]
        );
        return rows[0]?.center_name || null;
    } catch {
        return null;
    }
}

module.exports = {
    getCentreScope,
    learnerInterestedInCentreSql,
    assertLearnerInAdminCentre,
    getCentreName
};
