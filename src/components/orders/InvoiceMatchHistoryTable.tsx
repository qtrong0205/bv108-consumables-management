import { useMemo, useState } from 'react';
import { ApiInvoiceReconciliationRecord } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    };
};

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

const isMatchedStatus = (status: string) => status === 'matched' || status === 'enough';
const isMismatchStatus = (status: string) => status === 'shortage' || status === 'surplus' || status === 'material-mismatch';

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
    const [selectedGroup, setSelectedGroup] = useState<InvoiceHistoryGroup | null>(null);

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
                item.note,
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
                    if (isMismatchStatus(a.detailStatus) && !isMismatchStatus(b.detailStatus)) return -1;
                    if (!isMismatchStatus(a.detailStatus) && isMismatchStatus(b.detailStatus)) return 1;
                    return a.tenVtytBv.localeCompare(b.tenVtytBv);
                }),
            }))
            .sort((a, b) => {
                const timeA = a.matchedAtLatest ? new Date(a.matchedAtLatest).getTime() : 0;
                const timeB = b.matchedAtLatest ? new Date(b.matchedAtLatest).getTime() : 0;
                return timeB - timeA;
            });
    }, [filteredRecords]);

    const toggleInvoiceExpand = (groupKey: string, anchorElement?: HTMLElement | null) => {
        const beforeTop = anchorElement?.getBoundingClientRect().top;

        setExpandedInvoices((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });

        if (!anchorElement || beforeTop === undefined) {
            return;
        }

        requestAnimationFrame(() => {
            const afterTop = anchorElement.getBoundingClientRect().top;
            const delta = afterTop - beforeTop;
            if (Math.abs(delta) > 1) {
                window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
            }
        });
    };

    const matchedRows = useMemo(() => {
        if (!selectedGroup) return [] as ApiInvoiceReconciliationRecord[];
        return selectedGroup.records.filter((item) => isMatchedStatus(item.detailStatus));
    }, [selectedGroup]);

    const mismatchRows = useMemo(() => {
        if (!selectedGroup) return [] as ApiInvoiceReconciliationRecord[];
        return selectedGroup.records.filter((item) => !isMatchedStatus(item.detailStatus));
    }, [selectedGroup]);

    const detailOrderTotalQuantity = useMemo(() => {
        if (!selectedGroup) return 0;
        return selectedGroup.records.reduce((sum, item) => sum + Number(item.orderedQty || 0), 0);
    }, [selectedGroup]);

    const detailInvoiceTotalQuantity = useMemo(() => {
        if (!selectedGroup) return 0;
        return selectedGroup.records.reduce((sum, item) => sum + Number(item.invoiceQty || 0), 0);
    }, [selectedGroup]);

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
                                <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between hover:bg-muted/30 transition-colors">
                                    <button
                                        type="button"
                                        className="flex-1 text-left"
                                        onClick={(e) => toggleInvoiceExpand(group.key, e.currentTarget)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 text-muted-foreground">
                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </div>
                                            <FileText className="w-4 h-4 mt-0.5 text-primary" />
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-sm font-semibold text-foreground">{group.invoiceNumber}</span>
                                                    <Badge variant="outline" className="text-[11px]">{group.stats.total} dòng đối chiếu</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{group.supplierName}</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    Ngày hóa đơn: {formatDateTime(group.invoiceTime)}
                                                    <span className="mx-1">|</span>
                                                    Duyệt lúc: {formatDateTime(group.matchedAtLatest)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className="bg-green-100 text-green-700 border-green-300">Đã duyệt</Badge>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedGroup(group)}
                                        >
                                            Xem so sánh
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded ? (
                                    <div className="border-t border-border bg-muted/10 p-3">
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[980px]">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vật tư đặt</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vật tư hóa đơn</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">SL đặt</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">SL HĐ</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Lệch</th>
                                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Đã duyệt</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Ghi chú</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.records.map((item) => (
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
                                                            <td className="px-3 py-2 text-center">
                                                                <Badge className="bg-green-100 text-green-700 border-green-300">Đã duyệt</Badge>
                                                            </td>
                                                            <td className="px-3 py-2 text-xs text-foreground">{item.note || item.detailNote || '-'}</td>
                                                        </tr>
                                                    ))}
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
                Tổng: {invoiceGroups.length} hóa đơn đã duyệt | {filteredRecords.length} dòng đã đối chiếu (tháng {month}/{year})
            </div>

            <Dialog open={!!selectedGroup} onOpenChange={(open) => { if (!open) setSelectedGroup(null); }}>
                {selectedGroup ? (
                    <DialogContent className="w-[80vw] max-w-[80vw] max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chi tiết đối chiếu hóa đơn đã duyệt</DialogTitle>
                            <DialogDescription>
                                {selectedGroup.supplierName} • Hóa đơn: {selectedGroup.invoiceNumber}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                                <div className="text-muted-foreground">Tổng dòng đối chiếu</div>
                                <div className="text-lg font-semibold text-blue-700">{selectedGroup.records.length}</div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                                <div className="text-muted-foreground">Tổng SL Order</div>
                                <div className="text-lg font-semibold text-emerald-700">{detailOrderTotalQuantity}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                                <div className="text-muted-foreground">Tổng SL Hóa đơn</div>
                                <div className="text-lg font-semibold text-slate-700">{detailInvoiceTotalQuantity}</div>
                            </div>
                        </div>

                        {mismatchRows.length > 0 ? (
                            <div className="rounded-lg border border-amber-300 bg-amber-50/40 overflow-hidden">
                                <div className="px-3 py-2 text-sm font-semibold text-amber-800 border-b border-amber-200">
                                    Các vật tư còn lệch khi đối chiếu
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                        </colgroup>
                                        <thead className="bg-amber-100/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Mã QL</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (Order)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap border-r-4 border-amber-400">SL đặt</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap border-l-4 border-amber-400">Mã hàng hóa</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (HĐ)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap">SL HĐ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mismatchRows.map((item) => (
                                                <tr key={`mismatch-${item.id}`} className="border-t border-amber-100 align-top">
                                                    <td className="px-3 py-2 font-mono bg-amber-50/30">{item.maQuanLy || '—'}</td>
                                                    <td className="px-3 py-2 bg-amber-50/30">{item.tenVtytBv || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold border-r-4 border-amber-400 bg-amber-50/30">{item.orderedQty}</td>
                                                    <td className="px-3 py-2 font-mono border-l-4 border-amber-400">{item.invoiceItemCode || '—'}</td>
                                                    <td className="px-3 py-2">{item.invoiceItemName || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold">{item.invoiceQty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}

                        {matchedRows.length > 0 ? (
                            <div className="rounded-lg border border-emerald-300 bg-emerald-50/40 overflow-hidden">
                                <div className="px-3 py-2 text-sm font-semibold text-emerald-800 border-b border-emerald-200">
                                    Các vật tư đã khớp khi đối chiếu
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                        </colgroup>
                                        <thead className="bg-emerald-100/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Mã QL</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (Order)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap border-r-4 border-emerald-400">SL đặt</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap border-l-4 border-emerald-400">Mã hàng hóa</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (HĐ)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap">SL HĐ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matchedRows.map((item) => (
                                                <tr key={`matched-${item.id}`} className="border-t border-emerald-100 align-top">
                                                    <td className="px-3 py-2 font-mono bg-emerald-50/30">{item.maQuanLy || '—'}</td>
                                                    <td className="px-3 py-2 bg-emerald-50/30">{item.tenVtytBv || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold border-r-4 border-emerald-400 bg-emerald-50/30">{item.orderedQty}</td>
                                                    <td className="px-3 py-2 font-mono border-l-4 border-emerald-400">{item.invoiceItemCode || '—'}</td>
                                                    <td className="px-3 py-2">{item.invoiceItemName || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold">{item.invoiceQty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </DialogContent>
                ) : null}
            </Dialog>
        </div>
    );
}
