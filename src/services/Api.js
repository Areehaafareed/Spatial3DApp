// services/Api.js
// Central HTTP client for the PixiMesh backend.
// The base URL comes from .env so the app can point at a local server
// during development and the hosted URL (e.g. Netlify) in production.
import AsyncStorage from '@react-native-async-storage/async-storage';

const RAW_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:5000/api';
export const API_URL = RAW_URL.replace(/\/+$/, '');

export const TOKEN_KEY = '@piximesh_session_token';

export async function getToken() {
    try {
        return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function setToken(token) {
    try {
        if (token) {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
        }
    } catch (err) {
        console.error('[Api] Could not persist session token:', err?.message);
    }
}

/**
 * JSON fetch helper with automatic Bearer-token auth.
 * Throws an Error with `.status` and `.data` on non-2xx responses.
 */
export async function apiFetch(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
    const finalHeaders = { 'Content-Type': 'application/json', ...headers };

    if (auth) {
        const token = await getToken();
        if (token) finalHeaders.Authorization = `Bearer ${token}`;
    }

    let res;
    try {
        res = await fetch(`${API_URL}${path}`, {
            method,
            headers: finalHeaders,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (err) {
        throw new Error(`Could not reach the PixiMesh server. Check your connection.`);
    }

    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { raw: text };
    }

    if (!res.ok) {
        const error = new Error(data?.error || `Request failed (${res.status})`);
        error.status = res.status;
        error.data = data;
        throw error;
    }

    return data;
}

/** True when a stored session token exists (does not validate it). */
export async function hasSession() {
    return !!(await getToken());
}
