// backend/controllers/learnerController.js
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// ============================================
//  VALIDATE AND CLEAN PHONE NUMBER
// ============================================
const validateAndCleanPhone = (phone) => {
    if (!phone) {
        return { valid: false, message: 'Phone number is required' };
    }

    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Check +27 format
    if (cleaned.startsWith('+27')) {
        let afterCode = cleaned.substring(3);
        if (afterCode.startsWith('0')) {
            return { 
                valid: false, 
                message: 'Invalid number. Please enter exactly 9 digits after +27 (e.g., +27821234567)' 
            };
        }
        let digitsOnly = afterCode.replace(/\D/g, '');
        if (digitsOnly.length !== 9) {
            return { 
                valid: false, 
                message: `Please enter exactly 9 digits after +27. You entered ${digitsOnly.length}.` 
            };
        }
        return { valid: true, message: 'Valid phone number', cleaned: '0' + digitsOnly };
    }

    // Check 27 format (without +)
    if (cleaned.startsWith('27')) {
        let afterCode = cleaned.substring(2);
        if (afterCode.startsWith('0')) {
            return { 
                valid: false, 
                message: 'Invalid number. Please enter exactly 9 digits after 27 (e.g., 27821234567)' 
            };
        }
        let digitsOnly = afterCode.replace(/\D/g, '');
        if (digitsOnly.length !== 9) {
            return { 
                valid: false, 
                message: `Please enter exactly 9 digits after 27. You entered ${digitsOnly.length}.` 
            };
        }
        return { valid: true, message: 'Valid phone number', cleaned: '0' + digitsOnly };
    }

    // Check local format (starting with 0)
    if (cleaned.startsWith('0')) {
        let digitsOnly = cleaned.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            return { 
                valid: false, 
                message: `Phone number must be exactly 10 digits. You entered ${digitsOnly.length}.` 
            };
        }
        return { valid: true, message: 'Valid phone number', cleaned: digitsOnly };
    }

    if (cleaned.length > 0 && !cleaned.startsWith('0') && !cleaned.startsWith('27')) {
        return { 
            valid: false, 
            message: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' 
        };
    }

    return { 
        valid: false, 
        message: 'Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)' 
    };
};

// ============================================
//  GET LEARNER PROFILE (FIXED - Counts Enrolled too)
// ============================================
exports.getLearnerProfile = async (req, res) => {
    try {
        console.log('🔵 Getting learner profile for user:', req.user);
        
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                status: 'error',
                message: 'User not authenticated'
            });
        }

        const userId = req.user.userId;
        console.log('🔍 Fetching profile for userId:', userId);
        
        let addressColumn = '';
        try {
            const [columns] = await pool.query(
                "SHOW COLUMNS FROM user LIKE 'address'"
            );
            if (columns.length > 0) {
                addressColumn = 'u.address';
            } else {
                addressColumn = "'' as address";
                console.log('⚠️ address column not found, using empty string');
            }
        } catch (err) {
            console.log('⚠️ Could not check address column:', err.message);
            addressColumn = "'' as address";
        }
        
        const [users] = await pool.query(
            `SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.phone_number,
                u.id_number,
                u.gender_id,
                g.gender_description,
                u.email_verify,
                u.register_at,
                r.role_type,
                ${addressColumn}
             FROM user u
             LEFT JOIN gender g ON u.gender_id = g.gender_id
             LEFT JOIN role r ON u.role_id = r.role_id
             WHERE u.User_id = ?`,
            [userId]
        );
        
        console.log('👤 User found:', users.length > 0);
        
        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        const user = users[0];
        
        let completed = [];
        let totalCompleted = 0;
        try {
            const [completedResult] = await pool.query(
                `SELECT 
                    p.Programme_name as programme_name,
                    e.Enrolment_date as completion_date,
                    'Issued' as certificate_status
                 FROM Enrolment e
                 JOIN Programmes p ON e.Programme_id = p.Programme_id
                 WHERE e.User_id = ? AND e.Completion_status = 'Completed'
                 ORDER BY e.Enrolment_date DESC`,
                [userId]
            );
            completed = completedResult;
            totalCompleted = completedResult.length;
        } catch (err) {
            console.log('⚠️ Completed programmes query failed:', err.message);
        }
        
        //  Get current enrollment - Count BOTH 'In Progress' AND 'Enrolled'
        let enrolled = [];
        let totalEnrolled = 0;
        try {
            const [enrolledResult] = await pool.query(
                `SELECT 
                    p.Programme_name as programme_name,
                    e.Enrolment_date as enrollment_date,
                    e.Completion_status as status
                 FROM Enrolment e
                 JOIN Programmes p ON e.Programme_id = p.Programme_id
                 WHERE e.User_id = ? 
                 AND e.Completion_status IN ('In Progress', 'Enrolled')
                 ORDER BY e.Enrolment_date DESC`,
                [userId]
            );
            enrolled = enrolledResult;
            totalEnrolled = enrolledResult.length;
        } catch (err) {
            console.log(' Enrollments query failed:', err.message);
        }
        
        let certificatesCount = 0;
        try {
            const [certResult] = await pool.query(
                'SELECT COUNT(*) as count FROM Certificate WHERE User_id = ?',
                [userId]
            );
            certificatesCount = certResult[0]?.count || 0;
        } catch (err) {
            console.log(' Certificates query failed:', err.message);
        }
        
        let interestsCount = 0;
        try {
            const [interestResult] = await pool.query(
                'SELECT COUNT(*) as count FROM learner_interests WHERE user_id = ? AND status != "Not Interested"',
                [userId]
            );
            interestsCount = interestResult[0]?.count || 0;
        } catch (err) {
            console.log(' Interests count query failed:', err.message);
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                register_id: user.User_id,
                fullName: (user.name || '') + ' ' + (user.surname || ''),
                name: user.name || '',
                surname: user.surname || '',
                email: user.email || '',
                phone: user.phone_number || 'Not provided',
                phone_number: user.phone_number || 'Not provided',
                idNumber: user.id_number || 'Not provided',
                address: user.address || 'Not provided',
                gender: user.gender_description || 'Not provided',
                isVerified: user.email_verify || false,
                registeredAt: user.register_at,
                role: user.role_type || 'USER',
                completedProgrammes: completed.map(p => ({
                    name: p.programme_name,
                    completionDate: p.completion_date,
                    certificateStatus: p.certificate_status || 'Issued'
                })),
                totalCompleted: totalCompleted,
                totalEnrolled: totalEnrolled,
                totalCertificates: certificatesCount,
                totalInterests: interestsCount,
                currentEnrollment: enrolled.length > 0 ? enrolled[0].programme_name : 'None'
            }
        });
        
    } catch (error) {
        console.error(' Get learner profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching profile: ' + error.message
        });
    }
};

// ============================================
//  UPDATE LEARNER PROFILE (WITH PHONE VALIDATION)
// ============================================
exports.updateLearnerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phone, name, surname, address } = req.body;
        
        console.log(` Updating profile for user ${userId}`);
        console.log(' Update data:', { phone, name, surname, address });
        
        let validatedPhone = null;
        const errors = {};
        
        if (phone !== undefined && phone !== null) {
            const phoneValidation = validateAndCleanPhone(phone);
            if (!phoneValidation.valid) {
                errors.phone = phoneValidation.message;
                return res.status(400).json({
                    status: 'error',
                    message: 'Phone number validation failed',
                    errors: errors
                });
            }
            validatedPhone = phoneValidation.cleaned;
        }
        
        let hasAddressColumn = false;
        try {
            const [columns] = await pool.query(
                "SHOW COLUMNS FROM user LIKE 'address'"
            );
            hasAddressColumn = columns.length > 0;
        } catch (err) {
            console.log(' Could not check address column:', err.message);
        }
        
        const updates = [];
        const values = [];
        
        if (validatedPhone !== null) {
            updates.push('phone_number = ?');
            values.push(validatedPhone);
        }
        if (name !== undefined && name !== null) {
            updates.push('name = ?');
            values.push(name);
        }
        if (surname !== undefined && surname !== null) {
            updates.push('surname = ?');
            values.push(surname);
        }
        if (address !== undefined && address !== null && hasAddressColumn) {
            updates.push('address = ?');
            values.push(address);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'No fields to update'
            });
        }
        
        values.push(userId);
        
        await pool.query(
            `UPDATE user SET ${updates.join(', ')} WHERE User_id = ?`,
            values
        );
        
        const [users] = await pool.query(
            `SELECT 
                u.User_id,
                u.name,
                u.surname,
                u.email,
                u.phone_number,
                u.id_number,
                u.gender_id,
                g.gender_description,
                u.email_verify,
                u.register_at,
                ${hasAddressColumn ? 'u.address' : "'' as address"}
             FROM user u
             LEFT JOIN gender g ON u.gender_id = g.gender_id
             WHERE u.User_id = ?`,
            [userId]
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                register_id: users[0].User_id,
                fullName: (users[0].name || '') + ' ' + (users[0].surname || ''),
                name: users[0].name || '',
                surname: users[0].surname || '',
                email: users[0].email || '',
                phone: users[0].phone_number || 'Not provided',
                phone_number: users[0].phone_number || 'Not provided',
                idNumber: users[0].id_number || 'Not provided',
                address: users[0].address || 'Not provided',
                gender: users[0].gender_description,
                isVerified: users[0].email_verify,
                registeredAt: users[0].register_at
            }
        });
        
    } catch (error) {
        console.error(' Update profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating profile: ' + error.message
        });
    }
};

// ============================================
//  CHANGE PASSWORD
// ============================================
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Current password and new password are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                status: 'error',
                message: 'New password must be at least 8 characters'
            });
        }
        
        const [users] = await pool.query(
            'SELECT password_hash FROM user WHERE User_id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.query(
            'UPDATE user SET password_hash = ? WHERE User_id = ?',
            [hashedPassword, userId]
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error(' Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error changing password: ' + error.message
        });
    }
};

// ============================================
//  GET LEARNER STATS (FIXED - Counts Enrolled too)
// ============================================
exports.getLearnerStats = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        let completed = 0;
        let enrolled = 0;
        let certificates = 0;
        let inProgress = 0;
        let interests = 0;
        
        try {
            const [result] = await pool.query(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Completion_status = 'Completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN Completion_status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
                    SUM(CASE WHEN Completion_status = 'Enrolled' THEN 1 ELSE 0 END) as enrolled
                 FROM Enrolment 
                 WHERE User_id = ?`,
                [userId]
            );
            completed = result[0]?.completed || 0;
            inProgress = result[0]?.inProgress || 0;
            enrolled = result[0]?.enrolled || 0;
        } catch (err) {
            console.log(' Enrolment stats query failed:', err.message);
        }
        
        try {
            const [certResult] = await pool.query(
                'SELECT COUNT(*) as count FROM Certificate WHERE User_id = ?',
                [userId]
            );
            certificates = certResult[0]?.count || 0;
        } catch (err) {
            console.log(' Certificates count query failed:', err.message);
        }
        
        try {
            const [interestResult] = await pool.query(
                'SELECT COUNT(*) as count FROM learner_interests WHERE user_id = ? AND status != "Not Interested"',
                [userId]
            );
            interests = interestResult[0]?.count || 0;
        } catch (err) {
            console.log(' Interests count query failed:', err.message);
        }
        
        res.status(200).json({
            status: 'success',
            data: {
                totalCompleted: completed,
                totalEnrolled: enrolled,
                totalInProgress: inProgress,
                totalCertificates: certificates,
                totalInterests: interests
            }
        });
        
    } catch (error) {
        console.error(' Get learner stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching stats'
        });
    }
};

// ============================================
//  GET ALL PROGRAMMES
// ============================================
exports.getProgrammes = async (req, res) => {
    try {
        const [programmes] = await pool.query(
            `SELECT 
                Programme_id,
                Programme_name,
                Programme_description
             FROM Programmes
             ORDER BY Programme_name`
        );

        res.status(200).json({
            success: true,
            data: programmes
        });

    } catch (error) {
        console.error(' Error fetching programmes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch programmes'
        });
    }
};

// ============================================
//  RECORD LEARNER INTEREST
// ============================================
exports.recordInterest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { programmeId, programmeName } = req.body;

        console.log(` User ${userId} expressing interest`);
        console.log(' Request body:', req.body);

        let programmeIdToUse = programmeId;

        if (!programmeIdToUse && programmeName) {
            console.log(` Looking up programme by name: ${programmeName}`);
            const [programmes] = await pool.query(
                'SELECT Programme_id FROM Programmes WHERE Programme_name = ?',
                [programmeName]
            );

            if (programmes.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `Programme "${programmeName}" not found`
                });
            }
            programmeIdToUse = programmes[0].Programme_id;
            console.log(` Found programme ID: ${programmeIdToUse}`);
        }

        if (!programmeIdToUse) {
            return res.status(400).json({
                success: false,
                message: 'Programme ID or name is required'
            });
        }

        const [programmes] = await pool.query(
            'SELECT Programme_id, Programme_name FROM Programmes WHERE Programme_id = ?',
            [programmeIdToUse]
        );

        if (programmes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Programme not found'
            });
        }

        const programmeNameResult = programmes[0].Programme_name;

        const [existing] = await pool.query(
            `SELECT interest_id, status 
             FROM learner_interests 
             WHERE user_id = ? AND programme_id = ?`,
            [userId, programmeIdToUse]
        );

        if (existing.length > 0) {
            const status = existing[0].status;
            if (status === 'Not Interested') {
                await pool.query(
                    `UPDATE learner_interests 
                     SET status = 'New', interest_date = NOW(), notes = 'Re-activated interest'
                     WHERE interest_id = ?`,
                    [existing[0].interest_id]
                );
                
                return res.status(200).json({
                    success: true,
                    message: `Your interest in ${programmeNameResult} has been re-activated!`
                });
            }
            
            return res.status(409).json({
                success: false,
                message: `You have already expressed interest in ${programmeNameResult}`
            });
        }

        await pool.query(
            `INSERT INTO learner_interests (user_id, programme_id, status, interest_date)
             VALUES (?, ?, 'New', NOW())`,
            [userId, programmeIdToUse]
        );

        console.log(` User ${userId} expressed interest in ${programmeNameResult}`);

        res.status(201).json({
            success: true,
            message: `You've expressed interest in ${programmeNameResult}! Admin will contact you soon.`
        });

    } catch (error) {
        console.error(' Error recording interest:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record interest: ' + error.message
        });
    }
};

// ============================================
//  GET LEARNER'S INTERESTS
// ============================================
exports.getLearnerInterests = async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(` Fetching interests for user ${userId}`);

        const [interests] = await pool.query(
            `SELECT 
                li.interest_id,
                li.interest_date,
                li.status,
                li.notes,
                li.contacted_date,
                li.enrolled_date,
                p.Programme_id,
                p.Programme_name,
                p.Programme_description
             FROM learner_interests li
             INNER JOIN Programmes p ON li.programme_id = p.Programme_id
             WHERE li.user_id = ?
             ORDER BY li.interest_date DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: interests
        });

    } catch (error) {
        console.error(' Error fetching learner interests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interests: ' + error.message
        });
    }
};

// ============================================
// UPDATE INTEREST STATUS (For Admin use)
// ============================================
exports.updateInterestStatus = async (req, res) => {
    try {
        const { interestId } = req.params;
        const { status, notes } = req.body;

        console.log(` Updating interest ${interestId} to status: ${status}`);

        if (!interestId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Interest ID and status are required'
            });
        }

        const [existing] = await pool.query(
            'SELECT interest_id FROM learner_interests WHERE interest_id = ?',
            [interestId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Interest not found'
            });
        }

        let updates = ['status = ?'];
        const values = [status];

        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }

        if (status === 'Contacted') {
            updates.push('contacted_date = NOW()');
        }

        if (status === 'Enrolled') {
            updates.push('enrolled_date = NOW()');
        }

        values.push(interestId);

        await pool.query(
            `UPDATE learner_interests 
             SET ${updates.join(', ')}
             WHERE interest_id = ?`,
            values
        );

        res.status(200).json({
            success: true,
            message: `Interest status updated to ${status}`
        });

    } catch (error) {
        console.error(' Error updating interest status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update interest status: ' + error.message
        });
    }
};

// ============================================
//  GET COMPLETED PROGRAMMES WITH CERTIFICATES
// ============================================
exports.getCompletedProgrammes = async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(` Fetching completed programmes for user ${userId}`);

        const [completed] = await pool.query(
            `SELECT 
                p.Programme_name as programme_name,
                e.Enrolment_date as completion_date,
                'Issued' as certificate_status,
                c.Certificate_id as certificate_id,
                c.Certificate_name as certificate_name
             FROM Enrolment e
             JOIN Programmes p ON e.Programme_id = p.Programme_id
             LEFT JOIN Certificate c ON c.User_id = e.User_id AND c.Programme_id = e.Programme_id
             WHERE e.User_id = ? AND e.Completion_status = 'Completed'
             ORDER BY e.Enrolment_date DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: completed
        });

    } catch (error) {
        console.error(' Error fetching completed programmes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch completed programmes'
        });
    }
};

// ============================================
// GET CURRENT ENROLLMENTS (In Progress + Enrolled)
// ============================================
exports.getCurrentEnrollments = async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(` Fetching current enrollments for user ${userId}`);

        const [enrollments] = await pool.query(
            `SELECT 
                p.Programme_name as programme_name,
                e.Enrolment_date as enrollment_date,
                e.Completion_status as status
             FROM Enrolment e
             JOIN Programmes p ON e.Programme_id = p.Programme_id
             WHERE e.User_id = ? 
             AND e.Completion_status IN ('In Progress', 'Enrolled')
             ORDER BY e.Enrolment_date DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: enrollments
        });

    } catch (error) {
        console.error(' Error fetching current enrollments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch current enrollments'
        });
    }
};

// ============================================
//  GET CERTIFICATE BY ID
// ============================================
exports.getCertificateById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { certificateId } = req.params;

        console.log(` Fetching certificate ${certificateId} for user ${userId}`);

        const [certificates] = await pool.query(
            `SELECT 
                c.Certificate_id,
                c.Certificate_name,
                p.Programme_name as programme_name,
                u.name as learner_name,
                u.surname as learner_surname,
                c.issue_date,
                c.expiry_date,
                c.status
             FROM Certificate c
             JOIN user u ON c.User_id = u.User_id
             JOIN Programmes p ON c.Programme_id = p.Programme_id
             WHERE c.Certificate_id = ? AND c.User_id = ?`,
            [certificateId, userId]
        );

        if (certificates.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: certificates[0]
        });

    } catch (error) {
        console.error(' Error fetching certificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certificate'
        });
    }
};