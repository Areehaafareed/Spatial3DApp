// services/ProfileService.js
// Profile data (user info + scan/storage stats) from the PixiMesh API.
import { apiFetch } from './Api';

export class ProfileService {
    /**
     * Returns { user, stats: { models, storageKb, storageLimitKb, exports } }
     */
    static async getProfile() {
        return apiFetch('/profile');
    }

    /** Update the signed-in user's name and/or email. */
    static async updateProfile(patch) {
        const data = await apiFetch('/profile', { method: 'PATCH', body: patch });
        return data.user;
    }

    /** Current subscription state. */
    static async getPaymentStatus() {
        return apiFetch('/payments/status');
    }
}
