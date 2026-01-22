import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonthlyForecastRecord, MonthlyForecastItem } from "@/data/forecast/type";
import { TabsContent } from "@radix-ui/react-tabs";
import { Calendar, ChevronDown, ChevronRight, CheckCircle2, XCircle, FilePen, FileText, Clock, Package } from "lucide-react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface IMonthlyForecastHistoryProps {
    data: MonthlyForecastRecord[];
}

const MonthlyForecastHistory = ({ data }: IMonthlyForecastHistoryProps) => {
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<MonthlyForecastRecord | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    // Nhóm dữ liệu theo năm
    const groupedByYear = data.reduce((acc, record) => {
        const year = record.nam;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(record);
        return acc;
    }, {} as Record<number, MonthlyForecastRecord[]>);

    // Sắp xếp năm giảm dần
    const sortedYears = Object.keys(groupedByYear)
        .map(Number)
        .sort((a, b) => b - a);

    const toggleMonth = (id: string) => {
        setExpandedMonths(prev =>
            prev.includes(id)
                ? prev.filter(m => m !== id)
                : [...prev, id]
        );
    };

    const getStatusBadge = (status: MonthlyForecastRecord['trangThai']) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
            case 'partial':
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><FilePen className="w-3 h-3 mr-1" />Duyệt một phần</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
            default:
                return null;
        }
    };

    const getItemStatusBadge = (status: MonthlyForecastItem['trangThai']) => {
        const baseClass = "text-[10px]";
        switch (status) {
            case 'approved':
                return <Badge className={`bg-green-100 text-green-700 border-green-300 ${baseClass}`}>Duyệt</Badge>;
            case 'edited':
                return <Badge className={`bg-orange-100 text-orange-700 border-orange-300 ${baseClass}`}>Đã sửa</Badge>;
            case 'rejected':
                return <Badge className={`bg-red-100 text-red-700 border-red-300 ${baseClass}`}>Từ chối</Badge>;
            default:
                return null;
        }
    };

    const getMonthName = (month: number) => {
        return `Tháng ${month}`;
    };

    const viewDetail = (record: MonthlyForecastRecord) => {
        setSelectedRecord(record);
        setIsDetailDialogOpen(true);
    };

    return (
        <TabsContent value="monthly-history" className="space-y-6">
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Lịch sử dự trù theo tháng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {sortedYears.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Chưa có lịch sử dự trù nào</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedYears.map(year => (
                                <div key={year} className="space-y-3">
                                    {/* Header năm */}
                                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border pb-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Năm {year}
                                    </div>

                                    {/* Danh sách tháng */}
                                    <div className="space-y-2 pl-4">
                                        {groupedByYear[year]
                                            .sort((a, b) => b.thang - a.thang)
                                            .map(record => (
                                                <div key={record.id} className="border border-border rounded-lg overflow-hidden">
                                                    {/* Header tháng */}
                                                    <div
                                                        className="flex items-center justify-between p-4 bg-tertiary hover:bg-tertiary/80 cursor-pointer transition-colors"
                                                        onClick={() => toggleMonth(record.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                {expandedMonths.includes(record.id) ? (
                                                                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                                )}
                                                                <span className="font-medium text-foreground">
                                                                    {getMonthName(record.thang)}
                                                                </span>
                                                            </div>
                                                            {getStatusBadge(record.trangThai)}
                                                        </div>

                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Package className="w-4 h-4" />
                                                                <span>{record.tongSoVatTu} vật tư</span>
                                                            </div>
                                                            <div className="text-foreground font-medium">
                                                                {record.tongGiaTri.toLocaleString('vi-VN')}đ
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    viewDetail(record);
                                                                }}
                                                            >
                                                                <FileText className="w-4 h-4 mr-1" />
                                                                Chi tiết
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Nội dung mở rộng */}
                                                    {expandedMonths.includes(record.id) && (
                                                        <div className="p-4 bg-neutral border-t border-border">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Ngày tạo</p>
                                                                    <p className="font-medium">{record.ngayTao.toLocaleDateString('vi-VN')}</p>
                                                                </div>
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Ngày duyệt</p>
                                                                    <p className="font-medium">{record.ngayDuyet.toLocaleDateString('vi-VN')}</p>
                                                                </div>
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Người tạo</p>
                                                                    <p className="font-medium">{record.nguoiTao}</p>
                                                                </div>
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Người duyệt</p>
                                                                    <p className="font-medium">{record.nguoiDuyet}</p>
                                                                </div>
                                                            </div>

                                                            {/* Bảng vật tư preview */}
                                                            {record.danhSachVatTu.length > 0 && (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-sm">
                                                                        <thead className="bg-primary/10">
                                                                            <tr>
                                                                                <th className="px-3 py-2 text-left text-xs font-medium">STT</th>
                                                                                <th className="px-3 py-2 text-left text-xs font-medium">Mã VT</th>
                                                                                <th className="px-3 py-2 text-left text-xs font-medium">Tên vật tư</th>
                                                                                <th className="px-3 py-2 text-center text-xs font-medium">Dự trù</th>
                                                                                <th className="px-3 py-2 text-right text-xs font-medium">Thành tiền</th>
                                                                                <th className="px-3 py-2 text-center text-xs font-medium">Trạng thái</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-border">
                                                                            {record.danhSachVatTu.slice(0, 5).map((item, idx) => (
                                                                                <tr key={idx} className="hover:bg-tertiary/50">
                                                                                    <td className="px-3 py-2 text-xs">{item.stt}</td>
                                                                                    <td className="px-3 py-2 text-xs font-mono">{item.maVtyt}</td>
                                                                                    <td className="px-3 py-2 text-xs">{item.tenVtyt}</td>
                                                                                    <td className="px-3 py-2 text-xs text-center">{item.duTru}</td>
                                                                                    <td className="px-3 py-2 text-xs text-right">{item.thanhTien.toLocaleString('vi-VN')}đ</td>
                                                                                    <td className="px-3 py-2 text-center">{getItemStatusBadge(item.trangThai)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                    {record.danhSachVatTu.length > 5 && (
                                                                        <p className="text-xs text-muted-foreground text-center py-2">
                                                                            và {record.danhSachVatTu.length - 5} vật tư khác...
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog chi tiết */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Chi tiết dự trù {selectedRecord && `${getMonthName(selectedRecord.thang)}/${selectedRecord.nam}`}
                        </DialogTitle>
                        <DialogDescription>
                            Danh sách vật tư đã duyệt trong kỳ dự trù
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRecord && (
                        <div className="space-y-4">
                            {/* Thông tin tổng quan */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Tổng số vật tư</p>
                                    <p className="text-xl font-semibold">{selectedRecord.tongSoVatTu}</p>
                                </div>
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Tổng giá trị</p>
                                    <p className="text-xl font-semibold text-green-600">{selectedRecord.tongGiaTri.toLocaleString('vi-VN')}đ</p>
                                </div>
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Người duyệt</p>
                                    <p className="font-medium">{selectedRecord.nguoiDuyet}</p>
                                </div>
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Ngày duyệt</p>
                                    <p className="font-medium">{selectedRecord.ngayDuyet.toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            {/* Bảng chi tiết */}
                            <div className="overflow-x-auto border border-border rounded-lg">
                                <table className="w-full">
                                    <thead className="bg-primary text-primary-foreground">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium">STT</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Mã VT</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Quy cách</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium">Dự trù</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium">Gọi hàng</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium">Đơn giá</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium">Thành tiền</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {selectedRecord.danhSachVatTu.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-tertiary">
                                                <td className="px-3 py-2 text-xs text-center">{item.stt}</td>
                                                <td className="px-3 py-2 text-xs font-mono">{item.maVtyt}</td>
                                                <td className="px-3 py-2 text-sm">{item.tenVtyt}</td>
                                                <td className="px-3 py-2 text-xs">{item.quyCach}</td>
                                                <td className="px-3 py-2 text-xs text-center font-medium">{item.duTru}</td>
                                                <td className="px-3 py-2 text-xs text-center">{item.goiHang}</td>
                                                <td className="px-3 py-2 text-xs text-right">{item.donGia.toLocaleString('vi-VN')}đ</td>
                                                <td className="px-3 py-2 text-xs text-right font-medium">{item.thanhTien.toLocaleString('vi-VN')}đ</td>
                                                <td className="px-3 py-2 text-center">{getItemStatusBadge(item.trangThai)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-tertiary">
                                        <tr>
                                            <td colSpan={7} className="px-3 py-3 text-sm font-semibold text-right">Tổng cộng:</td>
                                            <td className="px-3 py-3 text-sm font-semibold text-right text-green-600">
                                                {selectedRecord.danhSachVatTu.reduce((sum, item) => sum + item.thanhTien, 0).toLocaleString('vi-VN')}đ
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </TabsContent>
    );
};

export default MonthlyForecastHistory;
