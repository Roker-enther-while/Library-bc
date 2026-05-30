const crypto = require('crypto');

// Standard 32-byte secret key (256 bits) for AES-256-GCM.
// In production, this would be retrieved from environment variables.
const ENCRYPTION_KEY = Buffer.from('f62d8ea873f1d248b1111628dcfba29a8a1abda46b9a89c92257d0f19c98a032', 'hex'); 
const IV_LENGTH = 12; // Standard IV length for AES-GCM

/**
 * Encrypts clear text into AES-256-GCM format: iv:ciphertext:authtag
 */
function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    } catch (err) {
        console.error('[CRYPTO] Encryption error:', err.message);
        return text;
    }
}

/**
 * Decrypts AES-256-GCM formatted string back to clear text
 */
function decrypt(encryptedString) {
    if (!encryptedString || typeof encryptedString !== 'string' || !encryptedString.includes(':')) {
        return encryptedString;
    }
    try {
        const parts = encryptedString.split(':');
        if (parts.length !== 3) return encryptedString; // Not in our format
        
        const iv = Buffer.from(parts[0], 'hex');
        const ciphertext = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (err) {
        console.error('[CRYPTO] Decryption error:', err.message);
        return '[DECRYPTION_ERROR_KEY_MISMATCH]';
    }
}

module.exports = { encrypt, decrypt };
