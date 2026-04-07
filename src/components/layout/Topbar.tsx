import { useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityNotification, useOrder } from '@/context/OrderContext';
import { AuthUser } from '@/services/api';

interface TopbarProps {
    userRole: string;
    user?: AuthUser;
    onLogout: () => void;
}

const formatNotificationTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Vừa xong';
    }

    return parsed.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false,
    });
};

const formatNotificationSummary = (notification: ActivityNotification) => {
    const actor = notification.actorName || 'Hệ thống';
    const count = notification.count && notification.count > 0 ? notification.count : undefined;
    const monthYear = notification.month && notification.year
        ? ` (tháng ${notification.month}/${notification.year})`
        : '';

    switch (notification.action) {
        case 'forecast.edited':
            return {
                title: 'Sửa Dự Trù',
                description: `${actor} đã sửa dự trù${count ? ` (${count} mục)` : ''}${monthYear}.`,
            };
        case 'forecast.approved':
            return {
                title: 'Duyệt Dự Trù',
                description: `${actor} đã duyệt dự trù${count ? ` (${count} mục)` : ''}${monthYear}.`,
            };
        case 'forecast.rejected':
            return {
                title: 'Từ Chối Dự Trù',
                description: `${actor} đã từ chối dự trù${count ? ` (${count} mục)` : ''}${monthYear}.`,
            };
        case 'forecast.submitted':
            return {
                title: 'Đã Gửi CHK',
                description: `${actor} đã gửi dự trù lên CHK${count ? ` (${count} mục)` : ''}${monthYear}.`,
            };
        case 'forecast.unsubmitted':
            return {
                title: 'Thủ Kho Hủy Duyệt',
                description: `${actor} đã hủy duyệt gửi dự trù${count ? ` (${count} mục)` : ''}${monthYear}.`,
            };
        case 'orders.pending_created':
            return {
                title: 'Thêm Vào Gọi Hàng',
                description: `${actor} đã thêm vật tư vào danh sách gọi hàng${count ? ` (${count} mục)` : ''}.`,
            };
        case 'orders.manual_created':
            return {
                title: 'Tạo Đơn Hàng',
                description: `${actor} đã tạo đơn hàng thủ công${count ? ` (${count} mục)` : ''}.`,
            };
        case 'orders.placed':
            return {
                title: 'Đặt Hàng',
                description: `${actor} đã đặt hàng${count ? ` (${count} vật tư)` : ''}.`,
            };
        case 'invoices.note_saved':
            return {
                title: 'Cập Nhật Ghi Chú Hóa Đơn',
                description: `${actor} đã cập nhật ghi chú hóa đơn${count ? ` (${count} dòng)` : ''}.`,
            };
        case 'invoices.approved':
            return {
                title: 'Duyệt Hóa Đơn',
                description: `${actor} đã duyệt hóa đơn${count ? ` (${count} dòng)` : ''}.`,
            };
        default:
            return {
                title: 'Cập Nhật Dữ Liệu',
                description: `${actor} đã cập nhật dữ liệu hệ thống.`,
            };
    }
};

export default function Topbar({ userRole, user, onLogout }: TopbarProps) {
    const navigate = useNavigate();
    const { activityNotifications, unreadActivityCount, markActivityNotificationsRead } = useOrder();
    const hasUnreadActivity = unreadActivityCount > 0;
    const visibleNotifications = useMemo(
        () => activityNotifications.slice(0, 30),
        [activityNotifications],
    );

    // Display user name with fallback: username -> email
    const displayUserName = user?.username || user?.email || 'Người dùng';

    return (
        <header className="sticky top-0 z-40 h-16 bg-neutral border-b border-border flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-6 flex-1">
                <h2 className="text-lg font-semibold text-foreground hidden sm:block">Bệnh Viện TWQĐ 108</h2>
            </div>

            <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                    <DropdownMenu
                        onOpenChange={(open) => {
                            if (open) {
                                markActivityNotificationsRead();
                            }
                        }}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-foreground hover:bg-muted"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5" strokeWidth={2} />
                                {hasUnreadActivity && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[380px] p-0">
                            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                                <div className="text-sm font-semibold text-foreground">Thông báo</div>
                                <div className="text-xs text-muted-foreground">
                                    {unreadActivityCount > 0 ? `${unreadActivityCount} mới` : 'Đã đọc hết'}
                                </div>
                            </div>

                            <ScrollArea className="max-h-[420px]">
                                {visibleNotifications.length === 0 ? (
                                    <div className="px-4 py-8 text-sm text-center text-muted-foreground">
                                        Chưa có thông báo mới
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/70">
                                        {visibleNotifications.map((notification) => {
                                            const summary = formatNotificationSummary(notification);
                                            return (
                                                <div key={notification.id} className="px-3 py-2.5">
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {summary.title}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                                        {summary.description}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                                        {formatNotificationTime(notification.createdAt)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                <div className="text-sm font-medium">{displayUserName}</div>
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

                <span className="text-xs text-muted-foreground text-center">
                    {displayUserName}
                </span>
            </div>
        </header>
    );
}
