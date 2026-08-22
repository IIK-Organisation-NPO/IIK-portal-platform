// backend/utils/email.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});


// EMAIL CSS STYLES (External - Reusable)


const emailStyles = `
    body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
    }
    .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
        background-color: #003366;
        padding: 40px 30px;
        text-align: center;
        border-radius: 8px 8px 0 0;
    }
    .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 28px;
        font-weight: 700;
    }
    .header p {
        color: #e8f0fe;
        margin: 10px 0 0 0;
        font-size: 16px;
    }
    .header .subtitle {
        font-size: 14px;
        margin-top: 5px;
        opacity: 0.8;
    }
    .body-content {
        padding: 40px 30px;
    }
    .body-content h2 {
        color: #003366;
        margin-top: 0;
        font-size: 24px;
    }
    .body-content p {
        color: #555555;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 20px;
    }
    .button-container {
        text-align: center;
        margin: 35px 0;
    }
    .btn-primary {
        display: inline-block;
        padding: 14px 45px;
        background-color: #003366;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,51,102,0.3);
    }
    .btn-primary:hover {
        background-color: #001a33;
    }
    .btn-success {
        display: inline-block;
        padding: 14px 45px;
        background-color: #28a745;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(40,167,69,0.3);
    }
    .btn-success:hover {
        background-color: #1e7e34;
    }
    .btn-danger {
        display: inline-block;
        padding: 14px 45px;
        background-color: #dc3545;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(220,53,69,0.3);
    }
    .btn-danger:hover {
        background-color: #c82333;
    }
    .warning-box {
        background-color: #fff3cd;
        padding: 15px 20px;
        border-radius: 6px;
        margin: 20px 0;
        border-left: 4px solid #ffc107;
    }
    .warning-box p {
        color: #856404;
        margin: 0;
        font-size: 14px;
    }
    .success-box {
        background-color: #d4edda;
        padding: 15px 20px;
        border-radius: 6px;
        margin: 20px 0;
        border-left: 4px solid #28a745;
    }
    .success-box p {
        color: #155724;
        margin: 0;
        font-size: 15px;
    }
    .divider {
        border: none;
        border-top: 1px solid #e0e0e0;
        margin: 30px 0;
    }
    .link-box {
        background-color: #f8f9fa;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0 0 0;
        word-break: break-all;
        color: #003366;
        font-size: 14px;
    }
    .footer-note {
        background-color: #f8f9fa;
        padding: 15px 20px;
        border-radius: 6px;
        margin-top: 30px;
        border-left: 4px solid #6c757d;
    }
    .footer-note p {
        color: #6c757d;
        margin: 0;
        font-size: 13px;
    }
    .features-box {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        margin: 20px 0;
    }
    .features-box h3 {
        color: #003366;
        margin-top: 0;
    }
    .features-box ul {
        color: #555;
        font-size: 14px;
        line-height: 2;
        padding-left: 20px;
        margin: 0;
    }
    .features-box ul li {
        list-style-type: none;
    }
    .features-box ul li::before {
        content: "✓ ";
        color: #28a745;
        font-weight: bold;
    }
    .footer-text {
        color: #999999;
        font-size: 12px;
        margin-top: 30px;
        text-align: center;
        border-top: 1px solid #e0e0e0;
        padding-top: 20px;
    }
    .footer-text p {
        margin: 5px 0;
    }
`;


// SEND VERIFICATION EMAIL


/**
 * Send email verification link
 * @param {string} email - User's email
 * @param {string} token - Verification token
 * @param {string} fullName - User's full name
 * @returns {Promise<boolean>}
 */
const sendVerificationEmail = async (email, token, fullName) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${token}`;
    
    const mailOptions = {
        from: `"IIK" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - IIK Certificate Portal',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IIK - Verify Email</title>
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>IIK</h1>
                        <p>International Institute of Knowledge</p>
                        <p class="subtitle">Certificate Management System</p>
                    </div>
                    
                    <div class="body-content">
                        <h2>Welcome, ${fullName}! 👋</h2>
                        <p>
                            Thank you for registering with the <strong>IIK Certificate Portal</strong>. To activate your account and start using our services, please verify your email address by clicking the button below.
                        </p>
                        
                        <div class="button-container">
                            <a href="${verificationLink}" class="btn-primary">
                                ✅ Verify Email Address
                            </a>
                        </div>
                        
                        <div class="warning-box">
                            <p>⏰ This verification link will expire in <strong>24 hours</strong>. If you don't verify within this time, you'll need to request a new verification email.</p>
                        </div>
                        
                        <hr class="divider">
                        
                        <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 0;">
                            If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <div class="link-box">
                            ${verificationLink}
                        </div>
                        
                        <div class="footer-note">
                            <p>🔒 <strong>Didn't request this?</strong> If you didn't create an account with us, please ignore this email. Your information is secure and will not be used without your consent.</p>
                        </div>
                        
                        <div class="footer-text">
                            <p>This is an automated message, please do not reply to this email.</p>
                            <p>&copy; 2024 IIK (International Institute of Knowledge). All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw new Error('Failed to send verification email. Please try again later.');
    }
};


// SEND WELCOME EMAIL


/**
 * Send welcome email after verification
 * @param {string} email - User's email
 * @param {string} fullName - User's full name
 * @returns {Promise<boolean>}
 */
const sendWelcomeEmail = async (email, fullName) => {
    const loginLink = `${process.env.FRONTEND_URL}/login`;
    
    const mailOptions = {
        from: `"IIK" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to IIK Certificate Portal! 🎉',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IIK - Welcome</title>
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>IIK</h1>
                        <p>International Institute of Knowledge</p>
                        <p class="subtitle">Certificate Management System</p>
                    </div>
                    
                    <div class="body-content">
                        <h2>Hello ${fullName}! 👋</h2>
                        <p>
                            Your account has been successfully verified. You're now ready to start using the <strong>IIK Certificate Portal</strong>.
                        </p>
                        
                        <div class="success-box">
                            <p>✅ Account successfully verified! Your account is now fully active.</p>
                        </div>
                        
                        <div class="button-container">
                            <a href="${loginLink}" class="btn-success">
                                Login to Your Account
                            </a>
                        </div>
                        
                        <div class="features-box">
                            <h3>What you can do now:</h3>
                            <ul>
                                <li>📚 Access your learning materials</li>
                                <li>📄 View and download certificates</li>
                                <li>📊 Track your progress</li>
                                <li>👤 Update your profile information</li>
                                <li>💬 Get support when you need it</li>
                            </ul>
                        </div>
                        
                        <hr class="divider">
                        
                        <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 0;">
                            If you have any questions or need assistance, please don't hesitate to contact our support team.
                        </p>
                        
                        <div class="footer-text">
                            <p>This is an automated message, please do not reply to this email.</p>
                            <p>&copy; 2024 IIK (International Institute of Knowledge). All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Welcome email failed:', error.message);
        return false;
    }
};


// SEND PASSWORD RESET EMAIL

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} token - Reset token
 * @param {string} fullName - User's full name
 * @returns {Promise<boolean>}
 */
const sendPasswordResetEmail = async (email, token, fullName) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: `"IIK" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your Password - IIK Certificate Portal',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IIK - Reset Password</title>
                <style>${emailStyles}</style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>IIK</h1>
                        <p>International Institute of Knowledge</p>
                        <p class="subtitle">Certificate Management System</p>
                    </div>
                    
                    <div class="body-content">
                        <h2>Hello ${fullName}! 🔐</h2>
                        <p>
                            We received a request to reset your password for your <strong>IIK Certificate Portal</strong> account.
                        </p>
                        
                        <div class="button-container">
                            <a href="${resetLink}" class="btn-danger">
                                🔑 Reset Password
                            </a>
                        </div>
                        
                        <div class="warning-box">
                            <p>⏰ This password reset link will expire in <strong>1 hour</strong>.</p>
                        </div>
                        
                        <hr class="divider">
                        
                        <p style="color: #777777; font-size: 14px; line-height: 1.6; margin: 0;">
                            If the button doesn't work, copy and paste this link into your browser:
                        </p>
                        <div class="link-box">
                            ${resetLink}
                        </div>
                        
                        <div class="footer-note">
                            <p>🔒 <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                        </div>
                        
                        <div class="footer-text">
                            <p>This is an automated message, please do not reply to this email.</p>
                            <p>&copy; 2024 IIK (International Institute of Knowledge). All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Password reset email failed:', error.message);
        throw new Error('Failed to send password reset email. Please try again later.');
    }
};


// EXPORTS


module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail
};