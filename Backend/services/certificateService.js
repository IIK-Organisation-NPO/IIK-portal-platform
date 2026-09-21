// backend/services/certificateService.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

class CertificateService {
    /**
     * Overlays the learner's dynamic data (name, ID, programme, date)
     * onto a template PDF and returns the resulting PDF as bytes.
     *
     * If `data.templatePath` is provided, that file is used as the base.
     * Otherwise the default IIK template is used.
     */
    static async generateCertificate(data) {
        try {
            console.log('Generating certificate for:', data.learnerName);

            // 1. Resolve which template to use
            const templatePath = data.templatePath
                ? data.templatePath
                : path.join(__dirname, '../templates/IIK Template Certificate.pdf');

            if (!fs.existsSync(templatePath)) {
                throw new Error(`Certificate template not found at: ${templatePath}`);
            }

            const templateBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);

            // 2. First page
            const pages = pdfDoc.getPages();
            const page = pages[0];

            // 3. Fonts
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // 4. Page dimensions
            const { width, height } = page.getSize();
            console.log('Page size:', width, 'x', height);

            // 5. Draw the dynamic data
            // (Coordinates are absolute — tuned to the standard IIK template.)

            // Learner name
            const nameText = (data.learnerName || 'LEARNER').toUpperCase();
            const nameSize = 20;
            const nameWidth = fontBold.widthOfTextAtSize(nameText, nameSize);
            page.drawText(nameText, {
                x: (width - nameWidth) / 2,
                y: height - 235,
                size: nameSize,
                font: fontBold,
                color: rgb(0.05, 0.05, 0.2),
            });

            // ID number
            const idText = data.idNumber || 'N/A';
            const idSize = 20;
            const idWidth = fontBold.widthOfTextAtSize(idText, idSize);
            page.drawText(idText, {
                x: (width - idWidth) / 2,
                y: height - 295,
                size: idSize,
                font: fontBold,
                color: rgb(0.2, 0.2, 0.3),
            });

            // Programme name
            const progText = data.programmeName || 'N/A';
            const progSize = 22;
            const progWidth = fontBold.widthOfTextAtSize(progText, progSize);
            page.drawText(progText, {
                x: (width - progWidth) / 2,
                y: height - 350,
                size: progSize,
                font: fontBold,
                color: rgb(0.15, 0.15, 0.35),
            });

            // Completion / issue date
            const formattedDate = data.completionDate
                ? new Date(data.completionDate).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : 'N/A';

            const dateSize = 14;
            const dateWidth = fontRegular.widthOfTextAtSize(formattedDate, dateSize);
            page.drawText(formattedDate, {
                x: (width - dateWidth) / 2,
                y: height - 405,
                size: dateSize,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.3),
            });

            // 6. Save and return
            const pdfBytes = await pdfDoc.save();
            console.log('Certificate generated successfully, size:', pdfBytes.length, 'bytes');
            return pdfBytes;

        } catch (error) {
            console.error('Error generating certificate:', error);
            throw error;
        }
    }

    /**
     * Generates the certificate and writes it to disk.
     */
    static async generateAndSaveCertificate(data, outputPath) {
        try {
            const pdfBytes = await this.generateCertificate(data);
            fs.writeFileSync(outputPath, pdfBytes);
            console.log(`Certificate saved to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Error saving certificate:', error);
            throw error;
        }
    }

    /**
     * Utility to build a human-readable certificate number.
     * Not used by the current upload flow (which uses `CERT-<id>`),
     * but kept in case you want it later.
     */
    static generateCertificateNumber(userId, programmeId, timestamp = Date.now()) {
        const prefix = 'IIK';
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${year}-${userId}-${programmeId}-${random}`;
    }
}

module.exports = CertificateService;