import { useState, useMemo, useEffect, useRef } from 'react';
import { OrderRequest } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, Building2, Package } from 'lucide-react';

interface OrderRequestTableProps {
    orders: OrderRequest[];
    selectedOrders: number[];
    setSelectedOrders: (ids: number[]) => void;
}

// Interface cho nhóm Nhà thầu
interface SupplierGroup {
    nhaThau: string;
    orders: OrderRequest[];
    totalDotGoiHang: number;
}

export default function OrderRequestTable({ orders, selectedOrders, setSelectedOrders }: OrderRequestTableProps) {
    // State để track các nhà thầu đang mở rộng
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

    // Refs cho checkbox indeterminate state
    const checkboxRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    // Gom nhóm vật tư theo Nhà thầu
    const supplierGroups = useMemo(() => {
        const groups: { [key: string]: OrderRequest[] } = {};

        orders.forEach(order => {
            if (!groups[order.nhaThau]) {
                groups[order.nhaThau] = [];
            }
            groups[order.nhaThau].push(order);
        });

        return Object.entries(groups).map(([nhaThau, groupOrders]): SupplierGroup => ({
            nhaThau,
            orders: groupOrders,
            totalDotGoiHang: groupOrders.reduce((sum, o) => sum + o.dotGoiHang, 0)
        })).sort((a, b) => a.nhaThau.localeCompare(b.nhaThau));
    }, [orders]);

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
            setSelectedOrders(orders.map(order => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    // Trạng thái checkbox "Chọn tất cả"
    const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
    const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

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

    // Update indeterminate state cho checkbox
    useEffect(() => {
        supplierGroups.forEach(group => {
            const checkbox = checkboxRefs.current[group.nhaThau];
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
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Tổng đợt gọi</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierGroups.map((group) => {
                                const isExpanded = expandedSuppliers.has(group.nhaThau);
                                const checkState = getSupplierCheckState(group);
                                const status = getSupplierStatus(group);

                                return (
                                    <>
                                        {/* Dòng Nhà thầu */}
                                        <tr
                                            key={group.nhaThau}
                                            className="border-b border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleExpand(group.nhaThau)}
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    ref={(el) => { checkboxRefs.current[group.nhaThau] = el; }}
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
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-primary" />
                                                    <span className="font-medium text-sm text-foreground">{group.nhaThau}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    {group.orders.length}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                    {group.totalDotGoiHang}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
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
                                            </td>
                                        </tr>

                                        {/* Bảng con - Danh sách vật tư */}
                                        {isExpanded && (
                                            <tr key={`${group.nhaThau}-items`}>
                                                <td colSpan={6} className="p-0">
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
                                                                    <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">Đợt gọi</th>
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
                                    </>
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
                        <strong className="text-foreground">{orders.length}</strong> vật tư
                    </span>
                </div>
                <div>
                    Đã chọn: <strong className="text-primary">{selectedOrders.length}</strong> vật tư
                </div>
            </div>
        </div>
    );
}
