import React, { useState, useMemo, useEffect } from 'react';
import { OrderHistory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Building2, Package, Calendar, CheckCircle2, CheckCircle, Plus } from 'lucide-react';
import { buildOrderHistoryGroups, OrderBatchHistoryGroup, OrderHistoryGroupSource } from './orderHistoryUtils';

interface OrderHistoryTableProps {
    orders: OrderHistory[];
}

const orderHistoryUiCache = {
    expandedGroups: [] as string[],
};

const formatDateTime = (date: string | Date | undefined) => {
    if (!date) return 'Không rõ thời gian đặt hàng';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
        return 'Không rõ thời gian đặt hàng';
    }

    return parsed.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(orderHistoryUiCache.expandedGroups));

    const historyGroups = useMemo(() => buildOrderHistoryGroups(orders), [orders]);

    const uniqueCompanyCount = useMemo(
        () => new Set(historyGroups.map((group) => group.nhaThau)).size,
        [historyGroups],
    );

    useEffect(() => {
        orderHistoryUiCache.expandedGroups = Array.from(expandedGroups);
    }, [expandedGroups]);

    const toggleExpand = (groupKey: string) => {
        setExpandedGroups((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    const getSourceBadge = (source?: OrderHistoryGroupSource) => {
        if (source === 'mixed') {
            return (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px] px-2 py-0.5 whitespace-nowrap w-fit">
                    Hỗn hợp
                </Badge>
            );
        }

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

    const getBatchStatusBadge = (group: OrderBatchHistoryGroup) => {
        const sentCount = group.orders.filter((order) => order.emailSent).length;
        if (sentCount === group.orders.length) {
            return (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Đã gửi email
                </Badge>
            );
        }

        if (sentCount > 0) {
            return (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Gửi một phần
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                Chưa gửi email
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
                            <col style={{ width: '110px' }} />
                            <col style={{ width: '140px' }} />
                        </colgroup>
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Số vật tư đã gọi</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Nguồn gốc</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyGroups.map((group) => {
                                const isExpanded = expandedGroups.has(group.groupKey);

                                return (
                                    <React.Fragment key={group.groupKey}>
                                        <tr
                                            className="border-b border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleExpand(group.groupKey)}
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
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-foreground truncate" title={group.nhaThau}>{group.nhaThau}</p>
                                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Calendar className="w-3 h-3 shrink-0" />
                                                            <span className="truncate" title={formatDateTime(group.batchTime)}>{formatDateTime(group.batchTime)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    {group.totalOrders}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center">
                                                    {getSourceBadge(group.source)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getBatchStatusBadge(group)}
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr key={`${group.groupKey}-items`}>
                                                <td colSpan={5} className="p-0">
                                                    <div className="bg-background border-l-4 border-green-400 overflow-x-auto">
                                                        <table className="w-full min-w-[980px]" style={{ tableLayout: 'fixed' }}>
                                                            <colgroup>
                                                                <col style={{ width: '40px' }} />
                                                                <col style={{ width: '90px' }} />
                                                                <col style={{ width: '260px' }} />
                                                                <col style={{ width: '170px' }} />
                                                                <col style={{ width: '70px' }} />
                                                                <col style={{ width: '90px' }} />
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '110px' }} />
                                                                <col style={{ width: '110px' }} />
                                                                <col style={{ width: '110px' }} />
                                                            </colgroup>
                                                            <thead className="bg-green-50 dark:bg-green-950/20 border-b border-green-200">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">STT</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Mã VT</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tên vật tư</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Hãng SX</th>
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
                                                                        key={`${group.groupKey}-${order.id}`}
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
                                                                        <td className="px-3 py-2 text-xs font-semibold text-foreground text-center">
                                                                            {order.dotGoiHang}
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <div className="flex justify-center">{getSourceBadge(order.source)}</div>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-xs text-foreground text-center whitespace-nowrap">
                                                                            {formatDateTime(order.ngayDatHang)}
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

            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <div className="flex items-center gap-4 flex-wrap">
                    <span>
                        <strong className="text-foreground">{historyGroups.length}</strong> đơn hàng
                    </span>
                    <span>
                        <strong className="text-foreground">{uniqueCompanyCount}</strong> nhà thầu
                    </span>
                    <span>
                        <strong className="text-foreground">{orders.length}</strong> vật tư đã gọi
                    </span>
                </div>
            </div>
        </div>
    );
}
