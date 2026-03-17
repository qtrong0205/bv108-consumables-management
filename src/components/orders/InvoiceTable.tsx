import React, { useState, useMemo } from 'react';
import { OrderHistory, Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileX,
    Package,
} from 'lucide-react';

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
    latestDate: Date;
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
            latestDate: new Date(Math.max(...results.map(r => new Date(r.order.ngayDatHang).getTime()))),
            stats: {
                matched: results.filter(r => r.status === 'matched').length,
                mismatched: results.filter(r => r.status === 'mismatched').length,
                noInvoice: results.filter(r => r.status === 'no-invoice').length,
            },
        })).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
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

    const formatDate = (date: string | Date) => {
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
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-[10px] whitespace-nowrap">
                        Khớp
                    </Badge>
                );
            case 'mismatched':
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-[10px] whitespace-nowrap">
                        Sai lệch
                    </Badge>
                );
            case 'no-invoice':
                return (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] whitespace-nowrap">
                        Chưa có HĐ
                    </Badge>
                );
        }
    };

    const getGroupStatus = (group: SupplierGroup) => {
        if (group.stats.mismatched > 0) {
            return (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Sai lệch
                </Badge>
            );
        }
        if (group.stats.noInvoice > 0) {
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <FileX className="w-3 h-3 mr-1" />
                    Chưa đủ HĐ
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Khớp hoàn toàn
            </Badge>
        );
    };

    const getGroupStatusHint = (group: SupplierGroup) => {
        if (group.stats.mismatched > 0) {
            return 'Có dòng sai số lượng';
        }
        if (group.stats.noInvoice > 0) {
            return 'Thiếu hóa đơn một phần';
        }
        return 'Tất cả dòng đã khớp';
    };

    const toPercent = (count: number, total: number) => {
        if (total <= 0) return 0;
        return Math.round((count / total) * 100);
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

            {/* Table */}
            <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '44px' }} />
                            <col />
                            <col style={{ width: '130px' }} />
                            <col style={{ width: '150px' }} />
                            <col style={{ width: '170px' }} />
                            <col style={{ width: '260px' }} />
                        </colgroup>
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Số vật tư đối chiếu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Lần đặt gần nhất</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Trạng thái chính</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Tỷ lệ đối chiếu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierGroups.map((group) => {
                                const isExpanded = expandedSuppliers.has(group.nhaThau);

                                return (
                                    <React.Fragment key={group.nhaThau}>
                                        {/* Dòng nhà thầu */}
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
                                                    {group.results.length}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(group.latestDate).split(' ')[0]}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground">mới nhất</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    {getGroupStatus(group)}
                                                    <span className="text-[11px] text-muted-foreground">{getGroupStatusHint(group)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="space-y-2">
                                                    <div className="h-2.5 w-full max-w-[220px] mx-auto rounded-full bg-muted overflow-hidden flex">
                                                        <div
                                                            className="bg-green-500"
                                                            style={{ width: `${toPercent(group.stats.matched, group.results.length)}%` }}
                                                        />
                                                        <div
                                                            className="bg-red-500"
                                                            style={{ width: `${toPercent(group.stats.mismatched, group.results.length)}%` }}
                                                        />
                                                        <div
                                                            className="bg-amber-400"
                                                            style={{ width: `${toPercent(group.stats.noInvoice, group.results.length)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                                                        <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                                                            Khớp {group.stats.matched}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                                            Lệch {group.stats.mismatched}
                                                        </span>
                                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                            Chưa HĐ {group.stats.noInvoice}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Chi tiết */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <div className="bg-background border-l-4 border-blue-400 overflow-x-auto">
                                                        <table className="w-full min-w-[980px]" style={{ tableLayout: 'fixed' }}>
                                                            <colgroup>
                                                                <col style={{ width: '90px' }} />
                                                                <col style={{ width: '260px' }} />
                                                                <col style={{ width: '100px' }} />
                                                                <col style={{ width: '140px' }} />
                                                                <col style={{ width: '90px' }} />
                                                                <col style={{ width: '100px' }} />
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '100px' }} />
                                                            </colgroup>
                                                            <thead className="bg-blue-50 border-b border-blue-200">
                                                                <tr className="text-xs">
                                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mã QL</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tên vật tư</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL đặt</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Mã HĐ</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL HĐ</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Chênh lệch</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Ngày đặt</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Trạng thái</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.results.map((result, idx) => (
                                                                    <tr
                                                                        key={idx}
                                                                        className={`border-b border-border/50 text-xs hover:bg-muted/30 ${
                                                                            result.status === 'mismatched'
                                                                                ? 'bg-red-50/60'
                                                                                : result.status === 'no-invoice'
                                                                                    ? 'bg-amber-50/50'
                                                                                    : ''
                                                                        }`}
                                                                    >
                                                                        <td className="px-3 py-2">
                                                                            <span className="font-mono text-xs truncate" title={result.order.maQuanLy}>
                                                                                {result.order.maQuanLy}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2">
                                                                            <div>
                                                                                <div className="font-medium text-foreground truncate" title={result.order.tenVtytBv}>
                                                                                    {result.order.tenVtytBv}
                                                                                </div>
                                                                                <div className="text-[11px] text-muted-foreground truncate" title={`${result.order.hangSx} • ${result.order.quyCach}`}>
                                                                                    {result.order.hangSx} • {result.order.quyCach}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            <span className="font-semibold">
                                                                                {result.order.dotGoiHang}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                                {result.order.donViTinh}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            {result.invoice ? (
                                                                                <span className="font-mono text-[11px] bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                                                    {result.invoice.maHoaDon}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
                                                                            {result.invoice ? (
                                                                                <span className="font-semibold">
                                                                                    {result.invoice.soLuong}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
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
                                                                        <td className="px-3 py-2 text-center whitespace-nowrap">
                                                                            {formatDate(result.order.ngayDatHang)}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-center">
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

            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <div className="flex items-center gap-4">
                    <span>
                        <strong className="text-foreground">{supplierGroups.length}</strong> nhà thầu
                    </span>
                    <span>
                        <strong className="text-foreground">{reconciliations.length}</strong> dòng đối chiếu
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-green-700">
                        Khớp: <strong>{totalStats.matched}</strong>
                    </span>
                    <span className="text-red-700">
                        Sai lệch: <strong>{totalStats.mismatched}</strong>
                    </span>
                    <span className="text-amber-700">
                        Chưa HĐ: <strong>{totalStats.noInvoice}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
