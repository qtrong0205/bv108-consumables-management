import React, { useState, useMemo } from 'react';
import { HoaDonUBot, OrderHistory } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Building2,
    Calendar,
    ChevronDown,
    ChevronRight,
    Package,
} from 'lucide-react';

interface InvoiceTableProps {
    orders: OrderHistory[];
    hoaDons: HoaDonUBot[];
}

type DetailStatus = 'matched' | 'enough' | 'shortage' | 'surplus' | 'material-mismatch' | 'no-invoice';

interface ReconciliationResult {
    order: OrderHistory;
    invoice?: HoaDonUBot;
    hasInvoice: boolean;
    quantityDiff?: number;
    detailStatus: DetailStatus;
    detailNote?: string;
    matchScore?: number;
}

interface SupplierGroup {
    nhaThau: string;
    results: ReconciliationResult[];
    latestDate: Date;
    stats: {
        hasInvoice: number;
        noInvoice: number;
    };
}

interface InvoiceLine {
    supplierKey: string;
    codeKey: string;
    nameKey: string;
    unitKey: string;
    invoiceDate: Date | null;
    data: HoaDonUBot;
}

const normalize = (value?: string | null) => {
    if (!value) return '';
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

const parseDate = (value: string | Date) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const tokenSimilarity = (a: string, b: string) => {
    const aa = normalize(a);
    const bb = normalize(b);
    if (!aa || !bb) return 0;
    if (aa === bb) return 1;
    if (aa.includes(bb) || bb.includes(aa)) return 0.9;

    const aTokens = aa.split(' ').filter(Boolean);
    const bTokens = bb.split(' ').filter(Boolean);
    if (aTokens.length === 0 || bTokens.length === 0) return 0;

    let hit = 0;
    for (const t of aTokens) {
        if (bTokens.includes(t)) hit += 1;
    }
    return hit / Math.max(aTokens.length, bTokens.length);
};

export default function InvoiceTable({ orders, hoaDons }: InvoiceTableProps) {
    const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
    const [selectedDetail, setSelectedDetail] = useState<ReconciliationResult | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterInvoiceStatus, setFilterInvoiceStatus] = useState<'all' | 'hasInvoice' | 'noInvoice'>('all');

    const invoiceLinesBySupplier = useMemo(() => {
        const grouped: Record<string, InvoiceLine[]> = {};

        hoaDons.forEach((hoaDon) => {
            const supplierKey = normalize(hoaDon.congTy);
            const line: InvoiceLine = {
                supplierKey,
                codeKey: normalize(hoaDon.maHangHoa),
                nameKey: normalize(hoaDon.tenHangHoa),
                unitKey: normalize(hoaDon.donViTinh),
                invoiceDate: parseDate(hoaDon.ngayHoaDon),
                data: hoaDon,
            };

            if (!grouped[supplierKey]) grouped[supplierKey] = [];
            grouped[supplierKey].push(line);
        });

        return grouped;
    }, [hoaDons]);

    const reconciliations = useMemo((): ReconciliationResult[] => {
        const usedInvoiceRows = new Set<number>();
        const emailSentOrders = orders.filter((o) => o.emailSent === true);

        return emailSentOrders.map((order) => {
            const supplierKey = normalize(order.nhaThau);
            const candidates = invoiceLinesBySupplier[supplierKey] || [];

            if (candidates.length === 0) {
                return {
                    order,
                    hasInvoice: false,
                    detailStatus: 'no-invoice',
                };
            }

            const orderCode = normalize(order.maVtytCu);
            const orderName = normalize(order.tenVtytBv);
            const orderUnit = normalize(order.donViTinh);
            const orderDate = parseDate(order.ngayDatHang);

            let bestCandidate: InvoiceLine | undefined;
            let bestScore = -1;
            let fallbackCandidate: InvoiceLine | undefined;
            let fallbackScore = -1;

            candidates.forEach((candidate) => {
                const nameSim = tokenSimilarity(orderName, candidate.nameKey);
                let score = 0;

                if (orderCode && candidate.codeKey && orderCode === candidate.codeKey) score += 70;
                score += nameSim * 25;
                if (orderUnit && candidate.unitKey && orderUnit === candidate.unitKey) score += 5;

                if (orderDate && candidate.invoiceDate) {
                    const dayGap = Math.abs(orderDate.getTime() - candidate.invoiceDate.getTime()) / (24 * 60 * 60 * 1000);
                    if (dayGap <= 7) score += 10;
                    else if (dayGap <= 30) score += 6;
                    else if (dayGap <= 60) score += 2;
                }

                if (score > fallbackScore) {
                    fallbackScore = score;
                    fallbackCandidate = candidate;
                }

                if (!usedInvoiceRows.has(candidate.data.id) && score > bestScore) {
                    bestScore = score;
                    bestCandidate = candidate;
                }
            });

            const chosen = bestCandidate || fallbackCandidate;
            const score = bestCandidate ? bestScore : fallbackScore;

            if (!chosen || score < 40) {
                return {
                    order,
                    hasInvoice: false,
                    detailStatus: 'no-invoice',
                    matchScore: Number(score.toFixed(2)),
                };
            }

            usedInvoiceRows.add(chosen.data.id);
            const quantityDiff = Number((Number(chosen.data.soLuong) - Number(order.dotGoiHang)).toFixed(3));

            const codeMatched = !!(orderCode && chosen.codeKey && orderCode === chosen.codeKey);
            const nameMatched = tokenSimilarity(orderName, chosen.nameKey) >= 0.85;
            const materialMatched = codeMatched || nameMatched;

            let detailStatus: DetailStatus = 'matched';
            let detailNote = 'Khớp vật tư và số lượng';

            if (!materialMatched) {
                detailStatus = 'material-mismatch';
                detailNote = 'Tên/mã vật tư trên hóa đơn chưa khớp với đơn đặt';
            } else if (quantityDiff < 0) {
                detailStatus = 'shortage';
                detailNote = `Thiếu ${Math.abs(quantityDiff)} so với số lượng đặt`;
            } else if (quantityDiff > 0) {
                detailStatus = 'surplus';
                detailNote = `Thừa ${quantityDiff} so với số lượng đặt`;
            } else if (codeMatched) {
                detailStatus = 'matched';
                detailNote = 'Đã khớp hoàn toàn';
            } else {
                detailStatus = 'enough';
                detailNote = 'Đủ số lượng, vật tư khớp theo tên';
            }

            return {
                order,
                invoice: chosen.data,
                hasInvoice: true,
                quantityDiff,
                detailStatus,
                detailNote,
                matchScore: Number(score.toFixed(2)),
            };
        });
    }, [orders, invoiceLinesBySupplier]);

    const supplierGroups = useMemo(() => {
        let filtered = reconciliations;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.order.maQuanLy.toLowerCase().includes(term) ||
                r.order.tenVtytBv.toLowerCase().includes(term) ||
                r.order.nhaThau.toLowerCase().includes(term) ||
                (r.invoice?.soHoaDon || '').toLowerCase().includes(term)
            );
        }

        // Filter by invoice status
        if (filterInvoiceStatus === 'hasInvoice') {
            filtered = filtered.filter(r => r.hasInvoice);
        } else if (filterInvoiceStatus === 'noInvoice') {
            filtered = filtered.filter(r => !r.hasInvoice);
        }

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
                hasInvoice: results.filter(r => r.hasInvoice).length,
                noInvoice: results.filter(r => !r.hasInvoice).length,
            },
        })).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
    }, [reconciliations, searchTerm, filterInvoiceStatus]);

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

    const getResultKey = (result: ReconciliationResult) => `${result.order.id}-${result.invoice?.id || 'no-invoice'}`;

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const renderDetailStatus = (status: DetailStatus) => {
        switch (status) {
            case 'matched':
                return (
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-[10px] whitespace-nowrap">
                        Khớp
                    </Badge>
                );
            case 'enough':
                return (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-[10px] whitespace-nowrap">
                        Đủ
                    </Badge>
                );
            case 'shortage':
                return (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] whitespace-nowrap">
                        Thiếu
                    </Badge>
                );
            case 'surplus':
                return (
                    <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-[10px] whitespace-nowrap">
                        Thừa
                    </Badge>
                );
            case 'material-mismatch':
                return (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-[10px] whitespace-nowrap">
                        Lệch vật tư
                    </Badge>
                );
            case 'no-invoice':
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-[10px] whitespace-nowrap">
                        Chưa có HĐ
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-[10px] whitespace-nowrap">
                        Khớp
                    </Badge>
                );
        }
    };

    const isExactTextMatch = (left: string, right: string) => {
        if (!left || !right) return false;
        return normalize(left) === normalize(right);
    };

    const isNameMatch = (left: string, right: string) => tokenSimilarity(left, right) >= 0.85;

    const renderCompareBadge = (isMatch: boolean, strict = false) => {
        if (isMatch) {
            return (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-[10px] whitespace-nowrap">
                    {strict ? 'Khớp chuẩn' : 'Khớp'}
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-[10px] whitespace-nowrap">
                Lệch
            </Badge>
        );
    };

    const totalStats = useMemo(() => {
        return supplierGroups.reduce((acc, group) => ({
            hasInvoice: acc.hasInvoice + group.stats.hasInvoice,
            noInvoice: acc.noInvoice + group.stats.noInvoice,
        }), { hasInvoice: 0, noInvoice: 0 });
    }, [supplierGroups]);

    return (
        <div className="space-y-4">
            {/* Search & Filter */}
            <div className="space-y-3">
                <Input
                    placeholder="Tìm theo mã đơn, tên vật tư, nhà thầu, mã hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Lọc theo trạng thái HĐ:</span>
                    <button
                        type="button"
                        onClick={() => setFilterInvoiceStatus('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            filterInvoiceStatus === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterInvoiceStatus('hasInvoice')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            filterInvoiceStatus === 'hasInvoice'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                    >
                        Đã có HĐ
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterInvoiceStatus('noInvoice')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            filterInvoiceStatus === 'noInvoice'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                    >
                        Chưa có HĐ
                    </button>
                </div>
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">Ghi chú nhanh:</span>
                    <span className="inline-flex items-center gap-1 rounded border border-green-300 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Khớp
                    </span>
                    <span className="text-xs">= đúng mã vật tư + đúng số lượng</span>
                    <span className="inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Đủ
                    </span>
                    <span className="text-xs">= đủ số lượng, vật tư khớp theo tên (chưa chắc đúng mã)</span>
                </div>
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
                            <col style={{ width: '250px' }} />
                        </colgroup>
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Số vật tư đối chiếu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Lần đặt gần nhất</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Tổng quan</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Trạng thái hóa đơn</th>
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
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                                        Có HĐ: {group.stats.hasInvoice}/{group.results.length}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground">So khớp theo vật tư đã gửi email</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {group.stats.noInvoice > 0 ? (
                                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 font-semibold">
                                                        Chưa có
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 font-semibold">
                                                        Đã có
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Chi tiết */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <div className="bg-background border-l-4 border-blue-400 overflow-x-auto">
                                                        <table className="w-full min-w-[1500px]" style={{ tableLayout: 'fixed' }}>
                                                            <colgroup>
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '280px' }} />
                                                                <col style={{ width: '140px' }} />
                                                                <col style={{ width: '180px' }} />
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '140px' }} />
                                                                <col style={{ width: '200px' }} />
                                                                <col style={{ width: '220px' }} />
                                                            </colgroup>
                                                            <thead className="bg-blue-50 border-b border-blue-200">
                                                                <tr className="text-xs">
                                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mã QL</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tên vật tư</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL đặt</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Mã HĐ</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL HĐ</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Chênh lệch</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Kết luận chi tiết</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Ngày đặt</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.results.map((result) => {
                                                                    const detailKey = getResultKey(result);
                                                                    return (
                                                                        <React.Fragment key={detailKey}>
                                                                            <tr
                                                                                className={`border-b border-border/50 text-xs hover:bg-muted/30 ${
                                                                                    result.detailStatus === 'material-mismatch' || result.detailStatus === 'surplus'
                                                                                        ? 'bg-red-50/60'
                                                                                        : result.detailStatus === 'shortage' || result.detailStatus === 'no-invoice'
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
                                                                                            {result.invoice.soHoaDon || result.invoice.idHoaDon}
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
                                                                                    {result.quantityDiff !== undefined ? (
                                                                                        <span
                                                                                            className={`font-bold ${
                                                                                                result.quantityDiff > 0
                                                                                                    ? 'text-orange-600'
                                                                                                    : result.quantityDiff < 0
                                                                                                        ? 'text-red-600'
                                                                                                        : 'text-green-700'
                                                                                            }`}
                                                                                        >
                                                                                            {result.quantityDiff > 0 ? '+' : ''}
                                                                                            {result.quantityDiff}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground">—</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <div className="inline-flex flex-col items-center gap-1">
                                                                                        {renderDetailStatus(result.detailStatus)}
                                                                                        {result.detailNote && (
                                                                                            <span className="text-[10px] text-muted-foreground max-w-[140px] leading-tight" title={result.detailNote}>
                                                                                                {result.detailNote}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                                                                    {formatDate(result.order.ngayDatHang)}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {result.hasInvoice ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => setSelectedDetail(result)}
                                                                                            className="text-[11px] font-medium text-blue-600 hover:text-blue-900 hover:underline"
                                                                                        >
                                                                                            Chi tiết
                                                                                        </button>
                                                                                    ) : null}
                                                                                </td>
                                                                            </tr>
                                                                        </React.Fragment>
                                                                    );
                                                                })}
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

            <Dialog open={!!selectedDetail} onOpenChange={(open) => { if (!open) setSelectedDetail(null); }}>
                {selectedDetail?.invoice && (
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Đối chiếu chi tiết đơn và hóa đơn</DialogTitle>
                            <DialogDescription>
                                {selectedDetail.order.nhaThau} • Mã QL: {selectedDetail.order.maQuanLy}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4">
                                <div className="text-sm font-semibold text-blue-700 mb-3">Bên gọi hàng (BV108)</div>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-muted-foreground">Mã quản lý:</span> <span className="font-medium">{selectedDetail.order.maQuanLy}</span></div>
                                    <div><span className="text-muted-foreground">Mã vật tư:</span> <span className="font-medium">{selectedDetail.order.maVtytCu || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Tên vật tư:</span> <span className="font-medium">{selectedDetail.order.tenVtytBv}</span></div>
                                    <div><span className="text-muted-foreground">Đơn vị:</span> <span className="font-medium">{selectedDetail.order.donViTinh}</span></div>
                                    <div><span className="text-muted-foreground">Số lượng gọi:</span> <span className="font-semibold">{selectedDetail.order.dotGoiHang}</span></div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
                                <div className="text-sm font-semibold text-emerald-700 mb-3">Bên hóa đơn (UBot)</div>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-muted-foreground">Số hóa đơn:</span> <span className="font-medium">{selectedDetail.invoice.soHoaDon || selectedDetail.invoice.idHoaDon}</span></div>
                                    <div><span className="text-muted-foreground">Mã hàng hóa:</span> <span className="font-medium">{selectedDetail.invoice.maHangHoa || '—'}</span></div>
                                    <div><span className="text-muted-foreground">Tên hàng hóa:</span> <span className="font-medium">{selectedDetail.invoice.tenHangHoa}</span></div>
                                    <div><span className="text-muted-foreground">Đơn vị:</span> <span className="font-medium">{selectedDetail.invoice.donViTinh}</span></div>
                                    <div><span className="text-muted-foreground">Số lượng hóa đơn:</span> <span className="font-semibold">{selectedDetail.invoice.soLuong}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Tiêu chí</th>
                                        <th className="px-3 py-2 text-left">Bên gọi</th>
                                        <th className="px-3 py-2 text-left">Bên hóa đơn</th>
                                        <th className="px-3 py-2 text-center">Kết quả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t">
                                        <td className="px-3 py-2">Mã vật tư</td>
                                        <td className="px-3 py-2 font-medium">{selectedDetail.order.maVtytCu || '—'}</td>
                                        <td className="px-3 py-2 font-medium">{selectedDetail.invoice.maHangHoa || '—'}</td>
                                        <td className="px-3 py-2 text-center">{renderCompareBadge(isExactTextMatch(selectedDetail.order.maVtytCu || '', selectedDetail.invoice.maHangHoa || ''), true)}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="px-3 py-2">Tên vật tư</td>
                                        <td className="px-3 py-2 font-medium">{selectedDetail.order.tenVtytBv}</td>
                                        <td className="px-3 py-2 font-medium">{selectedDetail.invoice.tenHangHoa}</td>
                                        <td className="px-3 py-2 text-center">{renderCompareBadge(isNameMatch(selectedDetail.order.tenVtytBv || '', selectedDetail.invoice.tenHangHoa || ''))}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="px-3 py-2">Đơn vị tính</td>
                                        <td className="px-3 py-2 font-medium">{selectedDetail.order.donViTinh || '—'}</td>
                                        <td className="px-3 py-2 font-medium">{selectedDetail.invoice.donViTinh || '—'}</td>
                                        <td className="px-3 py-2 text-center">{renderCompareBadge(isExactTextMatch(selectedDetail.order.donViTinh || '', selectedDetail.invoice.donViTinh || ''))}</td>
                                    </tr>
                                    <tr className="border-t">
                                        <td className="px-3 py-2">Số lượng</td>
                                        <td className="px-3 py-2 font-semibold">{selectedDetail.order.dotGoiHang}</td>
                                        <td className="px-3 py-2 font-semibold">{selectedDetail.invoice.soLuong}</td>
                                        <td className="px-3 py-2 text-center">{renderCompareBadge(Number(selectedDetail.order.dotGoiHang) === Number(selectedDetail.invoice.soLuong), true)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Kết luận:</span>
                            {renderDetailStatus(selectedDetail.detailStatus)}
                            {selectedDetail.detailNote && <span className="text-muted-foreground">{selectedDetail.detailNote}</span>}
                            <span className="text-muted-foreground">• Điểm match: {selectedDetail.matchScore ?? 0}</span>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

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
                        Đã có HĐ: <strong>{totalStats.hasInvoice}</strong>
                    </span>
                    <span className="text-amber-700">
                        Chưa có HĐ: <strong>{totalStats.noInvoice}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
