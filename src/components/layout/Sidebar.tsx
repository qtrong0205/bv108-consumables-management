import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, ShoppingCart, FileText, Settings, LogOut, PhoneCall, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface SidebarProps {
    currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/catalog', label: 'Danh mục vật tư', icon: Package },
        { path: '/suppliers', label: 'Gọi Hàng', icon: PhoneCall },
        { path: '/procurement', label: 'Kế hoạch mua sắm', icon: ClipboardList },
        { path: '/orders', label: 'Quản lý đơn hàng', icon: ShoppingCart },
        { path: '/reports', label: 'Báo cáo', icon: FileText },
        { path: '/forecast', label: 'Dự trù vật tư', icon: Calculator },
    ];

    const bottomItems = [
        { path: '/settings', label: 'Cài đặt', icon: Settings },
    ];

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={toggleMobile}
                aria-label="Toggle menu"
            >
                {isMobileOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
            </Button>

            <aside
                className={cn(
                    'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-200 ease-in-out',
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <div className="p-6 border-b border-primary-foreground/20">
                    <div className="flex items-center gap-3">
                        <img src="./logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
                        <div>
                            <h1 className="text-lg font-semibold text-primary-foreground">Vật Tư Y Tế</h1>
                            <p className="text-xs text-primary-foreground/80">Hệ Thống Quản Lý</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-md transition-colors cursor-pointer text-primary-foreground',
                                    isActive
                                        ? 'bg-primary-foreground/20 font-medium'
                                        : 'hover:bg-primary-foreground/10'
                                )}
                            >
                                <Icon className="w-5 h-5" strokeWidth={2} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-primary-foreground/20 space-y-1">
                    {bottomItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-primary-foreground/10 transition-colors cursor-pointer text-primary-foreground"
                            >
                                <Icon className="w-5 h-5" strokeWidth={2} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </aside>

            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"
                    onClick={toggleMobile}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
