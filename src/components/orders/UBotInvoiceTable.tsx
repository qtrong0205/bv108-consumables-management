import { HoaDonUBot } from '@/types';
import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/pagination';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const EMPTY_MATCHED_INVOICE_SET = new Set<string>();

const normalizeInvoiceKey = (value?: string | null) => (value || '').trim().toLowerCase();

const getInvoiceNumber = (invoice: HoaDonUBot) => {
    const soHoaDon = (invoice.soHoaDon || '').trim();
    const idHoaDon = (invoice.idHoaDon || '').trim();
    if (soHoaDon) return soHoaDon;
    if (idHoaDon) return idHoaDon;
    return `ID-${invoice.id}`;
};

interface UBotInvoiceTableProps {
    hoaDons: HoaDonUBot[];
    loading?: boolean;
    onRefresh?: () => void;
    matchedInvoiceNumbers?: Set<string>;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    expandedInvoices?: Set<string>;
    onExpandedInvoicesChange?: (expanded: Set<string>) => void;
    currentPage?: number;
    onCurrentPageChange?: (page: number) => void;
}

export default function UBotInvoiceTable({ 
    hoaDons, 
    loading, 
    onRefresh,
    matchedInvoiceNumbers,
    searchTerm: externalSearchTerm,
    onSearchChange,
    expandedInvoices: externalExpandedInvoices,
    onExpandedInvoicesChange,
    currentPage: externalCurrentPage,
    onCurrentPageChange,
}: UBotInvoiceTableProps) {
    // Use external state if provided, otherwise use internal state
    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [internalExpandedInvoices, setInternalExpandedInvoices] = useState<Set<string>>(new Set());
    const [internalCurrentPage, setInternalCurrentPage] = useState(1);
    
    const searchTerm = externalSearchTerm ?? internalSearchTerm;
    const setSearchTerm = (value: string | ((prev: string) => string)) => {
        const newValue = typeof value === 'function' ? value(searchTerm) : value;
        if (onSearchChange) {
            onSearchChange(newValue);
        } else {
            setInternalSearchTerm(newValue);
        }
    };
    
    const expandedInvoices = externalExpandedInvoices ?? internalExpandedInvoices;
    const setExpandedInvoices = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        const newValue = typeof value === 'function' ? value(expandedInvoices) : value;
        if (onExpandedInvoicesChange) {
            onExpandedInvoicesChange(newValue);
        } else {
            setInternalExpandedInvoices(newValue);
        }
    };
    
    const currentPage = externalCurrentPage ?? internalCurrentPage;
    const setCurrentPage = (value: number | ((prev: number) => number)) => {
        const newValue = typeof value === 'function' ? value(currentPage) : value;
        if (onCurrentPageChange) {
            onCurrentPageChange(newValue);
        } else {
            setInternalCurrentPage(newValue);
        }
    };
    
    const [refreshing, setRefreshing] = useState(false);
    const pageSize = 100;
    const matchedInvoiceKeySet = matchedInvoiceNumbers ?? EMPTY_MATCHED_INVOICE_SET;

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/hoa-don/refresh`, { method: 'POST' });
            const text = await res.text();
            
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    alert(`✅ ${data.message}\n\nTổng: ${data.total} bản ghi`);
                    onRefresh();
                } else {
                    console.error('Error details:', data);
                    const tried = Array.isArray(data.tried) && data.tried.length > 0
                        ? `\n\nTried runtimes:\n${data.tried.join('\n')}`
                        : '';
                    alert(`❌ ${data.error}\n\n${data.details || ''}${tried}\n\n${data.output?.substring(0, 500) || ''}`);
                }
            } catch (parseErr) {
                console.error('Response:', text);
                alert('❌ Lỗi parse JSON. Response: ' + text.substring(0, 200));
            }
        } catch (err: any) {
            alert('❌ Lỗi: ' + err.message);
        } finally {
            setRefreshing(false);
        }
    };

    // Group theo invoice_id
    const invoiceGroups = useMemo(() => {
        let filtered = hoaDons;

        // Tìm kiếm
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(hd =>
                hd.soHoaDon.toLowerCase().includes(term) ||
                hd.congTy.toLowerCase().includes(term) ||
                hd.tenHangHoa.toLowerCase().includes(term) ||
                hd.maHangHoa.toLowerCase().includes(term)
            );
        }

        // Gom nhóm theo idHoaDon
        const groups: { [key: string]: HoaDonUBot[] } = {};
        filtered.forEach(hd => {
            if (!groups[hd.idHoaDon]) {
                groups[hd.idHoaDon] = [];
            }
            groups[hd.idHoaDon].push(hd);
        });

        return Object.entries(groups).map(([idHoaDon, items]) => {
            const isMatched = (() => {
                if (matchedInvoiceKeySet.size === 0) return false;
                const numberKey = normalizeInvoiceKey(getInvoiceNumber(items[0]));
                const idKey = normalizeInvoiceKey(items[0].idHoaDon);
                return (numberKey && matchedInvoiceKeySet.has(numberKey)) || (idKey && matchedInvoiceKeySet.has(idKey));
            })();

            return {
                idHoaDon,
                items: items.sort((a, b) => a.sttDongHang - b.sttDongHang),
                firstItem: items[0],
                isMatched,
                totalAmount: items.reduce((sum, item) => 
                    sum + item.soLuong * item.donGiaChuaThue * (1 + item.thueSuatGtgt / 100), 0
                ),
            };
        }).sort((a, b) => 
            new Date(b.firstItem.ngayHoaDon).getTime() - new Date(a.firstItem.ngayHoaDon).getTime()
        );
    }, [hoaDons, searchTerm, matchedInvoiceKeySet]);

    // Pagination
    const totalPages = Math.ceil(invoiceGroups.length / pageSize);
    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return invoiceGroups.slice(start, end);
    }, [invoiceGroups, currentPage, pageSize]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const toggleExpand = (idHoaDon: string, anchorElement?: HTMLElement | null) => {
        const beforeTop = anchorElement?.getBoundingClientRect().top;

        setExpandedInvoices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(idHoaDon)) {
                newSet.delete(idHoaDon);
            } else {
                newSet.add(idHoaDon);
            }
            return newSet;
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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Đang tải dữ liệu...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search & Refresh */}
            <div className="flex gap-3">
                <Input
                    placeholder="Tìm theo số hóa đơn, công ty, tên hàng hóa, mã hàng hóa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                />
                {onRefresh && (
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="text-2xl font-bold text-blue-700">{invoiceGroups.length}</div>
                    <div className="text-sm text-blue-600">Tổng hóa đơn</div>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                    <div className="text-2xl font-bold text-green-700">{hoaDons.length}</div>
                    <div className="text-sm text-green-600">Tổng dòng hàng hóa</div>
                </div>
                <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">
                        {formatCurrency(invoiceGroups.reduce((sum, g) => sum + g.totalAmount, 0))}
                    </div>
                    <div className="text-sm text-purple-600">Tổng giá trị</div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium w-12"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Số HĐ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Ngày HĐ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Công ty</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Số mặt hàng</th>
                                <th className="px-4 py-3 text-right text-xs font-medium">Tổng giá trị</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Trạng thái</th>
                                <th className="px-4 py-3 text-center text-xs font-medium w-24">Tra cứu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedGroups.map((group) => {
                                const isExpanded = expandedInvoices.has(group.idHoaDon);
                                const firstItem = group.firstItem;
                                const rowClassName = group.isMatched
                                    ? 'border-b bg-emerald-50/40 text-muted-foreground opacity-60 hover:bg-emerald-50/60 cursor-pointer'
                                    : 'border-b bg-muted/30 hover:bg-muted/50 cursor-pointer';
                                const detailRowClassName = group.isMatched ? 'border-b opacity-60' : 'border-b';
                                const detailContainerClassName = group.isMatched ? 'bg-emerald-50/20 p-4' : 'bg-muted/10 p-4';

                                return (
                                    <React.Fragment key={group.idHoaDon}>
                                        {/* Dòng hóa đơn */}
                                        <tr
                                            className={rowClassName}
                                            onClick={(e) => toggleExpand(group.idHoaDon, e.currentTarget)}
                                        >
                                            <td className="px-4 py-2">
                                                <svg
                                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </td>
                                            <td className="px-4 py-2 font-medium text-sm">{firstItem.soHoaDon}</td>
                                            <td className="px-4 py-2 text-sm">{formatDate(firstItem.ngayHoaDon)}</td>
                                            <td className="px-4 py-2">
                                                <div className="max-w-xs">
                                                    <div className="font-medium text-sm">{firstItem.congTy}</div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        MST: {firstItem.maSoThueNguoiBan}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center text-sm">{group.items.length}</td>
                                            <td className="px-4 py-2 text-right font-medium text-sm">
                                                {formatCurrency(group.totalAmount)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <Badge variant={firstItem.trangThaiHoaDon === 'VALID' ? 'default' : 'secondary'}>
                                                        {firstItem.trangThaiHoaDon}
                                                    </Badge>
                                                    {group.isMatched ? (
                                                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-[11px]">
                                                            Đã match
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <a
                                                    href={firstItem.linkTraCuuHoaDon}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Xem PDF
                                                </a>
                                            </td>
                                        </tr>

                                        {/* Chi tiết hàng hóa */}
                                        {isExpanded && (
                                            <tr className={detailRowClassName}>
                                                <td colSpan={8} className="p-0">
                                                    <div className={detailContainerClassName}>
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b">
                                                                    <th className="px-2 py-2 text-left text-xs">STT</th>
                                                                    <th className="px-2 py-2 text-left text-xs">Mã hàng</th>
                                                                    <th className="px-2 py-2 text-left text-xs">Tên hàng hóa</th>
                                                                    <th className="px-2 py-2 text-center text-xs">ĐVT</th>
                                                                    <th className="px-2 py-2 text-right text-xs">Số lượng</th>
                                                                    <th className="px-2 py-2 text-right text-xs">Đơn giá</th>
                                                                    <th className="px-2 py-2 text-center text-xs">VAT</th>
                                                                    <th className="px-2 py-2 text-right text-xs">Thành tiền</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.items.map((item) => {
                                                                    const thanhTien = item.soLuong * item.donGiaChuaThue * (1 + item.thueSuatGtgt / 100);
                                                                    return (
                                                                        <tr key={item.id} className="border-b last:border-0">
                                                                            <td className="px-2 py-2">{item.sttDongHang}</td>
                                                                            <td className="px-2 py-2 font-mono text-xs">{item.maHangHoa}</td>
                                                                            <td className="px-2 py-2">{item.tenHangHoa}</td>
                                                                            <td className="px-2 py-2 text-center">{item.donViTinh}</td>
                                                                            <td className="px-2 py-2 text-right">{item.soLuong.toLocaleString('vi-VN')}</td>
                                                                            <td className="px-2 py-2 text-right">{formatCurrency(item.donGiaChuaThue)}</td>
                                                                            <td className="px-2 py-2 text-center">{item.thueSuatGtgt}%</td>
                                                                            <td className="px-2 py-2 text-right font-medium">{formatCurrency(thanhTien)}</td>
                                                                        </tr>
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

                {invoiceGroups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy hóa đơn
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={invoiceGroups.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    );
}
