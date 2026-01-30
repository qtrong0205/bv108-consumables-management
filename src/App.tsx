import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import InventoryCatalog from './pages/InventoryCatalog';
import ProcurementPlanning from './pages/ProcurementPlanning';
import OrderManagement from './pages/OrderManagement';
import Reports from './pages/Reports';
import { Toaster } from '@/components/ui/toaster';
import SupplierOrder from './pages/SupplierOrder';
import MaterialForecast from './pages/MaterialForecast';
import InvoiceManagement from './pages/InvoiceManagement';
import { OrderProvider } from './context/OrderContext';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string>('');

    const handleLogin = (role: string) => {
        setIsAuthenticated(true);
        setUserRole(role);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserRole('');
    };

    return (
        <OrderProvider>
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
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
                <Toaster />
            </Router>
        </OrderProvider>
    );
}

export default App;
