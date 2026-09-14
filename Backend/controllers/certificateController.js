// backend/controllers/certificateController.js
const { pool } = require('../config/database');
const CertificateService = require('../services/certificateService');
const fs = require('fs');
const path = require('path');

class CertificateController {
    // ============================================
    // ✅ GET ALL CERTIFICATES
    // ============================================
    static async getCertificates(req, res) {
        try {
            console.log('📜 Fetching certificates...');

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

            //  Format dates manually in JavaScript
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

            console.log(` Found ${formattedRows.length} certificates`);

            res.status(200).json({
                success: true,
                data: formattedRows
            });

        } catch (error) {
            console.error(' Error fetching certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch certificates'
            });
        }
    }

    // ============================================
    // ✅ VIEW CERTIFICATE - Displays in Browser (NEW)
    // ============================================
    static async viewCertificate(req, res) {
        try {
            const { id } = req.params;

            console.log('👁️ Viewing certificate ID:', id);

            const [certificate] = await pool.execute(
                `SELECT 
                    c.Certificate_id,
                    c.Date_issued,
                    u.name as learner_name,
                    u.surname as learner_surname,
                    u.id_number,
                    p.Programme_name
                FROM Certificate c
                LEFT JOIN user u ON c.User_id = u.User_id
                LEFT JOIN Programmes p ON c.Programme_id = p.Programme_id
                WHERE c.Certificate_id = ?`,
                [id]
            );

            if (certificate.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            const cert = certificate[0];
            const learnerName = `${cert.learner_name} ${cert.learner_surname || ''}`.trim() || 'Learner';

            const pdfBytes = await CertificateService.generateCertificate({
                learnerName: learnerName,
                idNumber: cert.id_number || 'N/A',
                completionDate: cert.Date_issued || new Date(),
                programmeName: cert.Programme_name || 'Programme',
                certificateNumber: `CERT-${cert.Certificate_id}`
            });

            //  Display in browser instead of downloading
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
            res.setHeader('Content-Length', pdfBytes.length);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.end(pdfBytes);

        } catch (error) {
            console.error(' Error viewing certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to view certificate: ' + error.message
            });
        }
    }

    // ============================================
    // ✅ DOWNLOAD CERTIFICATE
    // ============================================
    static async downloadCertificate(req, res) {
        try {
            const { id } = req.params;

            const [certificate] = await pool.execute(
                `SELECT 
                    c.Certificate_id,
                    c.Date_issued,
                    u.name as learner_name,
                    u.surname as learner_surname,
                    u.id_number,
                    p.Programme_name
                FROM Certificate c
                LEFT JOIN user u ON c.User_id = u.User_id
                LEFT JOIN Programmes p ON c.Programme_id = p.Programme_id
                WHERE c.Certificate_id = ?`,
                [id]
            );

            if (certificate.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Certificate not found'
                });
            }

            const cert = certificate[0];
            const learnerName = `${cert.learner_name} ${cert.learner_surname || ''}`.trim() || 'Learner';

            const pdfBytes = await CertificateService.generateCertificate({
                learnerName: learnerName,
                idNumber: cert.id_number || 'N/A',
                completionDate: cert.Date_issued || new Date(),
                programmeName: cert.Programme_name || 'Programme',
                certificateNumber: `CERT-${cert.Certificate_id}`
            });

            const fileName = `Certificate_${learnerName.replace(/\s/g, '_')}.pdf`;

            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': pdfBytes.length,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(pdfBytes);

        } catch (error) {
            console.error(' Error downloading certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to download certificate: ' + error.message
            });
        }
    }

    // ============================================
    // ✅ UPLOAD CERTIFICATE WITH FILE
    // ============================================
    static async uploadCertificate(req, res) {
        try {
            const { user_id, programme_id, issue_date, expiry_date } = req.body;
            const file = req.file;

            console.log('📤 Uploading certificate for user:', user_id);
            console.log('📄 File:', file ? file.originalname : 'No file');
            console.log('📅 Issue Date received:', issue_date);

            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'Certificate file is required'
                });
            }

            // Get learner and programme details
            const [learner] = await pool.execute(
                'SELECT name, surname FROM user WHERE User_id = ?',
                [user_id]
            );

            const [programme] = await pool.execute(
                'SELECT Programme_name FROM Programmes WHERE Programme_id = ?',
                [programme_id]
            );

            //  Ensure date is properly set
            let dateIssued;
            if (issue_date) {
                dateIssued = new Date(issue_date);
            } else {
                dateIssued = new Date();
            }

            let dateExpiry = null;
            if (expiry_date) {
                dateExpiry = new Date(expiry_date);
            }

            console.log('📅 Saving Date_issued:', dateIssued);

            // Insert into database
            const [result] = await pool.execute(
                `INSERT INTO Certificate 
                 (User_id, Programme_id, Date_issued, Expire_date)
                 VALUES (?, ?, ?, ?)`,
                [
                    user_id,
                    programme_id,
                    dateIssued,
                    dateExpiry
                ]
            );

            console.log(` Certificate ${result.insertId} uploaded successfully`);

            res.status(201).json({
                success: true,
                message: 'Certificate issued successfully',
                data: {
                    certificate_id: result.insertId,
                    date_issued: dateIssued
                }
            });

        } catch (error) {
            console.error(' Error uploading certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload certificate: ' + error.message
            });
        }
    }

    // ============================================
    // ✅ UPDATE CERTIFICATE
    // ============================================
    static async updateCertificate(req, res) {
        try {
            const { id } = req.params;
            const { Expire_date } = req.body;

            await pool.execute(
                `UPDATE Certificate 
                 SET Expire_date = ?
                 WHERE Certificate_id = ?`,
                [Expire_date, id]
            );

            res.status(200).json({
                success: true,
                message: 'Certificate updated successfully'
            });

        } catch (error) {
            console.error(' Error updating certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update certificate'
            });
        }
    }

    // ============================================
    // ✅ DELETE CERTIFICATE
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
            console.error(' Error deleting certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete certificate'
            });
        }
    }

    // ============================================
    //  BULK UPLOAD CERTIFICATES
    // ============================================
    static async bulkUploadCertificates(req, res) {
        try {
            const { certificates: certData } = req.body;
            
            if (!certData || !Array.isArray(certData) || certData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No certificate data provided'
                });
            }

            const results = [];
            const errors = [];

            for (const data of certData) {
                try {
                    const { user_id, programme_id, issue_date, expiry_date } = data;
                    
                    let dateIssued = issue_date ? new Date(issue_date) : new Date();
                    let dateExpiry = expiry_date ? new Date(expiry_date) : null;

                    const [result] = await pool.execute(
                        `INSERT INTO Certificate 
                         (User_id, Programme_id, Date_issued, Expire_date)
                         VALUES (?, ?, ?, ?)`,
                        [user_id, programme_id, dateIssued, dateExpiry]
                    );

                    results.push({
                        certificate_id: result.insertId
                    });
                } catch (err) {
                    errors.push({ error: err.message, data });
                }
            }

            res.status(200).json({
                success: true,
                message: `Processed ${results.length} certificates`,
                data: {
                    successful: results,
                    failed: errors
                }
            });

        } catch (error) {
            console.error(' Error bulk uploading certificates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to bulk upload certificates'
            });
        }
    }
}

module.exports = CertificateController;