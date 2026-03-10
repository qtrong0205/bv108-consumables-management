import { useCallback, useRef, useState } from 'react';
import { ApiCompareSupply, getNullableString } from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bot, ChevronDown, ChevronRight, FileDown, FileSpreadsheet, GripVertical } from 'lucide-react';

const formatNumber = (value: { Int32: number; Valid: boolean } | { Float64: number; Valid: boolean } | null | undefined): string => {
    if (!value?.Valid) return '';
    const numeric = 'Int32' in value ? value.Int32 : value.Float64;
    return numeric.toLocaleString('vi-VN');
};

const getMaThuVien = (item: ApiCompareSupply): string => getNullableString(item.maThuVien);
const getTenVatTu = (item: ApiCompareSupply): string => getNullableString(item.tenVatTu2025);

const COMPARE_FIELDS: Array<{
    label: string;
    value: (item: ApiCompareSupply) => string;
}> = [
        { label: 'STT', value: (i) => String(i.stt || '') },
        { label: 'Tên công ty', value: (i) => getNullableString(i.tenCongTy) },
        { label: 'Mã thư viện', value: (i) => getNullableString(i.maThuVien) },
        { label: 'Mã Thông tư 04', value: (i) => getNullableString(i.maThongTu04) },
        { label: 'Tên vật tư (sử dụng năm 2025)', value: (i) => getNullableString(i.tenVatTu2025) },
        { label: 'Thông số kỹ thuật của BV mời thầu (2025)', value: (i) => getNullableString(i.thongSoMoiThau2025) },
        { label: 'Thông số kỹ thuật (hiệu chỉnh cho 2026)', value: (i) => getNullableString(i.thongSoHieuChinh2026) },
        { label: 'Thông số kỹ thuật 1', value: (i) => getNullableString(i.thongSoKyThuat1) },
        { label: 'Thông số kỹ thuật 2', value: (i) => getNullableString(i.thongSoKyThuat2) },
        { label: 'Thông số kỹ thuật 3', value: (i) => getNullableString(i.thongSoKyThuat3) },
        { label: 'Thông số kỹ thuật 4', value: (i) => getNullableString(i.thongSoKyThuat4) },
        { label: 'Thông số kỹ thuật 5', value: (i) => getNullableString(i.thongSoKyThuat5) },
        { label: 'Thông số kỹ thuật 9', value: (i) => getNullableString(i.thongSoKyThuat9) },
        { label: 'Mã VTTH tương đương', value: (i) => getNullableString(i.maVtthTuongDuong) },
        { label: 'Công ty có VTTH tương đương', value: (i) => getNullableString(i.congTyVtthTuongDuong) },
        { label: 'ĐVT', value: (i) => getNullableString(i.dvt) },
        { label: 'Số lượng sử dụng 12 tháng', value: (i) => formatNumber(i.soLuongSuDung12Thang) },
        { label: 'Số lượng trúng thầu 2025 + bổ sung', value: (i) => formatNumber(i.soLuongTrungThau2025BoSung) },
        { label: 'Đơn giá trúng thầu năm 2025', value: (i) => formatNumber(i.donGiaTrungThau2025) },
        { label: 'Đơn giá đề xuất năm 2026', value: (i) => formatNumber(i.donGiaDeXuat2026) },
        { label: 'KQ trúng thầu THẤP NHẤT', value: (i) => formatNumber(i.ketQuaTrungThauThapNhat) },
        { label: 'TG/ĐV đăng tải giá THẤP NHẤT', value: (i) => getNullableString(i.thoiGianDangTaiThapNhat) },
        { label: 'KQ trúng thầu CAO NHẤT', value: (i) => formatNumber(i.ketQuaTrungThauCaoNhat) },
        { label: 'TG/ĐV đăng tải giá CAO NHẤT', value: (i) => getNullableString(i.thoiGianDangTaiCaoNhat) },
        { label: 'Công ty tham khảo', value: (i) => getNullableString(i.congTyThamKhao) },
        { label: 'Mã số thuế', value: (i) => getNullableString(i.maSoThue) },
        { label: 'Ký mã hiệu', value: (i) => getNullableString(i.kyMaHieu) },
        { label: 'Hãng sản xuất', value: (i) => getNullableString(i.hangSanXuat) },
        { label: 'Nước sản xuất', value: (i) => getNullableString(i.nuocSanXuat) },
        { label: 'Nhóm nước', value: (i) => getNullableString(i.nhomNuoc) },
        { label: 'Chất lượng', value: (i) => getNullableString(i.chatLuong) },
        { label: 'Mã 5086', value: (i) => getNullableString(i.ma5086) },
        { label: 'Tên thương mại', value: (i) => getNullableString(i.tenThuongMai) },
    ];

interface ResultDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    comparedItems: ApiCompareSupply[];
    columnOrder: number[];
    onColumnOrderChange: (order: number[]) => void;
    collapsedRows: string[];
    onCollapsedRowsChange: (rows: string[]) => void;
    onOpenChatbot: () => void;
    onExportExcel: () => void;
    onExportPdf: () => void;
}

const ResultDialog = ({
    open,
    onOpenChange,
    comparedItems,
    columnOrder,
    onColumnOrderChange,
    collapsedRows,
    onCollapsedRowsChange,
    onOpenChatbot,
    onExportExcel,
    onExportPdf,
}: ResultDialogProps) => {
    const [dragColIdx, setDragColIdx] = useState<number | null>(null);
    const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);
    const [attrColWidth, setAttrColWidth] = useState(200);
    const resizingRef = useRef(false);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);

    const orderedItems = columnOrder.length === 0
        ? comparedItems
        : columnOrder.map((i) => comparedItems[i]).filter(Boolean);

    const handleDragStart = useCallback((idx: number) => {
        setDragColIdx(idx);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
        e.preventDefault();
        setDragOverColIdx(idx);
    }, []);

    const handleDragEnd = useCallback(() => {
        if (dragColIdx !== null && dragOverColIdx !== null && dragColIdx !== dragOverColIdx) {
            const newOrder = [...columnOrder];
            const [moved] = newOrder.splice(dragColIdx, 1);
            newOrder.splice(dragOverColIdx, 0, moved);
            onColumnOrderChange(newOrder);
        }
        setDragColIdx(null);
        setDragOverColIdx(null);
    }, [dragColIdx, dragOverColIdx, columnOrder, onColumnOrderChange]);

    const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = true;
        resizeStartXRef.current = e.clientX;
        resizeStartWidthRef.current = attrColWidth;

        const onMouseMove = (ev: MouseEvent) => {
            if (!resizingRef.current) return;
            const delta = ev.clientX - resizeStartXRef.current;
            const newWidth = Math.max(80, Math.min(600, resizeStartWidthRef.current + delta));
            setAttrColWidth(newWidth);
        };

        const onMouseUp = () => {
            resizingRef.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [attrColWidth]);

    const isRowCollapsed = (label: string): boolean => collapsedRows.includes(label);

    const toggleRowCollapse = (label: string) => {
        if (collapsedRows.includes(label)) {
            onCollapsedRowsChange(collapsedRows.filter((x) => x !== label));
        } else {
            onCollapsedRowsChange([...collapsedRows, label]);
        }
    };

    const collapseAllRows = () => {
        onCollapsedRowsChange(COMPARE_FIELDS.map((f) => f.label));
    };

    const expandAllRows = () => {
        onCollapsedRowsChange([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex flex-col sm:max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
                    <div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                            Kết quả so sánh vật tư
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            So sánh {comparedItems.length} vật tư đã chọn
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={collapseAllRows}
                            disabled={collapsedRows.length === COMPARE_FIELDS.length}
                        >
                            Thu gọn tất cả
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={expandAllRows}
                            disabled={collapsedRows.length === 0}
                        >
                            Mở rộng tất cả
                        </Button>
                        <Button variant="outline" size="sm" onClick={onOpenChatbot}>
                            <Bot className="w-4 h-4 mr-2" />
                            Chatbot tư vấn
                        </Button>
                        <Button variant="outline" size="sm" onClick={onExportExcel}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Xuất Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={onExportPdf}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Xuất PDF
                        </Button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto bg-background">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-primary text-primary-foreground sticky top-0 z-20">
                            <tr>
                                <th
                                    className="px-3 py-3 text-left text-xs font-medium sticky left-0 z-30 bg-primary"
                                    style={{ width: attrColWidth, minWidth: attrColWidth, maxWidth: attrColWidth }}
                                >
                                    <span className="block truncate">Thuộc tính</span>
                                    <div
                                        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary-foreground/30 active:bg-primary-foreground/50 z-30"
                                        onMouseDown={handleResizeMouseDown}
                                    />
                                </th>
                                {orderedItems.map((item, idx) => (
                                    <th
                                        key={`head-${getMaThuVien(item)}`}
                                        className={`px-3 py-3 text-left text-xs font-medium min-w-[240px] cursor-grab active:cursor-grabbing select-none transition-colors ${dragOverColIdx === idx && dragColIdx !== idx
                                                ? 'bg-primary/70 ring-2 ring-primary-foreground/40 ring-inset'
                                                : ''
                                            } ${dragColIdx === idx ? 'opacity-50' : ''}`}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={handleDragEnd}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <GripVertical className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                                            <div>
                                                <div>{getMaThuVien(item)}</div>
                                                <div className="font-normal opacity-90 mt-1">{getTenVatTu(item)}</div>
                                            </div>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {COMPARE_FIELDS.map((field) => {
                                const collapsed = isRowCollapsed(field.label);

                                return (
                                    <tr key={field.label} className="group">
                                        <td
                                            className={`font-bold text-primary-foreground bg-primary sticky left-0 z-10 transition-all duration-300 overflow-hidden ${collapsed ? 'px-3 py-1.5 text-xs' : 'px-3 py-3 text-sm'
                                                }`}
                                            style={{ width: attrColWidth, minWidth: attrColWidth, maxWidth: attrColWidth }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleRowCollapse(field.label)}
                                                className="w-full flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                                                title={collapsed ? 'Mở rộng hàng' : 'Thu gọn hàng'}
                                            >
                                                <span
                                                    className={`flex-shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-90'
                                                        }`}
                                                >
                                                    {collapsed ? (
                                                        <ChevronRight className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </span>
                                                <span>{field.label}</span>
                                            </button>
                                        </td>

                                        <td colSpan={Math.max(orderedItems.length, 1)} className="p-0 overflow-hidden">
                                            <div
                                                className={`transition-all duration-500 ease-in-out overflow-hidden flex ${collapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-[500px] opacity-100 py-3'
                                                    }`}
                                            >
                                                <div className="flex w-full">
                                                    {orderedItems.map((item) => (
                                                        <div
                                                            key={`${field.label}-${getMaThuVien(item)}`}
                                                            className="flex-1 px-3 text-sm text-foreground align-top whitespace-pre-wrap break-words leading-6 border-r border-border last:border-r-0"
                                                            style={{ minWidth: '240px' }}
                                                        >
                                                            {field.value(item) || ''}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {collapsed && (
                                                <div className="flex h-6 items-center bg-muted/20 px-2">
                                                    <div className="h-[2px] w-full rounded-full bg-border/80" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ResultDialog;