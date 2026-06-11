import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { MonthlyForecastRecord, MonthlyForecastItem } from "@/data/forecast/type";
import { TabsContent } from "@radix-ui/react-tabs";
import { Calendar, ChevronDown, ChevronRight, CheckCircle2, X, XCircle, FilePen, FileText, Package, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const formatDate = (value?: Date) => {
    if (!value) {
        return "-";
    }

    const parsedValue = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsedValue.getTime()) ? "-" : parsedValue.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: Date) => {
    if (!value) {
        return "-";
    }

    const parsedValue = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsedValue.getTime()) ? "-" : parsedValue.toLocaleString("vi-VN");
};

const getTypeLevel1 = (typeName?: string): string => {
    if (!typeName) return "";
    const parts = typeName
        .split("-")
        .map((part) => part.trim())
        .filter(Boolean);
    const code = parts.length >= 1 ? parts[0] : "";
    const codeParts = code.split(".");
    if (codeParts.length <= 3) return code;
    return codeParts.slice(0, 3).join(".");
};

const getTypeLevel2 = (typeName?: string): string => {
    if (!typeName) return "";
    const parts = typeName
        .split("-")
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length >= 2 ? parts[1] : "";
};

const MonthlyForecastHistory = ({ data }: IMonthlyForecastHistoryProps) => {
    const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<MonthlyForecastRecord | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [searchModalTerm, setSearchModalTerm] = useState<string>("");
    const [selectedTypeLevel1, setSelectedTypeLevel1] = useState<string[]>([]);
    const [selectedTypeLevel2, setSelectedTypeLevel2] = useState<string[]>([]);
    const [typeLevel1PopoverOpen, setTypeLevel1PopoverOpen] = useState(false);
    const [typeLevel2PopoverOpen, setTypeLevel2PopoverOpen] = useState(false);

    const groupedByYear = data.reduce((acc, record) => {
        const year = record.nam;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(record);
        return acc;
    }, {} as Record<number, MonthlyForecastRecord[]>);

    const sortedYears = Object.keys(groupedByYear)
        .map(Number)
        .sort((a, b) => b - a);

    const toggleMonth = (id: string) => {
        setExpandedMonths((prev) =>
            prev.includes(id)
                ? prev.filter((monthId) => monthId !== id)
                : [...prev, id],
        );
    };

    const getStatusBadge = (status: MonthlyForecastRecord["trangThai"]) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
            case "partial":
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><FilePen className="w-3 h-3 mr-1" />Duyệt một phần</Badge>;
            case "rejected":
                return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
            default:
                return null;
        }
    };

    const getItemStatusBadge = (status: MonthlyForecastItem["trangThai"]) => {
        const baseClass = "text-[10px]";
        switch (status) {
            case "approved":
                return <Badge className={`bg-green-100 text-green-700 border-green-300 ${baseClass}`}>Duyệt</Badge>;
            case "edited":
                return <Badge className={`bg-orange-100 text-orange-700 border-orange-300 ${baseClass}`}>Đã sửa</Badge>;
            case "rejected":
                return <Badge className={`bg-red-100 text-red-700 border-red-300 ${baseClass}`}>Từ chối</Badge>;
            default:
                return null;
        }
    };

    const getMonthName = (month: number) => `Tháng ${month}`;

    const viewDetail = (record: MonthlyForecastRecord) => {
        setSelectedRecord(record);
        setSearchModalTerm("");
        setSelectedTypeLevel1([]);
        setSelectedTypeLevel2([]);
        setTypeLevel1PopoverOpen(false);
        setTypeLevel2PopoverOpen(false);
        setIsDetailDialogOpen(true);
    };

    useEffect(() => {
        if (isDetailDialogOpen) {
            return;
        }

        setSearchModalTerm("");
        setSelectedTypeLevel1([]);
        setSelectedTypeLevel2([]);
        setTypeLevel1PopoverOpen(false);
        setTypeLevel2PopoverOpen(false);
    }, [isDetailDialogOpen]);

    const monthlyItems = selectedRecord?.danhSachVatTu ?? [];
    const typeLevel1Options = useMemo(
        () => [...new Set(monthlyItems.map((item) => getTypeLevel1(item.typeName)).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [monthlyItems]
    );
    const typeLevel2Options = useMemo(() => {
        if (selectedTypeLevel1.length === 0) return [];
        const base = monthlyItems.filter((item) => selectedTypeLevel1.includes(getTypeLevel1(item.typeName)));
        return [...new Set(base.map((item) => getTypeLevel2(item.typeName)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    }, [monthlyItems, selectedTypeLevel1]);
    const filteredItems = useMemo(() => {
        const searchLower = searchModalTerm.trim().toLowerCase();

        return monthlyItems.filter((item) => {
            const matchesSearch =
                searchLower.length === 0 ||
                item.tenVtyt.toLowerCase().includes(searchLower) ||
                item.maVtyt.toLowerCase().includes(searchLower) ||
                item.quyCach.toLowerCase().includes(searchLower) ||
                (item.typeName || "").toLowerCase().includes(searchLower);

            const matchesLevel1 =
                selectedTypeLevel1.length === 0 ||
                selectedTypeLevel1.includes(getTypeLevel1(item.typeName));

            const matchesLevel2 =
                selectedTypeLevel2.length === 0 ||
                selectedTypeLevel2.includes(getTypeLevel2(item.typeName));

            return matchesSearch && matchesLevel1 && matchesLevel2;
        });
    }, [monthlyItems, searchModalTerm, selectedTypeLevel1, selectedTypeLevel2]);

    const filteredTotalValue = filteredItems.reduce((sum, item) => sum + item.thanhTien, 0);
    const isTypeLevel2Disabled = selectedTypeLevel1.length === 0;
    const isAllTypeLevel1Selected = selectedTypeLevel1.length > 0 && selectedTypeLevel1.length === typeLevel1Options.length;
    const isAllTypeLevel2Selected = selectedTypeLevel2.length > 0 && selectedTypeLevel2.length === typeLevel2Options.length;
    const typeLevel1Label = selectedTypeLevel1.length === 0
        ? "Tất cả cấp 1"
        : selectedTypeLevel1.length === 1
            ? selectedTypeLevel1[0]
            : `${selectedTypeLevel1.length} cấp 1 đã chọn`;
    const typeLevel2Label = isTypeLevel2Disabled
        ? "Chọn cấp 1 trước"
        : selectedTypeLevel2.length === 0
            ? "Tất cả cấp 2"
            : selectedTypeLevel2.length === 1
                ? selectedTypeLevel2[0]
                : `${selectedTypeLevel2.length} cấp 2 đã chọn`;

    const handleTypeLevel1Toggle = (code: string) => {
        setSelectedTypeLevel1((prev) => {
            if (prev.includes(code)) {
                const next = prev.filter((item) => item !== code);
                if (next.length === 0) {
                    setSelectedTypeLevel2([]);
                }
                return next;
            }
            return [...prev, code];
        });
    };

    const handleSelectAllTypeLevel1 = () => {
        if (selectedTypeLevel1.length === typeLevel1Options.length) {
            setSelectedTypeLevel1([]);
            setSelectedTypeLevel2([]);
            return;
        }
        setSelectedTypeLevel1([...typeLevel1Options]);
    };

    const handleClearTypeLevel1 = () => {
        setSelectedTypeLevel1([]);
        setSelectedTypeLevel2([]);
    };

    const handleTypeLevel2Toggle = (code: string) => {
        if (selectedTypeLevel1.length === 0) return;
        setSelectedTypeLevel2((prev) => {
            if (prev.includes(code)) {
                return prev.filter((item) => item !== code);
            }
            return [...prev, code];
        });
    };

    const handleSelectAllTypeLevel2 = () => {
        if (selectedTypeLevel1.length === 0) return;
        if (selectedTypeLevel2.length === typeLevel2Options.length) {
            setSelectedTypeLevel2([]);
            return;
        }
        setSelectedTypeLevel2([...typeLevel2Options]);
    };

    const handleClearTypeLevel2 = () => {
        setSelectedTypeLevel2([]);
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
                            {sortedYears.map((year) => (
                                <div key={year} className="space-y-3">
                                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground border-b border-border pb-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Năm {year}
                                    </div>

                                    <div className="space-y-2 pl-4">
                                        {groupedByYear[year]
                                            .sort((a, b) => b.thang - a.thang)
                                            .map((record) => (
                                                <div key={record.id} className="border border-border rounded-lg overflow-hidden">
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
                                                                {record.tongGiaTri.toLocaleString("vi-VN")}đ
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

                                                    {expandedMonths.includes(record.id) && (
                                                        <div className="p-4 bg-neutral border-t border-border">
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Ngày tạo</p>
                                                                    <p className="font-medium">{formatDate(record.ngayTao)}</p>
                                                                </div>
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Ngày duyệt</p>
                                                                    <p className="font-medium">{formatDate(record.ngayDuyet)}</p>
                                                                </div>
                                                                <div className="bg-tertiary p-3 rounded-lg">
                                                                    <p className="text-muted-foreground text-xs">Người tạo</p>
                                                                    <p className="font-medium">{record.nguoiTao}</p>
                                                                </div>
                                                            </div>
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

            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="w-[90vw] max-w-[1200px] h-[90vh] overflow-hidden p-5 sm:p-6 flex flex-col">
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
                        <div className="flex flex-1 min-h-0 flex-col space-y-5">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Tổng số vật tư</p>
                                    <p className="text-xl font-semibold">{selectedRecord.tongSoVatTu}</p>
                                </div>
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Tổng giá trị</p>
                                    <p className="text-xl font-semibold text-green-600">{selectedRecord.tongGiaTri.toLocaleString("vi-VN")}đ</p>
                                </div>
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Người tạo</p>
                                    <p className="font-medium">{selectedRecord.nguoiTao}</p>
                                </div>
                                <div className="bg-tertiary p-3 rounded-lg">
                                    <p className="text-muted-foreground text-xs">Ngày tạo</p>
                                    <p className="font-medium">{formatDate(selectedRecord.ngayTao)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col lg:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm vật tư (tên, mã, quy cách...)"
                                            value={searchModalTerm}
                                            onChange={(e) => setSearchModalTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <Popover open={typeLevel1PopoverOpen} onOpenChange={setTypeLevel1PopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full lg:w-56 justify-between font-normal">
                                                <span className="truncate">{typeLevel1Label}</span>
                                                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56 p-0" align="start">
                                            <div className="p-3 border-b border-border flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground">Chọn cấp 1</span>
                                                <button onClick={handleSelectAllTypeLevel1} className="text-xs text-secondary hover:text-secondary/80">
                                                    {isAllTypeLevel1Selected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                                </button>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto p-2">
                                                {typeLevel1Options.map((code) => (
                                                    <div
                                                        key={code}
                                                        className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                                                        onClick={() => handleTypeLevel1Toggle(code)}
                                                    >
                                                        <Checkbox
                                                            id={`monthly-type-level1-${code}`}
                                                            checked={selectedTypeLevel1.includes(code)}
                                                            onCheckedChange={() => handleTypeLevel1Toggle(code)}
                                                        />
                                                        <label htmlFor={`monthly-type-level1-${code}`} className="text-sm text-foreground cursor-pointer flex-1">
                                                            {code}
                                                        </label>
                                                    </div>
                                                ))}
                                                {typeLevel1Options.length === 0 && (
                                                    <div className="p-2 text-xs text-muted-foreground">Không có cấp 1</div>
                                                )}
                                            </div>
                                            {selectedTypeLevel1.length > 0 && (
                                                <div className="p-2 border-t border-border">
                                                    <Button variant="ghost" size="sm" onClick={handleClearTypeLevel1} className="w-full text-muted-foreground hover:text-foreground">
                                                        <X className="w-4 h-4 mr-2" />
                                                        Xóa bộ lọc
                                                    </Button>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>

                                    <Popover open={typeLevel2PopoverOpen} onOpenChange={setTypeLevel2PopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" disabled={isTypeLevel2Disabled} className="w-full lg:w-56 justify-between font-normal">
                                                <span className="truncate">{typeLevel2Label}</span>
                                                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56 p-0" align="start">
                                            <div className="p-3 border-b border-border flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground">Chọn cấp 2</span>
                                                <button onClick={handleSelectAllTypeLevel2} className="text-xs text-secondary hover:text-secondary/80">
                                                    {isAllTypeLevel2Selected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                                </button>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto p-2">
                                                {typeLevel2Options.map((code) => (
                                                    <div
                                                        key={code}
                                                        className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                                                        onClick={() => handleTypeLevel2Toggle(code)}
                                                    >
                                                        <Checkbox
                                                            id={`monthly-type-level2-${code}`}
                                                            checked={selectedTypeLevel2.includes(code)}
                                                            onCheckedChange={() => handleTypeLevel2Toggle(code)}
                                                        />
                                                        <label htmlFor={`monthly-type-level2-${code}`} className="text-sm text-foreground cursor-pointer flex-1">
                                                            {code}
                                                        </label>
                                                    </div>
                                                ))}
                                                {typeLevel2Options.length === 0 && (
                                                    <div className="p-2 text-xs text-muted-foreground">Không có cấp 2</div>
                                                )}
                                            </div>
                                            {selectedTypeLevel2.length > 0 && (
                                                <div className="p-2 border-t border-border">
                                                    <Button variant="ghost" size="sm" onClick={handleClearTypeLevel2} className="w-full text-muted-foreground hover:text-foreground">
                                                        <X className="w-4 h-4 mr-2" />
                                                        Xóa bộ lọc
                                                    </Button>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {(selectedTypeLevel1.length > 0 || selectedTypeLevel2.length > 0) && (
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-sm text-muted-foreground">Đang lọc:</span>
                                        {selectedTypeLevel1.map((code) => (
                                            <Badge
                                                key={`monthly-type1-${code}`}
                                                variant="secondary"
                                                className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                                onClick={() => handleTypeLevel1Toggle(code)}
                                            >
                                                Cấp 1: {code}
                                                <X className="w-3 h-3 ml-1" />
                                            </Badge>
                                        ))}
                                        {selectedTypeLevel2.map((code) => (
                                            <Badge
                                                key={`monthly-type2-${code}`}
                                                variant="secondary"
                                                className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                                onClick={() => handleTypeLevel2Toggle(code)}
                                            >
                                                Cấp 2: {code}
                                                <X className="w-3 h-3 ml-1" />
                                            </Badge>
                                        ))}
                                        <button
                                            onClick={() => {
                                                setSearchModalTerm("");
                                                handleClearTypeLevel1();
                                                handleClearTypeLevel2();
                                            }}
                                            className="text-xs text-muted-foreground hover:text-foreground underline"
                                        >
                                            Xóa tất cả
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border flex flex-col">
                                <table className="w-full">
                                    <thead className="bg-primary text-primary-foreground sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium">STT</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Mã VT</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Cấp 1</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Cấp 2</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Quy cách</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium">Dự trù</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium">Gọi hàng</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium">Đơn giá</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium">Thành tiền</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium">Trạng thái</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Người duyệt</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Thời gian duyệt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-tertiary">
                                                <td className="px-3 py-2 text-xs text-center">{item.stt}</td>
                                                <td className="px-3 py-2 text-xs font-mono">{item.maVtyt}</td>
                                                <td className="px-3 py-2 text-sm">{item.tenVtyt}</td>
                                                <td className="px-3 py-2 text-xs">{getTypeLevel1(item.typeName) || "-"}</td>
                                                <td className="px-3 py-2 text-xs">{getTypeLevel2(item.typeName) || "-"}</td>
                                                <td className="px-3 py-2 text-xs">{item.quyCach}</td>
                                                <td className="px-3 py-2 text-xs text-center font-medium">{item.duTru}</td>
                                                <td className="px-3 py-2 text-xs text-center">{item.goiHang}</td>
                                                <td className="px-3 py-2 text-xs text-right">{item.donGia.toLocaleString("vi-VN")}đ</td>
                                                <td className="px-3 py-2 text-xs text-right font-medium">{item.thanhTien.toLocaleString("vi-VN")}đ</td>
                                                <td className="px-3 py-2 text-center">{getItemStatusBadge(item.trangThai)}</td>
                                                <td className="px-3 py-2 text-xs">{item.nguoiDuyet || "-"}</td>
                                                <td className="px-3 py-2 text-xs whitespace-nowrap">{formatDateTime(item.ngayDuyet)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-tertiary">
                                        <tr>
                                            <td colSpan={9} className="px-3 py-3 text-sm font-semibold text-right">Tổng cộng:</td>
                                            <td className="px-3 py-3 text-sm font-semibold text-right text-green-600">
                                                {filteredTotalValue.toLocaleString("vi-VN")}đ
                                            </td>
                                            <td></td>
                                            <td></td>
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
