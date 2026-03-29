import { AES, enc } from 'crypto-js';
import Cookies from 'js-cookie';

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY || 'InventoryIQ@SecretKey#2024!';

const clearAuthStorage = () => {
    localStorage.clear();
    [
        'access_token',
        'email_token',
        'auth_id',
        'role_id',
        'role_name',
        'isLoggedIn',
    ].forEach((name) => Cookies.remove(name, { path: '/' }));
};

/**
 * Decrypt a single value. Checks Cookies first, then LocalStorage.
 */
export const tryDecryptCookie = (cookieValue, storageKey = null) => {
    let encrypted = cookieValue;
    
    // If cookie is empty, check localStorage backup
    if (!encrypted && storageKey) {
        encrypted = localStorage.getItem(storageKey);
    }

    if (!encrypted) return null;
    
    try {
        const out = AES.decrypt(encrypted, SECRET_KEY).toString(enc.Utf8);
        return out || null;
    } catch {
        return null;
    }
};

const decryptToken = (cookieToken, redirectPath, storageKey = null) => {
    let token = cookieToken;

    if ((!token || token === '') && storageKey) {
        token = localStorage.getItem(storageKey);
    }

    if (!token || token === '') {
        if (redirectPath && window.location.pathname !== '/') {
            clearAuthStorage();
            window.location = redirectPath;
        }
        return '';
    }

    try {
        const decrypted = AES.decrypt(token, SECRET_KEY).toString(enc.Utf8);
        if (!decrypted) throw new Error('empty decrypt');
        return decrypted;
    } catch {
        if (redirectPath && window.location.pathname !== '/') {
            clearAuthStorage();
            window.location = redirectPath;
        }
        return '';
    }
};

export const decryptAccessToken = () => decryptToken(Cookies.get('access_token'), '/', 'access_token');
export const decryptAuthId = () => decryptToken(Cookies.get('auth_id'), '/', 'auth_id');
export const decryptRoleId = () => decryptToken(Cookies.get('role_id'), '/', 'role_id');
export const decryptedEmailToken = () => decryptToken(Cookies.get('email_token'), '/', 'email_token');
export const decryptedRoleName = () => decryptToken(Cookies.get('role_name'), '/', 'role_name');

export { SECRET_KEY };
