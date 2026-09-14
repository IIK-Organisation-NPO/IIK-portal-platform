class SouthAfricanID {
    static validate(idNumber) {
        // Remove spaces and dashes
        idNumber = idNumber.replace(/[\s-]/g, '');
        
        // Must be exactly 13 digits
        if (!/^\d{13}$/.test(idNumber)) {
            return { valid: false, message: 'ID number must be exactly 13 digits' };
        }

        // Extract components
        const birthDate = this.extractBirthDate(idNumber);
        const gender = this.extractGender(idNumber);
        const citizenship = this.extractCitizenship(idNumber);
        const isValid = this.verifyLuhn(idNumber);

        return {
            valid: isValid,
            message: isValid ? 'Valid South African ID' : 'Invalid ID number - checksum failed',
            data: {
                birthDate,
                gender,
                citizenship,
                age: this.calculateAge(birthDate)
            }
        };
    }

    static extractBirthDate(idNumber) {
        const year = parseInt(idNumber.substring(0, 2));
        const month = parseInt(idNumber.substring(2, 4));
        const day = parseInt(idNumber.substring(4, 6));
        
        // Determine century
        const currentYear = new Date().getFullYear();
        const fullYear = year > 20 ? 1900 + year : 2000 + year;
        
        // Validate date
        const date = new Date(fullYear, month - 1, day);
        if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null;
        }
        
        return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    static extractGender(idNumber) {
        const genderDigit = parseInt(idNumber.substring(6, 10));
        return genderDigit >= 5000 ? 'female' : 'male';
    }

    static extractCitizenship(idNumber) {
        const citizenDigit = parseInt(idNumber.substring(10, 11));
        return citizenDigit === 0 ? 'citizen' : 'resident';
    }

    static calculateAge(birthDate) {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    static verifyLuhn(idNumber) {
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
        return (sum % 10 === 0);
    }

    static formatID(idNumber) {
        return idNumber.replace(/(\d{6})(\d{4})(\d{3})/, '$1 $2 $3');
    }
}

module.exports = SouthAfricanID;