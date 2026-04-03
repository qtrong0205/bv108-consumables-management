import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle, FileDown, FileUp, ChevronDown, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import InventoryTable from '@/components/inventory/InventoryTable';
import ItemDetailModal from '@/components/inventory/ItemDetailModal';
import { MedicalSupply } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useSupplies, useSupplyGroups, useSupplySearch } from '@/hooks/use-supplies';
import ApiDebug from '@/components/debug/ApiDebug';
import Pagination from '@/components/ui/pagination';

const getTypeLevel1 = (typeName?: string): string => {
    if (!typeName) return '';
    const parts = typeName
        .split('-')
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length >= 1 ? parts[0] : '';
};

const getTypeLevel2 = (typeName?: string): string => {
    if (!typeName) return '';
    const parts = typeName
        .split('-')
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length >= 2 ? parts[1] : '';
};

export default function InventoryCatalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTypeLevel1, setSelectedTypeLevel1] = useState<string[]>([]);
    const [selectedTypeLevel2, setSelectedTypeLevel2] = useState<string[]>([]);
    const [stockFilter, setStockFilter] = useState<'all' | 'low-stock'>('all');
    const [selectedItem, setSelectedItem] = useState<MedicalSupply | null>(null);
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [typeLevel1PopoverOpen, setTypeLevel1PopoverOpen] = useState(false);
    const [typeLevel2PopoverOpen, setTypeLevel2PopoverOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Hook cho danh sách thông thường
    const normalList = useSupplies(1, 100);

    // Hook cho tìm kiếm
    const searchList = useSupplySearch(100);

    // Chọn hook nào để dùng dựa trên searchInput
    const isSearching = searchInput.trim().length > 0;
    const activeHook = isSearching ? searchList : normalList;

    const { supplies, loading, error, page, pageSize, total, totalPages, setPage, setPageSize } = activeHook;
    const { groups: categories, loading: groupsLoading } = useSupplyGroups();
    const typeLevel1Options = useMemo(
        () =>
            [...new Set(supplies.map((item) => getTypeLevel1(item.typeName)).filter(Boolean))].sort((a, b) =>
                a.localeCompare(b)
            ),
        [supplies]
    );
    const typeLevel2Options = useMemo(() => {
        if (selectedTypeLevel1.length === 0) return [];
        const base = supplies.filter((item) => selectedTypeLevel1.includes(getTypeLevel1(item.typeName)));
        return [...new Set(base.map((item) => getTypeLevel2(item.typeName)).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b)
        );
    }, [supplies, selectedTypeLevel1]);

    useEffect(() => {
        if (selectedTypeLevel1.length === 0) return;
        const valid = selectedTypeLevel1.filter((code) => typeLevel1Options.includes(code));
        if (valid.length !== selectedTypeLevel1.length) {
            setSelectedTypeLevel1(valid);
        }
    }, [selectedTypeLevel1, typeLevel1Options]);

    useEffect(() => {
        if (selectedTypeLevel2.length === 0) return;
        const valid = selectedTypeLevel2.filter((code) => typeLevel2Options.includes(code));
        if (valid.length !== selectedTypeLevel2.length) {
            setSelectedTypeLevel2(valid);
        }
    }, [selectedTypeLevel2, typeLevel2Options]);

    useEffect(() => {
        if (selectedTypeLevel1.length === 0 && selectedTypeLevel2.length > 0) {
            setSelectedTypeLevel2([]);
        }
    }, [selectedTypeLevel1, selectedTypeLevel2]);

    // Cập nhật keyword cho search hook khi searchInput thay đổi
    useEffect(() => {
        if (isSearching && 'setKeyword' in searchList) {
            searchList.setKeyword(searchInput.trim());
        }
    }, [searchInput, isSearching]);

    // Đọc filter từ URL khi component mount
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam === 'low-stock') {
            setStockFilter('low-stock');
        } else {
            setStockFilter('all');
        }
    }, [searchParams]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Hiển thị thông báo lỗi nếu có
    useEffect(() => {
        if (error) {
            toast({
                title: "Lỗi tải dữ liệu",
                description: error,
                variant: "destructive",
            });
        }
    }, [error, toast]);

    // Filter dữ liệu TRÊN CLIENT (chỉ filter category và stock, không filter search)
    const filteredItems = useMemo(() => {
        let filtered = supplies;

        // Filter theo danh mục (nhiều danh mục)
        if (selectedCategories.length > 0) {
            filtered = filtered.filter((item) => selectedCategories.includes(item.tenNhom || ''));
        }

        // Filter theo mã cấp 1 của typeName
        if (selectedTypeLevel1.length > 0) {
            filtered = filtered.filter((item) => selectedTypeLevel1.includes(getTypeLevel1(item.typeName)));
        }

        // Filter theo mã cấp 2 của typeName (chỉ khi đã chọn mã cấp 1)
        if (selectedTypeLevel1.length > 0 && selectedTypeLevel2.length > 0) {
            filtered = filtered.filter((item) => selectedTypeLevel2.includes(getTypeLevel2(item.typeName)));
        }

        // Filter theo tình trạng tồn kho
        if (stockFilter === 'low-stock') {
            filtered = filtered.filter((item) => item.soLuongTon < item.soLuongToiThieu);
        }

        return filtered;
    }, [supplies, selectedCategories, selectedTypeLevel1, selectedTypeLevel2, stockFilter]);

    // Tính toán lowStock từ dữ liệu supplies
    const lowStock = useMemo(() => {
        return supplies
            .filter((item) => item.soLuongTon < item.soLuongToiThieu)
            .map((item) => item.maVtyt);
    }, [supplies]);

    const lowStockCount = lowStock.length;
    const hasActiveFilters = selectedCategories.length > 0 || selectedTypeLevel1.length > 0 || selectedTypeLevel2.length > 0;
    const isTypeLevel2Disabled = selectedTypeLevel1.length === 0;
    const isAllTypeLevel1Selected = selectedTypeLevel1.length > 0 && selectedTypeLevel1.length === typeLevel1Options.length;
    const isAllTypeLevel2Selected = selectedTypeLevel2.length > 0 && selectedTypeLevel2.length === typeLevel2Options.length;
    const typeLevel1Label = selectedTypeLevel1.length === 0
        ? 'Tất cả mã cấp 1'
        : selectedTypeLevel1.length === 1
            ? selectedTypeLevel1[0]
            : `${selectedTypeLevel1.length} mã cấp 1 đã chọn`;
    const typeLevel2Label = isTypeLevel2Disabled
        ? 'Chọn mã cấp 1 trước'
        : selectedTypeLevel2.length === 0
            ? 'Tất cả mã cấp 2'
            : selectedTypeLevel2.length === 1
                ? selectedTypeLevel2[0]
                : `${selectedTypeLevel2.length} mã cấp 2 đã chọn`;

    useEffect(() => {
        if (isTypeLevel2Disabled && typeLevel2PopoverOpen) {
            setTypeLevel2PopoverOpen(false);
        }
    }, [isTypeLevel2Disabled, typeLevel2PopoverOpen]);

    const handleStockFilterChange = (value: 'all' | 'low-stock') => {
        setStockFilter(value);
        if (value === 'low-stock') {
            setSearchParams({ filter: 'low-stock' });
        } else {
            setSearchParams({});
        }
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleSelectAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories([...categories]);
        }
    };

    const handleClearCategories = () => {
        setSelectedCategories([]);
    };

    const handleTypeLevel1Toggle = (code: string) => {
        setSelectedTypeLevel1((prev) => {
            if (prev.includes(code)) {
                return prev.filter((item) => item !== code);
            }
            return [...prev, code];
        });
    };

    const handleSelectAllTypeLevel1 = () => {
        if (selectedTypeLevel1.length === typeLevel1Options.length) {
            setSelectedTypeLevel1([]);
        } else {
            setSelectedTypeLevel1([...typeLevel1Options]);
        }
    };

    const handleClearTypeLevel1 = () => {
        setSelectedTypeLevel1([]);
    };

    const handleTypeLevel2Toggle = (code: string) => {
        if (isTypeLevel2Disabled) return;
        setSelectedTypeLevel2((prev) => {
            if (prev.includes(code)) {
                return prev.filter((item) => item !== code);
            }
            return [...prev, code];
        });
    };

    const handleSelectAllTypeLevel2 = () => {
        if (isTypeLevel2Disabled) return;
        if (selectedTypeLevel2.length === typeLevel2Options.length) {
            setSelectedTypeLevel2([]);
        } else {
            setSelectedTypeLevel2([...typeLevel2Options]);
        }
    };

    const handleClearTypeLevel2 = () => {
        setSelectedTypeLevel2([]);
    };

    const handleClearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedTypeLevel1([]);
        setSelectedTypeLevel2([]);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Kiểm tra định dạng file
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'text/csv' // .csv
            ];

            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
                toast({
                    title: "Lỗi định dạng file",
                    description: "Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV (.csv)",
                    variant: "destructive",
                });
                return;
            }

            // TODO: Xử lý đọc và import dữ liệu từ file
            toast({
                title: "Tải file thành công",
                description: `Đã chọn file: ${file.name}`,
            });

            console.log('File được chọn:', file);
            // Reset input để có thể chọn lại cùng file
            event.target.value = '';
        }
    };

    const handleExport = () => {
        // Chuẩn bị dữ liệu cho Excel
        const excelData = filteredItems.map((item, index) => ({
            'STT': index + 1,
            'Mã VT': item.maVtyt,
            'Mã quản lý': item.id,
            'Tên vật tư': item.tenVtyt,
            'Tên thương mại': item.tenThuongMai,
            'Mã hiệu': item.maHieu,
            'Hãng sản xuất': item.hangSanXuat,
            'Nước sản xuất': item.nuocSanXuat,
            'Mã nhóm': item.maNhom,
            'Nhóm vật tư': item.tenNhom,
            'Loại': item.typeName,
            'Đơn vị tính': item.donViTinh,
            'Quy cách': item.quyCach,
            'Đơn giá': item.donGia,
            'Số lượng kế hoạch': item.soLuongKeHoach,
            'Tổng thầu': item.tongThau,
            'Nhà thầu': item.nhaThau,
            'Quyết định': item.quyetDinh,
            'Tồn tối thiểu': item.soLuongToiThieu,
            'Tồn hiện tại': item.soLuongTon,
            'Số lượng tiêu hao': item.soLuongTieuHao,
        }));

        // Tạo workbook và worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh mục tồn kho');

        // Điều chỉnh độ rộng cột
        const colWidths = [
            { wch: 5 },    // STT
            { wch: 12 },   // Mã VT
            { wch: 20 },   // Mã quản lý
            { wch: 90 },   // Tên vật tư
            { wch: 90 },   // Tên thương mại
            { wch: 10 },   // Mã hiệu
            { wch: 20 },   // Hãng sản xuất
            { wch: 12 },   // Nước sản xuất
            { wch: 10 },   // Mã nhóm
            { wch: 60 },   // Nhóm vật tư
            { wch: 15 },   // Loại
            { wch: 10 },   // Đơn vị tính
            { wch: 12 },   // Quy cách
            { wch: 12 },   // Đơn giá
            { wch: 12 },   // Số lượng kế hoạch
            { wch: 10 },   // Tổng thầu
            { wch: 70 },   // Nhà thầu
            { wch: 20 },   // Quyết định
            { wch: 12 },   // Tồn tối thiểu
            { wch: 12 },   // Tồn hiện tại
            { wch: 12 },   // Số lượng tiêu hao
        ];
        ws['!cols'] = colWidths;

        // Xuất file
        const fileName = `danh_muc_ton_kho_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast({
            title: "Xuất file thành công",
            description: `File "${fileName}" đã được tải xuống`,
        });
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Debug Component */}
            {error && <ApiDebug />}

            <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-tertiary/95 backdrop-blur supports-[backdrop-filter]:bg-tertiary/80 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Danh mục tồn kho</h1>
                    <p className="text-muted-foreground">
                        Quản lý và giám sát tồn kho vật tư y tế
                        {!loading && total > 0 && (
                            <span className="ml-2 text-primary font-medium">
                                • {total.toLocaleString('vi-VN')} vật tư
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    {lowStockCount > 0 && (
                        <div
                            onClick={() => handleStockFilterChange(stockFilter === 'low-stock' ? 'all' : 'low-stock')}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${stockFilter === 'low-stock'
                                ? 'bg-warning/20 border-warning'
                                : 'bg-warning/10 border-warning hover:bg-warning/20'
                                }`}
                        >
                            <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={2} />
                            <span className="text-sm font-medium text-foreground">
                                {stockFilter === 'low-stock' ? 'Đang lọc: ' : ''}{lowStockCount} vật tư sắp hết
                            </span>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                        onClick={handleExport}
                    >
                        <FileUp className="w-4 h-4 mr-2" strokeWidth={2} />
                        Xuất file Excel
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                        onClick={handleImportClick}
                    >
                        <FileDown className="w-4 h-4 mr-2" strokeWidth={2} />
                        Nhập file Excel
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                    />
                </div>
            </div>

            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Lọc & Tìm kiếm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2} />
                            <Input
                                type="search"
                                placeholder="Tìm theo tên hoặc mã vật tư..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10 bg-neutral text-foreground border-border"
                            />
                        </div>

                        {/* Multi-select Category Filter */}
                        <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full md:w-72 bg-neutral text-foreground border-border justify-between font-normal"
                                >
                                    <span className="truncate">
                                        {selectedCategories.length === 0
                                            ? 'Tất cả danh mục'
                                            : selectedCategories.length === 1
                                                ? selectedCategories[0]
                                                : `${selectedCategories.length} danh mục đã chọn`}
                                    </span>
                                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="start">
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">Chọn danh mục</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSelectAllCategories}
                                                className="text-xs text-secondary hover:text-secondary/80"
                                            >
                                                {selectedCategories.length === categories.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                    {categories.map((category) => (
                                        <div
                                            key={category}
                                            className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                                            onClick={() => handleCategoryToggle(category)}
                                        >
                                            <Checkbox
                                                id={category}
                                                checked={selectedCategories.includes(category)}
                                                onCheckedChange={() => handleCategoryToggle(category)}
                                            />
                                            <label
                                                htmlFor={category}
                                                className="text-sm text-foreground cursor-pointer flex-1"
                                            >
                                                {category}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {selectedCategories.length > 0 && (
                                    <div className="p-2 border-t border-border">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearCategories}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        {/* Multi-select Type Level 1 Filter */}
                        <Popover open={typeLevel1PopoverOpen} onOpenChange={setTypeLevel1PopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full md:w-56 bg-neutral text-foreground border-border justify-between font-normal"
                                >
                                    <span className="truncate">{typeLevel1Label}</span>
                                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">Chọn mã cấp 1</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSelectAllTypeLevel1}
                                                className="text-xs text-secondary hover:text-secondary/80"
                                            >
                                                {isAllTypeLevel1Selected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                    {typeLevel1Options.map((code) => (
                                        <div
                                            key={code}
                                            className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                                            onClick={() => handleTypeLevel1Toggle(code)}
                                        >
                                            <Checkbox
                                                id={`type-level1-${code}`}
                                                checked={selectedTypeLevel1.includes(code)}
                                                onCheckedChange={() => handleTypeLevel1Toggle(code)}
                                            />
                                            <label
                                                htmlFor={`type-level1-${code}`}
                                                className="text-sm text-foreground cursor-pointer flex-1"
                                            >
                                                {code}
                                            </label>
                                        </div>
                                    ))}
                                    {typeLevel1Options.length === 0 && (
                                        <div className="p-2 text-xs text-muted-foreground">Không có mã cấp 1</div>
                                    )}
                                </div>
                                {selectedTypeLevel1.length > 0 && (
                                    <div className="p-2 border-t border-border">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearTypeLevel1}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        {/* Multi-select Type Level 2 Filter */}
                        <Popover open={typeLevel2PopoverOpen} onOpenChange={setTypeLevel2PopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isTypeLevel2Disabled}
                                    className="w-full md:w-56 bg-neutral text-foreground border-border justify-between font-normal"
                                >
                                    <span className="truncate">{typeLevel2Label}</span>
                                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0" align="start">
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">Chọn mã cấp 2</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSelectAllTypeLevel2}
                                                className="text-xs text-secondary hover:text-secondary/80"
                                            >
                                                {isAllTypeLevel2Selected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                    {typeLevel2Options.map((code) => (
                                        <div
                                            key={code}
                                            className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                                            onClick={() => handleTypeLevel2Toggle(code)}
                                        >
                                            <Checkbox
                                                id={`type-level2-${code}`}
                                                checked={selectedTypeLevel2.includes(code)}
                                                onCheckedChange={() => handleTypeLevel2Toggle(code)}
                                            />
                                            <label
                                                htmlFor={`type-level2-${code}`}
                                                className="text-sm text-foreground cursor-pointer flex-1"
                                            >
                                                {code}
                                            </label>
                                        </div>
                                    ))}
                                    {typeLevel2Options.length === 0 && (
                                        <div className="p-2 text-xs text-muted-foreground">Không có mã cấp 2</div>
                                    )}
                                </div>
                                {selectedTypeLevel2.length > 0 && (
                                    <div className="p-2 border-t border-border">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearTypeLevel2}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        <Select value={stockFilter} onValueChange={(v) => handleStockFilterChange(v as 'all' | 'low-stock')}>
                            <SelectTrigger className="w-full md:w-48 bg-neutral text-foreground border-border">
                                <SelectValue placeholder="Tình trạng tồn kho" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="low-stock">Sắp hết hàng</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Page Size Selector */}
                        <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                            <SelectTrigger className="w-full md:w-40 bg-neutral text-foreground border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="50">50 / trang</SelectItem>
                                <SelectItem value="100">100 / trang</SelectItem>
                                <SelectItem value="200">200 / trang</SelectItem>
                                <SelectItem value="500">500 / trang</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Hiển thị các danh mục đã chọn */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                            <span className="text-sm text-muted-foreground">Đang lọc:</span>
                            {selectedCategories.map((category) => (
                                <Badge
                                    key={category}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                    onClick={() => handleCategoryToggle(category)}
                                >
                                    {category}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            {selectedTypeLevel1.map((code) => (
                                <Badge
                                    key={`type1-${code}`}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                    onClick={() => handleTypeLevel1Toggle(code)}
                                >
                                    Mã cấp 1: {code}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            {selectedTypeLevel2.map((code) => (
                                <Badge
                                    key={`type2-${code}`}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                    onClick={() => handleTypeLevel2Toggle(code)}
                                >
                                    Mã cấp 2: {code}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            <button
                                onClick={handleClearAllFilters}
                                className="text-xs text-muted-foreground hover:text-foreground underline"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Loading state */}
            {loading && (
                <Card className="bg-neutral border-border">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                    </CardContent>
                </Card>
            )}

            {/* Error state */}
            {error && !loading && (
                <Card className="bg-neutral border-border">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-warning mb-4" />
                        <p className="text-foreground font-medium mb-2">Không thể tải dữ liệu</p>
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Inventory Table */}
            {!loading && !error && (
                <>
                    <InventoryTable items={filteredItems} lowStockItems={lowStock} onRowClick={setSelectedItem} />

                    {/* Pagination - chỉ hiển thị khi không filter */}
                    {!searchInput && selectedCategories.length === 0 && selectedTypeLevel1.length === 0 && selectedTypeLevel2.length === 0 && stockFilter === 'all' && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            pageSize={pageSize}
                            onPageChange={setPage}
                        />
                    )}

                    {/* Thông tin khi có filter */}
                    {(searchInput || selectedCategories.length > 0 || selectedTypeLevel1.length > 0 || selectedTypeLevel2.length > 0 || stockFilter === 'low-stock') && (
                        <div className="text-center text-sm text-muted-foreground">
                            Đang hiển thị {filteredItems.length} / {supplies.length} vật tư (đã filter)
                        </div>
                    )}
                </>
            )}

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    allSupplies={supplies}
                    onItemChange={setSelectedItem}
                />
            )}
        </div>
    );
}
