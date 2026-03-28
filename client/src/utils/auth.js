import { AES, enc } from 'crypto-js';
import Cookies from 'js-cookie';

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY || 'InventoryIQ@SecretKey#2024!';

/** Clear auth storage (cookies + local). */
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
 * Decrypt a single cookie value. Returns null if missing or invalid (wrong SECRET_KEY or corrupt data).
 * Does not redirect — use for components that must not navigate during render.
 */
export const tryDecryptCookie = (encrypted) => {
	if (!encrypted) return null;
	try {
		const out = AES.decrypt(encrypted, SECRET_KEY).toString(enc.Utf8);
		return out || null;
	} catch {
		return null;
	}
};

const decryptToken = (cookieToken, redirectPath) => {
	// Always read fresh — do not cache cookie values at module load (fixes post-login / SPA issues).
	if (cookieToken === undefined || cookieToken === null || cookieToken === '') {
		if (redirectPath) {
			clearAuthStorage();
			window.location = redirectPath;
		}
		return '';
	}
	try {
		const decrypted = AES.decrypt(cookieToken, SECRET_KEY).toString(enc.Utf8);
		if (!decrypted) {
			throw new Error('empty decrypt');
		}
		return decrypted;
	} catch {
		clearAuthStorage();
		if (redirectPath) {
			window.location = redirectPath;
		}
		return '';
	}
};

const decryptAccessToken = () => decryptToken(Cookies.get('access_token'), '/');
const decryptAuthId = () => decryptToken(Cookies.get('auth_id'), '/');
const decryptRoleId = () => decryptToken(Cookies.get('role_id'), '/');
const decryptedEmailToken = () => decryptToken(Cookies.get('email_token'), '/');
const decryptedRoleName = () => decryptToken(Cookies.get('role_name'), '/');

export { SECRET_KEY, decryptAccessToken, decryptAuthId, decryptRoleId, decryptedEmailToken, decryptedRoleName };
