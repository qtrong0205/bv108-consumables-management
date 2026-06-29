import { useEffect, useState } from 'react';
import {
    AUTH_EXPIRES_AT_KEY,
    AUTH_LAST_ACTIVITY_AT_KEY,
    AUTH_STATE_CHANGED_EVENT,
    AUTH_TOKEN_KEY,
    AUTH_USER_KEY,
    StoredAuth,
    getStoredAuth,
} from '@/services/api';

const AUTH_STORAGE_KEYS = new Set([
    AUTH_TOKEN_KEY,
    AUTH_USER_KEY,
    AUTH_EXPIRES_AT_KEY,
    AUTH_LAST_ACTIVITY_AT_KEY,
]);

export const useStoredAuth = (): StoredAuth | null => {
    const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth());

    useEffect(() => {
        const syncAuth = () => {
            setAuth(getStoredAuth());
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key && !AUTH_STORAGE_KEYS.has(event.key)) {
                return;
            }

            syncAuth();
        };

        syncAuth();
        window.addEventListener('storage', handleStorage);
        window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuth);

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuth);
        };
    }, []);

    return auth;
};
