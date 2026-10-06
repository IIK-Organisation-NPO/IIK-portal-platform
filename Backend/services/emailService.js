// backend/services/emailService.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { isEmptyWeek } = require('../services/weeklySummaryService');

dotenv.config();

// ============================================================
// SHARED EMAIL THEME
// ============================================================
const EMAIL_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif;
        background: #0a0a0a;
        padding: 0;
        margin: 0;
        -webkit-font-smoothing: antialiased;
    }
    .wrapper {
        width: 100%;
        background: #0a0a0a;
        padding: 24px 12px;
    }
    .container {
        max-width: 600px;
        margin: 0 auto;
        background: #141414;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid #1f1f1f;
    }
    .header {
        background: #000000;
        padding: 40px 30px;
        text-align: center;
        border-bottom: 1px solid #1f1f1f;
    }
    .header h1 {
        color: #ffffff;
        font-size: 26px;
        margin: 0;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .header p {
        color: #8a8a8a;
        font-size: 14px;
        margin: 8px 0 0;
    }
    .content {
        padding: 36px 32px 32px;
    }
    .greeting {
        font-size: 17px;
        color: #e5e5e5;
        margin-bottom: 16px;
        line-height: 1.5;
    }
    .greeting strong {
        color: #d4af37;
        font-weight: 600;
    }
    .message {
        color: #b3b3b3;
        line-height: 1.7;
        font-size: 15px;
        margin-bottom: 24px;
    }
    .code-box {
        background: #0a0a0a;
        border: 2px dashed #d4af37;
        border-radius: 12px;
        padding: 28px 20px;
        text-align: center;
        margin: 24px 0;
    }
    .code-box .label {
        font-size: 12px;
        color: #8a8a8a;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 14px;
        display: block;
    }
    .code-box .code {
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 10px;
        color: #d4af37;
        font-family: 'Courier New', monospace;
        background: #000000;
        padding: 14px 20px;
        border-radius: 10px;
        display: inline-block;
        word-break: break-all;
    }
    .code-box .expiry {
        margin-top: 14px;
        color: #8a8a8a;
        font-size: 13px;
    }
    .code-box .expiry strong {
        color: #d4af37;
    }
    .alert {
        background: #1c1c1c;
        border-left: 4px solid #d4af37;
        padding: 14px 18px;
        border-radius: 6px;
        margin: 20px 0;
        font-size: 14px;
        color: #cccccc;
        line-height: 1.6;
    }
    .alert strong {
        color: #d4af37;
    }
    .details {
        background: #0a0a0a;
        border: 1px solid #1f1f1f;
        border-radius: 10px;
        padding: 18px 20px;
        margin: 20px 0;
    }
    .details .row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #1f1f1f;
        font-size: 14px;
    }
    .details .row:last-child {
        border-bottom: none;
    }
    .details .row .k {
        color: #8a8a8a;
        flex-shrink: 0;
    }
    .details .row .v {
        color: #e5e5e5;
        text-align: right;
        word-break: break-word;
    }
    .btn-wrap {
        text-align: center;
        margin: 28px 0 12px;
    }
    .btn {
        display: inline-block;
        padding: 14px 34px;
        background: #d4af37;
        color: #000000 !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 700;
        font-size: 15px;
        letter-spacing: 0.3px;
    }
    .footer {
        text-align: center;
        padding: 24px 30px;
        border-top: 1px solid #1f1f1f;
        background: #0a0a0a;
    }
    .footer p {
        color: #6e6e6e;
        font-size: 12px;
        margin: 4px 0;
        line-height: 1.5;
    }
    .footer .brand {
        color: #d4af37;
        font-weight: 600;
        font-size: 13px;
    }

    @media only screen and (max-width: 480px) {
        .wrapper { padding: 12px 8px; }
        .container { border-radius: 10px; }
        .header { padding: 30px 20px; }
        .header h1 { font-size: 20px; }
        .header p { font-size: 13px; }
        .content { padding: 26px 20px 22px; }
        .greeting { font-size: 15px; }
        .message { font-size: 14px; }
        .code-box { padding: 22px 14px; }
        .code-box .code {
            font-size: 30px;
            letter-spacing: 6px;
            padding: 12px 14px;
        }
        .details { padding: 14px 16px; }
        .details .row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
        .details .row .v {
            text-align: left;
        }
        .btn { padding: 13px 26px; font-size: 14px; }
        .footer { padding: 18px 20px; }
    }
`;

class EmailService {
    constructor() {
        console.log('Initializing email service...');

        this.fromAddress = process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`;
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email credentials not set in .env');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT, 10) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        this.verifyConnection();
    }

    async verifyConnection() {
        if (!this.transporter) return false;
        try {
            await this.transporter.verify();
            console.log('Email service configured successfully!');
            console.log(`Sending emails from: ${process.env.EMAIL_USER}`);
            return true;
        } catch (error) {
            console.error('Email configuration error:', error.message);
            return false;
        }
    }

    async sendMail(mailOptions) {
        if (!this.transporter) {
            throw new Error('Email transporter is not configured. Check EMAIL_USER and EMAIL_PASS environment variables.');
        }
        return this.transporter.sendMail(mailOptions);
    }

    // ============================================
    // SEND OTP EMAIL FOR SIGNUP
    // ============================================
    async sendOTPEmail(email, fullName, otpCode) {
        console.log(`Sending OTP email to: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your Verification Code</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>IIK Learner Portal</h1>
                                <p>Certificate Management System</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    Welcome to IIK Learner Certificate Portal. To complete your registration,
                                    please verify your email address using the OTP code below.
                                </p>

                                <div class="code-box">
                                    <span class="label">Your Verification Code</span>
                                    <div class="code">${otpCode}</div>
                                    <div class="expiry">This code expires in <strong>10 minutes</strong></div>
                                </div>

                                <div class="alert">
                                    <strong>Important:</strong> Never share this OTP with anyone. This code is for your verification only.
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    If you did not create this account, please ignore this email.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: 'Your OTP Code - IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour OTP verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, please ignore this email.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('OTP email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send OTP email:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND PASSWORD RESET OTP EMAIL
    // ============================================
    async sendPasswordResetOTPEmail(email, fullName, otpCode) {
        console.log(`Sending password reset OTP to: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Password Reset</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    We received a request to reset your password. Use the OTP code below
                                    to verify your identity.
                                </p>

                                <div class="code-box">
                                    <span class="label">Your Verification Code</span>
                                    <div class="code">${otpCode}</div>
                                    <div class="expiry">This code expires in <strong>15 minutes</strong></div>
                                </div>

                                <div class="alert">
                                    <strong>Important:</strong> Never share this OTP with anyone.
                                    If you did not request this, please ignore this email.
                                </div>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: 'Password Reset OTP - IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour password reset OTP code is: ${otpCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Password reset OTP email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send password reset OTP:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND WELCOME EMAIL
    // ============================================
    async sendWelcomeEmail(email, fullName) {
        console.log(`Sending welcome email to: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to IIK Portal</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Welcome to IIK Portal</h1>
                                <p>Your Learning Journey Begins Now</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    We're excited to have you on board. Your account has been successfully
                                    created and verified.
                                </p>

                                <div class="details">
                                    <div class="row">
                                        <span class="k">Access learning materials</span>
                                        <span class="v">Yes</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Track your progress</span>
                                        <span class="v">Yes</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Update your profile</span>
                                        <span class="v">Yes</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Real-time notifications</span>
                                        <span class="v">Yes</span>
                                    </div>
                                </div>

                                <div class="btn-wrap">
                                    <a href="${this.frontendUrl}/dashboard" class="btn">Go to Dashboard</a>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    If you have any questions, feel free to contact our support team.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: 'Welcome to IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nWelcome to IIK Learner Portal! Your account has been successfully created and verified.\n\nYou can now:\n- Access your learning materials and certificates\n- Track your progress\n- Update your profile\n\nVisit: ${this.frontendUrl}/dashboard\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Welcome email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send welcome email:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND LOCK NOTIFICATION EMAIL
    // ============================================
    async sendLockNotificationEmail(email, fullName, attempts, lockDuration, ipAddress, userAgent, lockoutCount, lockoutDescription) {
        console.log(`Sending lock notification to: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Locked</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Account Locked</h1>
                                <p>Security Alert</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    Your account has been temporarily locked due to
                                    <strong style="color: #d4af37;">${attempts} failed login attempts</strong>.
                                    This is your ${lockoutDescription}.
                                </p>

                                <div class="details">
                                    <div class="row">
                                        <span class="k">Email</span>
                                        <span class="v">${email}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">IP Address</span>
                                        <span class="v">${ipAddress || 'Unknown'}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Device</span>
                                        <span class="v">${userAgent || 'Unknown'}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Lock Duration</span>
                                        <span class="v">${lockDuration} minute${lockDuration > 1 ? 's' : ''}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Failed Attempts</span>
                                        <span class="v">${attempts}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Lockout Count</span>
                                        <span class="v">${lockoutCount}</span>
                                    </div>
                                </div>

                                <div class="alert">
                                    <strong>What to do next:</strong><br>
                                    &bull; Wait ${lockDuration} minute${lockDuration > 1 ? 's' : ''} and try again<br>
                                    &bull; If you forgot your password, use the "Forgot Password" link<br>
                                    &bull; If this was not you, contact support immediately
                                </div>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated security alert, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: `Account Locked - IIK Learner Portal (${lockoutDescription})`,
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour IIK Learner Portal account has been temporarily locked due to ${attempts} failed login attempts.\n\nLockout: ${lockoutDescription}\nLock Duration: ${lockDuration} minutes\nIP Address: ${ipAddress || 'Unknown'}\n\nPlease wait ${lockDuration} minutes and try again.\n\nIf this wasn't you, please contact support immediately.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Lock notification email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send lock notification email:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND BULK EMAIL FOR ADMIN
    // ============================================
    async sendBulkEmail(email, fullName, subject, message) {
        console.log(`Sending bulk email to: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>IIK Learner Portal</h1>
                                <p>Learner Certificate Management</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Dear <strong>${fullName}</strong>,</p>
                                <p class="message" style="white-space: pre-wrap;">${message}</p>
                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 24px;">
                                    Best regards,<br>
                                    <strong style="color: #d4af37;">IIK Learner Certificate Portal Team</strong>
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: subject,
                html: htmlContent,
                text: `Dear ${fullName},\n\n${message}\n\nBest regards,\nIIK Learner Certificate Portal Team`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Bulk email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send bulk email:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND NEW PROGRAMME NOTIFICATION TO A LEARNER
    // ============================================
    async sendNewProgrammeNotification(email, fullName, programme) {
        console.log(`Sending new programme notification to: ${email}`);

        const {
            name = 'New Programme',
            description = '',
            duration = '',
            startDate = null,
        } = programme || {};

        const formattedStart = startDate
            ? new Date(startDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            })
            : 'To be announced';

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Programme Available</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>New Programme Available</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    A new programme has just been published on the IIK Learner Portal,
                                    and we thought you would want to know. If it's a fit for you, you can
                                    express your interest and pick a centre right away.
                                </p>

                                <div class="details">
                                    <div class="row">
                                        <span class="k">Programme</span>
                                        <span class="v">${name}</span>
                                    </div>
                                    ${description ? `
                                        <div class="row">
                                            <span class="k">Description</span>
                                            <span class="v">${description}</span>
                                        </div>
                                    ` : ''}
                                    ${duration ? `
                                        <div class="row">
                                            <span class="k">Duration</span>
                                            <span class="v">${duration}</span>
                                        </div>
                                    ` : ''}
                                    <div class="row">
                                        <span class="k">Starts</span>
                                        <span class="v">${formattedStart}</span>
                                    </div>
                                </div>

                                <div class="btn-wrap">
                                    <a href="${this.frontendUrl}/learner-programmes" class="btn">View Programme</a>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    You'receiving this because you opted in to new programme notifications.
                                    You can turn this off anytime in your Settings.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: `New Programme Available: ${name}`,
                html: htmlContent,
                text: `Hello ${fullName},\n\nA new programme is now available on the IIK Learner Portal.\n\nProgramme: ${name}\n${description ? `Description: ${description}\n` : ''}${duration ? `Duration: ${duration}\n` : ''}Starts: ${formattedStart}\n\nView it here: ${this.frontendUrl}/learner-programmes\n\nYou're receiving this because you opted in to new programme notifications.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('New programme notification sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send new programme notification:', error.message);
            throw error;
        }
    }

    // ============================================
    // BROADCAST NEW PROGRAMME TO MANY LEARNERS
    // ============================================
    async sendNewProgrammeToMany(learners, programme, delayMs = 500) {
        const results = { sent: [], failed: [] };

        if (!Array.isArray(learners) || learners.length === 0) {
            console.log('No learners to notify for new programme.');
            return results;
        }

        console.log(`Broadcasting new programme "${programme?.name}" to ${learners.length} learner(s)...`);

        for (const learner of learners) {
            const fullName = `${learner.name || ''} ${learner.surname || ''}`.trim() || 'Learner';

            try {
                await this.sendNewProgrammeNotification(
                    learner.email,
                    fullName,
                    programme
                );
                results.sent.push(learner.email);
            } catch (err) {
                console.error(`Failed to send to ${learner.email}:`, err.message);
                results.failed.push({ email: learner.email, error: err.message });
            }

            if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        console.log(`Broadcast complete. Sent: ${results.sent.length}, Failed: ${results.failed.length}`);
        return results;
    }

    // ============================================
    // NOTIFY ADMINS OF A NEW LEARNER REGISTRATION
    // ============================================
    async sendNewLearnerRegistrationNotification(email, adminName, learner) {
        console.log(`Sending new-learner notification to admin: ${email}`);

        const {
            name = 'Learner',
            surname = '',
            email: learnerEmail = '',
            registeredAt = new Date(),
        } = learner || {};

        const fullName = `${name} ${surname}`.trim() || 'Learner';
        const formattedDate = new Date(registeredAt).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Learner Registration</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>New Learner Registered</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${adminName}</strong>,</p>
                                <p class="message">
                                    A new learner has just completed registration and verified
                                    their email address on the IIK Learner Certificate Portal.
                                </p>

                                <div class="details">
                                    <div class="row">
                                        <span class="k">Name</span>
                                        <span class="v">${fullName}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Email</span>
                                        <span class="v">${learnerEmail}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Registered</span>
                                        <span class="v">${formattedDate}</span>
                                    </div>
                                </div>

                                <div class="btn-wrap">
                                    <a href="${this.frontendUrl}/admin/learners" class="btn">View in Admin Portal</a>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    You're receiving this because you opted in to new learner registration notifications.
                                    You can turn this off anytime in your Account Settings.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: `New Learner Registered: ${fullName}`,
                html: htmlContent,
                text: `Hello ${adminName},\n\nA new learner has just registered on the IIK Learner Portal.\n\nName: ${fullName}\nEmail: ${learnerEmail}\nRegistered: ${formattedDate}\n\nView them in the admin portal: ${this.frontendUrl}/admin/learners\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('New-learner notification sent to admin:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send new-learner notification:', error.message);
            throw error;
        }
    }

    // ============================================
    // BROADCAST NEW-LEARNER REGISTRATION TO MANY ADMINS
    // ============================================
    async sendNewLearnerRegistrationToMany(admins, learner, delayMs = 500) {
        const results = { sent: [], failed: [] };

        if (!Array.isArray(admins) || admins.length === 0) {
            console.log('No admins to notify for new learner registration.');
            return results;
        }

        console.log(`Notifying ${admins.length} admin(s) of new learner registration...`);

        for (const admin of admins) {
            const adminName = `${admin.Name || ''} ${admin.Surname || ''}`.trim() || 'Admin';

            try {
                await this.sendNewLearnerRegistrationNotification(
                    admin.Email_address,
                    adminName,
                    learner
                );
                results.sent.push(admin.Email_address);
            } catch (err) {
                console.error(`Failed to send to admin ${admin.Email_address}:`, err.message);
                results.failed.push({ email: admin.Email_address, error: err.message });
            }

            if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        console.log(`Broadcast complete. Sent: ${results.sent.length}, Failed: ${results.failed.length}`);
        return results;
    }

    // ============================================
    // NOTIFY AN ADMIN THAT A LEARNER COMPLETED A PROGRAMME
    // ============================================
    async sendLearnerCompletedNotification(adminEmail, adminName, details) {
        console.log(`Sending learner-completed notification to admin: ${adminEmail}`);

        const {
            learnerName = 'Learner',
            programmeName = 'Programme',
            centreName = 'your centre',
            completedAt = new Date(),
            markedByName = 'System',
        } = details || {};

        const formattedDate = new Date(completedAt).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Learner Ready for Certificate</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Ready for Certificate</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${adminName}</strong>,</p>
                                <p class="message">
                                    A learner at your centre has completed a programme
                                    and is ready for their certificate.
                                </p>

                                <div class="details">
                                    <div class="row">
                                        <span class="k">Programme</span>
                                        <span class="v">${programmeName}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Learner</span>
                                        <span class="v">${learnerName}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Centre</span>
                                        <span class="v">${centreName}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Completed</span>
                                        <span class="v">${formattedDate}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Marked by</span>
                                        <span class="v">${markedByName}</span>
                                    </div>
                                </div>

                                <div class="btn-wrap">
                                    <a href="${this.frontendUrl}/admin-certificates" class="btn">Issue Certificate</a>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    You're receiving this because you opted in to certificate notifications.
                                    You can turn this off anytime in your Account Settings.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: adminEmail,
                subject: `Ready for certificate: ${learnerName} - ${programmeName}`,
                html: htmlContent,
                text: `Hello ${adminName},\n\nA learner at your centre has completed a programme and is ready for their certificate.\n\nLearner: ${learnerName}\nProgramme: ${programmeName}\nCentre: ${centreName}\nCompleted: ${formattedDate}\nMarked by: ${markedByName}\n\nIssue their certificate here: ${this.frontendUrl}/admin-certificates\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Learner-completed notification sent to admin:', adminEmail);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send learner-completed notification:', error.message);
            throw error;
        }
    }

    // ============================================
    // BROADCAST LEARNER-COMPLETED TO MANY ADMINS
    // ============================================
    async sendLearnerCompletedToAdmins(admins, details, delayMs = 500) {
        const results = { sent: [], failed: [] };

        if (!Array.isArray(admins) || admins.length === 0) {
            console.log('No admins to notify about learner completion.');
            return results;
        }

        console.log(`Notifying ${admins.length} admin(s) that ${details?.learnerName || 'a learner'} completed ${details?.programmeName || 'a programme'}...`);

        for (const admin of admins) {
            const adminName = `${admin.Name || ''} ${admin.Surname || ''}`.trim() || 'Admin';

            try {
                await this.sendLearnerCompletedNotification(
                    admin.Email_address,
                    adminName,
                    details
                );
                results.sent.push(admin.Email_address);
            } catch (err) {
                console.error(`Failed to send to admin ${admin.Email_address}:`, err.message);
                results.failed.push({ email: admin.Email_address, error: err.message });
            }

            if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        console.log(`Learner-completed broadcast complete. Sent: ${results.sent.length}, Failed: ${results.failed.length}`);
        return results;
    }

    // ============================================
    // SEND WEEKLY SUMMARY TO AN ADMIN
    // ============================================
    async sendWeeklySummary(adminEmail, adminName, summary) {
        console.log(`Sending weekly summary to: ${adminEmail}`);

        const {
            scope = 'centre',
            centreName = null,
            periodStart,
            periodEnd,
            newRegistrations = 0,
            newInterests = 0,
            newEnrolments = 0,
            completions = 0,
            certificatesIssued = 0,
            totalActiveLearners = 0,
            totalCentres = 0,
        } = summary || {};

        const fmt = (d) =>
            d
                ? new Date(d).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })
                : '';

        const periodLabel = `${fmt(periodStart)} - ${fmt(periodEnd)}`;
        const isGlobal = scope === 'global';
        const scopeLabel = isGlobal ? 'All Centres' : (centreName || 'Your Centre');

        const registrationsRow = isGlobal
            ? `<div class="row"><span class="k">New learner registrations</span><span class="v">${newRegistrations}</span></div>`
            : '';

        const centresRow = isGlobal
            ? `<div class="row"><span class="k">Total centres</span><span class="v">${totalCentres}</span></div>`
            : '';

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Weekly Summary</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Weekly Summary</h1>
                                <p>${scopeLabel}</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${adminName}</strong>,</p>
                                <p class="message">${periodLabel}</p>

                                <p style="color: #d4af37; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 20px 0 12px;">This week</p>
                                <div class="details">
                                    ${registrationsRow}
                                    <div class="row">
                                        <span class="k">New interests</span>
                                        <span class="v">${newInterests}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">New enrolments</span>
                                        <span class="v">${newEnrolments}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Completions</span>
                                        <span class="v">${completions}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Certificates issued</span>
                                        <span class="v">${certificatesIssued}</span>
                                    </div>
                                </div>

                                <p style="color: #d4af37; font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 20px 0 12px;">Running totals</p>
                                <div class="details">
                                    <div class="row">
                                        <span class="k">Active learners</span>
                                        <span class="v">${totalActiveLearners}</span>
                                    </div>
                                    ${centresRow}
                                </div>

                                <div class="btn-wrap">
                                    <a href="${this.frontendUrl}/admin-analytics" class="btn">View Full Analytics</a>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    You're receiving this because you opted in to weekly summaries.
                                    You can turn this off anytime in your Account Settings.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: adminEmail,
                subject: `Weekly summary - ${scopeLabel} (${periodLabel})`,
                html: htmlContent,
                text: `Hello ${adminName},\n\nWeekly summary - ${scopeLabel}\n${periodLabel}\n\nThis week:\n${isGlobal ? `- New learner registrations: ${newRegistrations}\n` : ''}- New interests: ${newInterests}\n- New enrolments: ${newEnrolments}\n- Completions: ${completions}\n- Certificates issued: ${certificatesIssued}\n\nRunning totals:\n- Active learners: ${totalActiveLearners}\n${isGlobal ? `- Total centres: ${totalCentres}\n` : ''}\nView analytics: ${this.frontendUrl}/admin-analytics\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Weekly summary sent to:', adminEmail);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send weekly summary:', error.message);
            throw error;
        }
    }

    // ============================================
    // BROADCAST WEEKLY SUMMARY TO MANY ADMINS
    // ============================================
    async sendWeeklySummaryToMany(admins, summaryResolver, delayMs = 500) {
        const results = { sent: [], skipped: [], failed: [] };

        if (!Array.isArray(admins) || admins.length === 0) {
            console.log('No admins to send weekly summaries to.');
            return results;
        }

        console.log(`Sending weekly summary to ${admins.length} admin(s)...`);

        for (const admin of admins) {
            const adminName =
                `${admin.Name || ''} ${admin.Surname || ''}`.trim() || 'Admin';

            try {
                const summary = await summaryResolver(admin);

                if (!summary) {
                    console.log(`Skipped admin ${admin.Admin_ID}: no summary`);
                    results.skipped.push(admin.Email_address);
                    continue;
                }

                if (isEmptyWeek(summary)) {
                    console.log(
                        `Skipped admin ${admin.Admin_ID}: no activity this week ` +
                        `(${summary.scope === 'global' ? 'global' : `centre ${summary.centreId}`})`
                    );
                    results.skipped.push(admin.Email_address);
                    continue;
                }

                await this.sendWeeklySummary(admin.Email_address, adminName, summary);
                results.sent.push(admin.Email_address);
            } catch (err) {
                console.error(
                    `Failed to send weekly summary to ${admin.Email_address}:`,
                    err.message
                );
                results.failed.push({
                    email: admin.Email_address,
                    error: err.message,
                });
            }

            if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        console.log(
            `Weekly summary broadcast complete. ` +
            `Sent: ${results.sent.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}`
        );
        return results;
    }

    // ============================================
    // SEND CERTIFICATE ISSUED NOTIFICATION TO A LEARNER
    // ============================================
    async sendCertificateIssuedNotification(email, fullName, certificate) {
        console.log(`Sending certificate issued notification to: ${email}`);

        const {
            programmeName = 'Programme',
            certificateNumber = 'N/A',
            issueDate = new Date(),
        } = certificate || {};

        const formattedDate = issueDate
            ? new Date(issueDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            })
            : new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Certificate Issued</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Certificate Issued</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Congratulations, <strong>${fullName}</strong>!</p>
                                <p class="message">
                                    Your certificate has been issued and is now available in
                                    your learner portal. Well done on completing the programme.
                                </p>

                                <div class="details">
                                    <div class="row">
                                        <span class="k">Programme</span>
                                        <span class="v">${programmeName}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Certificate #</span>
                                        <span class="v">${certificateNumber}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Issued on</span>
                                        <span class="v">${formattedDate}</span>
                                    </div>
                                </div>

                                <div class="btn-wrap">
                                    <a href="${this.frontendUrl}/learner-certificates" class="btn">View My Certificate</a>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    You're receiving this because you opted in to certificate notifications.
                                    You can turn this off anytime in your Settings.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: `Certificate Issued: ${programmeName}`,
                html: htmlContent,
                text: `Congratulations ${fullName}!\n\nYour certificate for "${programmeName}" has been issued.\n\nCertificate #: ${certificateNumber}\nIssued: ${formattedDate}\n\nView it here: ${this.frontendUrl}/learner-certificates\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Certificate issued notification sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send certificate issued notification:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND VERIFICATION EMAIL (LEGACY - FOR GOOGLE USERS)
    // ============================================
    async sendVerificationEmail(email, fullName, verificationToken) {
        console.log(`Sending verification email to: ${email}`);

        const verificationLink = `${this.frontendUrl}/verify-email/${verificationToken}`;

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify Your Email</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Verify Your Email</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    Thank you for creating an account with IIK Learner Portal.
                                    Please verify your email address by clicking the button below.
                                </p>

                                <div class="btn-wrap">
                                    <a href="${verificationLink}" class="btn">Verify Email Address</a>
                                </div>

                                <p style="color: #8a8a8a; font-size: 13px; margin-top: 20px;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="color: #d4af37; font-size: 12px; word-break: break-all; background: #0a0a0a; padding: 12px; border-radius: 6px; border: 1px solid #1f1f1f;">
                                    ${verificationLink}
                                </p>

                                <div class="alert">
                                    <strong>This link expires in 24 hours.</strong>
                                </div>

                                <p style="color: #6e6e6e; font-size: 13px; margin-top: 12px;">
                                    If you did not create an account, please ignore this email.
                                </p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: 'Verify Your Email - IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nThank you for creating an account with IIK Learner Portal. Please verify your email by clicking this link:\n\n${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, please ignore this email.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Verification email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send verification email:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND PASSWORD CHANGE CONFIRMATION
    // ============================================
    async sendPasswordChangeConfirmation(email, fullName) {
        console.log(`Sending password change confirmation to: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Changed</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>Password Changed</h1>
                                <p>IIK Learner Certificate Portal</p>
                            </div>
                            <div class="content">
                                <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                                <p class="message">
                                    Your password has been successfully changed.
                                </p>

                                <div class="alert">
                                    <strong>If you did not make this change</strong>, please contact support immediately.
                                </div>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                                <p>This is an automated message, please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: email,
                subject: 'Password Changed Successfully - IIK Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Password change confirmation sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send password change confirmation:', error.message);
            throw error;
        }
    }

    // ============================================
    // SEND CONTACT FORM EMAIL
    // ============================================
    async sendContactFormEmail(name, email, subject, message) {
        console.log(`Sending contact form email from: ${email}`);

        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Contact Form Submission</title>
                    <style>${EMAIL_STYLES}</style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <h1>New Contact Form Submission</h1>
                                <p>IIK Portal</p>
                            </div>
                            <div class="content">
                                <div class="details">
                                    <div class="row">
                                        <span class="k">Name</span>
                                        <span class="v">${name}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Email</span>
                                        <span class="v">${email}</span>
                                    </div>
                                    <div class="row">
                                        <span class="k">Subject</span>
                                        <span class="v">${subject}</span>
                                    </div>
                                </div>

                                <p class="message" style="white-space: pre-wrap;">${message}</p>
                            </div>
                            <div class="footer">
                                <p class="brand">IIK Learner Certificate Portal</p>
                                <p>This email was sent from the IIK Portal contact form.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: this.fromAddress,
                to: process.env.EMAIL_USER,
                replyTo: email,
                subject: `Contact Form: ${subject}`,
                html: htmlContent,
                text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
            };

            const info = await this.sendMail(mailOptions);
            console.log('Contact form email sent');
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send contact form email:', error.message);
            throw error;
        }
    }
}

module.exports = new EmailService();