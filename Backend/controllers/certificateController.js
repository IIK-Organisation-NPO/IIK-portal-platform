// backend/controllers/certificateController.js
const { pool } = require('../config/database');
const CertificateService = require('../services/certificateService');
const fs = require('fs');
const path = require('path');

class CertificateController {
    // ============================================
    // GET ALL CERTIFICATES
    // ============================================
    static async getCertificates(req, res) {
        try {
            console.log('Fetching certificates...');

            const [rows] = await pool.execute(
                `SELECT 
                    c.Certificate_id,
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

            // Format dates as YYYY-MM-DD
            const formattedRows = rows.map(row => {
                let formattedDateIssued = null;
                if (row.Date_issued) {
                    try {
                        const date = new Date(row.Date_issued);
                        if (!isNaN(date.getTime())) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            formattedDateIssued = `${year}-${month}-${day}`;
                        }
                    } catch (e) {
                        console.error('Date formatting error for row:', row.Certificate_id, e);
                    }
                }

                let formattedExpireDate = null;
                if (row.Expire_date) {
                    try {
                        const date = new Date(row.Expire_date);
                        if (!isNaN(date.getTime())) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            formattedExpireDate = `${year}-${month}-${day}`;
                        }
                    } catch (e) {
                        console.error('Date formatting error for row:', row.Certificate_id, e);
                    }
                }

                return {
                    ...row,
                    Date_issued: formattedDateIssued,
                    Expire_date: formattedExpireDate
                };
            });

            console.log(`Found ${formattedRows.length} certificates`);

            res.status(200).json({
                success: true,
                data: formattedRows
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
    // VIEW CERTIFICATE
    // Streams the stored PDF: cert-<id>.pdf
    // ============================================
    static async viewCertificate(req, res) {
        try {
            const { id } = req.params;

            console.log('Viewing certificate ID:', id);

            // Confirm row exists
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
    // Streams the stored PDF as an attachment
    // ============================================
    static async downloadCertificate(req, res) {
        try {
            const { id } = req.params;

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
    // UPLOAD CERTIFICATE WITH FILE
    // Fills the uploaded PDF with the learner's data and
    // saves it as cert-<Certificate_id>.pdf
    // ============================================
    static async uploadCertificate(req, res) {
        try {
            const { user_id, programme_id, issue_date, expiry_date } = req.body;
            const file = req.file;

            console.log('Uploading certificate for user:', user_id);
            console.log('File:', file ? file.originalname : 'No file');
            console.log('Issue Date received:', issue_date);

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

            // ---- Date validations ----
            if (issue_date) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const parsedIssue = new Date(issue_date);
                if (isNaN(parsedIssue.getTime())) {
                    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                    return res.status(400).json({ success: false, message: 'Invalid issue date format.' });
                }
                parsedIssue.setHours(0, 0, 0, 0);
                if (parsedIssue < today) {
                    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                    return res.status(400).json({
                        success: false,
                        message: 'Issue date cannot be in the past. Please choose today or a future date.'
                    });
                }
            }

            if (expiry_date) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const parsedExpiry = new Date(expiry_date);
                if (isNaN(parsedExpiry.getTime())) {
                    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                    return res.status(400).json({ success: false, message: 'Invalid expiry date format.' });
                }
                parsedExpiry.setHours(0, 0, 0, 0);
                if (parsedExpiry < today) {
                    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                    return res.status(400).json({ success: false, message: 'Expiry date cannot be in the past.' });
                }
                if (issue_date) {
                    const parsedIssue = new Date(issue_date); parsedIssue.setHours(0, 0, 0, 0);
                    if (parsedExpiry < parsedIssue) {
                        try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                        return res.status(400).json({
                            success: false,
                            message: 'Expiry date must be on or after the issue date.'
                        });
                    }
                }
            }

            // ---- Learner must have COMPLETED the programme ----
            const [completedEnrolment] = await pool.execute(
                `SELECT Enrolment_id FROM Enrolment
                 WHERE User_id = ? AND Programme_id = ? AND Completion_status = 'Completed'
                 LIMIT 1`,
                [user_id, programme_id]
            );
            if (completedEnrolment.length === 0) {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                return res.status(400).json({
                    success: false,
                    message: 'This learner has not completed this programme, so a certificate cannot be issued.'
                });
            }

            // ---- Duplicate check ----
            const [existing] = await pool.execute(
                `SELECT Certificate_id FROM Certificate WHERE User_id = ? AND Programme_id = ?`,
                [user_id, programme_id]
            );
            if (existing.length > 0) {
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                return res.status(409).json({
                    success: false,
                    message: 'This learner already has a certificate for this programme.'
                });
            }

            // ---- Insert the row ----
            const dateIssued = issue_date ? new Date(issue_date) : new Date();
            const dateExpiry = expiry_date ? new Date(expiry_date) : null;

            const [result] = await pool.execute(
                `INSERT INTO Certificate 
                 (User_id, Programme_id, Date_issued, Expire_date)
                 VALUES (?, ?, ?, ?)`,
                [user_id, programme_id, dateIssued, dateExpiry]
            );

            const certificateId = result.insertId;

            // ---- Fill the uploaded PDF with the learner's data ----
            const uploadDir = path.join(__dirname, '..', 'uploads', 'certificates');
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

                const pdfBytes = await CertificateService.generateCertificate({
                    learnerName,
                    idNumber: details.learner_id_number || 'N/A',
                    completionDate: dateIssued,
                    programmeName: details.Programme_name || 'Programme',
                    certificateNumber: `CERT-${certificateId}`,
                    templatePath: file.path,   // use the uploaded file as the base
                });

                fs.writeFileSync(finalPath, pdfBytes);
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }

            } catch (genError) {
                console.error('Error generating certificate PDF:', genError);
                await pool.execute('DELETE FROM Certificate WHERE Certificate_id = ?', [certificateId]);
                try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to generate the certificate PDF: ' + genError.message
                });
            }

            console.log(`Certificate ${certificateId} uploaded and PDF generated successfully`);

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
    // UPDATE CERTIFICATE
    // Accepts Programme_id, Expire_date, neverExpires
    // ============================================
    static async updateCertificate(req, res) {
        try {
            const { id } = req.params;
            const { Programme_id, Expire_date, neverExpires } = req.body;

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
                `UPDATE Certificate SET ${updateFields.join(', ')} WHERE Certificate_id = ?`,
                values
            );

            res.status(200).json({
                success: true,
                message: 'Certificate updated successfully'
            });

        } catch (error) {
            console.error('Error updating certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update certificate'
            });
        }
    }

    // ============================================
    // DELETE CERTIFICATE
    // Also removes cert-<id>.pdf from disk
    // ============================================
    static async deleteCertificate(req, res) {
        try {
            const { id } = req.params;

            // Remove the PDF from disk if it exists
            const filePath = path.join(
                __dirname, '..', 'uploads', 'certificates', `cert-${id}.pdf`
            );
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error('Could not delete certificate file from disk:', fileError.message);
                // Continue — the DB row is the primary record
            }

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
    // BULK UPLOAD CERTIFICATES
    // Generates a PDF for each learner using the uploaded template.
    // Requires:
    //   - multipart form-data with field "template" (single PDF)
    //   - body.certificates = JSON string of [{ user_id, programme_id, issue_date }]
    // ============================================
    static async bulkUploadCertificates(req, res) {
        try {
            const templateFile = req.file;                    // multer .single('template')
            const rawCertificates = req.body.certificates;

            // Parse the certificates array (sent as a JSON string in multipart form-data)
            let certData;
            try {
                certData = typeof rawCertificates === 'string'
                    ? JSON.parse(rawCertificates)
                    : rawCertificates;
            } catch (parseErr) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid certificates payload'
                });
            }

            if (!Array.isArray(certData) || certData.length === 0) {
                if (templateFile) { try { fs.unlinkSync(templateFile.path); } catch (e) {} }
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

            // Make sure the directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

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
                        continue;
                    }

                    const dateIssued = issue_date ? new Date(issue_date) : new Date();
                    const dateExpiry = expiry_date ? new Date(expiry_date) : null;

                    // ---- Insert the row ----
                    const [result] = await pool.execute(
                        `INSERT INTO Certificate 
                         (User_id, Programme_id, Date_issued, Expire_date)
                         VALUES (?, ?, ?, ?)`,
                        [user_id, programme_id, dateIssued, dateExpiry]
                    );

                    insertedCertificateId = result.insertId;

                    // ---- Generate the certificate PDF ----
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

                    const pdfBytes = await CertificateService.generateCertificate({
                        learnerName,
                        idNumber: details.learner_id_number || 'N/A',
                        completionDate: dateIssued,
                        programmeName: details.Programme_name || 'Programme',
                        certificateNumber: `CERT-${insertedCertificateId}`,
                        templatePath: templateFile.path    // <-- use the uploaded template
                    });

                    const finalPath = path.join(uploadDir, `cert-${insertedCertificateId}.pdf`);
                    fs.writeFileSync(finalPath, pdfBytes);

                    results.push({
                        user_id,
                        certificate_id: insertedCertificateId,
                        pdf: `cert-${insertedCertificateId}.pdf`
                    });

                } catch (err) {
                    console.error(`Bulk cert failed for user ${data.user_id}:`, err.message);

                    // Roll back the DB row if the PDF generation failed
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

            // Clean up the temp template file
            try { fs.unlinkSync(templateFile.path); } catch (e) { /* ignore */ }

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

            // Clean up if we have the file
            if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }

            res.status(500).json({
                success: false,
                message: 'Failed to bulk upload certificates: ' + error.message
            });
        }
    }
}
module.exports = CertificateController;