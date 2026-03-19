import { useMemo, useState } from 'react';
import { ApiInvoiceReconciliationRecord } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, FileText, Search } from 'lucide-react';

interface InvoiceMatchHistoryTableProps {
    records: ApiInvoiceReconciliationRecord[];
    loading: boolean;
    error: string | null;
    month: number;
    year: number;
    searchTerm: string;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    onSearchChange: (term: string) => void;
    onRefresh: () => void;
}

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'matched':
            return { label: 'Khớp 100%', className: 'bg-green-100 text-green-700 border-green-300' };
        case 'enough':
            return { label: 'Đủ số lượng', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
        case 'shortage':
            return { label: 'Thiếu số lượng', className: 'bg-orange-100 text-orange-700 border-orange-300' };
        case 'surplus':
            return { label: 'Thừa số lượng', className: 'bg-blue-100 text-blue-700 border-blue-300' };
        case 'material-mismatch':
            return { label: 'Lệch vật tư', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
        default:
            return { label: status || 'Khác', className: 'bg-muted text-muted-foreground border-border' };
    }
};

const isMatchedStatus = (status: string) => status === 'matched' || status === 'enough';
const isMismatchStatus = (status: string) => status === 'shortage' || status === 'surplus' || status === 'material-mismatch';

type InvoiceHistoryGroup = {
    key: string;
    invoiceNumber: string;
    invoiceIdHoaDon?: string;
    supplierName: string;
    invoiceTime?: string;
    matchedAtLatest?: string;
    records: ApiInvoiceReconciliationRecord[];
    stats: {
        total: number;
        matched: number;
        mismatch: number;
        notEnoughScore: number;
    };
};

export default function InvoiceMatchHistoryTable({
    records,
    loading,
    error,
    month,
    year,
    searchTerm,
    onMonthChange,
    onYearChange,
    onSearchChange,
    onRefresh,
}: InvoiceMatchHistoryTableProps) {
    const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());

    const filteredRecords = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        const baseRecords = records.filter((item) => item.hasInvoice);
        if (!keyword) return baseRecords;

        return baseRecords.filter((item) => {
            const haystack = [
                item.nhaThau,
                item.tenVtytBv,
                item.maVtytCu,
                item.maQuanLy,
                item.invoiceNumber,
                item.invoiceItemCode,
                item.invoiceItemName,
                item.detailStatus,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(keyword);
        });
    }, [records, searchTerm]);

    const invoiceGroups = useMemo<InvoiceHistoryGroup[]>(() => {
        const grouped = new Map<string, InvoiceHistoryGroup>();

        filteredRecords.forEach((item) => {
            const key = `${item.invoiceNumber}__${item.invoiceIdHoaDon || ''}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    key,
                    invoiceNumber: item.invoiceNumber,
                    invoiceIdHoaDon: item.invoiceIdHoaDon,
                    supplierName: item.nhaThau,
                    invoiceTime: item.invoiceTime,
                    matchedAtLatest: item.matchedAt,
                    records: [],
                    stats: {
                        total: 0,
                        matched: 0,
                        mismatch: 0,
                        notEnoughScore: 0,
                    },
                });
            }

            const group = grouped.get(key)!;
            group.records.push(item);
            group.stats.total += 1;
            if (isMatchedStatus(item.detailStatus)) {
                group.stats.matched += 1;
            }
            if (isMismatchStatus(item.detailStatus)) {
                group.stats.mismatch += 1;
            }
            if (item.matchScore < 40) {
                group.stats.notEnoughScore += 1;
            }

            if (!group.invoiceTime && item.invoiceTime) {
                group.invoiceTime = item.invoiceTime;
            }

            if (item.matchedAt && (!group.matchedAtLatest || new Date(item.matchedAt).getTime() > new Date(group.matchedAtLatest).getTime())) {
                group.matchedAtLatest = item.matchedAt;
            }
        });

        return Array.from(grouped.values())
            .map((group) => ({
                ...group,
                records: [...group.records].sort((a, b) => {
                    if (a.detailStatus === b.detailStatus) {
                        return (b.matchScore || 0) - (a.matchScore || 0);
                    }
                    if (isMismatchStatus(a.detailStatus) && !isMismatchStatus(b.detailStatus)) return -1;
                    if (!isMismatchStatus(a.detailStatus) && isMismatchStatus(b.detailStatus)) return 1;
                    return 0;
                }),
            }))
            .sort((a, b) => {
                const timeA = a.matchedAtLatest ? new Date(a.matchedAtLatest).getTime() : 0;
                const timeB = b.matchedAtLatest ? new Date(b.matchedAtLatest).getTime() : 0;
                return timeB - timeA;
            });
    }, [filteredRecords]);

    const toggleInvoiceExpand = (groupKey: string) => {
        setExpandedInvoices((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tháng</label>
                    <Input
                        type="number"
                        min={1}
                        max={12}
                        value={month}
                        onChange={(e) => onMonthChange(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                        className="w-24"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Năm</label>
                    <Input
                        type="number"
                        min={2000}
                        max={3000}
                        value={year}
                        onChange={(e) => onYearChange(Math.min(3000, Math.max(2000, Number(e.target.value) || new Date().getFullYear())))}
                        className="w-28"
                    />
                </div>
                <div className="space-y-1 flex-1 min-w-[220px]">
                    <label className="text-xs text-muted-foreground">Tìm kiếm</label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Tìm theo số hóa đơn, nhà thầu, vật tư..."
                            className="pl-9"
                        />
                    </div>
                </div>
                <Button onClick={onRefresh} variant="outline">Tải lại</Button>
            </div>

            {error ? (
                <div className="text-sm text-destructive">{error}</div>
            ) : null}

            <div className="space-y-3">
                {loading ? (
                    <div className="rounded-md border border-border px-4 py-8 text-sm text-center text-muted-foreground">
                        Đang tải lịch sử đối chiếu...
                    </div>
                ) : invoiceGroups.length === 0 ? (
                    <div className="rounded-md border border-border px-4 py-8 text-sm text-center text-muted-foreground">
                        Không có hóa đơn đã đối chiếu trong tháng/năm đã chọn
                    </div>
                ) : (
                    invoiceGroups.map((group) => {
                        const isExpanded = expandedInvoices.has(group.key);

                        return (
                            <div key={group.key} className="rounded-md border border-border overflow-hidden bg-card">
                                <button
                                    type="button"
                                    className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                                    onClick={() => toggleInvoiceExpand(group.key)}
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 text-muted-foreground">
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </div>
                                            <FileText className="w-4 h-4 mt-0.5 text-primary" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold text-foreground">{group.invoiceNumber}</span>
                                                    <Badge variant="outline" className="text-[11px]">{group.stats.total} dòng đối chiếu</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{group.supplierName}</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    Ngày hóa đơn: {formatDateTime(group.invoiceTime)}
                                                    <span className="mx-1">|</span>
                                                    Match lần cuối: {formatDateTime(group.matchedAtLatest)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge className="bg-green-100 text-green-700 border-green-300">Khớp: {group.stats.matched}</Badge>
                                            <Badge className="bg-orange-100 text-orange-700 border-orange-300">Lệch: {group.stats.mismatch}</Badge>
                                            {group.stats.notEnoughScore > 0 ? (
                                                <Badge className="bg-red-100 text-red-700 border-red-300">Điểm thấp: {group.stats.notEnoughScore}</Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>

                                {isExpanded ? (
                                    <div className="border-t border-border bg-muted/10 p-3">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[1000px]">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vật tư đặt</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vật tư hóa đơn</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">SL đặt</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">SL HD</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Lệch</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Điểm</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Trạng thái</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ghi chú</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.records.map((item) => {
                                                        const status = getStatusLabel(item.detailStatus);
                                                        return (
                                                            <tr key={item.id} className="border-b border-border/60">
                                                                <td className="px-3 py-2 text-xs text-foreground">
                                                                    <div className="font-medium">{item.tenVtytBv}</div>
                                                                    <div className="text-[11px] text-muted-foreground">{item.maVtytCu || item.maQuanLy}</div>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs text-foreground">
                                                                    <div className="font-medium">{item.invoiceItemName || '-'}</div>
                                                                    <div className="text-[11px] text-muted-foreground">{item.invoiceItemCode || '-'}</div>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs text-center">{item.orderedQty}</td>
                                                                <td className="px-3 py-2 text-xs text-center">{item.invoiceQty}</td>
                                                                <td className="px-3 py-2 text-xs text-center">{item.quantityDiff}</td>
                                                                <td className="px-3 py-2 text-xs text-center">{item.matchScore.toFixed(2)}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <Badge className={status.className}>{status.label}</Badge>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs text-foreground">{item.detailNote || '-'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="text-xs text-muted-foreground">
                Tổng: {invoiceGroups.length} hóa đơn | {filteredRecords.length} dòng đối chiếu (tháng {month}/{year})
            </div>
        </div>
    );
}
