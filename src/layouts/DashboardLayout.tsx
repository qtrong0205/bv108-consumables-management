import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { AuthUser } from '@/services/api';

interface DashboardLayoutProps {
    userRole: string;
    user?: AuthUser;
    onLogout: () => void;
}

export default function DashboardLayout({ userRole, user, onLogout }: DashboardLayoutProps) {
    const location = useLocation();

    return (
        <div className="h-screen overflow-hidden bg-tertiary flex">
            <Sidebar currentPath={location.pathname} />
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                <Topbar userRole={userRole} user={user} onLogout={onLogout} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
