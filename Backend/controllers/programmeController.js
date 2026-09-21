const {
    insertAndGetId,
    getOne,
    getMany,
    updateAndGetCount,
    deleteAndGetCount
} = require('../config/database');

// ---------------------------------------------------------------------------
// Map a DB row to the shape the frontend expects
// ---------------------------------------------------------------------------
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
        startDate: formattedStartDate,        // pretty, for display
        startDateRaw: row.Start_date || null, // raw ISO / Date, for logic
        status: row.Programme_status || 'Draft',
        enrolled: 0,
        category: 'General',
        archived: row.Programme_status === 'Archived'
    };
};

// ---------------------------------------------------------------------------
// Classify a start date relative to today.
// Returns 'none' | 'today' | 'past' | 'future'
// ---------------------------------------------------------------------------
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
// POST /api/programmes
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

        // ---------- Publish flow ----------
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
        const saved = await getOne(
            'SELECT * FROM programmes WHERE Programme_id = ?',
            [insertId]
        );

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

// ---------------------------------------------------------------------------
// GET /api/programmes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /api/programmes/:id
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// PUT /api/programmes/:id
//
// Enforces transition rules:
//   - Active -> Upcoming blocked when start date is today
//   - Upcoming -> Active blocked when start date is future
//   - Draft -> Active/Upcoming blocked when no start date exists
//   - -> Draft always allowed and clears Start_date to NULL
// ---------------------------------------------------------------------------
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

        // Classify the current start date
        const startKind = classifyStartDate(existing.Start_date);

        // ----- Rule 1: Active -> Upcoming blocked when start is today -----
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

        // ----- Rule 2: Upcoming -> Active blocked when start is future -----
        if (
            currentStatus === 'Upcoming' &&
            newStatus === 'Active' &&
            startKind === 'future'
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This programme is scheduled to start in the future, so it cannot be set to Active yet.'
            });
        }

        // ----- Rule 3: Draft -> Active/Upcoming blocked when no start date -----
        if (
            currentStatus === 'Draft' &&
            newStatus !== 'Draft' &&
            startKind === 'none' &&
            !startDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'This programme has no start date yet. Provide a start date before activating it.'
            });
        }

        // ----- Determine final status + start date -----
        let finalStatus = newStatus;
        let finalStartDate = existing.Start_date;

        // Switching to Draft clears the start date
        if (newStatus === 'Draft' || clearStartDate === true) {
            finalStatus = 'Draft';
            finalStartDate = null;
        } else if (startDate) {
            // A new start date is being provided — validate and re-derive status
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

            const yyyy = selected.getFullYear();
            const mm = String(selected.getMonth() + 1).padStart(2, '0');
            const dd = String(selected.getDate()).padStart(2, '0');
            finalStartDate = `${yyyy}-${mm}-${dd}`;

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

// ---------------------------------------------------------------------------
// DELETE /api/programmes/:id
// The Certificate FK is ON DELETE SET NULL, so certificates are preserved
// with Programme_id = NULL when their programme is deleted.
// ---------------------------------------------------------------------------
const deleteProgramme = async (req, res) => {
    try {
        const { id } = req.params;

        // Make sure the programme exists
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

        // Delete — the FK SET NULL handles certificates automatically
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

        // Friendly safety net if some other FK still blocks the delete
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

// ---------------------------------------------------------------------------
// PATCH /api/programmes/:id/archive
// Flips Programme_status to 'Archived'. Leaves Start_date untouched.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// PATCH /api/programmes/:id/unarchive
// Restores the status based on the stored Start_date:
//   - No start date           -> 'Draft'
//   - Start date <= today     -> 'Active'
//   - Start date > today      -> 'Upcoming'
// ---------------------------------------------------------------------------
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

module.exports = {
    createProgramme,
    getAllProgrammes,
    getProgrammeById,
    updateProgramme,
    deleteProgramme,
    archiveProgramme,
    unarchiveProgramme
};