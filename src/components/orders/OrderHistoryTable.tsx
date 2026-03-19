import React, { useState, useMemo, useEffect } from 'react';
import { OrderHistory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Building2, Package, Calendar, CheckCircle2, CheckCircle, Plus } from 'lucide-react';

interface OrderHistoryTableProps {
    orders: OrderHistory[];
}

// Interface cho nhóm Nhà thầu
interface SupplierHistoryGroup {
    nhaThau: string;
    orders: OrderHistory[];
    totalOrders: number;
    latestDate: Date;
}

const orderHistoryUiCache = {
    expandedSuppliers: [] as string[],
};

export default function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
    // State để track các nhà thầu đang mở rộng
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set(orderHistoryUiCache.expandedSuppliers));

    // Gom nhóm vật tư theo Nhà thầu
    const supplierGroups = useMemo(() => {
        const groups: { [key: string]: OrderHistory[] } = {};

        orders.forEach(order => {
            if (!groups[order.nhaThau]) {
                groups[order.nhaThau] = [];
            }
            groups[order.nhaThau].push(order);
        });

        return Object.entries(groups).map(([nhaThau, groupOrders]): SupplierHistoryGroup => ({
            nhaThau,
            orders: groupOrders.sort((a, b) =>
                new Date(b.ngayDatHang).getTime() - new Date(a.ngayDatHang).getTime()
            ),
            totalOrders: groupOrders.length,
            latestDate: new Date(Math.max(...groupOrders.map(o => new Date(o.ngayDatHang).getTime())))
        })).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
    }, [orders]);

    useEffect(() => {
        orderHistoryUiCache.expandedSuppliers = Array.from(expandedSuppliers);
    }, [expandedSuppliers]);

    // Toggle mở rộng nhà thầu
    const toggleExpand = (nhaThau: string) => {
        setExpandedSuppliers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(nhaThau)) {
                newSet.delete(nhaThau);
            } else {
                newSet.add(nhaThau);
            }
            return newSet;
        });
    };

    // Format ngày
    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Lấy badge nguồn gốc đơn hàng
    const getSourceBadge = (source?: string) => {
        if (source === 'manual') {
            return (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[10px] px-2 py-0.5 flex items-center gap-0.5 whitespace-nowrap w-fit">
                    <Plus className="w-2.5 h-2.5" />
                    Thủ công
                </Badge>
            );
        }
        return (
            <Badge className="bg-green-50 text-green-700 border-green-200 border text-[10px] px-2 py-0.5 flex items-center gap-0.5 whitespace-nowrap w-fit">
                <CheckCircle className="w-2.5 h-2.5" />
                Dự trù
            </Badge>
        );
    };

    const getApproverLabel = (order: OrderHistory) => {
        if (order.source === 'manual' && !order.nguoiPheDuyet) {
            return 'Không qua duyệt';
        }
        return order.nguoiPheDuyet || 'Chưa xác định';
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '44px' }} />
                            <col />
                            <col style={{ width: '140px' }} />
                            <col style={{ width: '130px' }} />
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '130px' }} />
                        </colgroup>
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Số vật tư đã gọi</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Lần gọi gần nhất</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Nguồn gốc</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierGroups.map((group) => {
                                const isExpanded = expandedSuppliers.has(group.nhaThau);

                                return (
                                    <React.Fragment key={group.nhaThau}>
                                        {/* Dòng Nhà thầu */}
                                        <tr
                                            className="border-b border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleExpand(group.nhaThau)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center text-muted-foreground">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-primary" />
                                                    <span className="font-medium text-sm text-foreground">{group.nhaThau}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    {group.totalOrders}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {formatDate(group.latestDate).split(' ')[0]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {/* Hiển thị nguồn gốc từ đơn hàng đầu tiên của nhóm */}
                                                {getSourceBadge(group.orders[0]?.source)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className="bg-green-50 text-green-700 border-green-200"
                                                >
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Đã gửi email
                                                </Badge>
                                            </td>
                                        </tr>

                                        {/* Bảng con - Danh sách vật tư đã gọi */}
                                        {isExpanded && (
                                            <tr key={`${group.nhaThau}-items`}>
                                                <td colSpan={6} className="p-0">
                                                    <div className="bg-background border-l-4 border-green-400 overflow-x-auto">
                                                        <table className="w-full min-w-[900px]" style={{ tableLayout: 'fixed' }}>
                                                            <colgroup>
                                                                <col style={{ width: '40px' }} />
                                                                <col style={{ width: '90px' }} />
                                                                <col style={{ width: '220px' }} />
                                                                <col style={{ width: '140px' }} />
                                                                <col style={{ width: '55px' }} />
                                                                <col style={{ width: '90px' }} />
                                                                <col style={{ width: '65px' }} />
                                                                <col style={{ width: '80px' }} />
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '110px' }} />
                                                                <col style={{ width: '110px' }} />
                                                                <col style={{ width: '100px' }} />
                                                            </colgroup>
                                                            <thead className="bg-green-50 dark:bg-green-950/20 border-b border-green-200">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">STT</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Mã VT</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tên vật tư</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Hãng SX</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">ĐVT</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Quy cách</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">SL</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Nguồn</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Ngày gọi</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Người duyệt</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Người gọi</th>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Trạng thái</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.orders.map((order, index) => (
                                                                    <tr
                                                                        key={`${order.id}-${index}`}
                                                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                                                    >
                                                                        <td className="px-3 py-2 text-xs text-muted-foreground text-center">
                                                                            {index + 1}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs font-mono text-foreground truncate" title={order.maVtytCu}>
                                                                            {order.maVtytCu}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground">
                                                                            <p className="font-medium truncate" title={order.tenVtytBv}>{order.tenVtytBv}</p>
                                                                            <p className="text-[11px] text-muted-foreground truncate" title={order.maHieu ?? ''}>{order.maHieu}</p>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground truncate" title={order.hangSx}>
                                                                            {order.hangSx}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground text-center">
                                                                            {order.donViTinh}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground text-center truncate" title={order.quyCach}>
                                                                            {order.quyCach}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs font-semibold text-foreground text-center">
                                                                            {order.dotGoiHang}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex justify-center">{getSourceBadge(order.source)}</div>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground text-center whitespace-nowrap">
                                                                            {formatDate(order.ngayDatHang)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground text-center truncate" title={getApproverLabel(order)}>
                                                                            {getApproverLabel(order)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground text-center truncate" title={order.nguoiDatHang || ''}>
                                                                            {order.nguoiDatHang || 'Chưa xác định'}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-green-100 text-green-700 border-green-300 text-[10px] whitespace-nowrap"
                                                                            >
                                                                                {order.trangThai}
                                                                            </Badge>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Thống kê */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <div className="flex items-center gap-4">
                    <span>
                        <strong className="text-foreground">{supplierGroups.length}</strong> nhà thầu
                    </span>
                    <span>
                        <strong className="text-foreground">{orders.length}</strong> lần gọi hàng
                    </span>
                </div>
            </div>
        </div>
    );
}
