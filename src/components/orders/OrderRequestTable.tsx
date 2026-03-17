import React, { useState, useMemo, useEffect, useRef } from 'react';
import { OrderRequest } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Building2, Package, CheckCircle, Plus, Funnel, ArrowUpDown, Clock3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortOrder = 'newest' | 'oldest';

const getOrderTime = (order: OrderRequest): number => {
    const t = order.thoiGianPheDuyet ?? order.ngayTao;
    if (!t) return 0;
    return new Date(t).getTime();
};

interface OrderRequestTableProps {
    orders: OrderRequest[];
    unreadGroupKeys: string[];
    onMarkGroupsRead: (groupKeys: string[]) => void;
    selectedOrders: number[];
    setSelectedOrders: (ids: number[]) => void;
}

// Interface cho nhóm Nhà thầu
interface SupplierGroup {
    groupKey: string;
    nhaThau: string;
    approvedAt: string | Date | undefined;
    sortTime: number;
    orders: OrderRequest[];
}

const getApprovalGroupKey = (order: OrderRequest): string => {
    if (order.groupKey && order.groupKey.trim().length > 0) {
        return order.groupKey;
    }

    const t = order.thoiGianPheDuyet ?? order.ngayTao;
    if (!t) return `${order.nhaThau}__id_${order.id}`;

    const parsed = new Date(t).getTime();
    if (Number.isNaN(parsed)) return `${order.nhaThau}__raw_${String(t)}`;

    return `${order.nhaThau}__${new Date(parsed).toISOString()}`;
};

const formatDateTime = (value?: string | Date) => {
    if (!value) return 'Không rõ thời gian duyệt';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Không rõ thời gian duyệt';
    return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function OrderRequestTable({ orders, unreadGroupKeys, onMarkGroupsRead, selectedOrders, setSelectedOrders }: OrderRequestTableProps) {
    // State để track các nhà thầu đang mở rộng
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
    const [selectedCompany, setSelectedCompany] = useState('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

    // Refs cho checkbox indeterminate state
    const checkboxRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Gom nhóm vật tư theo Nhà thầu
    const supplierGroups = useMemo(() => {
        const groups: { [key: string]: SupplierGroup } = {};

        orders.forEach(order => {
            const groupKey = getApprovalGroupKey(order);
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    groupKey,
                    nhaThau: order.nhaThau,
                    approvedAt: order.thoiGianPheDuyet ?? order.ngayTao,
                    sortTime: getOrderTime(order),
                    orders: [],
                };
            }

            groups[groupKey].orders.push(order);
            const orderTime = getOrderTime(order);
            if (orderTime > groups[groupKey].sortTime) {
                groups[groupKey].sortTime = orderTime;
                groups[groupKey].approvedAt = order.thoiGianPheDuyet ?? order.ngayTao;
            }
        });

        return Object.values(groups).map((group): SupplierGroup => ({
            ...group,
            orders: [...group.orders].sort((a, b) =>
                sortOrder === 'newest'
                    ? getOrderTime(b) - getOrderTime(a)
                    : getOrderTime(a) - getOrderTime(b)
            ),
        })).sort((a, b) => {
            return sortOrder === 'newest'
                ? b.sortTime - a.sortTime
                : a.sortTime - b.sortTime;
        });
    }, [orders, sortOrder]);

    const companyOptions = useMemo(() => [...new Set(supplierGroups.map((group) => group.nhaThau))], [supplierGroups]);

    const visibleSupplierGroups = useMemo(() => {
        if (selectedCompany === 'all') {
            return supplierGroups;
        }
        return supplierGroups.filter((group) => group.nhaThau === selectedCompany);
    }, [supplierGroups, selectedCompany]);

    const visibleOrderIds = useMemo(() => {
        return visibleSupplierGroups.flatMap((group) => group.orders.map((order) => order.id));
    }, [visibleSupplierGroups]);

    // Toggle mở rộng nhà thầu
    const toggleExpand = (groupKey: string) => {
        setExpandedSuppliers(prev => {
            const newSet = new Set(prev);
            const isExpanding = !newSet.has(groupKey);
            if (isExpanding) {
                    onMarkGroupsRead([groupKey]);
            }
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    // Kiểm tra trạng thái checkbox của nhà thầu
    const getSupplierCheckState = (group: SupplierGroup) => {
        const orderIds = group.orders.map(o => o.id);
        const selectedCount = orderIds.filter(id => selectedOrders.includes(id)).length;

        if (selectedCount === 0) return 'unchecked';
        if (selectedCount === orderIds.length) return 'checked';
        return 'indeterminate';
    };

    // Xử lý chọn/bỏ chọn nhà thầu (chọn tất cả vật tư của nhà thầu)
    const handleSupplierCheck = (group: SupplierGroup, checked: boolean) => {
        const orderIds = group.orders.map(o => o.id);

        if (checked) {
            // Thêm tất cả vật tư của nhà thầu vào danh sách đã chọn
            const newSelected = [...new Set([...selectedOrders, ...orderIds])];
            setSelectedOrders(newSelected);
        } else {
            // Bỏ tất cả vật tư của nhà thầu khỏi danh sách đã chọn
            setSelectedOrders(selectedOrders.filter(id => !orderIds.includes(id)));
        }
    };

    // Xử lý chọn/bỏ chọn từng vật tư
    const handleOrderCheck = (orderId: number, checked: boolean) => {
        if (checked) {
            setSelectedOrders([...selectedOrders, orderId]);
        } else {
            setSelectedOrders(selectedOrders.filter(id => id !== orderId));
        }
    };

    // Xử lý chọn tất cả
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSelected = [...new Set([...selectedOrders, ...visibleOrderIds])];
            setSelectedOrders(newSelected);
        } else {
            setSelectedOrders(selectedOrders.filter((id) => !visibleOrderIds.includes(id)));
        }
    };

    // Trạng thái checkbox "Chọn tất cả"
    const selectedVisibleCount = visibleOrderIds.filter((id) => selectedOrders.includes(id)).length;
    const allSelected = visibleOrderIds.length > 0 && selectedVisibleCount === visibleOrderIds.length;
    const someSelected = selectedVisibleCount > 0 && selectedVisibleCount < visibleOrderIds.length;

    // Lấy trạng thái của nhà thầu
    const getSupplierStatus = (group: SupplierGroup) => {
        const checkState = getSupplierCheckState(group);
        if (checkState === 'checked') {
            return { label: 'Đã chọn', variant: 'success' as const };
        }
        if (checkState === 'indeterminate') {
            return { label: 'Đang chọn', variant: 'warning' as const };
        }
        return { label: 'Chưa chọn', variant: 'secondary' as const };
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

    // Lấy nguồn gốc của nhóm (nếu tất cả đều từ 1 nguồn)
    const getGroupSource = (group: SupplierGroup) => {
        const sources = new Set(group.orders.map(o => o.source));
        if (sources.size === 1) {
            return Array.from(sources)[0];
        }
        return 'mixed';
    };

    const unreadGroupKeySet = useMemo(() => new Set(unreadGroupKeys), [unreadGroupKeys]);

    // Update indeterminate state cho checkbox
    useEffect(() => {
        supplierGroups.forEach(group => {
            const checkbox = checkboxRefs.current[group.groupKey];
            if (checkbox) {
                const state = getSupplierCheckState(group);
                const input = checkbox.querySelector('input');
                if (input) {
                    (input as HTMLInputElement).indeterminate = state === 'indeterminate';
                }
            }
        });
    }, [selectedOrders, supplierGroups]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                        <SelectTrigger className="w-52 bg-neutral text-foreground border-border h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Mới nhất đến cũ nhất</SelectItem>
                            <SelectItem value="oldest">Cũ nhất đến mới nhất</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Funnel className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                        <SelectTrigger className="w-full max-w-sm bg-neutral text-foreground border-border h-9">
                            <SelectValue placeholder="Lọc theo công ty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả công ty</SelectItem>
                            {companyOptions.map((company) => (
                                <SelectItem key={company} value={company}>
                                    {company}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap w-12">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Chọn tất cả"
                                        className={someSelected ? "data-[state=checked]:bg-primary-foreground/50" : ""}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap w-12"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Số vật tư</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Nguồn gốc</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Trạng thái</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleSupplierGroups.map((group) => {
                                const isExpanded = expandedSuppliers.has(group.groupKey);
                                const checkState = getSupplierCheckState(group);
                                const status = getSupplierStatus(group);

                                return (
                                    <React.Fragment key={group.groupKey}>
                                        {/* Dòng Nhà thầu */}
                                        <tr
                                            className="border-b border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleExpand(group.groupKey)}
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    ref={(el) => { checkboxRefs.current[group.groupKey] = el; }}
                                                    checked={checkState === 'checked'}
                                                    onCheckedChange={(checked: boolean) => handleSupplierCheck(group, checked)}
                                                    aria-label={`Chọn nhà thầu ${group.nhaThau}`}
                                                    className={checkState === 'indeterminate' ? "data-[state=checked]:bg-primary/50" : ""}
                                                />
                                            </td>
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
                                                <div className="flex items-start gap-2">
                                                    <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-foreground truncate" title={group.nhaThau}>{group.nhaThau}</p>
                                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Clock3 className="w-3 h-3 shrink-0" />
                                                            <span className="truncate" title={formatDateTime(group.approvedAt)}>{formatDateTime(group.approvedAt)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    {group.orders.length}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center">
                                                    {getSourceBadge(getGroupSource(group) === 'mixed' ? undefined : getGroupSource(group))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                            ${status.variant === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                            ${status.variant === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                                            ${status.variant === 'secondary' ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
                                                        `}
                                                    >
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {unreadGroupKeySet.has(group.groupKey) && (
                                                    <span
                                                        className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"
                                                        title="Nhóm công ty vừa có đơn mới"
                                                    />
                                                )}
                                            </td>
                                        </tr>

                                        {/* Bảng con - Danh sách vật tư */}
                                        {isExpanded && (
                                            <tr key={`${group.groupKey}-items`}>
                                                <td colSpan={7} className="p-0">
                                                    <div className="bg-background border-l-4 border-primary/30">
                                                        <table className="w-full">
                                                            <thead className="bg-tertiary/50">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap w-12"></th>
                                                                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">STT</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mã VT</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Tên vật tư</th>
                                                                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Hãng SX</th>
                                                                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">ĐVT</th>
                                                                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Quy cách</th>
                                                                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Nguồn</th>
                                                                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Số lượng</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.orders.map((order, index) => (
                                                                    <tr
                                                                        key={order.id}
                                                                        className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedOrders.includes(order.id) ? 'bg-primary/5' : ''
                                                                            }`}
                                                                    >
                                                                        <td className="px-4 py-2">
                                                                            <Checkbox
                                                                                checked={selectedOrders.includes(order.id)}
                                                                                onCheckedChange={(checked: boolean) => handleOrderCheck(order.id, checked)}
                                                                                aria-label={`Chọn vật tư ${order.tenVtytBv}`}
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 text-xs text-muted-foreground text-center">
                                                                            {index + 1}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-xs font-mono text-foreground">
                                                                            {order.maVtytCu}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-foreground">
                                                                            <div className="max-w-[250px]">
                                                                                <p className="font-medium truncate" title={order.tenVtytBv}>
                                                                                    {order.tenVtytBv}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground truncate" title={order.maHieu}>
                                                                                    {order.maHieu}
                                                                                </p>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-xs text-foreground">
                                                                            {order.hangSx}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-xs text-foreground text-center">
                                                                            {order.donViTinh}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-xs text-foreground text-center">
                                                                            {order.quyCach}
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <div className="flex items-center justify-center">
                                                                                {getSourceBadge(order.source)}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-tertiary text-foreground border-border text-[10px] px-1.5 py-0.5 rounded-full"
                                                                            >
                                                                                {order.dotGoiHang}
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
                        <strong className="text-foreground">{visibleSupplierGroups.length}</strong> nhóm duyệt
                    </span>
                    <span>
                        <strong className="text-foreground">{visibleOrderIds.length}</strong> vật tư
                    </span>
                </div>
                <div>
                    Đã chọn: <strong className="text-primary">{selectedVisibleCount}</strong> vật tư
                </div>
            </div>
        </div>
    );
}
