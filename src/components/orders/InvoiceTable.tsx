import React, { useState, useMemo } from 'react';
import { OrderHistory, Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface InvoiceTableProps {
    orders: OrderHistory[];
    invoices: Invoice[];
}

// Kết quả đối chiếu
interface ReconciliationResult {
    order: OrderHistory;
    invoice?: Invoice;
    status: 'matched' | 'mismatched' | 'no-invoice';
    difference?: number;
}

interface SupplierGroup {
    nhaThau: string;
    results: ReconciliationResult[];
    stats: {
        matched: number;
        mismatched: number;
        noInvoice: number;
    };
}

export default function InvoiceTable({ orders, invoices }: InvoiceTableProps) {
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // Đối chiếu đơn hàng với hóa đơn
    const reconciliations = useMemo((): ReconciliationResult[] => {
        // Chỉ lấy đơn đã gửi email
        const emailSentOrders = orders.filter(o => o.emailSent === true);

        return emailSentOrders.map(order => {
            // Tìm hóa đơn tương ứng theo maQuanLy
            const invoice = invoices.find(inv => inv.maQuanLy === order.maQuanLy);

            if (!invoice) {
                return {
                    order,
                    status: 'no-invoice' as const,
                };
            }

            // So sánh số lượng
            const diff = invoice.soLuong - order.dotGoiHang;
            const status: 'matched' | 'mismatched' = diff === 0 ? 'matched' : 'mismatched';

            return {
                order,
                invoice,
                status,
                difference: diff !== 0 ? diff : undefined,
            };
        });
    }, [orders, invoices]);

    // Gom nhóm theo nhà thầu
    const supplierGroups = useMemo(() => {
        let filtered = reconciliations;

        // Tìm kiếm
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.order.maQuanLy.toLowerCase().includes(term) ||
                r.order.tenVtytBv.toLowerCase().includes(term) ||
                r.order.nhaThau.toLowerCase().includes(term) ||
                (r.invoice?.maHoaDon || '').toLowerCase().includes(term)
            );
        }

        // Gom nhóm
        const groups: { [key: string]: ReconciliationResult[] } = {};
        filtered.forEach(r => {
            if (!groups[r.order.nhaThau]) {
                groups[r.order.nhaThau] = [];
            }
            groups[r.order.nhaThau].push(r);
        });

        return Object.entries(groups).map(([nhaThau, results]): SupplierGroup => ({
            nhaThau,
            results,
            stats: {
                matched: results.filter(r => r.status === 'matched').length,
                mismatched: results.filter(r => r.status === 'mismatched').length,
                noInvoice: results.filter(r => r.status === 'no-invoice').length,
            },
        })).sort((a, b) => a.nhaThau.localeCompare(b.nhaThau));
    }, [reconciliations, searchTerm]);

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

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const renderStatus = (status: ReconciliationResult['status']) => {
        switch (status) {
            case 'matched':
                return (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Khớp
                    </Badge>
                );
            case 'mismatched':
                return (
                    <Badge variant="destructive">
                        Sai lệch
                    </Badge>
                );
            case 'no-invoice':
                return (
                    <Badge variant="outline">
                        Chưa có HĐ
                    </Badge>
                );
        }
    };

    // Thống kê tổng
    const totalStats = useMemo(() => {
        return supplierGroups.reduce((acc, group) => ({
            matched: acc.matched + group.stats.matched,
            mismatched: acc.mismatched + group.stats.mismatched,
            noInvoice: acc.noInvoice + group.stats.noInvoice,
        }), { matched: 0, mismatched: 0, noInvoice: 0 });
    }, [supplierGroups]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Input
                    placeholder="Tìm theo mã đơn, tên vật tư, nhà thầu, mã hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                    <div className="text-2xl font-bold text-green-700">{totalStats.matched}</div>
                    <div className="text-sm text-green-600">Khớp</div>
                </div>
                <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                    <div className="text-2xl font-bold text-red-700">{totalStats.mismatched}</div>
                    <div className="text-sm text-red-600">Sai lệch</div>
                </div>
                <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                    <div className="text-2xl font-bold text-amber-700">{totalStats.noInvoice}</div>
                    <div className="text-sm text-amber-600">Chưa có HĐ</div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium w-12"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Tổng</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Khớp</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Lệch</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Chưa HĐ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierGroups.map((group) => {
                                const isExpanded = expandedSuppliers.has(group.nhaThau);

                                return (
                                    <React.Fragment key={group.nhaThau}>
                                        {/* Dòng nhà thầu */}
                                        <tr
                                            className="border-b bg-muted/30 hover:bg-muted/50 cursor-pointer"
                                            onClick={() => toggleExpand(group.nhaThau)}
                                        >
                                            <td className="px-4 py-3 text-center">
                                                {isExpanded ? '▼' : '▶'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium">{group.nhaThau}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">
                                                {group.results.length}
                                            </td>
                                            <td className="px-4 py-3 text-center text-green-600 font-semibold">
                                                {group.stats.matched}
                                            </td>
                                            <td className="px-4 py-3 text-center text-red-600 font-semibold">
                                                {group.stats.mismatched}
                                            </td>
                                            <td className="px-4 py-3 text-center text-amber-600 font-semibold">
                                                {group.stats.noInvoice}
                                            </td>
                                        </tr>

                                        {/* Chi tiết */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <div className="bg-muted/10">
                                                        <table className="w-full">
                                                            <thead className="bg-muted/50">
                                                                <tr className="text-xs">
                                                                    <th className="px-4 py-2 text-left font-medium">Mã QL</th>
                                                                    <th className="px-4 py-2 text-left font-medium">Tên vật tư</th>
                                                                    <th className="px-4 py-2 text-center font-medium">SL đặt</th>
                                                                    <th className="px-4 py-2 text-center font-medium">Mã HĐ</th>
                                                                    <th className="px-4 py-2 text-center font-medium">SL HĐ</th>
                                                                    <th className="px-4 py-2 text-center font-medium">Chênh lệch</th>
                                                                    <th className="px-4 py-2 text-center font-medium">Ngày đặt</th>
                                                                    <th className="px-4 py-2 text-center font-medium">Trạng thái</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.results.map((result, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className={`border-b text-sm hover:bg-muted/30 ${
                                                                            result.status === 'mismatched' ? 'bg-red-50/50' : ''
                                                                        }`}
                                                                    >
                                                                        <td className="px-4 py-3">
                                                                            <span className="font-mono text-xs">
                                                                                {result.order.maQuanLy}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            <div>
                                                                                <div className="font-medium">
                                                                                    {result.order.tenVtytBv}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {result.order.hangSx} • {result.order.quyCach}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <span className="font-semibold">
                                                                                {result.order.dotGoiHang}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                                {result.order.donViTinh}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {result.invoice ? (
                                                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                                    {result.invoice.maHoaDon}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {result.invoice ? (
                                                                                <span className="font-semibold">
                                                                                    {result.invoice.soLuong}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {result.difference !== undefined ? (
                                                                                <span
                                                                                    className={`font-bold ${
                                                                                        result.difference > 0
                                                                                            ? 'text-orange-600'
                                                                                            : 'text-red-600'
                                                                                    }`}
                                                                                >
                                                                                    {result.difference > 0 ? '+' : ''}
                                                                                    {result.difference}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-xs">
                                                                            {formatDate(result.order.ngayDatHang)}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            {renderStatus(result.status)}
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

            {supplierGroups.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    {searchTerm
                        ? 'Không tìm thấy kết quả'
                        : 'Chưa có đơn hàng nào được gửi email'}
                </div>
            )}
        </div>
    );
}
