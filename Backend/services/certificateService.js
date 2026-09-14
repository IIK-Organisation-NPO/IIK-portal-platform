// backend/services/certificateService.js
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

class CertificateService {
    static async generateCertificate(data) {
        try {
            console.log(' Generating certificate for:', data.learnerName);

            // 1. Load the template PDF
            const templatePath = path.join(__dirname, '../templates/IIK Template Certificate.pdf');
            
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Certificate template not found at: ${templatePath}`);
            }

            const templateBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);

            // 2. Get the first page
            const pages = pdfDoc.getPages();
            const page = pages[0];

            // 3. Get the fonts
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // 4. Get page dimensions
            const { width, height } = page.getSize();
            console.log(' Page size:', width, 'x', height);

            // 5. Draw ONLY the dynamic data on the template

            // Draw Learner Name - on the dashed line under "This certificate is awarded to"
            const nameText = (data.learnerName || 'LEARNER').toUpperCase();
            const nameSize = 20;
            const nameWidth = fontBold.widthOfTextAtSize(nameText, nameSize);
            page.drawText(nameText, {
                x: (width - nameWidth) / 2,
                y: height - 235, // Adjust this position
                size: nameSize,
                font: fontBold,
                color: rgb(0.05, 0.05, 0.2),
            });

            // Draw ID Number - on the line under "ID Number:"
            const idText = data.idNumber || 'N/A';
            const idWidth = fontBold.widthOfTextAtSize(idText, 25);
            page.drawText(idText, {
                x: (width - idWidth) / 2 , 
                y: height - 295, 
                size: 20,
                font: fontBold,
                color: rgb(0.2, 0.2, 0.3),
            });

            // Draw Programme Name - in the empty space between ID and Completion Date
            const progText = data.programmeName || 'N/A';
            const progWidth = fontBold.widthOfTextAtSize(progText, 25);
            page.drawText(progText, {
                x: (width - progWidth) / 2,
                y: height - 350,
                size: 22,
                font: fontBold,
                color: rgb(0.15, 0.15, 0.35),
            });

            // Draw Completion Date - on the line under "Completion Date:"
            const formattedDate = data.completionDate ? 
                new Date(data.completionDate).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'N/A';
            
            const dateWidth = fontBold.widthOfTextAtSize(formattedDate, 14);
            page.drawText(formattedDate, {
                x: (width - dateWidth) / 2 , 
                y: height - 405, 
                size: 14,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.3),
            });

            // 6. Save the PDF
            const pdfBytes = await pdfDoc.save();
            
            // Debug: Save to file
            const debugPath = path.join(__dirname, '../debug-certificate.pdf');
            fs.writeFileSync(debugPath, pdfBytes);
            console.log(' Debug PDF saved to:', debugPath);
            
            console.log(' Certificate generated successfully, size:', pdfBytes.length, 'bytes');
            return pdfBytes;

        } catch (error) {
            console.error(' Error generating certificate:', error);
            throw error;
        }
    }

    static async generateAndSaveCertificate(data, outputPath) {
        try {
            const pdfBytes = await this.generateCertificate(data);
            fs.writeFileSync(outputPath, pdfBytes);
            console.log(` Certificate saved to: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error(' Error saving certificate:', error);
            throw error;
        }
    }

    static generateCertificateNumber(userId, programmeId, timestamp = Date.now()) {
        const prefix = 'IIK';
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${year}-${userId}-${programmeId}-${random}`;
    }
}

module.exports = CertificateService;