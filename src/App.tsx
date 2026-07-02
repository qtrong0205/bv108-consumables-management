import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import { Toaster } from '@/components/ui/toaster';
import { OrderProvider } from './context/OrderContext';
import {
    AUTH_EXPIRES_AT_KEY,
    AUTH_LAST_ACTIVITY_AT_KEY,
    AUTH_STATE_CHANGED_EVENT,
    AUTH_SESSION_INVALID_EVENT,
    AUTH_TOKEN_KEY,
    AUTH_USER_KEY,
    AuthResponse,
    StoredAuth,
    clearStoredAuth,
    getStoredAuth,
    getStoredAuthLastActivityAt,
    recordAuthActivity,
    storeAuth,
} from './services/api';
import { canCreateUsers, canManageSupplyTasks, canViewInvoices, formatRoleLabel } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const InventoryCatalog = lazy(() => import('./pages/InventoryCatalog'));
const Reports = lazy(() => import('./pages/Reports'));
const SupplierOrder = lazy(() => import('./pages/SupplierOrder'));
const MaterialForecast = lazy(() => import('./pages/MaterialForecast'));
const InvoiceManagement = lazy(() => import('./pages/InvoiceManagement'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TaskManagement = lazy(() => import('./pages/TaskManagement'));

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 15 * 1000;
const SESSION_TIMER_BUFFER_MS = 250;
const SESSION_ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
const SESSION_STORAGE_KEYS = new Set([
    AUTH_TOKEN_KEY,
    AUTH_USER_KEY,
    AUTH_EXPIRES_AT_KEY,
    AUTH_LAST_ACTIVITY_AT_KEY,
]);

const parseTimestamp = (value?: string | null): number => {
    if (!value) {
        return 0;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const isSameAuth = (left: StoredAuth | null, right: StoredAuth | null): boolean => {
    if (left === right) {
        return true;
    }

    if (!left || !right) {
        return false;
    }

    return left.token === right.token
        && left.expiresAt === right.expiresAt
        && left.user.id === right.user.id
        && left.user.username === right.user.username
        && left.user.email === right.user.email
        && left.user.role === right.user.role;
};

type LogoutReason = 'manual' | 'idle' | 'expired' | 'server';

function PageFallback() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
            Đang tải màn hình...
        </div>
    );
}

const withSuspense = (element: JSX.Element) => (
    <Suspense fallback={<PageFallback />}>
        {element}
    </Suspense>
);

function App() {
    const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth());
    const sessionTimeoutRef = useRef<number | null>(null);
    const lastActivityWriteRef = useRef(0);

    const setAuthState = (nextAuth: StoredAuth | null) => {
        setAuth((currentAuth) => (isSameAuth(currentAuth, nextAuth) ? currentAuth : nextAuth));
    };

    const clearSessionTimeout = () => {
        if (sessionTimeoutRef.current !== null) {
            window.clearTimeout(sessionTimeoutRef.current);
            sessionTimeoutRef.current = null;
        }
    };

    const handleLogout = (reason: LogoutReason = 'manual') => {
        clearSessionTimeout();
        clearStoredAuth();
        setAuthState(null);

        if (reason === 'idle') {
            toast({
                variant: 'destructive',
                title: 'Phiên đăng nhập đã hết hạn',
                description: 'Bạn không thao tác trong 30 phút nên hệ thống đã tự đăng xuất.',
            });
            return;
        }

        if (reason === 'expired') {
            toast({
                variant: 'destructive',
                title: 'Phiên đăng nhập đã kết thúc',
                description: 'Phiên làm việc tối đa đã hết. Vui lòng đăng nhập lại.',
            });
            return;
        }

        if (reason === 'server') {
            toast({
                variant: 'destructive',
                title: 'Phiên đăng nhập không còn hợp lệ',
                description: 'Hệ thống yêu cầu bạn đăng nhập lại để tiếp tục.',
            });
        }
    };

    const handleLogin = (auth: AuthResponse) => {
        storeAuth(auth);
        lastActivityWriteRef.current = Date.now();
        setAuthState(getStoredAuth());
    };

    useEffect(() => {
        if (!auth) {
            clearSessionTimeout();
            return;
        }

        const syncSession = () => {
            const currentAuth = getStoredAuth();
            if (!currentAuth) {
                clearSessionTimeout();
                if (parseTimestamp(auth.expiresAt) > 0 && parseTimestamp(auth.expiresAt) <= Date.now()) {
                    handleLogout('expired');
                    return;
                }
                setAuthState(null);
                return;
            }

            const expiresAtTimestamp = parseTimestamp(currentAuth.expiresAt);
            const lastActivityTimestamp = parseTimestamp(getStoredAuthLastActivityAt()) || Date.now();
            const now = Date.now();

            if (expiresAtTimestamp <= now) {
                handleLogout('expired');
                return;
            }

            if (lastActivityTimestamp + IDLE_TIMEOUT_MS <= now) {
                handleLogout('idle');
                return;
            }

            const nextDeadline = Math.min(expiresAtTimestamp, lastActivityTimestamp + IDLE_TIMEOUT_MS);
            clearSessionTimeout();

            // Keep the client-side session aligned with both the idle timeout and JWT expiry.
            sessionTimeoutRef.current = window.setTimeout(() => {
                syncSession();
            }, Math.max(0, nextDeadline - now) + SESSION_TIMER_BUFFER_MS);

            setAuthState(currentAuth);
        };

        const handleActivity = () => {
            if (!getStoredAuth()) {
                syncSession();
                return;
            }

            const now = Date.now();
            if (now - lastActivityWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) {
                return;
            }

            lastActivityWriteRef.current = now;
            recordAuthActivity(new Date(now).toISOString());
            syncSession();
        };

        const handleFocus = () => {
            lastActivityWriteRef.current = 0;
            syncSession();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }

            lastActivityWriteRef.current = 0;
            syncSession();
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key && !SESSION_STORAGE_KEYS.has(event.key)) {
                return;
            }

            syncSession();
        };

        const handleSessionInvalid = () => {
            handleLogout('server');
        };

        const handleAuthStateChanged = () => {
            const currentAuth = getStoredAuth();
            lastActivityWriteRef.current = 0;

            if (!currentAuth) {
                clearSessionTimeout();
                setAuthState(null);
                return;
            }

            setAuthState(currentAuth);
        };

        syncSession();
        SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleActivity, { passive: true });
        });
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleStorage);
        window.addEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
        window.addEventListener(AUTH_SESSION_INVALID_EVENT, handleSessionInvalid);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearSessionTimeout();
            SESSION_ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleActivity);
            });
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(AUTH_STATE_CHANGED_EVENT, handleAuthStateChanged);
            window.removeEventListener(AUTH_SESSION_INVALID_EVENT, handleSessionInvalid);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [auth]);

    const isAuthenticated = Boolean(auth?.token);
    const userRole = auth?.user.role ?? '';
    const user = auth?.user;
    const authSessionKey = auth?.token ?? 'guest';

    return (
        <OrderProvider key={authSessionKey}>
            <Router>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            isAuthenticated ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <LoginPage onLogin={handleLogin} />
                            )
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            !isAuthenticated ? (
                                <Navigate to="/login" replace />
                            ) : canCreateUsers(userRole) ? (
                                <RegisterPage />
                            ) : (
                                <Navigate to="/profile" replace />
                            )
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ? (
                                <DashboardLayout userRole={formatRoleLabel(userRole)} user={user} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    >
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={withSuspense(<Dashboard />)} />
                        <Route path="catalog" element={withSuspense(<InventoryCatalog />)} />
                        <Route path="suppliers" element={withSuspense(<SupplierOrder />)} />
                        <Route path="forecast" element={withSuspense(<MaterialForecast />)} />
                        <Route
                            path="invoices"
                            element={canViewInvoices(userRole) ? withSuspense(<InvoiceManagement />) : <Navigate to="/dashboard" replace />}
                        />
                        <Route
                            path="tasks"
                            element={canManageSupplyTasks(userRole) ? withSuspense(<TaskManagement />) : <Navigate to="/dashboard" replace />}
                        />
                        <Route path="reports" element={withSuspense(<Reports />)} />
                        <Route path="profile" element={withSuspense(<ProfilePage />)} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <Toaster />
            </Router>
        </OrderProvider>
    );
}

export default App;
