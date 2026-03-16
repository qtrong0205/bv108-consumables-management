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
        <div className="min-h-screen bg-tertiary flex">
            <Sidebar currentPath={location.pathname} />
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                <Topbar userRole={userRole} onLogout={onLogout} />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
