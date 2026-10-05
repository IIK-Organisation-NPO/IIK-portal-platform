// backend/controllers/adminController.js
const { pool } = require('../config/database');
const emailService = require('../services/emailService');
const { getPrefs } = require('../utils/notificationPrefs');
const { getPrefs: getAdminPrefs } = require('../utils/adminNotificationPrefs');
const fs = require('fs');
const path = require('path');
const {
    getCentreScope,
    learnerInterestedInCentreSql,
    assertLearnerInAdminCentre,
    getCentreName
} = require('../utils/centreScope');

class AdminController {
    // GET DASHBOARD STATS 
    static async getStats(req, res) {
        try {
            console.log('Fetching admin stats...');
            const scope = getCentreScope(req);
            const centreName = scope.applyFilter
                ? await getCentreName(pool, scope.centreId)
                : null;
            const scopedPayload = {
                scopedCentre: scope.applyFilter
                    ? { id: scope.centreId, name: centreName }
                    : null
            };

            if (scope.denyAll) {
                return res.status(200).json({
                    success: true,
                    data: {
                        totalUsers: 0,
                        totalLearners: 0,
                        totalAdmins: 0,
                        totalSuperAdmins: 0,
                        totalProgrammes: 0,
                        totalCertificates: 0,
                        pendingCertificates: 0,
                        verifiedUsers: 0,
                        totalEnrollments: 0,
                        completedEnrollments: 0,
                        enrolledEnrollments: 0,
                        inProgressEnrollments: 0,
                        activeEnrolments: 0,
                        totalInterests: 0,
                        ...scopedPayload
                    }
                });
            }

            const learnerScopeSql = scope.applyFilter
                ? ` AND ${learnerInterestedInCentreSql('u.User_id')}`
                : '';
            const learnerScopeParams = scope.applyFilter ? [scope.centreId] : [];

            const [totalUsers] = await pool.execute(
                `SELECT COUNT(*) as count FROM user u WHERE 1=1${learnerScopeSql}`,
                learnerScopeParams
            );
            const [totalLearners] = await pool.execute(
                `SELECT COUNT(DISTINCT u.User_id) as count FROM user u WHERE u.role_id = 2${learnerScopeSql}`,
                learnerScopeParams
            );
            const [totalAdmins] = await pool.execute(
                'SELECT COUNT(*) as count FROM user WHERE role_id = 1'
            );
            const [totalSuperAdmins] = await pool.execute(
                'SELECT COUNT(*) as count FROM user WHERE role_id = 3'
            );

            let totalProgrammes = 0;
            try {
                const [result] = await pool.execute('SELECT COUNT(*) as count FROM Programmes');
                totalProgrammes = result[0]?.count || 0;
            } catch (err) {
                console.log('Programmes table not found, using 0');
            }

            const [verifiedUsers] = await pool.execute(
                `SELECT COUNT(*) as count FROM user u WHERE u.email_verify = 1${learnerScopeSql}`,
                learnerScopeParams
            );

            // ==============================================================
            //Get Certificates ttal
            // ==============================================================
            let totalCertificates = 0;
            let pendingCertificates = 0;
            try {
                if (scope.applyFilter) {
                    const [result] = await pool.execute(
                        `SELECT COUNT(*) AS count
                           FROM Certificate c
                           INNER JOIN Enrolment e
                               ON e.User_id = c.User_id
                              AND e.Programme_id = c.Programme_id
                              AND e.Completion_status = 'Completed'
                          WHERE e.digital_center_id = ?`,
                        [scope.centreId]
                    );
                    totalCertificates = result[0]?.count || 0;

                    const [pendingResult] = await pool.execute(
                        `SELECT COUNT(*) AS count
                           FROM Certificate c
                           INNER JOIN Enrolment e
                               ON e.User_id = c.User_id
                              AND e.Programme_id = c.Programme_id
                              AND e.Completion_status = 'Completed'
                          WHERE e.digital_center_id = ?
                            AND DATE(c.Date_issued) > CURDATE()`,
                        [scope.centreId]
                    );
                    pendingCertificates = pendingResult[0]?.count || 0;
                } else {
                    const [result] = await pool.execute(
                        'SELECT COUNT(*) as count FROM Certificate'
                    );
                    totalCertificates = result[0]?.count || 0;

                    const [pendingResult] = await pool.execute(
                        `SELECT COUNT(*) as count FROM Certificate
                         WHERE DATE(Date_issued) > CURDATE()`
                    );
                    pendingCertificates = pendingResult[0]?.count || 0;
                }
            } catch (err) {
                console.log('Certificate count query failed:', err.message);
            }

            // ---- Enrolments from learner_interests  by a specific centre ----
            let totalEnrollments = 0;
            let completedEnrollments = 0;
            let enrolledEnrollments = 0;
            let inProgressEnrollments = 0;
            let activeEnrolments = 0;

            try {
                const centreFilter = scope.applyFilter
                    ? ' AND digital_center_id = ?'
                    : '';
                const centreParams = scope.applyFilter ? [scope.centreId] : [];

                // Total enrolments at this centre
                const [total] = await pool.execute(
                    `SELECT COUNT(*) AS count
                       FROM learner_interests
                      WHERE status = 'Enrolled'${centreFilter}`,
                    centreParams
                );
                totalEnrollments = total[0]?.count || 0;
                enrolledEnrollments = totalEnrollments;
                activeEnrolments = totalEnrollments;

                // In progress  Contacted (
                const [inProgress] = await pool.execute(
                    `SELECT COUNT(*) AS count
                       FROM learner_interests
                      WHERE status = 'Contacted'${centreFilter}`,
                    centreParams
                );
                inProgressEnrollments = inProgress[0]?.count || 0;

                // Completed 
                const [completed] = await pool.execute(
                    `SELECT COUNT(*) AS count
                       FROM learner_interests
                      WHERE status = 'Completed'${centreFilter}`,
                    centreParams
                );
                completedEnrollments = completed[0]?.count || 0;

            } catch (err) {
                console.log('Enrolment stats query failed:', err.message);
            }

            let totalInterests = 0;
            try {
                const interestSql = scope.applyFilter
                    ? 'SELECT COUNT(*) as count FROM learner_interests WHERE status != "Not Interested" AND digital_center_id = ?'
                    : 'SELECT COUNT(*) as count FROM learner_interests WHERE status != "Not Interested"';
                const [result] = await pool.execute(
                    interestSql,
                    scope.applyFilter ? [scope.centreId] : []
                );
                totalInterests = result[0]?.count || 0;
            } catch (err) {
                console.log('learner_interests table not found, using 0');
            }

            res.status(200).json({
                success: true,
                data: {
                    totalUsers: totalUsers[0]?.count || 0,
                    totalLearners: totalLearners[0]?.count || 0,
                    totalAdmins: totalAdmins[0]?.count || 0,
                    totalSuperAdmins: totalSuperAdmins[0]?.count || 0,
                    totalProgrammes: totalProgrammes,
                    totalCertificates: totalCertificates,
                    pendingCertificates: pendingCertificates,
                    verifiedUsers: verifiedUsers[0]?.count || 0,
                    totalEnrollments: totalEnrollments,
                    completedEnrollments: completedEnrollments,
                    enrolledEnrollments: enrolledEnrollments,
                    inProgressEnrollments: inProgressEnrollments,
                    activeEnrolments: activeEnrolments,
                    totalInterests: totalInterests,
                    ...scopedPayload
                }
            });

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard stats: ' + error.message
            });
        }
    }

    // ===== GET PROGRAMMES FROM DATABASE =====
    static async getProgrammes(req, res) {
        try {
            console.log('Fetching programmes from database...');

            const [rows] = await pool.execute(
                `SELECT 
                    Programme_id,
                    Programme_name,
                    Programme_description
                FROM Programmes
                ORDER BY Programme_name`
            );

            console.log(`Found ${rows.length} programmes`);

            res.status(200).json({
                success: true,
                data: rows
            });

        } catch (error) {
            console.error('Error fetching programmes:', error);

            const defaultProgrammes = [
                { Programme_id: 1, Programme_name: 'Digital Literacy', Programme_description: 'Foundational digital skills training' },
                { Programme_id: 2, Programme_name: 'Microsoft 365', Programme_description: 'Comprehensive Microsoft 365 training' },
                { Programme_id: 3, Programme_name: 'Digital Marketing', Programme_description: 'Complete digital marketing course' }
            ];

            res.status(200).json({
                success: true,
                data: defaultProgrammes,
                message: 'Using default programmes (table not found)'
            });
        }
    }

    // ===== GET PROGRAMME INTEREST COUNTS =====
    static async getProgrammeInterestCounts(req, res) {
        try {
            console.log('Fetching programme interest counts...');

            const [rows] = await pool.execute(
                `SELECT 
                    p.Programme_id,
                    p.Programme_name,
                    p.Programme_description,
                    COUNT(li.interest_id) as interested_count,
                    MAX(li.interest_date) as last_interest_date
                FROM Programmes p
                LEFT JOIN learner_interests li 
                    ON p.Programme_id = li.programme_id 
                    AND li.status != 'Not Interested'
                GROUP BY p.Programme_id, p.Programme_name, p.Programme_description
                ORDER BY interested_count DESC`
            );

            console.log(`Found ${rows.length} programmes with interest counts`);

            res.status(200).json({
                success: true,
                data: rows
            });

        } catch (error) {
            console.error('Error fetching programme interest counts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch programme interest counts: ' + error.message
            });
        }
    }

    // ===== GET RECENT ACTIVITIES =====
    static async getActivities(req, res) {
        try {
            console.log('Fetching recent activities...');

            let activities = [];
            try {
                const [rows] = await pool.execute(
                    `SELECT 
                        log_id,
                        user_id,
                        activity_type,
                        activity_description,
                        timestamp as created_at
                    FROM user_activity_logs
                    ORDER BY timestamp DESC
                    LIMIT 20`
                );
                activities = rows;
            } catch (err) {
                console.log('user_activity_logs table not found, using user registrations');

                const [rows] = await pool.execute(
                    `SELECT 
                        User_id as user_id,
                        CONCAT('New user registered: ', name, ' ', surname) as activity_description,
                        'registration' as activity_type,
                        register_at as created_at
                    FROM user
                    ORDER BY register_at DESC
                    LIMIT 20`
                );
                activities = rows;
            }

            res.status(200).json({
                success: true,
                data: activities
            });

        } catch (error) {
            console.error('Error fetching activities:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch activities'
            });
        }
    }

 // ============================================
    // GET LEARNERS
    // ============================================
    static async getLearners(req, res) {
        try {
            console.log('Fetching learners...');

            const adminCentreId = req.user?.centreId ?? null;
            const isSuperAdmin = req.user?.roleId === 3;
            const centreFilter = !isSuperAdmin && adminCentreId;

            const params = [];
            let extraWhere = '';

            if (centreFilter) {
                
                params.push(adminCentreId); 
                params.push(adminCentreId); 
                params.push(adminCentreId); 
                params.push(adminCentreId); 
                params.push(adminCentreId); 

                extraWhere = `
                    AND EXISTS (
                        SELECT 1 FROM learner_interests lx
                        WHERE lx.user_id = u.User_id
                          AND lx.status != 'Not Interested'
                          AND lx.digital_center_id = ?
                    )
                `;
                params.push(adminCentreId); 
            }

            const [rows] = await pool.execute(
                `SELECT 
                    u.User_id as id,
                    u.name,
                    u.surname,
                    u.email,
                    u.phone_number,
                    u.email_verify as isVerified,
                    u.register_at as joinedDate,
                    g.gender_description as gender,
                    r.role_type as role,

                    COALESCE(
                        (SELECT p.Programme_name
                         FROM Enrolment e
                         JOIN Programmes p ON e.Programme_id = p.Programme_id
                         WHERE e.User_id = u.User_id
                           AND e.Completion_status != 'Withdrawn'
                           ${centreFilter ? 'AND e.digital_center_id = ?' : ''}
                         ORDER BY e.Enrolment_date DESC
                         LIMIT 1),
                        (SELECT p2.Programme_name
                         FROM learner_interests li
                         JOIN Programmes p2 ON li.programme_id = p2.Programme_id
                         WHERE li.user_id = u.User_id
                           AND li.status != 'Not Interested'
                           ${centreFilter ? 'AND li.digital_center_id = ?' : ''}
                         ORDER BY li.interest_date DESC
                         LIMIT 1)
                    ) as programme_name,

                    COALESCE(
                        (SELECT MAX(e2.Enrolment_date)
                         FROM Enrolment e2 
                         WHERE e2.User_id = u.User_id 
                         AND e2.Completion_status != 'Withdrawn'),
                        (SELECT MAX(li2.interest_date)
                         FROM learner_interests li2
                         WHERE li2.user_id = u.User_id
                         AND li2.status != 'Not Interested')
                    ) as enrolment_date,

                    -- -----------------------------------------------------------------
                    -- Status derivation.
                    --
                    -- Priority 1: the learner has a certificate for a Completed
                    --   enrolment at THIS admin's centre → 'Completed'.
                    --   (For super admins, the centre filter is skipped, so the
                    --    check is against any completion anywhere.)
                    --
                    -- Priority 2: learner_interests.status drives the display.
                    --
                    -- Priority 3 (fallback): Enrolment table, for learners with
                    --   no live interest record.
                    -- -----------------------------------------------------------------
                    COALESCE(
                        (SELECT
                            CASE
                                WHEN EXISTS (
                                    SELECT 1
                                    FROM Certificate c
                                    INNER JOIN Enrolment e
                                        ON e.User_id = c.User_id
                                       AND e.Programme_id = c.Programme_id
                                       AND e.Completion_status = 'Completed'
                                    WHERE c.User_id = u.User_id
                                      ${centreFilter ? 'AND e.digital_center_id = ?' : ''}
                                ) THEN 'Completed'

                                WHEN MAX(li3.status) = 'Enrolled'  THEN 'Active'
                                WHEN MAX(li3.status) = 'Contacted' THEN 'Active'
                                WHEN MAX(li3.status) = 'New'       THEN 'Active'
                                ELSE 'Inactive'
                            END
                         FROM learner_interests li3
                         WHERE li3.user_id = u.User_id
                           AND li3.status != 'Not Interested'
                           ${centreFilter ? 'AND li3.digital_center_id = ?' : ''}),
                        (SELECT
                            CASE
                                WHEN MAX(e3.Completion_status) = 'Completed'   THEN 'Completed'
                                WHEN MAX(e3.Completion_status) = 'Enrolled'    THEN 'Active'
                                WHEN MAX(e3.Completion_status) = 'In Progress' THEN 'Active'
                                WHEN MAX(e3.Completion_status) = 'Withdrawn'   THEN 'Inactive'
                                WHEN MAX(e3.Completion_status) = 'Inactive'    THEN 'Inactive'
                                ELSE MAX(e3.Completion_status)
                            END
                         FROM Enrolment e3
                         WHERE e3.User_id = u.User_id
                           ${centreFilter ? 'AND e3.digital_center_id = ?' : ''})
                    ) as status,

                    (SELECT COUNT(*) 
                     FROM Enrolment e 
                     WHERE e.User_id = u.User_id 
                     AND e.Completion_status != 'Withdrawn') as enrolled_count,

                    (SELECT COUNT(*) > 0 
                     FROM learner_interests li 
                     WHERE li.user_id = u.User_id 
                     AND li.status != 'Not Interested') as hasInterested,

                    (SELECT COUNT(*) > 0 
                     FROM learner_interests li 
                     WHERE li.user_id = u.User_id 
                     AND li.status = 'Enrolled') as isEnrolled

                FROM user u
                LEFT JOIN gender g ON u.gender_id = g.gender_id
                LEFT JOIN role r ON u.role_id = r.role_id
                WHERE u.role_id = 2
                ${extraWhere}
                ORDER BY u.User_id DESC`,
                params
            );

            res.status(200).json({
                success: true,
                data: rows
            });

        } catch (error) {
            console.error('Error fetching learners:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch learners'
            });
        }
    }

    // ============================================
    // UPDATE LEARNER
    // ============================================
    static async updateLearner(req, res) {
        try {
            const { id } = req.params;
            const { name, surname, email, phone, status } = req.body;

            console.log('Updating learner:', { id, name, surname, email, phone, status });

            //  Deactivate 
            if (status === 'Inactive') {
                const [result] = await pool.execute(
                    `UPDATE Enrolment
                     SET Completion_status = 'Inactive'
                     WHERE User_id = ? AND Completion_status = 'Active'`,
                    [id]
                );

                console.log(
                    `Deactivated ${result.affectedRows} active enrolment(s) for user ${id}`
                );

                return res.status(200).json({
                    success: true,
                    message:
                        result.affectedRows > 0
                            ? `Learner deactivated. ${result.affectedRows} enrolment(s) marked inactive.`
                            : 'Learner is now inactive.'
                });
            }

            //  Profile update ----
            const safeName    = (name !== undefined && name !== '') ? name : null;
            const safeSurname = (surname !== undefined && surname !== '') ? surname : null;
            const safeEmail   = (email !== undefined && email !== '') ? email : null;
            const safePhone   = (phone !== undefined && phone !== '') ? phone : null;

            await pool.execute(
                `UPDATE user 
                 SET name = ?, 
                     surname = ?, 
                     email = ?, 
                     phone_number = ?
                 WHERE User_id = ? AND role_id = 2`,
                [safeName, safeSurname, safeEmail, safePhone, id]
            );

            return res.status(200).json({
                success: true,
                message: 'Learner updated successfully'
            });

        } catch (error) {
            console.error('Error updating learner:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update learner: ' + error.message
            });
        }
    }

    // ===== DELETE LEARNER =====
    static async deleteLearner(req, res) {
        try {
            const { id } = req.params;

            await pool.execute(
                'DELETE FROM user WHERE User_id = ? AND role_id = 2',
                [id]
            );

            res.status(200).json({
                success: true,
                message: 'Learner deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting learner:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete learner'
            });
        }
    }

    // ============================================
    // GET CERTIFICATES
    // Admin sees only certificates whose matching completion happened at their own centre.
    // Super Admin sees every certificate.
    // ============================================
    static async getCertificates(req, res) {
        try {
            console.log('Fetching certificates...');

            const adminCentreId = req.user?.centreId ?? null;
            const isSuperAdmin = req.user?.roleId === 3;
            const centreFilter = !isSuperAdmin && adminCentreId;

            const params = [];
            let query = `
                SELECT 
                    c.Certificate_id,
                    c.User_id,
                    c.Programme_id,
                    c.Date_issued,
                    c.Expire_date,
                    u.name as learner_name,
                    u.surname as learner_surname,
                    u.email as learner_email,
                    p.Programme_name
                FROM Certificate c
                LEFT JOIN user u ON c.User_id = u.User_id
                LEFT JOIN Programmes p ON c.Programme_id = p.Programme_id
            `;

            if (centreFilter) {
                query += `
                    INNER JOIN Enrolment e
                        ON e.User_id = c.User_id
                       AND e.Programme_id = c.Programme_id
                       AND e.Completion_status = 'Completed'
                `;
            }

            query += ` WHERE 1 = 1 `;

            if (centreFilter) {
                query += ` AND e.digital_center_id = ? `;
                params.push(adminCentreId);
            }

            query += ` ORDER BY c.Certificate_id DESC`;

            const [rows] = await pool.execute(query, params);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const data = rows.map((row) => {
                let status = 'Pending';

                if (row.Date_issued) {
                    const issued = new Date(row.Date_issued);
                    if (!isNaN(issued.getTime())) {
                        issued.setHours(0, 0, 0, 0);
                        status = issued <= today ? 'Issued' : 'Pending';
                    }
                }

                return {
                    ...row,
                    status
                };
            });

            console.log(
                `Found ${data.length} certificates ` +
                `(centreFilter: ${centreFilter}, centreId: ${adminCentreId})`
            );

            res.status(200).json({
                success: true,
                data
            });

        } catch (error) {
            console.error('Error fetching certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch certificates'
            });
        }
    }

// ============================================
// UPLOAD CERTIFICATE — generates PDF from the uploaded template
// and stores the generated result as a BLOB in the DB.
// ============================================
static async uploadCertificate(req, res) {
    try {
        const { user_id, programme_id, issue_date, expiry_date } = req.body;
        const file = req.file;

        console.log('Uploading certificate for user:', user_id, 'programme:', programme_id);
        console.log('Template file:', file ? file.originalname : 'No file');

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Certificate template file is required'
            });
        }

        if (!user_id || !programme_id) {
            try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
            return res.status(400).json({
                success: false,
                message: 'Learner and programme are required'
            });
        }

        // ---- Centre-scope guard ----
        const adminCentreId = req.user?.centreId ?? null;
        const isSuperAdmin = req.user?.roleId === 3;

        if (!isSuperAdmin) {
            if (!adminCentreId) {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                return res.status(403).json({
                    success: false,
                    message: 'Your account is not assigned to a centre.'
                });
            }
            const [completionCheck] = await pool.execute(
                `SELECT Enrolment_id
                 FROM Enrolment
                 WHERE User_id = ?
                   AND Programme_id = ?
                   AND digital_center_id = ?
                   AND Completion_status = 'Completed'
                 LIMIT 1`,
                [user_id, programme_id, adminCentreId]
            );

            if (completionCheck.length === 0) {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                return res.status(403).json({
                    success: false,
                    message:
                        'This learner has not completed this programme at your centre.'
                });
            }
        }

        // ---- Duplicate check ----
        const [existing] = await pool.execute(
            `SELECT Certificate_id
             FROM Certificate
             WHERE User_id = ? AND Programme_id = ?`,
            [user_id, programme_id]
        );

        if (existing.length > 0) {
            try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
            return res.status(409).json({
                success: false,
                message: 'This learner already has a certificate for this programme.'
            });
        }

        const dateIssued = issue_date ? new Date(issue_date) : new Date();
        const dateExpiry = expiry_date ? new Date(expiry_date) : null;

        // ---- Fetch learner + programme details ----
        const [detailsRows] = await pool.execute(
            `SELECT 
                u.name      AS learner_name,
                u.surname   AS learner_surname,
                u.id_number AS learner_id_number,
                p.Programme_name
             FROM user u
             LEFT JOIN Programmes p ON p.Programme_id = ?
             WHERE u.User_id = ?`,
            [programme_id, user_id]
        );

        const details = detailsRows[0] || {};
        const learnerName = `${details.learner_name || ''} ${details.learner_surname || ''}`.trim() || 'Learner';

        // ---- Insert a placeholder row first, so we get the certificate ID ----
        const [insertResult] = await pool.execute(
            `INSERT INTO Certificate
             (User_id, Programme_id, Date_issued, Expire_date)
             VALUES (?, ?, ?, ?)`,
            [user_id, programme_id, dateIssued, dateExpiry]
        );

        const certificateId = insertResult.insertId;
        console.log(`Certificate row ${certificateId} created`);

        // ---- Generate the completed PDF from the template ----
        let pdfBuffer;
        try {
            const CertificateService = require('../services/certificateService');

            pdfBuffer = await CertificateService.generateCertificate({
                learnerName,
                idNumber: details.learner_id_number || 'N/A',
                completionDate: dateIssued,
                programmeName: details.Programme_name || 'Programme',
                certificateNumber: `CERT-${certificateId}`,
                templatePath: file.path,
            });

            console.log(`Generated certificate PDF: ${pdfBuffer.length} bytes`);
        } catch (genError) {
            console.error('Error generating certificate PDF:', genError);

            // Roll back the inserted row
            try {
                await pool.execute(
                    'DELETE FROM Certificate WHERE Certificate_id = ?',
                    [certificateId]
                );
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr.message);
            }

            try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

            return res.status(500).json({
                success: false,
                message: 'Failed to generate the certificate PDF: ' + genError.message
            });
        }

        // ---- Clean up the temporary template file ----
        try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

        // ---- Save the generated PDF as a blob ----
        try {
            await pool.execute(
                `UPDATE Certificate SET file_data = ? WHERE Certificate_id = ?`,
                [pdfBuffer, certificateId]
            );
            console.log(`Saved certificate blob for cert ${certificateId} (${pdfBuffer.length} bytes)`);
        } catch (blobErr) {
            console.error('Failed to save certificate blob:', blobErr.message);

            // Roll back
            try {
                await pool.execute(
                    'DELETE FROM Certificate WHERE Certificate_id = ?',
                    [certificateId]
                );
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr.message);
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to save certificate PDF: ' + blobErr.message
            });
        }

        // ============================================
        // NOTIFY LEARNER IF THEY OPTED IN
        // ============================================
        setImmediate(async () => {
            try {
                const prefs = getPrefs(user_id);
                if (prefs.certificateIssued !== true) return;

                const [rows] = await pool.execute(
                    `SELECT name, surname, email
                     FROM user
                     WHERE User_id = ? AND role_id = 2
                     LIMIT 1`,
                    [user_id]
                );

                if (rows.length === 0 || !rows[0].email) return;

                const learner = rows[0];
                const fullName = `${learner.name || ''} ${learner.surname || ''}`.trim() || 'Learner';

                await emailService.sendCertificateIssuedNotification(
                    learner.email,
                    fullName,
                    {
                        programmeName: details.Programme_name || 'Programme',
                        certificateNumber: `CERT-${certificateId}`,
                        issueDate: dateIssued,
                    }
                );
            } catch (err) {
                console.error('Background certificate email failed:', err.message);
            }
        });

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: {
                certificate_id: certificateId,
                date_issued: dateIssued,
                file_size: pdfBuffer.length,
            }
        });

    } catch (error) {
        console.error('Error uploading certificate:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'This learner already has a certificate for this programme.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to upload certificate: ' + error.message
        });
    }
}
    // ============================================
// VIEW CERTIFICATE — streams PDF inline from the DB blob
// ============================================
static async viewCertificate(req, res) {
    try {
        const { id } = req.params;

        console.log('Viewing certificate ID:', id);

        const [rows] = await pool.execute(
            `SELECT 
                Certificate_id,
                file_data
             FROM Certificate
             WHERE Certificate_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        const cert = rows[0];

        if (!cert.file_data) {
            return res.status(404).json({
                success: false,
                message: 'Certificate file is not available in the database.'
            });
        }

        const buffer = Buffer.isBuffer(cert.file_data)
            ? cert.file_data
            : Buffer.from(cert.file_data);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="certificate-${id}.pdf"`,
            'Content-Length': buffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(buffer);

    } catch (error) {
        console.error('Error viewing certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to view certificate: ' + error.message
        });
    }
}

// ============================================
// DOWNLOAD CERTIFICATE — streams PDF as attachment from the DB blob
// ============================================
static async downloadCertificate(req, res) {
    try {
        const { id } = req.params;

        console.log('Downloading certificate ID:', id);

        const [rows] = await pool.execute(
            `SELECT 
                c.Certificate_id,
                c.file_data,
                u.name    AS learner_name,
                u.surname AS learner_surname
             FROM Certificate c
             LEFT JOIN user u ON c.User_id = u.User_id
             WHERE c.Certificate_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        const cert = rows[0];

        if (!cert.file_data) {
            return res.status(404).json({
                success: false,
                message: 'Certificate file is not available in the database.'
            });
        }

        const learnerName = `${cert.learner_name || 'Learner'} ${cert.learner_surname || ''}`.trim();
        const fileName = `Certificate_${learnerName.replace(/\s+/g, '_')}_${cert.Certificate_id}.pdf`;

        const buffer = Buffer.isBuffer(cert.file_data)
            ? cert.file_data
            : Buffer.from(cert.file_data);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': buffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(buffer);

    } catch (error) {
        console.error('Error downloading certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download certificate: ' + error.message
        });
    }
}
    // ============================================
    // UPDATE CERTIFICATE
    // ============================================
    static async updateCertificate(req, res) {
        try {
            const { id } = req.params;
            const { Programme_id, Expire_date, neverExpires } = req.body;

            console.log('Updating certificate:', id);
            console.log('New Programme_id:', Programme_id);
            console.log('New Expire_date:', Expire_date);
            console.log('Never Expires:', neverExpires);

            const updateFields = [];
            const values = [];

            if (Programme_id !== undefined && Programme_id !== '' && Programme_id !== null) {
                updateFields.push('Programme_id = ?');
                values.push(Programme_id);
            }

            updateFields.push('Expire_date = ?');
            values.push(neverExpires ? null : Expire_date);

            values.push(id);

            await pool.execute(
                `UPDATE Certificate 
                 SET ${updateFields.join(', ')}
                 WHERE Certificate_id = ?`,
                values
            );

            console.log(`Certificate ${id} updated successfully`);

            res.status(200).json({
                success: true,
                message: 'Certificate updated successfully'
            });

        } catch (error) {
            console.error('Error updating certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update certificate: ' + error.message
            });
        }
    }

    // ============================================
    // DELETE CERTIFICATE
    // ============================================
    static async deleteCertificate(req, res) {
        try {
            const { id } = req.params;

            await pool.execute(
                'DELETE FROM Certificate WHERE Certificate_id = ?',
                [id]
            );

            res.status(200).json({
                success: true,
                message: 'Certificate deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete certificate'
            });
        }
    }

    // ============================================
    // GET INTERESTED LEARNERS
    // ============================================
    static async getInterestedLearners(req, res) {
        try {
            console.log('Fetching interested learners...');

            const { programme } = req.query;

            const [tableCheck] = await pool.execute(
                "SHOW TABLES LIKE 'learner_interests'"
            );

            if (tableCheck.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'Table not found'
                });
            }

            let query = `
                SELECT
                    li.interest_id,
                    li.interest_date,
                    li.status,
                    li.notes,
                    li.contacted_date,
                    li.enrolled_date,
                    li.programme_id,
                    li.digital_center_id,
                    u.User_id        AS id,
                    u.name,
                    u.surname,
                    u.email,
                    u.phone_number,
                    u.register_at,
                    u.email_verify   AS isVerified,
                    p.Programme_name AS programme_name,
                    dc.center_name   AS digital_center_name
                FROM learner_interests li
                INNER JOIN user u ON li.user_id = u.User_id
                LEFT JOIN Programmes p ON li.programme_id = p.Programme_id
                LEFT JOIN Digital_Center dc ON li.digital_center_id = dc.digital_center_id
                WHERE li.status != 'Not Interested'
            `;

            const params = [];

            const adminCentreId = req.user?.centreId ?? null;
            const isSuperAdmin = req.user?.roleId === 3;

            if (!isSuperAdmin && adminCentreId) {
                query += ' AND li.digital_center_id = ?';
                params.push(adminCentreId);
            }

            if (programme) {
                query += ` AND p.Programme_name = ?`;
                params.push(programme);
            }

            query += ` ORDER BY li.interest_date DESC`;

            const [rows] = await pool.execute(query, params);

            res.status(200).json({
                success: true,
                data: rows,
                count: rows.length
            });

        } catch (error) {
            console.error('Error fetching interested learners:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch interested learners: ' + error.message
            });
        }
    }



    // ============================================
    // UPDATE INTERESTED LEARNER STATUS
    // ============================================
    static async updateInterestedLearnerStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            console.log(`Updating interest ${id} to status: ${status}`);

            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Interest ID and status are required'
                });
            }

            const validStatuses = ['New', 'Contacted', 'Enrolled', 'Not Interested'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be New, Contacted, Enrolled, or Not Interested'
                });
            }

            const [existing] = await pool.execute(
                'SELECT user_id, programme_id, digital_center_id FROM learner_interests WHERE interest_id = ?',
                [id]
            );
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Interest record not found'
                });
            }
            const { user_id, programme_id, digital_center_id } = existing[0];

            const adminCentreId = req.user?.centreId ?? null;
            const isSuperAdmin = req.user?.roleId === 3;

            if (!isSuperAdmin && adminCentreId && String(digital_center_id) !== String(adminCentreId)) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only manage learners in your own centre.'
                });
            }


            
            if (status === 'Enrolled') {
                const [activeEnrolments] = await pool.execute(
                    `SELECT li.interest_id,
                            li.programme_id,
                            p.Programme_name AS programme_name,
                            dc.center_name   AS centre_name
                     FROM learner_interests li
                     LEFT JOIN Programmes p ON p.Programme_id = li.programme_id
                     LEFT JOIN Digital_Center dc ON dc.digital_center_id = li.digital_center_id
                     WHERE li.user_id = ?
                       AND li.status = 'Enrolled'
                       AND li.interest_id != ?
                     LIMIT 1`,
                    [user_id, id]
                );

                if (activeEnrolments.length > 0) {
                    const active = activeEnrolments[0];
                    return res.status(409).json({
                        success: false,
                        message:
                            `This learner is already enrolled in "${active.programme_name}" ` +
                            `at ${active.centre_name}. Complete or remove that enrolment before ` +
                            `enrolling them in another programme.`
                    });
                }
            }

            
            if (status === 'Enrolled') {
                try {
                    const enrolmentCentreId = isSuperAdmin ? null : adminCentreId;

                    const [existingEnrolment] = await pool.execute(
                        `SELECT Enrolment_id FROM Enrolment
                         WHERE User_id = ? AND Programme_id = ?`,
                        [user_id, programme_id]
                    );

                    if (existingEnrolment.length === 0) {
                        await pool.execute(
                            `INSERT INTO Enrolment
                                (User_id, Programme_id, digital_center_id, Enrolment_date, Completion_status)
                             VALUES (?, ?, ?, NOW(), 'Active')`,
                            [user_id, programme_id, enrolmentCentreId]
                        );
                    } else {
                        await pool.execute(
                            `UPDATE Enrolment
                             SET Completion_status = 'Active',
                                 Enrolment_date = NOW(),
                                 digital_center_id = COALESCE(?, digital_center_id)
                             WHERE User_id = ? AND Programme_id = ?`,
                            [enrolmentCentreId, user_id, programme_id]
                        );
                    }
                } catch (enrolmentError) {
                    console.error('Error creating enrolment:', enrolmentError);
                    return res.status(500).json({
                        success: false,
                        message:
                            'Failed to add learner to enrolment table: ' +
                            enrolmentError.message
                    });
                }
            }

            const updateFields = ['status = ?'];
            const values = [status];

            if (status === 'Contacted') {
                updateFields.push('contacted_date = NOW()');
            }
            if (status === 'Enrolled') {
                updateFields.push('enrolled_date = NOW()');
            }

            values.push(id);

            await pool.execute(
                `UPDATE learner_interests
                 SET ${updateFields.join(', ')}
                 WHERE interest_id = ?`,
                values
            );

            return res.status(200).json({
                success: true,
                message:
                    status === 'Enrolled'
                        ? 'Learner enrolled successfully'
                        : `Learner status updated to ${status} successfully`
            });

        } catch (error) {
            console.error('Error updating interest status:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update learner status: ' + error.message
            });
        }
    }


     
    // MARK AN ENROLMENT AS COMPLETED
    
    static async markEnrolmentComplete(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Enrolment ID is required.'
                });
            }

            const adminCentreId = req.user?.centreId ?? null;
            const isSuperAdmin = req.user?.roleId === 3;
            const actorAdminId = req.user?.userId ?? req.user?.Admin_ID ?? null;
            const actorName = `${req.user?.name || ''} ${req.user?.surname || ''}`.trim() || 'Admin';

            // ---- Look up the enrolment ----
            const [enrolments] = await pool.execute(
                `SELECT
                    e.Enrolment_id,
                    e.User_id,
                    e.Programme_id,
                    e.digital_center_id,
                    e.Completion_status,
                    e.Completion_date,
                    u.name          AS learner_name,
                    u.surname       AS learner_surname,
                    p.Programme_name,
                    dc.center_name
                 FROM Enrolment e
                 INNER JOIN user u ON u.User_id = e.User_id
                 INNER JOIN Programmes p ON p.Programme_id = e.Programme_id
                 LEFT JOIN Digital_Center dc ON dc.digital_center_id = e.digital_center_id
                 WHERE e.Enrolment_id = ?
                 LIMIT 1`,
                [id]
            );

            if (enrolments.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Enrolment not found.'
                });
            }

            const enrolment = enrolments[0];

            
            if (!isSuperAdmin) {
                if (!adminCentreId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Your account is not assigned to a centre.'
                    });
                }

                if (String(enrolment.digital_center_id) !== String(adminCentreId)) {
                    return res.status(403).json({
                        success: false,
                        message: 'This enrolment does not belong to your centre.'
                    });
                }
            }

            
            if (enrolment.Completion_status === 'Completed') {
                return res.status(200).json({
                    success: true,
                    message: 'This enrolment is already marked as completed.',
                    data: {
                        Enrolment_id: enrolment.Enrolment_id,
                        Completion_status: 'Completed',
                        Completion_date: enrolment.Completion_date
                    }
                });
            }

            
            await pool.execute(
                `UPDATE Enrolment
                 SET Completion_status = 'Completed',
                     Completion_date = NOW()
                 WHERE Enrolment_id = ?`,
                [id]
            );

            console.log(
                `Enrolment ${id} marked Completed by admin ${actorAdminId}. ` +
                `Learner ${enrolment.User_id}, programme ${enrolment.Programme_id}, ` +
                `centre ${enrolment.digital_center_id}.`
            );

            // ---- Notify the centre's admins 
            const centreIdForNotify = enrolment.digital_center_id;
            const learnerName = `${enrolment.learner_name || ''} ${enrolment.learner_surname || ''}`.trim() || 'Learner';
            const programmeName = enrolment.Programme_name || 'Programme';
            const centreName = enrolment.center_name || 'your centre';

            if (centreIdForNotify) {
                setImmediate(async () => {
                    try {
                        const [admins] = await pool.execute(
                            `SELECT Admin_ID, Name, Surname, Email_address
                             FROM Admin
                             WHERE Centre_ID = ?
                               AND Email_address IS NOT NULL
                               AND Email_address != ''`,
                            [centreIdForNotify]
                        );

                        if (admins.length === 0) {
                            console.log(`📧 No admins at centre ${centreIdForNotify} to notify.`);
                            return;
                        }

                        
                        const opted = admins.filter(
    (a) => getAdminPrefs(a.Admin_ID).notifyOnCertificate === true
);

                        if (opted.length === 0) {
                            console.log('📧 No opted-in admins to notify about this completion.');
                            return;
                        }

                        await emailService.sendLearnerCompletedToAdmins(opted, {
                            learnerName,
                            programmeName,
                            centreName,
                            completedAt: new Date(),
                            markedByName: actorName,
                        });
                    } catch (err) {
                        console.error(' Background learner-completed email failed:', err.message);
                    }
                });
            } else {
                console.log(' Enrolment has no centre — skipping admin notification.');
            }

            return res.status(200).json({
                success: true,
                message: 'Enrolment marked as completed.',
                data: {
                    Enrolment_id: enrolment.Enrolment_id,
                    Completion_status: 'Completed',
                    Completion_date: new Date()
                }
            });

        } catch (error) {
            console.error('Error marking enrolment complete:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark enrolment as completed: ' + error.message
            });
        }
    }

    // ============================================
    // SEND BULK EMAIL
    // ============================================
    static async sendBulkEmail(req, res) {
        try {
            const { recipients, subject, message } = req.body;

            console.log('===== SEND BULK EMAIL STARTED =====');
            console.log('Recipients count:', recipients?.length || 0);

            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No recipients specified'
                });
            }

            if (!subject || !subject.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject is required'
                });
            }

            if (!message || !message.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const validRecipients = recipients.filter(r => r.email && r.email.trim());

            if (validRecipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid email addresses found'
                });
            }

            res.status(200).json({
                success: true,
                message: `Sending ${validRecipients.length} emails in the background...`,
                data: {
                    total: validRecipients.length,
                    status: 'processing'
                }
            });

            setImmediate(async () => {
                try {
                    let sentCount = 0;
                    let failedCount = 0;

                    for (const recipient of validRecipients) {
                        try {
                            const fullName = `${recipient.name || 'Learner'} ${recipient.surname || ''}`.trim() || 'Learner';

                            await emailService.sendBulkEmail(
                                recipient.email,
                                fullName,
                                subject.trim(),
                                message.trim()
                            );

                            sentCount++;
                            console.log(`Email sent to ${recipient.email}`);
                        } catch (err) {
                            failedCount++;
                            console.error(`Failed to send to ${recipient.email}:`, err.message);
                        }
                    }

                    console.log('===== BULK EMAIL COMPLETE =====');
                    console.log(`Sent: ${sentCount}`);
                    console.log(`Failed: ${failedCount}`);
                } catch (error) {
                    console.error('Error in background email processing:', error);
                }
            });

        } catch (error) {
            console.error('Error sending bulk email:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send bulk email: ' + error.message
            });
        }
    }

    

    // ============================================
    // GET ELIGIBLE LEARNERS FOR BULK CERTIFICATES
    // ============================================
    static async getEligibleLearners(req, res) {
        try {
            console.log('Fetching eligible learners from Enrolment table...');

            const { programme_id, status } = req.query;

            const adminCentreId = req.user?.centreId ?? null;
            const isSuperAdmin = req.user?.roleId === 3;
            const centreFilter = !isSuperAdmin && adminCentreId;

            let query = `
                SELECT 
                    u.User_id as id,
                    u.name,
                    u.surname,
                    u.email,
                    u.phone_number,
                    u.id_number,
                    e.Enrolment_id,
                    e.Enrolment_date,
                    e.Completion_status,
                    e.Completion_date,
                    e.digital_center_id,
                    p.Programme_id,
                    p.Programme_name,
                    dc.digital_center_id AS centre_id,
                    dc.center_name
                FROM Enrolment e
                INNER JOIN user u ON e.User_id = u.User_id
                INNER JOIN Programmes p ON e.Programme_id = p.Programme_id
                LEFT JOIN Digital_Center dc ON e.digital_center_id = dc.digital_center_id
                WHERE u.role_id = 2
                  AND e.Completion_status = 'Completed'
            `;

            const params = [];

            if (centreFilter) {
                // Only completions recorded at this admin's centre
                query += ` AND e.digital_center_id = ?`;
                params.push(adminCentreId);
            }

            if (programme_id) {
                query += ` AND e.Programme_id = ?`;
                params.push(programme_id);
            }

            query += ` ORDER BY e.Completion_date DESC, u.name ASC`;

            const [rows] = await pool.execute(query, params);

            console.log(
                `Found ${rows.length} eligible learners ` +
                `(centreFilter: ${centreFilter}, centreId: ${adminCentreId})`
            );

            res.status(200).json({
                success: true,
                data: rows,
                count: rows.length
            });

        } catch (error) {
            console.error('Error fetching eligible learners:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch eligible learners: ' + error.message
            });
        }
    }

    // ============================================
// BULK UPLOAD CERTIFICATES — generates each PDF from the
// uploaded template and stores the generated bytes as a blob.
// ============================================
static async bulkUploadCertificates(req, res) {
    const templateFile = req.file;
    const cleanupTemplate = () => {
        if (templateFile) { try { fs.unlinkSync(templateFile.path); } catch (e) { /* ignore */ } }
    };

    try {
        const adminCentreId = req.user?.centreId ?? null;
        const isSuperAdmin = req.user?.roleId === 3;
        const centreFilter = !isSuperAdmin && adminCentreId;

        let certData;
        try {
            certData = typeof req.body.certificates === 'string'
                ? JSON.parse(req.body.certificates)
                : req.body.certificates;
        } catch (parseErr) {
            cleanupTemplate();
            return res.status(400).json({
                success: false,
                message: 'Invalid certificates payload'
            });
        }

        if (!Array.isArray(certData) || certData.length === 0) {
            cleanupTemplate();
            return res.status(400).json({
                success: false,
                message: 'No certificate data provided'
            });
        }

        if (!templateFile) {
            return res.status(400).json({
                success: false,
                message: 'Certificate template PDF is required'
            });
        }

        const CertificateService = require('../services/certificateService');

        console.log(`Bulk issuing ${certData.length} certificates using template: ${templateFile.originalname}`);
        console.log(`Scope: centreFilter=${centreFilter}, centreId=${adminCentreId}`);

        const results = [];
        const errors = [];

        for (const data of certData) {
            let insertedCertificateId = null;

            try {
                const { user_id, programme_id, issue_date, expiry_date } = data;

                // ---- Reject past issue dates ----
                if (issue_date) {
                    const parsed = new Date(issue_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    parsed.setHours(0, 0, 0, 0);

                    if (parsed < today) {
                        errors.push({
                            user_id,
                            programme_id,
                            error: 'Issue date cannot be in the past.'
                        });
                        console.log(`Skipped user ${user_id}: past issue date (${issue_date})`);
                        continue;
                    }
                }

                // ---- Check completed enrolment ----
                let completionSql = `
                    SELECT Enrolment_id
                    FROM Enrolment
                    WHERE User_id = ?
                      AND Programme_id = ?
                      AND Completion_status = 'Completed'
                `;
                const completionParams = [user_id, programme_id];

                if (centreFilter) {
                    completionSql += ` AND digital_center_id = ?`;
                    completionParams.push(adminCentreId);
                }

                completionSql += ` LIMIT 1`;

                const [completedEnrolment] = await pool.execute(
                    completionSql,
                    completionParams
                );

                if (completedEnrolment.length === 0) {
                    errors.push({
                        user_id,
                        programme_id,
                        error: centreFilter
                            ? 'Learner has not completed this programme at your centre'
                            : 'Learner has not completed this programme'
                    });
                    console.log(`Skipped user ${user_id}: not completed (centre scoped: ${centreFilter})`);
                    continue;
                }

                // ---- Duplicate check ----
                const [existing] = await pool.execute(
                    `SELECT Certificate_id FROM Certificate WHERE User_id = ? AND Programme_id = ?`,
                    [user_id, programme_id]
                );
                if (existing.length > 0) {
                    errors.push({
                        user_id,
                        programme_id,
                        error: 'Certificate already exists for this learner and programme'
                    });
                    console.log(`Skipped duplicate for user ${user_id}, programme ${programme_id}`);
                    continue;
                }

                const dateIssued = issue_date ? new Date(issue_date) : new Date();
                const dateExpiry = expiry_date ? new Date(expiry_date) : null;

                // ---- Insert placeholder row to get the certificate ID ----
                const [result] = await pool.execute(
                    `INSERT INTO Certificate 
                     (User_id, Programme_id, Date_issued, Expire_date)
                     VALUES (?, ?, ?, ?)`,
                    [user_id, programme_id, dateIssued, dateExpiry]
                );

                insertedCertificateId = result.insertId;

                // ---- Fetch learner + programme details ----
                const [detailsRows] = await pool.execute(
                    `SELECT 
                        u.name      AS learner_name,
                        u.surname   AS learner_surname,
                        u.id_number AS learner_id_number,
                        p.Programme_name
                     FROM user u
                     LEFT JOIN Programmes p ON p.Programme_id = ?
                     WHERE u.User_id = ?`,
                    [programme_id, user_id]
                );

                const details = detailsRows[0] || {};
                const learnerName = `${details.learner_name || ''} ${details.learner_surname || ''}`.trim();

                // ---- Generate the completed PDF from the template ----
                const pdfBytes = await CertificateService.generateCertificate({
                    learnerName,
                    idNumber: details.learner_id_number || 'N/A',
                    completionDate: dateIssued,
                    programmeName: details.Programme_name || 'Programme',
                    certificateNumber: `CERT-${insertedCertificateId}`,
                    templatePath: templateFile.path
                });

                // ---- Save the generated PDF as a blob ----
                await pool.execute(
                    `UPDATE Certificate SET file_data = ? WHERE Certificate_id = ?`,
                    [pdfBytes, insertedCertificateId]
                );

                console.log(`Certificate ${insertedCertificateId} generated and stored (${pdfBytes.length} bytes)`);

                results.push({
                    user_id,
                    certificate_id: insertedCertificateId,
                    file_size: pdfBytes.length
                });

                // ============================================
                // NOTIFY LEARNER IF THEY OPTED IN
                // ============================================
                setImmediate(async () => {
                    try {
                        const prefs = getPrefs(user_id);
                        if (prefs.certificateIssued !== true) return;

                        const [rows] = await pool.execute(
                            `SELECT name, surname, email
                             FROM user
                             WHERE User_id = ? AND role_id = 2
                             LIMIT 1`,
                            [user_id]
                        );

                        if (rows.length === 0 || !rows[0].email) return;

                        const learner = rows[0];
                        const fullName = `${learner.name || ''} ${learner.surname || ''}`.trim() || 'Learner';

                        await emailService.sendCertificateIssuedNotification(
                            learner.email,
                            fullName,
                            {
                                programmeName: details.Programme_name || 'Programme',
                                certificateNumber: `CERT-${insertedCertificateId}`,
                                issueDate: dateIssued,
                            }
                        );
                    } catch (err) {
                        console.error('Background certificate email failed:', err.message);
                    }
                });

            } catch (err) {
                console.error(`Bulk cert failed for user ${data.user_id}:`, err.message);

                // Roll back the DB row if it was inserted
                if (insertedCertificateId) {
                    try {
                        await pool.execute(
                            'DELETE FROM Certificate WHERE Certificate_id = ?',
                            [insertedCertificateId]
                        );
                    } catch (rollbackErr) {
                        console.error('Rollback failed:', rollbackErr.message);
                    }
                }

                errors.push({
                    user_id: data.user_id,
                    programme_id: data.programme_id,
                    error: err.message
                });
            }
        }

        cleanupTemplate();

        res.status(200).json({
            success: true,
            message: `Issued ${results.length} of ${certData.length} certificates`,
            data: {
                successful: results,
                failed: errors,
                total: certData.length
            }
        });

    } catch (error) {
        console.error('Error bulk uploading certificates:', error);
        cleanupTemplate();
        res.status(500).json({
            success: false,
            message: 'Failed to bulk upload certificates: ' + error.message
        });
    }
}
    // ============================================
    // SEND WEEKLY SUMMARY NOW 
    // ============================================
    static async sendWeeklySummaryNow(req, res) {
        try {
            const adminId = req.user?.userId ?? req.user?.Admin_ID ?? null;
            const roleId = req.user?.roleId ?? null;
            const centreId = req.user?.centreId ?? null;

            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated.'
                });
            }

            const {
                getCentreSummary,
                getGlobalSummary,
            } = require('../services/weeklySummaryService');
            const emailService = require('../services/emailService');

            // Pull the admin's name + email for the email body
            const [rows] = await pool.execute(
                `SELECT Admin_ID, Name, Surname, Email_address, role_ID, Centre_ID
                 FROM Admin
                 WHERE Admin_ID = ?
                 LIMIT 1`,
                [adminId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin account not found.'
                });
            }

            const admin = rows[0];
            const isSuperAdmin = Number(admin.role_ID) === 3;

            const summary = isSuperAdmin
                ? await getGlobalSummary()
                : (admin.Centre_ID ? await getCentreSummary(admin.Centre_ID) : null);

            if (!summary) {
                return res.status(400).json({
                    success: false,
                    message: 'Your account is not assigned to a centre and is not a super admin.'
                });
            }

            const adminName =
                `${admin.Name || ''} ${admin.Surname || ''}`.trim() || 'Admin';

            
            await emailService.sendWeeklySummary(
                admin.Email_address,
                adminName,
                summary
            );

            return res.status(200).json({
                success: true,
                message: 'Weekly summary sent.',
                data: {
                    sentTo: admin.Email_address,
                    scope: summary.scope,
                    period: `${summary.periodStartStr} → ${summary.periodEndStr}`,
                }
            });
        } catch (error) {
            console.error('Error sending weekly summary now:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send weekly summary: ' + error.message
            });
        }
    }
    // ============================================
    // GET COMPLETE ANALYTICS DATA
    // ============================================
    static async getAnalytics(req, res) {
        try {
            console.log('Fetching analytics data...');

            const [totalRegistered] = await pool.execute(
                'SELECT COUNT(*) as count FROM user WHERE role_id = 2'
            );

            const [completedProgrammes] = await pool.execute(
                'SELECT COUNT(*) as count FROM Enrolment WHERE Completion_status = "Completed"'
            );

            const [inProgress] = await pool.execute(
                'SELECT COUNT(*) as count FROM Enrolment WHERE Completion_status = "In Progress" OR Completion_status = "Enrolled"'
            );

            const [inactive] = await pool.execute(
                'SELECT COUNT(*) as count FROM Enrolment WHERE Completion_status = "Inactive" OR Completion_status = "Withdrawn"'
            );

            const [genderStats] = await pool.execute(
                `SELECT 
                    g.gender_description as gender,
                    COUNT(*) as count
                FROM user u
                LEFT JOIN gender g ON u.gender_id = g.gender_id
                WHERE u.role_id = 2
                GROUP BY g.gender_description`
            );

            const [learners] = await pool.execute(
                `SELECT id_number FROM user WHERE role_id = 2 AND id_number IS NOT NULL AND id_number != ''`
            );

            const ageData = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;
            const currentDay = currentDate.getDate();

            learners.forEach(learner => {
                const idNumber = learner.id_number.toString().trim();

                if (idNumber.length >= 6) {
                    const year = parseInt(idNumber.substring(0, 2));
                    const month = parseInt(idNumber.substring(2, 4));
                    const day = parseInt(idNumber.substring(4, 6));

                    let fullYear = year;
                    if (year >= 0 && year <= 99) {
                        const currentYearShort = currentYear % 100;
                        fullYear = year <= currentYearShort ? 2000 + year : 1900 + year;
                    }

                    let age = currentYear - fullYear;

                    if (month > currentMonth || (month === currentMonth && day > currentDay)) {
                        age--;
                    }

                    if (age >= 18 && age <= 24) {
                        ageData['18-24']++;
                    } else if (age >= 25 && age <= 34) {
                        ageData['25-34']++;
                    } else if (age >= 35 && age <= 44) {
                        ageData['35-44']++;
                    } else if (age >= 45 && age <= 54) {
                        ageData['45-54']++;
                    } else if (age >= 55) {
                        ageData['55+']++;
                    }
                }
            });

            const total = totalRegistered[0]?.count || 0;
            const completed = completedProgrammes[0]?.count || 0;
            const inProg = inProgress[0]?.count || 0;
            const inact = inactive[0]?.count || 0;

            const completionRate = total > 0 ? ((completed / total) * 100) : 0;
            const activeRate = total > 0 ? (((inProg + completed) / total) * 100) : 0;

            let female = 0, male = 0, other = 0;
            genderStats.forEach(row => {
                if (row.gender === 'Female') female = row.count;
                else if (row.gender === 'Male') male = row.count;
                else other += row.count;
            });

            res.status(200).json({
                success: true,
                data: {
                    stats: {
                        totalRegistered: total,
                        completedProgrammes: completed,
                        inProgress: inProg,
                        inactive: inact,
                        completionRate: parseFloat(completionRate.toFixed(1)),
                        activeRate: parseFloat(activeRate.toFixed(1))
                    },
                    gender: {
                        female: female,
                        male: male,
                        other: other
                    },
                    age: ageData
                }
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch analytics data: ' + error.message
            });
        }
    }

    // ============================================
    // GET CENTRE STATISTICS
    // ============================================
    static async getCentreStats(req, res) {
        try {
            console.log('Fetching centre statistics...');

            const [centres] = await pool.execute(
                `SELECT
                    COALESCE(dc.center_name, 'Unassigned') AS name,
                    COUNT(li.interest_id)                  AS learner_count
                 FROM learner_interests li
                 LEFT JOIN Digital_Center dc
                        ON dc.digital_center_id = li.digital_center_id
                 WHERE li.status != 'Not Interested'
                 GROUP BY COALESCE(dc.center_name, 'Unassigned')
                 ORDER BY learner_count DESC`
            );

            const maxCount = centres.length > 0
                ? Math.max(...centres.map(r => Number(r.learner_count) || 0))
                : 1;

            const result = centres.map(centre => ({
                name: centre.name || 'Unknown Centre',
                count: Number(centre.learner_count) || 0,
                percentage: maxCount > 0
                    ? ((Number(centre.learner_count) / maxCount) * 100)
                    : 0,
            }));

            res.status(200).json({
                success: true,
                data: result,
            });

        } catch (error) {
            console.error('Error fetching centre stats:', error);
            res.status(200).json({
                success: true,
                data: [],
                message: 'No centre data available',
            });
        }
    }

    // ============================================
    // GET PROGRAMME STATISTICS
    // ============================================
    static async getProgrammeStats(req, res) {
        try {
            console.log('Fetching programme statistics...');

            const [programmes] = await pool.execute(
                `SELECT 
                    p.Programme_name as name,
                    COUNT(DISTINCT e.User_id) as enrolled,
                    SUM(CASE WHEN e.Completion_status = 'Completed' THEN 1 ELSE 0 END) as completed
                FROM Programmes p
                LEFT JOIN Enrolment e ON e.Programme_id = p.Programme_id
                GROUP BY p.Programme_id, p.Programme_name
                ORDER BY enrolled DESC`
            );

            const result = programmes.map(prog => ({
                name: prog.name || 'Unknown Programme',
                enrolled: prog.enrolled || 0,
                completed: prog.completed || 0,
                completionRate: prog.enrolled > 0 ? ((prog.completed / prog.enrolled) * 100).toFixed(1) : 0
            }));

            res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            console.error('Error fetching programme stats:', error);
            res.status(200).json({
                success: true,
                data: [],
                message: 'No programme data available'
            });
        }
    }

    // ============================================
    // GET COMPLETED PROGRAMMES FOR A SPECIFIC LEARNER
    // ============================================
    static async getLearnerCompletedProgrammes(req, res) {
    try {
        const { id } = req.params;

        console.log('Fetching completed programmes for learner:', id);

        // ---- Centre scope ----
        const adminCentreId = req.user?.centreId ?? null;
        const isSuperAdmin = req.user?.roleId === 3;
        const centreFilter = !isSuperAdmin && adminCentreId;

        const [users] = await pool.execute(
            'SELECT User_id, name, surname, email FROM user WHERE User_id = ? AND role_id = 2',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Learner not found'
            });
        }

        
        let query = `
            SELECT
                p.Programme_id,
                p.Programme_name,
                p.Programme_description,
                p.Duration,
                e.Enrolment_id,
                e.Enrolment_date,
                e.Completion_date,
                e.Completion_status,
                e.digital_center_id
             FROM Enrolment e
             INNER JOIN Programmes p ON e.Programme_id = p.Programme_id
             WHERE e.User_id = ?
               AND e.Completion_status = 'Completed'
        `;

        const params = [id];

        if (centreFilter) {
            query += ` AND e.digital_center_id = ?`;
            params.push(adminCentreId);
        }

        query += ` ORDER BY e.Completion_date DESC, e.Enrolment_date DESC`;

        const [rows] = await pool.execute(query, params);

        console.log(
            `Found ${rows.length} completed programmes for learner ${id} ` +
            `(centreFilter: ${centreFilter}, centreId: ${adminCentreId})`
        );

        return res.status(200).json({
            success: true,
            learner: {
                id: users[0].User_id,
                name: users[0].name,
                surname: users[0].surname,
                email: users[0].email
            },
            data: rows.map(r => ({
                id: r.Programme_id,
                Programme_id: r.Programme_id,
                name: r.Programme_name,
                Programme_name: r.Programme_name,
                description: r.Programme_description,
                Programme_description: r.Programme_description,
                duration: r.Duration,
                Duration: r.Duration,
                completionDate: r.Completion_date || r.Enrolment_date,
                Completion_date: r.Completion_date,
                Enrolment_date: r.Enrolment_date,
                status: r.Completion_status,
                Completion_status: r.Completion_status,
                digital_center_id: r.digital_center_id
            })),
            completedProgrammes: rows.map(r => ({
                id: r.Programme_id,
                name: r.Programme_name,
                description: r.Programme_description,
                duration: r.Duration,
                completionDate: r.Completion_date || r.Enrolment_date,
                status: r.Completion_status
            })),
            count: rows.length
        });

    } catch (error) {
        console.error('Error fetching learner completed programmes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch completed programmes: ' + error.message
        });
    }
}
    // ============================================
    // SEND WEEKLY SUMMARY NOW 
    // ============================================
    static async sendWeeklySummaryNow(req, res) {
        try {
            const adminId = req.user?.userId ?? req.user?.Admin_ID ?? null;

            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated.'
                });
            }

            const {
                getCentreSummary,
                getGlobalSummary,
            } = require('../services/weeklySummaryService');
            const emailService = require('../services/emailService');

            const [rows] = await pool.execute(
                `SELECT Admin_ID, Name, Surname, Email_address, role_ID, Centre_ID
                 FROM Admin
                 WHERE Admin_ID = ?
                 LIMIT 1`,
                [adminId]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin account not found.'
                });
            }

            const admin = rows[0];
            const isSuperAdmin = Number(admin.role_ID) === 3;

            const summary = isSuperAdmin
                ? await getGlobalSummary()
                : (admin.Centre_ID ? await getCentreSummary(admin.Centre_ID) : null);

            if (!summary) {
                return res.status(400).json({
                    success: false,
                    message: 'Your account is not assigned to a centre and is not a super admin.'
                });
            }

            const adminName =
                `${admin.Name || ''} ${admin.Surname || ''}`.trim() || 'Admin';

            await emailService.sendWeeklySummary(
                admin.Email_address,
                adminName,
                summary
            );

            return res.status(200).json({
                success: true,
                message: 'Weekly summary sent.',
                data: {
                    sentTo: admin.Email_address,
                    scope: summary.scope,
                    period: `${summary.periodStartStr} → ${summary.periodEndStr}`,
                }
            });
        } catch (error) {
            console.error('Error sending weekly summary now:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send weekly summary: ' + error.message
            });
        }
    }
}

module.exports = AdminController;