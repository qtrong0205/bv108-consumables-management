import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

interface DashboardLayoutProps {
    userRole: string;
    onLogout: () => void;
}

export default function DashboardLayout({ userRole, onLogout }: DashboardLayoutProps) {
    const location = useLocation();

    return (
        <div className="h-screen overflow-hidden bg-tertiary flex">
            <Sidebar currentPath={location.pathname} />
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                <Topbar userRole={userRole} onLogout={onLogout} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
