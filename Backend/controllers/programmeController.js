const {
    pool,
    insertAndGetId,
    getOne,
    getMany,
    updateAndGetCount,
    deleteAndGetCount
} = require('../config/database');

const emailService = require('../services/emailService');
const { getPrefs } = require('../utils/notificationPrefs');


const mapProgrammeRow = (row) => {
    if (!row) return null;

    let formattedStartDate = 'Not set';
    if (row.Start_date) {
        const d = new Date(row.Start_date);
        if (!isNaN(d.getTime())) {
            formattedStartDate = d.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
        } else {
            formattedStartDate = String(row.Start_date);
        }
    }

    return {
        id: row.Programme_id,
        name: row.Programme_name || 'Untitled Programme',
        description: row.Programme_description || '',
        duration: row.Duration || '',
        startDate: formattedStartDate,
        startDateRaw: row.Start_date || null,
        status: row.Programme_status || 'Draft',
        enrolled: 0,
        category: 'General',
        archived: row.Programme_status === 'Archived'
    };
};


const classifyStartDate = (rawDate) => {
    if (!rawDate) return 'none';
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'none';
    d.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) return 'today';
    return d < today ? 'past' : 'future';
};

// ---------------------------------------------------------------------------
// Create Programme
// ---------------------------------------------------------------------------
const createProgramme = async (req, res) => {
    try {
        const { programmeName, description, duration, startDate, status } = req.body;

        if (!programmeName || !programmeName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Programme name is required.'
            });
        }

        // ---------- Draft flow ----------
        if (status === 'Draft') {
            const sql = `
                INSERT INTO programmes
                    (Programme_name, Programme_description, Duration, Start_date, Programme_status)
                VALUES (?, ?, ?, ?, ?)
            `;
            const insertId = await insertAndGetId(sql, [
                programmeName.trim(),
                description || null,
                duration || null,
                null,
                'Draft'
            ]);

            // Register this programme at every existing centre 
            await pool.execute(
                `INSERT IGNORE INTO Programme_Centre (Programme_id, digital_center_id, Status)
                 SELECT ?, dc.digital_center_id, 'Active'
                 FROM digital_center dc`,
                [insertId]
            );

            const saved = await getOne(
                'SELECT * FROM programmes WHERE Programme_id = ?',
                [insertId]
            );
            return res.status(201).json({
                success: true,
                message: 'Programme saved as draft successfully.',
                programme: mapProgrammeRow(saved)
            });
        }

        
        if (!startDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date is required to publish a programme.'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(startDate);
        selected.setHours(0, 0, 0, 0);

        if (isNaN(selected.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start date format.'
            });
        }

        if (selected < today) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past.'
            });
        }

        const finalStatus =
            selected.getTime() === today.getTime() ? 'Active' : 'Upcoming';

        const yyyy = selected.getFullYear();
        const mm = String(selected.getMonth() + 1).padStart(2, '0');
        const dd = String(selected.getDate()).padStart(2, '0');
        const formattedStartDate = `${yyyy}-${mm}-${dd}`;

        const sql = `
            INSERT INTO programmes
                (Programme_name, Programme_description, Duration, Start_date, Programme_status)
            VALUES (?, ?, ?, ?, ?)
        `;
        const insertId = await insertAndGetId(sql, [
            programmeName.trim(),
            description || null,
            duration || null,
            formattedStartDate,
            finalStatus
        ]);

        // Register this programme at every existing centre (Active by default)
        await pool.execute(
            `INSERT IGNORE INTO Programme_Centre (Programme_id, digital_center_id, Status)
             SELECT ?, dc.digital_center_id, 'Active'
             FROM digital_center dc`,
            [insertId]
        );

        const saved = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [insertId]
        );

        // ============================================
        // NOTIFY LEARNERS WHO OPTED IN 
        // ============================================
        setImmediate(async () => {
            try {
                if (finalStatus !== 'Active' && finalStatus !== 'Upcoming') {
                    return;
                }

                const [learners] = await pool.query(
                    `SELECT User_id, name, surname, email
                     FROM user
                     WHERE role_id = 2
                       AND email IS NOT NULL
                       AND email != ''
                       AND email_verify = 1`
                );

                const opted = learners.filter(
                    (l) => getPrefs(l.User_id).newProgramme === true
                );

                if (opted.length === 0) {
                    console.log('📧 No learners opted in to new programme notifications.');
                    return;
                }

                await emailService.sendNewProgrammeToMany(opted, {
                    name: programmeName.trim(),
                    description: description || '',
                    duration: duration || '',
                    startDate: formattedStartDate,
                });
            } catch (err) {
                console.error(' Background new-programme email job failed:', err.message);
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Programme published successfully.',
            programme: mapProgrammeRow(saved)
        });
    } catch (error) {
        console.error('Error creating programme:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating programme.'
        });
    }
};

// ===========================================
// GET programmes
// ===========================================
const getAllProgrammes = async (req, res) => {
    try {
        const rows = await getMany(
            'SELECT * FROM programmes ORDER BY Programme_id DESC'
        );
        const programmes = rows.map(mapProgrammeRow);
        return res.status(200).json({
            success: true,
            count: programmes.length,
            programmes
        });
    } catch (error) {
        console.error('Error fetching programmes:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching programmes.'
        });
    }
};


const getProgrammeById = async (req, res) => {
    try {
        const row = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [req.params.id]
        );
        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Programme not found.'
            });
        }
        return res.status(200).json({
            success: true,
            programme: mapProgrammeRow(row)
        });
    } catch (error) {
        console.error('Error fetching programme:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching programme.'
        });
    }
};

// ======================================
// Edit Programme
// ======================================
const updateProgramme = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            programmeName,
            description,
            duration,
            startDate,
            status,
            clearStartDate
        } = req.body;

        const existing = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Programme not found.'
            });
        }

        const finalName = (programmeName || existing.Programme_name || '').trim();
        const finalDescription = description ?? existing.Programme_description;
        const finalDuration = duration ?? existing.Duration;

        const currentStatus = existing.Programme_status;
        const newStatus = status || currentStatus;

        const startKind = classifyStartDate(existing.Start_date);

       
        if (
            currentStatus === 'Active' &&
            newStatus === 'Upcoming' &&
            startKind === 'today'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This programme starts today, so it cannot be moved back to Upcoming. It is already active.'
            });
        }

        if (
            currentStatus === 'Draft' &&
            newStatus !== 'Draft' &&
            newStatus !== 'Active' &&
            startKind === 'none' &&
            !startDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This programme has no start date yet. Provide a start date before activating it.'
            });
        }

        
        let finalStatus = newStatus;
        let finalStartDate = existing.Start_date;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (newStatus === 'Draft' || clearStartDate === true) {
            finalStatus = 'Draft';
            finalStartDate = null;
        } else if (newStatus === 'Active') {
            finalStatus = 'Active';
            finalStartDate = todayStr;
        } else if (startDate) {
            const selected = new Date(startDate);
            selected.setHours(0, 0, 0, 0);

            if (isNaN(selected.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid start date format.'
                });
            }
            if (selected < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date cannot be in the past.'
                });
            }

            const sYyyy = selected.getFullYear();
            const sMm = String(selected.getMonth() + 1).padStart(2, '0');
            const sDd = String(selected.getDate()).padStart(2, '0');
            finalStartDate = `${sYyyy}-${sMm}-${sDd}`;

            finalStatus =
                selected.getTime() === today.getTime() ? 'Active' : 'Upcoming';
        }

        const sql = `
            UPDATE programmes
            SET Programme_name = ?,
                Programme_description = ?,
                Duration = ?,
                Start_date = ?,
                Programme_status = ?
            WHERE Programme_id = ?
        `;
        await updateAndGetCount(sql, [
            finalName,
            finalDescription,
            finalDuration,
            finalStartDate,
            finalStatus,
            id
        ]);

        const updated = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Programme updated successfully.',
            programme: mapProgrammeRow(updated)
        });
    } catch (error) {
        console.error('Error updating programme:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating programme.'
        });
    }
};

// ===========================================
// DELETE PROGRAMME
// ===========================================
const deleteProgramme = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Programme not found.'
            });
        }

        await deleteAndGetCount(
            'DELETE FROM programmes WHERE Programme_id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Programme deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting programme:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(409).json({
                success: false,
                message: 'This programme cannot be deleted because it is still referenced by other records.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Server error while deleting programme.'
        });
    }
};

// =================================================
// ARCHIVE PROGRAMME
// =================================================
const archiveProgramme = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Programme not found.'
            });
        }

        await updateAndGetCount(
            `UPDATE programmes SET Programme_status = 'Archived' WHERE Programme_id = ?`,
            [id]
        );

        const updated = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Programme archived successfully.',
            programme: mapProgrammeRow(updated)
        });
    } catch (error) {
        console.error('Error archiving programme:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while archiving programme.'
        });
    }
};

// =====================================================
//UNARCHIVE PROGRAMME
// ====================================================
const unarchiveProgramme = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Programme not found.'
            });
        }

        let restoredStatus = 'Draft';
        if (existing.Start_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const start = new Date(existing.Start_date);
            start.setHours(0, 0, 0, 0);

            restoredStatus = start <= today ? 'Active' : 'Upcoming';
        }

       
        await updateAndGetCount(
            `UPDATE programmes SET Programme_status = ? WHERE Programme_id = ?`,
            [restoredStatus, id]
        );

        const updated = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Programme unarchived successfully.',
            programme: mapProgrammeRow(updated)
        });
    } catch (error) {
        console.error('Error unarchiving programme:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while unarchiving programme.'
        });
    }
};

//==========================================================
// GET ACTIVE PROGRAMME IN A CENTRE
// ========================================================
const getActiveProgrammeCentres = async (req, res) => {
    try {
        const { programmeId } = req.params;

        const rows = await getMany(
            `SELECT
                dc.digital_center_id AS id,
                dc.center_name       AS name,
                dc.address,
                dc.latitude,
                dc.longitude,
                dc.contact_number
             FROM Programme_Centre pc
             JOIN digital_center dc
                ON dc.digital_center_id = pc.digital_center_id
             WHERE pc.Programme_id = ?
               AND pc.Status = 'Active'
             ORDER BY dc.center_name ASC`,
            [programmeId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching active programme centres:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch centres for this programme.'
        });
    }
};

const getCentreProgrammes = async (req, res) => {
    try {
        const { centreId } = req.params;

        const rows = await getMany(
            `SELECT
                p.Programme_id          AS id,
                p.Programme_name        AS name,
                p.Programme_description AS description,
                p.Duration              AS duration,
                p.Programme_status      AS programmeStatus,
                pc.Status               AS centreStatus
             FROM Programme_Centre pc
             JOIN programmes p ON p.Programme_id = pc.Programme_id
             WHERE pc.digital_center_id = ?
             ORDER BY p.Programme_name ASC`,
            [centreId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching centre programmes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch programmes for this centre.'
        });
    }
};


const updateProgrammeCentreStatus = async (req, res) => {
    try {
        const { programmeId, centreId } = req.params;
        const { status } = req.body;

        if (!['Active', 'Archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either Active or Archived.'
            });
        }

        const affected = await updateAndGetCount(
            `UPDATE Programme_Centre
             SET Status = ?
             WHERE Programme_id = ? AND digital_center_id = ?`,
            [status, programmeId, centreId]
        );

        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'This programme is not linked to that centre.'
            });
        }

        res.json({
            success: true,
            message: status === 'Archived'
                ? 'Programme archived at this centre.'
                : 'Programme restored at this centre.'
        });
    } catch (error) {
        console.error('Error updating programme centre status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update programme centre status.'
        });
    }
};


const updateMyProgrammeCentreStatus = async (req, res) => {
    try {
        const { programmeId } = req.params;
        const { status } = req.body;

        if (!['Active', 'Archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be either Active or Archived.'
            });
        }

        const centreId = req.user?.centreId ?? null;
        const roleId   = req.user?.roleId ?? null;

        if (roleId === 3) {
            return res.status(400).json({
                success: false,
                message: 'Super Admins do not have a single centre. Use the per-centre endpoint instead.'
            });
        }

        if (!centreId) {
            return res.status(400).json({
                success: false,
                message: 'Your account is not assigned to a centre.'
            });
        }

        const affected = await updateAndGetCount(
            `UPDATE Programme_Centre
             SET Status = ?
             WHERE Programme_id = ? AND digital_center_id = ?`,
            [status, programmeId, centreId]
        );

        if (affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'This programme is not linked to your centre.'
            });
        }

        return res.status(200).json({
            success: true,
            message: status === 'Archived'
                ? 'Programme archived at your centre.'
                : 'Programme restored at your centre.'
        });
    } catch (error) {
        console.error('Error updating my programme centre status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update programme at your centre.'
        });
    }
};

module.exports = {
    createProgramme,
    getAllProgrammes,
    getProgrammeById,
    updateProgramme,
    deleteProgramme,
    archiveProgramme,
    unarchiveProgramme,
    getActiveProgrammeCentres,
    getCentreProgrammes,
    updateProgrammeCentreStatus,
    updateMyProgrammeCentreStatus,
};