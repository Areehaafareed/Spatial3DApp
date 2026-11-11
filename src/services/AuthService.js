// services/AuthService.js
// Signup / login / session helpers backed by the PixiMesh API.
import { apiFetch, setToken, getToken, hasSession } from './Api';

export class AuthService {
    /** Create an account; stores the returned session token. */
    static async signup(name, email, password) {
        const data = await apiFetch('/auth/signup', {
            method: 'POST',
            auth: false,
            body: { name: name.trim(), email: email.trim(), password },
        });
        await setToken(data.token);
        return data.user;
    }

    /** Sign in; stores the returned session token. */
    static async login(email, password) {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            auth: false,
            body: { email: email.trim(), password },
        });
        await setToken(data.token);
        return data.user;
    }

    /** Fetch the currently signed-in user (validates the token). */
    static async me() {
        const data = await apiFetch('/auth/me');
        return data.user;
    }

    /** Change password for the signed-in user. */
    static async changePassword(currentPassword, newPassword) {
        return apiFetch('/auth/password', {
            method: 'PATCH',
            body: { currentPassword, newPassword },
        });
    }

    /** Clear the local session. */
    static async logout() {
        await setToken(null);
    }

    static getToken = getToken;
    static hasSession = hasSession;
}
