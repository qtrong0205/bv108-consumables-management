import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import InventoryCatalog from './pages/InventoryCatalog';
import Reports from './pages/Reports';
import { Toaster } from '@/components/ui/toaster';
import SupplierOrder from './pages/SupplierOrder';
import MaterialForecast from './pages/MaterialForecast';
import InvoiceManagement from './pages/InvoiceManagement';
import ProfilePage from './pages/ProfilePage';
import { OrderProvider } from './context/OrderContext';
import { AuthResponse, clearStoredAuth, getStoredAuth, storeAuth } from './services/api';

const formatRoleLabel = (role: string): string => {
    if (role === 'truong_khoa') return 'Trưởng khoa';
    if (role === 'nhan_vien') return 'Nhân viên';
    return role;
};

function App() {
    const initialAuth = getStoredAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialAuth?.token));
    const [userRole, setUserRole] = useState<string>(initialAuth ? formatRoleLabel(initialAuth.user.role) : '');
    const [authSessionKey, setAuthSessionKey] = useState(initialAuth?.token ?? 'guest');

    const handleLogin = (auth: AuthResponse) => {
        storeAuth(auth);
        setIsAuthenticated(true);
        setUserRole(formatRoleLabel(auth.user.role));
        setAuthSessionKey(auth.token);
    };

    const handleLogout = () => {
        clearStoredAuth();
        setIsAuthenticated(false);
        setUserRole('');
        setAuthSessionKey('guest');
    };

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
                            isAuthenticated ? (
                                <Navigate to="/dashboard" replace />
                            ) : (
                                <RegisterPage />
                            )
                        }
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ? (
                                <DashboardLayout userRole={userRole} onLogout={handleLogout} />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    >
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="catalog" element={<InventoryCatalog />} />
                        <Route path="suppliers" element={<SupplierOrder />} />
                        <Route path="forecast" element={<MaterialForecast />} />
                        <Route path="invoices" element={<InvoiceManagement />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="profile" element={<ProfilePage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <Toaster />
            </Router>
        </OrderProvider>
    );
}

export default App;
