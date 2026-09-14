const crypto = require('crypto');

// ===== GENERATE OTP =====
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ===== GENERATE RANDOM TOKEN =====
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// ===== GENERATE JWT SECRET =====
const generateJWTSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

// ===== FORMAT RESPONSE =====
const formatResponse = (success, message, data = null, errors = null) => {
    return {
        success,
        message,
        ...(data && { data }),
        ...(errors && { errors })
    };
};

// ===== VALIDATE EMAIL =====
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ===== VALIDATE PHONE NUMBER (South African) - FIXED =====
const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    
    // Remove spaces, dashes, and parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // South African phone number patterns
    // Local: 0821234567 (10 digits, starts with 0)
    // International with +: +27821234567 (starts with +27)
    // International without +: 27821234567 (starts with 27)
    const localPattern = /^0\d{9}$/;                    // 0821234567
    const intlWithPlusPattern = /^\+\d{11}$/;           // +27821234567
    const intlWithoutPlusPattern = /^27\d{9}$/;         // 27821234567
    
    // Check if it matches any pattern
    if (localPattern.test(cleaned) || 
        intlWithPlusPattern.test(cleaned) || 
        intlWithoutPlusPattern.test(cleaned)) {
        return true;
    }
    
    // Additional check: after removing non-digits, should be 10 or 11 digits
    const digitsOnly = cleaned.replace(/\D/g, '');
    if ((digitsOnly.length === 10 && digitsOnly.startsWith('0')) ||
        (digitsOnly.length === 11 && digitsOnly.startsWith('27'))) {
        return true;
    }
    
    return false;
};

// ===== CLEAN PHONE NUMBER (for database storage) =====
const cleanPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    
    // Remove any remaining non-digits
    cleaned = cleaned.replace(/\D/g, '');
    
    // Convert international to local format
    // 27821234567 -> 0821234567
    if (cleaned.startsWith('27') && cleaned.length === 11) {
        cleaned = '0' + cleaned.substring(2);
    }
    
    return cleaned;
};

// ===== FORMAT PHONE NUMBER (for display) =====
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Clean the number first
    let cleaned = phone.replace(/\D/g, '');
    
    // Check if it's international (starts with 27)
    if (cleaned.startsWith('27') && cleaned.length === 11) {
        // Format as +27 82 123 4567
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    // Local format: 082 123 4567
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    
    return phone;
};

// ===== VALIDATE SOUTH AFRICAN ID =====
const isValidSAID = (idNumber) => {
    if (!idNumber) return false;
    
    // Remove spaces and dashes
    idNumber = idNumber.replace(/[\s-]/g, '');
    
    // Must be exactly 13 digits
    if (!/^\d{13}$/.test(idNumber)) return false;
    
    // Luhn algorithm (checksum)
    let sum = 0;
    let alternate = false;
    for (let i = idNumber.length - 1; i >= 0; i--) {
        let n = parseInt(idNumber.charAt(i));
        if (alternate) {
            n *= 2;
            if (n > 9) {
                n = (n % 10) + 1;
            }
        }
        sum += n;
        alternate = !alternate;
    }
    return sum % 10 === 0;
};

// ===== GET AGE FROM SA ID =====
const getAgeFromSAID = (idNumber) => {
    if (!isValidSAID(idNumber)) return null;
    
    idNumber = idNumber.replace(/[\s-]/g, '');
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    
    const currentYear = new Date().getFullYear();
    const fullYear = year > 20 ? 1900 + year : 2000 + year;
    const birthDate = new Date(fullYear, month - 1, day);
    
    // Check if date is valid
    if (birthDate.getFullYear() !== fullYear || 
        birthDate.getMonth() !== month - 1 || 
        birthDate.getDate() !== day) {
        return null;
    }
    
    const age = currentYear - fullYear;
    return age;
};

// ===== GET GENDER FROM SA ID =====
const getGenderFromSAID = (idNumber) => {
    if (!isValidSAID(idNumber)) return null;
    
    idNumber = idNumber.replace(/[\s-]/g, '');
    const genderDigit = parseInt(idNumber.charAt(6));
    return genderDigit >= 5 ? 'male' : 'female';
};

// ===== GET GENDER ID FROM SA ID =====
const getGenderIdFromSAID = (idNumber) => {
    const gender = getGenderFromSAID(idNumber);
    if (gender === 'male') return 1;
    if (gender === 'female') return 2;
    return null;
};

// ===== GET CITIZENSHIP FROM SA ID =====
const getCitizenshipFromSAID = (idNumber) => {
    if (!isValidSAID(idNumber)) return null;
    
    idNumber = idNumber.replace(/[\s-]/g, '');
    const citizenDigit = parseInt(idNumber.charAt(10));
    return citizenDigit === 0 ? 'SA Citizen' : 'Permanent Resident';
};

// ===== EXTRACT BIRTH DATE FROM SA ID =====
const getBirthDateFromSAID = (idNumber) => {
    if (!isValidSAID(idNumber)) return null;
    
    idNumber = idNumber.replace(/[\s-]/g, '');
    const year = parseInt(idNumber.substring(0, 2));
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    
    const fullYear = year > 20 ? 1900 + year : 2000 + year;
    const birthDate = new Date(fullYear, month - 1, day);
    
    // Check if date is valid
    if (birthDate.getFullYear() !== fullYear || 
        birthDate.getMonth() !== month - 1 || 
        birthDate.getDate() !== day) {
        return null;
    }
    
    return birthDate;
};

// ===== SANITIZE INPUT =====
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return input.trim().replace(/[<>]/g, '');
    }
    return input;
};

// ===== SANITIZE OBJECT =====
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' ? sanitizeInput(item) : item
            );
        } else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

// ===== MASK EMAIL =====
const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return email;
    if (username.length <= 2) return email;
    const masked = username.slice(0, 2) + '****' + username.slice(-2);
    return `${masked}@${domain}`;
};

// ===== MASK PHONE =====
const maskPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.length <= 6) return phone;
    const last4 = cleaned.slice(-4);
    return `*******${last4}`;
};

// ===== MASK ID NUMBER =====
const maskIDNumber = (idNumber) => {
    if (!idNumber) return '';
    const cleaned = idNumber.replace(/[\s-]/g, '');
    if (cleaned.length <= 4) return idNumber;
    const last4 = cleaned.slice(-4);
    return `*********${last4}`;
};

// ===== SLEEP FUNCTION =====
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// ===== RETRY FUNCTION =====
const retry = async (fn, retries = 3, delay = 1000) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < retries - 1) {
                await sleep(delay * (i + 1));
            }
        }
    }
    throw lastError;
};

// ===== TRY CATCH WRAPPER =====
const asyncHandler = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

// ===== LOGGER =====
const logger = {
    info: (message, data = null) => {
        console.log(`ℹ️ ${message}`, data || '');
    },
    success: (message, data = null) => {
        console.log(`✅ ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`❌ ${message}`, error || '');
        if (error?.stack && process.env.NODE_ENV === 'development') {
            console.error(error.stack);
        }
    },
    warning: (message, data = null) => {
        console.warn(`⚠️ ${message}`, data || '');
    },
    debug: (message, data = null) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`🔍 ${message}`, data || '');
        }
    },
    table: (data) => {
        if (process.env.NODE_ENV === 'development') {
            console.table(data);
        }
    }
};

// ===== PAGINATION =====
const getPagination = (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    return {
        page: pageNum,
        limit: limitNum,
        offset,
        skip: offset
    };
};

// ===== PAGINATION RESPONSE =====
const paginateResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null
        }
    };
};

// ===== EXTRACT USER AGENT INFO =====
const parseUserAgent = (userAgent) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';
    
    // Browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    
    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    // Device detection
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        device = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        device = 'Tablet';
    }
    
    return { browser, os, device };
};

// ===== GENERATE RANDOM PASSWORD =====
const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
};

// ===== CHECK STRENGTH OF PASSWORD =====
const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];
    
    if (!password) {
        return { score: 0, strength: 'Very Weak', feedback: ['Password is required'] };
    }
    
    // Length check
    if (password.length >= 8) {
        score += 1;
    } else {
        feedback.push('Password should be at least 8 characters long');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Add lowercase letters');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Add uppercase letters');
    }
    
    // Number check
    if (/\d/.test(password)) {
        score += 1;
    } else {
        feedback.push('Add numbers');
    }
    
    // Special character check
    if (/[@$!%*?&]/.test(password)) {
        score += 1;
    } else {
        feedback.push('Add special characters (@$!%*?&)');
    }
    
    // Determine strength
    let strength = 'Very Weak';
    if (score >= 5) strength = 'Very Strong';
    else if (score === 4) strength = 'Strong';
    else if (score === 3) strength = 'Medium';
    else if (score === 2) strength = 'Weak';
    
    return {
        score,
        strength,
        feedback: feedback.length > 0 ? feedback : ['Password is strong!']
    };
};

// ===== CONVERT TO SLUG =====
const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
};

// ===== TRUNCATE TEXT =====
const truncateText = (text, maxLength = 100, suffix = '...') => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + suffix;
};

module.exports = {
    generateOTP,
    generateToken,
    generateJWTSecret,
    formatResponse,
    isValidEmail,
    isValidPhoneNumber,
    cleanPhoneNumber,
    formatPhoneNumber,
    isValidSAID,
    getAgeFromSAID,
    getGenderFromSAID,
    getGenderIdFromSAID,
    getCitizenshipFromSAID,
    getBirthDateFromSAID,
    sanitizeInput,
    sanitizeObject,
    maskEmail,
    maskPhone,
    maskIDNumber,
    sleep,
    retry,
    asyncHandler,
    logger,
    getPagination,
    paginateResponse,
    parseUserAgent,
    generateRandomPassword,
    checkPasswordStrength,
    slugify,
    truncateText
};