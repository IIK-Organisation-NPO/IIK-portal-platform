// backend/controllers/adminController.js
const { pool } = require('../config/database');
const emailService = require('../services/emailService');
const fs = require('fs');
const path = require('path');

class AdminController {
       // ===== GET DASHBOARD STATS =====
    static async getStats(req, res) {
        try {
            console.log('Fetching admin stats...');

            const [totalUsers] = await pool.execute('SELECT COUNT(*) as count FROM user');
            const [totalLearners] = await pool.execute(
                'SELECT COUNT(*) as count FROM user WHERE role_id = 2'
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
                'SELECT COUNT(*) as count FROM user WHERE email_verify = 1'
            );

            // ---- Certificates: total + pending (future issue dates) ----
            let totalCertificates = 0;
            let pendingCertificates = 0;
            try {
                const [result] = await pool.execute(
                    'SELECT COUNT(*) as count FROM Certificate'
                );
                totalCertificates = result[0]?.count || 0;

                const [pendingResult] = await pool.execute(
                    'SELECT COUNT(*) as count FROM Certificate WHERE DATE(Date_issued) > CURDATE()'
                );
                pendingCertificates = pendingResult[0]?.count || 0;
            } catch (err) {
                console.log('Certificate table not found, using 0');
            }

            // ---- Enrolments ----
            let totalEnrollments = 0;
            let completedEnrollments = 0;
            let enrolledEnrollments = 0;
            let inProgressEnrollments = 0;
            let activeEnrolments = 0;

            try {
                const [result] = await pool.execute(
                    'SELECT COUNT(*) as count FROM Enrolment'
                );
                totalEnrollments = result[0]?.count || 0;

                const [completed] = await pool.execute(
                    'SELECT COUNT(*) as count FROM Enrolment WHERE Completion_status = "Completed"'
                );
                completedEnrollments = completed[0]?.count || 0;

                // Active enrolments — matches the actual ENUM value in the
                // Enrolment table ('Active'), not the old 'Enrolled' string.
                const [active] = await pool.execute(
                    'SELECT COUNT(*) as count FROM Enrolment WHERE Completion_status = "Active"'
                );
                activeEnrolments = active[0]?.count || 0;

                // Keep these two fields in the response for backwards compat
                // (they're derived from the same number now)
                enrolledEnrollments = activeEnrolments;
                inProgressEnrollments = 0;

            } catch (err) {
                console.log('Enrolment table not found, using 0');
            }

            let totalInterests = 0;
            try {
                const [result] = await pool.execute(
                    'SELECT COUNT(*) as count FROM learner_interests WHERE status != "Not Interested"'
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
                    totalInterests: totalInterests
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
    // Programme, enrolment date, and status fall back
    // to learner_interests when no Enrolment row exists.
    // ============================================
    static async getLearners(req, res) {
        try {
            console.log('Fetching learners...');

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
                        (SELECT GROUP_CONCAT(p.Programme_name SEPARATOR ', ')
                         FROM Enrolment e 
                         JOIN Programmes p ON e.Programme_id = p.Programme_id 
                         WHERE e.User_id = u.User_id 
                         AND e.Completion_status != 'Withdrawn'
                         ORDER BY e.Enrolment_date DESC),
                        (SELECT p2.Programme_name
                         FROM learner_interests li
                         JOIN Programmes p2 ON li.programme_id = p2.Programme_id
                         WHERE li.user_id = u.User_id
                         AND li.status != 'Not Interested'
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

                    COALESCE(
                        (SELECT 
                            CASE
                                WHEN MAX(e3.Completion_status) = 'Completed' THEN 'Completed'
                                WHEN MAX(e3.Completion_status) = 'Enrolled' THEN 'Active'
                                WHEN MAX(e3.Completion_status) = 'In Progress' THEN 'Active'
                                WHEN MAX(e3.Completion_status) = 'Withdrawn' THEN 'Inactive'
                                WHEN MAX(e3.Completion_status) = 'Inactive' THEN 'Inactive'
                                ELSE MAX(e3.Completion_status)
                            END
                         FROM Enrolment e3
                         WHERE e3.User_id = u.User_id),
                        (SELECT
                            CASE
                                WHEN MAX(li3.status) = 'Enrolled' THEN 'Active'
                                WHEN MAX(li3.status) = 'Contacted' THEN 'Inactive'
                                WHEN MAX(li3.status) = 'New' THEN 'Inactive'
                                ELSE 'Inactive'
                            END
                         FROM learner_interests li3
                         WHERE li3.user_id = u.User_id
                         AND li3.status != 'Not Interested')
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
                ORDER BY u.User_id DESC`
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
    // Two paths:
    //   1. { status: 'Inactive' } -> marks every ACTIVE enrolment for this
    //      learner as 'Inactive'. Rows are preserved, not deleted. The
    //      derived status in getLearners then shows 'Inactive'.
    //   2. Name / surname / email / phone -> profile update only.
    // ============================================
    static async updateLearner(req, res) {
        try {
            const { id } = req.params;
            const { name, surname, email, phone, status } = req.body;

            console.log('Updating learner:', { id, name, surname, email, phone, status });

            // ---- Path 1: Deactivate ----
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

            // ---- Path 2: Profile update ----
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
    // Derives the status from Date_issued at read time:
    //   - today or past  -> 'Issued'
    //   - future         -> 'Pending'
    // No DB column needed; the status is computed on every request.
    // ============================================
    static async getCertificates(req, res) {
        try {
            console.log('Fetching certificates...');

            const [rows] = await pool.execute(
                `SELECT 
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
                ORDER BY c.Certificate_id DESC`
            );

            // Normalize "today" to date-only so the comparison ignores time.
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

            console.log(`Found ${data.length} certificates`);

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
    // UPLOAD CERTIFICATE WITH FILE
    // Overlays the learner's data onto the uploaded PDF template
    // and saves it as cert-<Certificate_id>.pdf
    // A learner can only have ONE certificate per programme.
    // ============================================
    static async uploadCertificate(req, res) {
        try {
            const { user_id, programme_id, issue_date, expiry_date } = req.body;
            const file = req.file;

            console.log('Uploading certificate for user:', user_id, 'programme:', programme_id);
            console.log('File:', file ? file.originalname : 'No file');

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Certificate file is required'
                });
            }

            if (!user_id || !programme_id) {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                return res.status(400).json({
                    success: false,
                    message: 'Learner and programme are required'
                });
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
            // ---- End duplicate check ----

            const dateIssued = issue_date ? new Date(issue_date) : new Date();
            const dateExpiry = expiry_date ? new Date(expiry_date) : null;

            const [result] = await pool.execute(
                `INSERT INTO Certificate 
                 (User_id, Programme_id, Date_issued, Expire_date)
                 VALUES (?, ?, ?, ?)`,
                [user_id, programme_id, dateIssued, dateExpiry]
            );

            const certificateId = result.insertId;
            console.log(`Certificate row ${certificateId} created`);

            // ---- Overlay learner data onto the UPLOADED template ----
            const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');

            // Make sure the directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const finalPath = path.join(uploadDir, `cert-${certificateId}.pdf`);

            try {
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

                const CertificateService = require('../services/certificateService');

                const pdfBytes = await CertificateService.generateCertificate({
                    learnerName,
                    idNumber: details.learner_id_number || 'N/A',
                    completionDate: dateIssued,
                    programmeName: details.Programme_name || 'Programme',
                    certificateNumber: `CERT-${certificateId}`,
                    templatePath: file.path,   // <-- KEY: use the uploaded file as the base
                });

                fs.writeFileSync(finalPath, pdfBytes);
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

                console.log(`Certificate PDF generated at: ${finalPath}`);

            } catch (genError) {
                console.error('Error generating certificate PDF:', genError);

                // Roll back the DB row so the learner isn't stuck with a bad record
                try {
                    await pool.execute('DELETE FROM Certificate WHERE Certificate_id = ?', [certificateId]);
                } catch (rollbackErr) {
                    console.error('Rollback failed:', rollbackErr.message);
                }
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate the certificate PDF: ' + genError.message
                });
            }

            res.status(201).json({
                success: true,
                message: 'Certificate issued and uploaded successfully',
                data: {
                    certificate_id: certificateId,
                    date_issued: dateIssued
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
    // VIEW CERTIFICATE
    // Streams the stored cert-<id>.pdf (which was generated
    // from the uploaded template). Does NOT regenerate.
    // ============================================
    static async viewCertificate(req, res) {
        try {
            const { id } = req.params;

            console.log('Viewing certificate ID:', id);

            // Confirm the row exists
            const [rows] = await pool.execute(
                'SELECT Certificate_id FROM Certificate WHERE Certificate_id = ?',
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            // Stream the stored file
            const filePath = path.join(
                __dirname, '..', 'uploads', 'certificates', `cert-${id}.pdf`
            );

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate file is missing on the server.'
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

            fs.createReadStream(filePath).pipe(res);

        } catch (error) {
            console.error('Error viewing certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to view certificate: ' + error.message
            });
        }
    }

    // ============================================
    // DOWNLOAD CERTIFICATE
    // Streams the stored cert-<id>.pdf as an attachment.
    // Does NOT regenerate.
    // ============================================
    static async downloadCertificate(req, res) {
        try {
            const { id } = req.params;

            console.log('Downloading certificate ID:', id);

            const [rows] = await pool.execute(
                `SELECT c.Certificate_id, u.name as learner_name, u.surname as learner_surname
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

            const filePath = path.join(
                __dirname, '..', 'uploads', 'certificates', `cert-${id}.pdf`
            );

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate file is missing on the server.'
                });
            }

            const learnerName = `${rows[0].learner_name || 'Learner'} ${rows[0].learner_surname || ''}`.trim();
            const fileName = `Certificate_${learnerName.replace(/\s/g, '_')}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

            fs.createReadStream(filePath).pipe(res);

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
    //===========================================
    // UPDATE INTERESTED LEARNER STATUS
    // Transitions:
    //   New         -> just sets status = 'New'
    //   Contacted   -> sets status = 'Contacted' + contacted_date = NOW()
    //   Enrolled    -> sets status = 'Enrolled' + enrolled_date = NOW()
    //                  + creates/updates the Enrolment row
    //   Not Interested -> just sets the status
    //
    // Rules:
    //   - Only one ACTIVE enrolment per learner per calendar day
    //   - Enrolment.Completion_status uses only ENUM values
    //     ('Active', 'Inactive', 'Completed') — never 'Enrolled' / 'In Progress'
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

            // ---- Look up the interest record ----
            const [existing] = await pool.execute(
                'SELECT user_id, programme_id FROM learner_interests WHERE interest_id = ?',
                [id]
            );
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Interest record not found'
                });
            }
            const { user_id, programme_id } = existing[0];

            // =====================================================
            // RULE: only one ACTIVE enrolment per learner per day
            // (a completed enrolment from earlier today doesn't block
            //  a fresh one — only an enrolment still marked Active does)
            // =====================================================
            if (status === 'Enrolled') {
                const [todayEnrolments] = await pool.execute(
                    `SELECT Enrolment_id FROM Enrolment
                     WHERE User_id = ?
                       AND DATE(Enrolment_date) = CURDATE()
                       AND Completion_status = 'Active'`,
                    [user_id]
                );
                if (todayEnrolments.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message:
                            'This learner already has an active enrolment today. Only one enrolment per day is allowed.'
                    });
                }
            }

            // =====================================================
            // Enrolment side-effect — only when status = 'Enrolled'
            // =====================================================
            if (status === 'Enrolled') {
                try {
                    const [existingEnrolment] = await pool.execute(
                        `SELECT Enrolment_id FROM Enrolment
                         WHERE User_id = ? AND Programme_id = ?`,
                        [user_id, programme_id]
                    );

                    if (existingEnrolment.length === 0) {
                        // Completion_status must be one of the ENUM values:
                        //   'Active', 'Inactive', 'Completed'
                        await pool.execute(
                            `INSERT INTO Enrolment
                                (User_id, Programme_id, Enrolment_date, Completion_status)
                             VALUES (?, ?, NOW(), 'Active')`,
                            [user_id, programme_id]
                        );
                    } else {
                        // Re-activate an existing row for this learner/programme
                        await pool.execute(
                            `UPDATE Enrolment
                             SET Completion_status = 'Active',
                                 Enrolment_date = NOW()
                             WHERE User_id = ? AND Programme_id = ?`,
                            [user_id, programme_id]
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

            // =====================================================
            // Update the interest record (status + matching timestamp)
            // =====================================================
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
                    p.Programme_id,
                    p.Programme_name,
                    dc.digital_center_id,
                    dc.center_name
                FROM Enrolment e
                INNER JOIN user u ON e.User_id = u.User_id
                INNER JOIN Programmes p ON e.Programme_id = p.Programme_id
                LEFT JOIN Digital_Center dc ON e.digital_center_id = dc.digital_center_id
                WHERE u.role_id = 2
            `;

            const params = [];

            if (programme_id) {
                query += ` AND e.Programme_id = ?`;
                params.push(programme_id);
            }

            if (status && status !== 'All') {
                query += ` AND e.Completion_status = ?`;
                params.push(status);
            }

            query += ` ORDER BY e.Completion_date DESC, u.name ASC`;

            const [rows] = await pool.execute(query, params);

            console.log(`Found ${rows.length} eligible learners`);

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
    // BULK UPLOAD CERTIFICATES
    // Overlays one uploaded template PDF onto every selected learner's data.
    // Expects multipart form-data:
    //   - file field "template" (single PDF)
    //   - body field "certificates" (JSON string of [{ user_id, programme_id, issue_date, expiry_date }])
    // ============================================
    static async bulkUploadCertificates(req, res) {
        const templateFile = req.file;
        const cleanupTemplate = () => {
            if (templateFile) { try { fs.unlinkSync(templateFile.path); } catch (e) {} }
        };

        try {
            // ---- Parse the certificates array (multipart sends it as a string) ----
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
            const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            console.log(`Bulk issuing ${certData.length} certificates using template: ${templateFile.originalname}`);

            const results = [];
            const errors = [];

            for (const data of certData) {
                let insertedCertificateId = null;

                try {
                    const { user_id, programme_id, issue_date, expiry_date } = data;

                    // ---- Learner must have completed the programme ----
                    const [completedEnrolment] = await pool.execute(
                        `SELECT Enrolment_id FROM Enrolment
                         WHERE User_id = ? AND Programme_id = ? AND Completion_status = 'Completed'
                         LIMIT 1`,
                        [user_id, programme_id]
                    );
                    if (completedEnrolment.length === 0) {
                        errors.push({
                            user_id,
                            programme_id,
                            error: 'Learner has not completed this programme'
                        });
                        console.log(`Skipped user ${user_id}: not completed`);
                        continue;
                    }

                    // ---- No duplicate ----
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

                    // ---- Insert the certificate row ----
                    const [result] = await pool.execute(
                        `INSERT INTO Certificate 
                         (User_id, Programme_id, Date_issued, Expire_date)
                         VALUES (?, ?, ?, ?)`,
                        [user_id, programme_id, dateIssued, dateExpiry]
                    );

                    insertedCertificateId = result.insertId;

                    // ---- Load learner details for the overlay ----
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

                    // ---- Overlay the learner's data onto the uploaded template ----
                    const pdfBytes = await CertificateService.generateCertificate({
                        learnerName,
                        idNumber: details.learner_id_number || 'N/A',
                        completionDate: dateIssued,
                        programmeName: details.Programme_name || 'Programme',
                        certificateNumber: `CERT-${insertedCertificateId}`,
                        templatePath: templateFile.path
                    });

                    const finalPath = path.join(uploadDir, `cert-${insertedCertificateId}.pdf`);
                    fs.writeFileSync(finalPath, pdfBytes);

                    results.push({
                        user_id,
                        certificate_id: insertedCertificateId,
                        pdf: `cert-${insertedCertificateId}.pdf`
                    });

                    console.log(`Certificate ${insertedCertificateId} issued for user ${user_id}`);

                } catch (err) {
                    console.error(`Bulk cert failed for user ${data.user_id}:`, err.message);

                    // Roll back the DB row if PDF generation failed
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
    // Used by Admin_Certificates.jsx to populate the
    // programme dropdown when issuing a certificate.
    // ============================================
    static async getLearnerCompletedProgrammes(req, res) {
        try {
            const { id } = req.params;

            console.log('Fetching completed programmes for learner:', id);

            // 1. Verify the learner exists and is a learner (role_id = 2)
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

            // 2. Get completed enrolments
            const [rows] = await pool.execute(
                `SELECT
                    p.Programme_id,
                    p.Programme_name,
                    p.Programme_description,
                    p.Duration,
                    e.Enrolment_id,
                    e.Enrolment_date,
                    e.Completion_date,
                    e.Completion_status
                 FROM Enrolment e
                 INNER JOIN Programmes p ON e.Programme_id = p.Programme_id
                 WHERE e.User_id = ?
                   AND e.Completion_status = 'Completed'
                 ORDER BY e.Completion_date DESC, e.Enrolment_date DESC`,
                [id]
            );

            console.log(`Found ${rows.length} completed programmes for learner ${id}`);

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
                    Completion_status: r.Completion_status
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
}


module.exports = AdminController;