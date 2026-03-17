import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopbarProps {
    userRole: string;
    onLogout: () => void;
}

export default function Topbar({ userRole, onLogout }: TopbarProps) {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-40 h-16 bg-neutral border-b border-border flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-6 flex-1">
                <h2 className="text-lg font-semibold text-foreground hidden sm:block">Bệnh Viện TWQĐ 108</h2>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-foreground hover:bg-muted"
                    aria-label="Notifications"
                >
                    <Bell className="w-5 h-5" strokeWidth={2} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-foreground hover:bg-muted"
                            aria-label="User menu"
                        >
                            <User className="w-5 h-5" strokeWidth={2} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-foreground">
                            <div className="text-sm font-medium">Tài khoản</div>
                            <div className="text-xs text-muted-foreground">{userRole}</div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/profile')} className="text-foreground cursor-pointer">Hồ sơ</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground cursor-pointer">Cài đặt</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onLogout} className="text-destructive cursor-pointer">
                            Đăng xuất
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
