import { HoaDonUBot } from '@/types';
import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/pagination';

interface UBotInvoiceTableProps {
    hoaDons: HoaDonUBot[];
    loading?: boolean;
    onRefresh?: () => void;
}

export default function UBotInvoiceTable({ hoaDons, loading, onRefresh }: UBotInvoiceTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
    const [refreshing, setRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 100;

    const handleRefresh = async () => {
        if (!onRefresh) return;
        setRefreshing(true);
        try {
            const res = await fetch('http://localhost:8080/api/hoa-don/refresh', { method: 'POST' });
            const text = await res.text();
            
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    alert(`✅ ${data.message}\n\nTổng: ${data.total} bản ghi`);
                    onRefresh();
                } else {
                    console.error('Error details:', data);
                    alert(`❌ ${data.error}\n\n${data.details || ''}\n\n${data.output?.substring(0, 500) || ''}`);
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

        return Object.entries(groups).map(([idHoaDon, items]) => ({
            idHoaDon,
            items: items.sort((a, b) => a.sttDongHang - b.sttDongHang),
            firstItem: items[0],
            totalAmount: items.reduce((sum, item) => 
                sum + item.soLuong * item.donGiaChuaThue * (1 + item.thueSuatGtgt / 100), 0
            ),
        })).sort((a, b) => 
            new Date(b.firstItem.ngayHoaDon).getTime() - new Date(a.firstItem.ngayHoaDon).getTime()
        );
    }, [hoaDons, searchTerm]);

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

    const toggleExpand = (idHoaDon: string) => {
        setExpandedInvoices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(idHoaDon)) {
                newSet.delete(idHoaDon);
            } else {
                newSet.add(idHoaDon);
            }
            return newSet;
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

                                return (
                                    <React.Fragment key={group.idHoaDon}>
                                        {/* Dòng hóa đơn */}
                                        <tr
                                            className="border-b bg-muted/30 hover:bg-muted/50 cursor-pointer"
                                            onClick={() => toggleExpand(group.idHoaDon)}
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
                                                <Badge variant={firstItem.trangThaiHoaDon === 'VALID' ? 'default' : 'secondary'}>
                                                    {firstItem.trangThaiHoaDon}
                                                </Badge>
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
                                            <tr className="border-b">
                                                <td colSpan={8} className="p-0">
                                                    <div className="bg-muted/10 p-4">
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
