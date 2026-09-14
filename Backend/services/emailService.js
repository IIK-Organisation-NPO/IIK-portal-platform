const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

class EmailService {
    constructor() {
        console.log(' Initializing email service...');
        
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error(' Email credentials not set in .env');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
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
        try {
            await this.transporter.verify();
            console.log(' Email service configured successfully!');
            console.log(` Sending emails from: ${process.env.EMAIL_USER}`);
            return true;
        } catch (error) {
            console.error(' Email configuration error:', error.message);
            return false;
        }
    }

    // ===== SEND OTP EMAIL FOR SIGNUP =====
    async sendOTPEmail(email, fullName, otpCode) {
        console.log(`📧 Sending OTP email to: ${email}`);
        console.log(`📧 OTP Code: ${otpCode}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your OTP Code</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: #f4f4f9;
                            padding: 20px;
                            margin: 0;
                        }
                        .container {
                            max-width: 580px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: #ffffff;
                            font-size: 28px;
                            margin: 0;
                            font-weight: 700;
                        }
                        .header p {
                            color: rgba(255,255,255,0.9);
                            font-size: 16px;
                            margin: 8px 0 0;
                        }
                        .content {
                            padding: 40px 35px 30px;
                        }
                        .greeting {
                            font-size: 18px;
                            color: #333;
                            margin-bottom: 15px;
                        }
                        .greeting strong {
                            color: #667eea;
                        }
                        .message {
                            color: #555;
                            line-height: 1.8;
                            margin-bottom: 25px;
                            font-size: 15px;
                        }
                        .otp-box {
                            background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
                            border: 2px dashed #667eea;
                            border-radius: 16px;
                            padding: 30px;
                            text-align: center;
                            margin: 25px 0;
                        }
                        .otp-box .label {
                            font-size: 14px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin-bottom: 10px;
                            display: block;
                        }
                        .otp-code {
                            font-size: 48px;
                            font-weight: 800;
                            letter-spacing: 15px;
                            color: #667eea;
                            font-family: 'Courier New', monospace;
                            background: white;
                            padding: 15px 25px;
                            border-radius: 12px;
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
                        }
                        .otp-timer {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            margin-top: 15px;
                            color: #888;
                            font-size: 14px;
                        }
                        .otp-timer .time {
                            font-weight: 600;
                            color: #dc3545;
                        }
                        .warning {
                            background: #fff8e1;
                            border-left: 4px solid #ffc107;
                            padding: 14px 18px;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-size: 14px;
                            color: #856404;
                        }
                        .footer {
                            text-align: center;
                            padding: 25px 30px;
                            border-top: 1px solid #eee;
                            background: #fafafa;
                        }
                        .footer p {
                            color: #999;
                            font-size: 12px;
                            margin: 3px 0;
                        }
                        .footer .brand {
                            color: #667eea;
                            font-weight: 600;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 IIK Learner Portal</h1>
                            <p>Certificate Management System</p>
                        </div>
                        
                        <div class="content">
                            <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                            
                            <p class="message">
                                Welcome to <strong>IIK Learner Certificate Portal</strong>!
                                To complete your registration, please verify your email address using the OTP code below.
                            </p>
                            
                            <div class="otp-box">
                                <span class="label">🔐 Your Verification Code</span>
                                <div class="otp-code">${otpCode}</div>
                                <div class="otp-timer">
                                    <span>⏰ This code expires in</span>
                                    <span class="time">10 minutes</span>
                                </div>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong> Never share this OTP with anyone. This code is for your verification only.
                            </div>
                            
                            <p style="color: #888; font-size: 13px; margin-top: 15px;">
                                If you did not create this account, please ignore this email.
                            </p>
                        </div>
                        
                        <div class="footer">
                            <p class="brand">IIK Learner Certificate Portal</p>
                            <p>&copy; 2024 All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🔐 Your OTP Code - IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour OTP verification code is: ${otpCode}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, please ignore this email.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' OTP email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send OTP email:', error.message);
            throw error;
        }
    }

    // ===== SEND PASSWORD RESET OTP EMAIL =====
    async sendPasswordResetOTPEmail(email, fullName, otpCode) {
        console.log(`📧 Sending password reset OTP to: ${email}`);
        console.log(`📧 OTP Code: ${otpCode}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset OTP</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: #f4f4f9;
                            padding: 20px;
                            margin: 0;
                        }
                        .container {
                            max-width: 580px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: #ffffff;
                            font-size: 28px;
                            margin: 0;
                            font-weight: 700;
                        }
                        .header p {
                            color: rgba(255,255,255,0.9);
                            font-size: 16px;
                            margin: 8px 0 0;
                        }
                        .content {
                            padding: 40px 35px 30px;
                        }
                        .greeting {
                            font-size: 18px;
                            color: #333;
                            margin-bottom: 15px;
                        }
                        .greeting strong {
                            color: #f5576c;
                        }
                        .message {
                            color: #555;
                            line-height: 1.8;
                            margin-bottom: 25px;
                            font-size: 15px;
                        }
                        .otp-box {
                            background: linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%);
                            border: 2px dashed #f5576c;
                            border-radius: 16px;
                            padding: 30px;
                            text-align: center;
                            margin: 25px 0;
                        }
                        .otp-box .label {
                            font-size: 14px;
                            color: #888;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            margin-bottom: 10px;
                            display: block;
                        }
                        .otp-code {
                            font-size: 48px;
                            font-weight: 800;
                            letter-spacing: 15px;
                            color: #f5576c;
                            font-family: 'Courier New', monospace;
                            background: white;
                            padding: 15px 25px;
                            border-radius: 12px;
                            display: inline-block;
                            box-shadow: 0 4px 15px rgba(245, 87, 108, 0.2);
                        }
                        .otp-timer {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            margin-top: 15px;
                            color: #888;
                            font-size: 14px;
                        }
                        .otp-timer .time {
                            font-weight: 600;
                            color: #f5576c;
                        }
                        .warning {
                            background: #fff8e1;
                            border-left: 4px solid #ffc107;
                            padding: 14px 18px;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-size: 14px;
                            color: #856404;
                        }
                        .footer {
                            text-align: center;
                            padding: 25px 30px;
                            border-top: 1px solid #eee;
                            background: #fafafa;
                        }
                        .footer p {
                            color: #999;
                            font-size: 12px;
                            margin: 3px 0;
                        }
                        .footer .brand {
                            color: #667eea;
                            font-weight: 600;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔑 Password Reset</h1>
                            <p>IIK Learner Certificate Portal</p>
                        </div>
                        
                        <div class="content">
                            <p class="greeting">Hello <strong>${fullName}</strong>,</p>
                            
                            <p class="message">
                                We received a request to reset your password. Use the OTP code below to verify your identity.
                            </p>
                            
                            <div class="otp-box">
                                <span class="label">🔐 Your Verification Code</span>
                                <div class="otp-code">${otpCode}</div>
                                <div class="otp-timer">
                                    <span>⏰ This code expires in</span>
                                    <span class="time">15 minutes</span>
                                </div>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong> Never share this OTP with anyone.
                                If you did not request this, please ignore this email.
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p class="brand">IIK Learner Certificate Portal</p>
                            <p>&copy; 2024 All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🔑 Password Reset OTP - IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour password reset OTP code is: ${otpCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' Password reset OTP email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send password reset OTP:', error.message);
            throw error;
        }
    }

    // ===== SEND WELCOME EMAIL =====
    async sendWelcomeEmail(email, fullName) {
        console.log(`📧 Sending welcome email to: ${email}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to IIK Portal</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f9; padding: 20px; margin: 0; }
                        .container { max-width: 580px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 30px; text-align: center; }
                        .header h1 { color: white; font-size: 28px; margin: 0; font-weight: 700; }
                        .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 14px; }
                        .content { padding: 40px 35px; }
                        .content h2 { color: #333; font-size: 22px; margin: 0 0 10px; }
                        .content p { color: #555; line-height: 1.7; }
                        .features { background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; }
                        .features ul { list-style: none; padding: 0; margin: 0; }
                        .features li { padding: 8px 0; border-bottom: 1px solid #eee; color: #555; }
                        .features li:last-child { border-bottom: none; }
                        .features li::before { content: "✓ "; color: #4CAF50; font-weight: bold; }
                        .btn { display: inline-block; padding: 14px 35px; background: #4CAF50; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
                        .footer { text-align: center; padding: 25px 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; background: #fafafa; }
                        .footer p { margin: 3px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Welcome to IIK Portal!</h1>
                            <p>Your Learning Journey Begins Now</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${fullName},</h2>
                            <p>We're excited to have you on board! Your account has been successfully created and verified.</p>
                            
                            <div class="features">
                                <p style="margin: 0 0 10px; font-weight: 600; color: #333;">Here's what you can do:</p>
                                <ul>
                                    <li>📚 Access your learning materials and certificates</li>
                                    <li>📊 Track your progress and achievements</li>
                                    <li>📝 Update your profile and preferences</li>
                                    <li>🔔 Get real-time notifications</li>
                                    <li>💬 Connect with instructors and peers</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard</a>
                            </div>
                            
                            <p style="color: #888; font-size: 14px;">
                                If you have any questions, feel free to contact our support team.
                            </p>
                        </div>
                        <div class="footer">
                            <p style="color: #4CAF50; font-weight: 600;">IIK Learner Certificate Portal</p>
                            <p>&copy; 2024 All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🎉 Welcome to IIK Learner Portal!',
                html: htmlContent,
                text: `Hello ${fullName},\n\nWelcome to IIK Learner Portal! Your account has been successfully created and verified.\n\nYou can now:\n- Access your learning materials and certificates\n- Track your progress\n- Update your profile\n\nVisit: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard\n\nIIK Learner Certificate Portal`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' Welcome email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send welcome email:', error.message);
            throw error;
        }
    }

    // ===== SEND LOCK NOTIFICATION EMAIL =====
    async sendLockNotificationEmail(email, fullName, attempts, lockDuration, ipAddress, userAgent, lockoutCount, lockoutDescription) {
        console.log(`📧 Sending lock notification to: ${email}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Locked</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f9; padding: 20px; margin: 0; }
                        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 30px; text-align: center; }
                        .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; }
                        .content { padding: 40px 35px 30px; }
                        .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
                        .alert-box .icon { font-size: 48px; display: block; margin-bottom: 10px; }
                        .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
                        .details-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                        .details-item:last-child { border-bottom: none; }
                        .label { color: #666; font-weight: 500; }
                        .value { color: #333; font-weight: 600; }
                        .warning { background: #fff8e1; border-left: 4px solid #ffc107; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #856404; }
                        .footer { text-align: center; padding: 25px 30px; border-top: 1px solid #eee; background: #fafafa; }
                        .footer p { color: #999; font-size: 12px; margin: 3px 0; }
                        .lockout-badge {
                            display: inline-block;
                            background: #dc3545;
                            color: white;
                            padding: 4px 14px;
                            border-radius: 20px;
                            font-size: 13px;
                            font-weight: 600;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔒 Account Locked</h1>
                        </div>
                        <div class="content">
                            <div class="alert-box">
                                <span class="icon">⚠️</span>
                                <h3 style="margin: 0; color: #721c24;">Account Temporarily Locked</h3>
                            </div>
                            
                            <p style="font-size: 16px; color: #333;">
                                Hello <strong>${fullName}</strong>,
                            </p>
                            
                            <p style="color: #555; line-height: 1.7;">
                                Your IIK Learner Portal account has been temporarily locked due to <strong>${attempts} failed login attempts</strong>.
                                This is your <strong>${lockoutDescription}</strong>.
                            </p>
                            
                            <div style="text-align: center; margin: 15px 0;">
                                <span class="lockout-badge">🔒 ${lockoutDescription}</span>
                            </div>
                            
                            <div class="details">
                                <div class="details-item">
                                    <span class="label">📧 Email</span>
                                    <span class="value">${email}</span>
                                </div>
                                <div class="details-item">
                                    <span class="label">🖥️ IP Address</span>
                                    <span class="value">${ipAddress || 'Unknown'}</span>
                                </div>
                                <div class="details-item">
                                    <span class="label">🔧 Device</span>
                                    <span class="value" style="font-size: 13px;">${userAgent || 'Unknown'}</span>
                                </div>
                                <div class="details-item">
                                    <span class="label">⏰ Lock Duration</span>
                                    <span class="value">${lockDuration} minute${lockDuration > 1 ? 's' : ''}</span>
                                </div>
                                <div class="details-item">
                                    <span class="label">📊 Failed Attempts</span>
                                    <span class="value">${attempts}</span>
                                </div>
                                <div class="details-item">
                                    <span class="label">📈 Lockout Count</span>
                                    <span class="value">${lockoutCount}</span>
                                </div>
                            </div>
                            
                            <div class="warning">
                                <strong>💡 What to do next:</strong>
                                <ul style="margin: 10px 0 0; padding-left: 20px;">
                                    <li>Wait ${lockDuration} minute${lockDuration > 1 ? 's' : ''} and try again</li>
                                    <li>If you forgot your password, use the "Forgot Password" link</li>
                                    <li>If this wasn't you, please contact support immediately</li>
                                </ul>
                            </div>
                            
                            <p style="color: #888; font-size: 13px; margin-top: 15px;">
                                If you did not attempt to login, please ignore this email or contact our support team.
                            </p>
                        </div>
                        <div class="footer">
                            <p style="color: #667eea; font-weight: 600;">IIK Learner Certificate Portal</p>
                            <p>&copy; 2024 All rights reserved.</p>
                            <p>This is an automated security alert, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `🔒 Account Locked - IIK Learner Portal (${lockoutDescription})`,
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour IIK Learner Portal account has been temporarily locked due to ${attempts} failed login attempts.\n\nLockout: ${lockoutDescription}\nLock Duration: ${lockDuration} minutes\nIP Address: ${ipAddress || 'Unknown'}\n\nPlease wait ${lockDuration} minutes and try again.\n\nIf this wasn't you, please contact support immediately.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' Lock notification email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send lock notification email:', error.message);
            throw error;
        }
    }

    // ============================================
    // ✅ SEND BULK EMAIL FOR ADMIN
    // ============================================
    async sendBulkEmail(email, fullName, subject, message) {
        console.log(`📧 Sending bulk email to: ${email}`);
        console.log(`📧 Subject: ${subject}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background: #f4f4f9;
                            padding: 20px;
                            margin: 0;
                        }
                        .container {
                            max-width: 580px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .header h1 {
                            color: #ffffff;
                            font-size: 28px;
                            margin: 0;
                            font-weight: 700;
                        }
                        .header p {
                            color: rgba(255,255,255,0.9);
                            font-size: 16px;
                            margin: 8px 0 0;
                        }
                        .content {
                            padding: 40px 35px 30px;
                        }
                        .greeting {
                            font-size: 18px;
                            color: #333;
                            margin-bottom: 15px;
                        }
                        .greeting strong {
                            color: #667eea;
                        }
                        .message-content {
                            color: #555;
                            line-height: 1.8;
                            margin: 20px 0;
                            font-size: 15px;
                            white-space: pre-wrap;
                        }
                        .footer {
                            text-align: center;
                            padding: 25px 30px;
                            border-top: 1px solid #eee;
                            background: #fafafa;
                        }
                        .footer p {
                            color: #999;
                            font-size: 12px;
                            margin: 3px 0;
                        }
                        .footer .brand {
                            color: #667eea;
                            font-weight: 600;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📧 IIK Learner Portal</h1>
                            <p>Learner Certificate Management</p>
                        </div>
                        
                        <div class="content">
                            <p class="greeting">Dear <strong>${fullName}</strong>,</p>
                            
                            <div class="message-content">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            
                            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #888; font-size: 14px;">
                                    Best regards,<br>
                                    <strong style="color: #667eea;">IIK Learner Certificate Portal Team</strong>
                                </p>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p class="brand">IIK Learner Certificate Portal</p>
                            <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: subject,
                html: htmlContent,
                text: `Dear ${fullName},\n\n${message}\n\nBest regards,\nIIK Learner Certificate Portal Team`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' Bulk email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send bulk email:', error.message);
            throw error;
        }
    }

    // ===== SEND VERIFICATION EMAIL (LEGACY - FOR GOOGLE USERS) =====
    async sendVerificationEmail(email, fullName, verificationToken) {
        console.log(`📧 Sending verification email to: ${email}`);
        
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify Your Email</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f9; padding: 20px; margin: 0; }
                        .container { max-width: 580px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
                        .header h1 { color: white; font-size: 28px; margin: 0; font-weight: 700; }
                        .header p { color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 14px; }
                        .content { padding: 40px 35px; }
                        .content h2 { color: #333; font-size: 22px; margin: 0 0 10px; }
                        .content p { color: #555; line-height: 1.7; }
                        .btn { 
                            display: inline-block; 
                            padding: 14px 35px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: 600;
                            margin: 20px 0;
                        }
                        .btn:hover { transform: scale(1.02); }
                        .expiry { text-align: center; color: #999; font-size: 13px; }
                        .footer { text-align: center; padding: 25px 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; background: #fafafa; }
                        .footer p { margin: 3px 0; }
                        .warning { 
                            background: #fff3cd; 
                            border-left: 4px solid #ffc107; 
                            padding: 12px 16px; 
                            border-radius: 4px; 
                            margin: 15px 0;
                            font-size: 13px;
                            color: #856404;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎓 IIK Learner Portal</h1>
                            <p>Verify Your Email Address</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${fullName},</h2>
                            <p>Thank you for creating an account with IIK Learner Portal. Please verify your email address by clicking the button below:</p>
                            
                            <div style="text-align: center;">
                                <a href="${verificationLink}" class="btn">Verify Email Address</a>
                            </div>
                            
                            <p style="color: #888; font-size: 14px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="color: #667eea; font-size: 13px; word-break: break-all; background: #f8f9ff; padding: 12px; border-radius: 8px; border: 1px solid #e8ecf1;">
                                ${verificationLink}
                            </p>
                            
                            <div class="warning">
                                <strong>⚠️ This link expires in 24 hours</strong>
                            </div>
                            
                            <p style="color: #888; font-size: 14px; margin-top: 20px;">
                                If you didn't create an account, please ignore this email.
                            </p>
                        </div>
                        <div class="footer">
                            <p style="color: #667eea; font-weight: 600;">IIK Learner Certificate Portal</p>
                            <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '📧 Verify Your Email - IIK Learner Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nThank you for creating an account with IIK Learner Portal. Please verify your email by clicking this link:\n\n${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('✅ Verification email sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Failed to send verification email:', error.message);
            throw error;
        }
    }

    // ===== SEND PASSWORD CHANGE CONFIRMATION =====
    async sendPasswordChangeConfirmation(email, fullName) {
        console.log(`📧 Sending password change confirmation to: ${email}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Changed</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f9; padding: 20px; margin: 0; }
                        .container { max-width: 580px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 30px; text-align: center; }
                        .header h1 { color: white; font-size: 28px; margin: 0; font-weight: 700; }
                        .content { padding: 40px 35px; }
                        .content h2 { color: #333; font-size: 22px; margin: 0 0 10px; }
                        .content p { color: #555; line-height: 1.7; }
                        .footer { text-align: center; padding: 25px 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; background: #fafafa; }
                        .footer p { margin: 3px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Password Changed</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${fullName},</h2>
                            <p>Your password has been successfully changed.</p>
                            <p style="color: #888; font-size: 14px;">
                                If you didn't make this change, please contact support immediately.
                            </p>
                        </div>
                        <div class="footer">
                            <p style="color: #4CAF50; font-weight: 600;">IIK Learner Certificate Portal</p>
                            <p>&copy; 2024 All rights reserved.</p>
                            <p>This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: ' Password Changed Successfully - IIK Portal',
                html: htmlContent,
                text: `Hello ${fullName},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.\n\nIIK Learner Certificate Portal`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' Password change confirmation sent to:', email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send password change confirmation:', error.message);
            throw error;
        }
    }

    // ===== SEND CONTACT FORM EMAIL =====
    async sendContactFormEmail(name, email, subject, message) {
        console.log(`📧 Sending contact form email from: ${email}`);
        
        try {
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Contact Form Submission</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f9; padding: 20px; }
                        .container { max-width: 580px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
                        .header h1 { color: white; font-size: 24px; margin: 0; }
                        .content { padding: 35px; }
                        .content h2 { color: #333; font-size: 18px; margin: 0 0 10px; }
                        .content p { color: #666; line-height: 1.7; }
                        .content .label { font-weight: 600; color: #333; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📬 New Contact Form Submission</h1>
                        </div>
                        <div class="content">
                            <p><span class="label">👤 Name:</span> ${name}</p>
                            <p><span class="label">📧 Email:</span> ${email}</p>
                            <p><span class="label">📝 Subject:</span> ${subject}</p>
                            <p><span class="label">💬 Message:</span></p>
                            <p style="background: #f8f9fa; padding: 15px; border-radius: 8px;">${message}</p>
                        </div>
                        <div class="footer">
                            <p>This email was sent from the IIK Portal contact form.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: process.env.EMAIL_FROM || `"IIK Portal" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER,
                replyTo: email,
                subject: `📬 Contact Form: ${subject}`,
                html: htmlContent,
                text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(' Contact form email sent');
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(' Failed to send contact form email:', error.message);
            throw error;
        }
    }
}

module.exports = new EmailService();