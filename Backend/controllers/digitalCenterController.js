// backend/controllers/digitalCenterController.js
const { pool } = require('../config/database');

// ============================================
// ✅ GET ALL DIGITAL CENTRES
// ============================================
exports.getAllCenters = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                digital_center_id AS id,
                center_name       AS name,
                address,
                latitude,
                longitude,
                contact_number    AS phone
             FROM Digital_Center
             ORDER BY center_name`
        );

        // Ensure coordinates are real numbers (never strings)
        const data = rows.map((r) => ({
            ...r,
            latitude:  r.latitude  !== null ? parseFloat(r.latitude)  : null,
            longitude: r.longitude !== null ? parseFloat(r.longitude) : null,
            hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
        }));

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        console.error('❌ Error fetching digital centers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch digital centers: ' + error.message,
        });
    }
};

// ============================================
// ✅ FIND NEAREST DIGITAL CENTRES
// Query: ?latitude=...&longitude=...
// ============================================
exports.getNearestCenters = async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }

        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);

        if (isNaN(userLat) || isNaN(userLon)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid latitude or longitude',
            });
        }

        const [rows] = await pool.query(
            `SELECT 
                digital_center_id AS id,
                center_name       AS name,
                address,
                latitude,
                longitude,
                contact_number    AS phone,
                (
                    6371 * ACOS(
                        LEAST(1, GREATEST(-1,
                            COS(RADIANS(?)) * COS(RADIANS(latitude)) *
                            COS(RADIANS(longitude) - RADIANS(?)) +
                            SIN(RADIANS(?)) * SIN(RADIANS(latitude))
                        ))
                    )
                ) AS distance_km
             FROM Digital_Center
             WHERE latitude IS NOT NULL AND longitude IS NOT NULL
             ORDER BY distance_km ASC`,
            [userLat, userLon, userLat]
        );

        const data = rows.map((r) => {
            const km = Number(r.distance_km);
            const distanceLabel = km < 1
                ? `${Math.round(km * 1000)} m away`
                : `${km.toFixed(1)} km away`;

            return {
                id: r.id,
                name: r.name,
                address: r.address,
                phone: r.phone,
                hours: 'Mon-Fri: 8:00 AM - 4:00 PM',
                latitude: parseFloat(r.latitude),
                longitude: parseFloat(r.longitude),
                distance_km: km,
                distance: distanceLabel,
            };
        });

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        console.error('❌ Error finding nearest centers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find nearest centers: ' + error.message,
        });
    }
};

// ============================================
// ✅ SUBMIT INTEREST IN A DIGITAL CENTRE
// Writes into learner_interests with:
//   programme_id      = <programme id if provided, else NULL>
//   digital_center_id = <the centre>
//   status            = 'New'
// ============================================
exports.submitInterest = async (req, res) => {
    try {
        const userId = req.user?.userId || req.userId;
        const { centerId, programmeId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        if (!centerId) {
            return res.status(400).json({
                success: false,
                message: 'Center ID is required',
            });
        }

        // ---- Confirm the centre exists ----
        const [centers] = await pool.query(
            'SELECT digital_center_id, center_name FROM Digital_Center WHERE digital_center_id = ?',
            [centerId]
        );

        if (centers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Digital centre not found',
            });
        }

        const centerName = centers[0].center_name;

        // ---- If a programme id was provided, confirm it exists ----
        let validProgrammeId = null;
        if (programmeId) {
            const [programmes] = await pool.query(
                'SELECT Programme_id FROM programmes WHERE Programme_id = ?',
                [programmeId]
            );
            if (programmes.length > 0) {
                validProgrammeId = programmes[0].Programme_id;
            }
        }

        // ---- Reject duplicates ----
        // A duplicate is the same (user, centre, programme) combination.
        // We treat NULL programme as its own case.
        const [existing] = await pool.query(
            `SELECT interest_id, status FROM learner_interests
             WHERE user_id = ?
               AND digital_center_id = ?
               AND ((programme_id = ?) OR (programme_id IS NULL AND ? IS NULL))`,
            [userId, centerId, validProgrammeId, validProgrammeId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: `You have already expressed interest in ${centerName}.`,
                data: {
                    centerId,
                    centreName: centerName,
                    programmeId: validProgrammeId,
                    status: existing[0].status,
                },
            });
        }

        // ---- Insert into learner_interests ----
        const [result] = await pool.query(
            `INSERT INTO learner_interests
                (user_id, programme_id, digital_center_id, interest_date, status)
             VALUES (?, ?, ?, NOW(), 'New')`,
            [userId, validProgrammeId, centerId]
        );

        console.log(
            `✅ User ${userId} submitted interest in ${centerName}` +
            (validProgrammeId ? ` for programme ${validProgrammeId}` : '')
        );

        return res.status(201).json({
            success: true,
            message: `Interest submitted for ${centerName}.`,
            data: {
                interest_id: result.insertId,
                centerId,
                centreName: centerName,
                programmeId: validProgrammeId,
                status: 'New',
            },
        });
    } catch (error) {
        console.error('❌ Error submitting interest:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit interest: ' + error.message,
        });
    }
};

// ============================================
// ✅ REMOVE INTEREST IN A DIGITAL CENTRE
// Deletes the matching row from learner_interests.
// ============================================
exports.removeInterest = async (req, res) => {
    try {
        const userId = req.user?.userId || req.userId;
        const { centerId } = req.body;

        if (!userId || !centerId) {
            return res.status(400).json({
                success: false,
                message: 'User and center are required',
            });
        }

        const [result] = await pool.query(
            `DELETE FROM learner_interests
             WHERE user_id = ? AND digital_center_id = ?`,
            [userId, centerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No interest record found for this centre',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Interest removed',
        });
    } catch (error) {
        console.error('❌ Error removing interest:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove interest: ' + error.message,
        });
    }
};

// ============================================
// ✅ GET MY CENTER INTERESTS
// Reads from learner_interests (centre rows only).
// ============================================
exports.getMyCenterInterests = async (req, res) => {
    try {
        const userId = req.user?.userId || req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        const [rows] = await pool.query(
            `SELECT
                li.interest_id,
                li.digital_center_id,
                li.programme_id,
                li.status,
                li.interest_date,
                dc.center_name,
                dc.address,
                dc.contact_number
             FROM learner_interests li
             INNER JOIN Digital_Center dc
                 ON li.digital_center_id = dc.digital_center_id
             WHERE li.user_id = ?
               AND li.digital_center_id IS NOT NULL
             ORDER BY li.interest_date DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (error) {
        console.error('❌ Error fetching center interests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interests: ' + error.message,
        });
    }
};