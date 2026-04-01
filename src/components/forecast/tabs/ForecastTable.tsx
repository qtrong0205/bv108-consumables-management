import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Pagination from "@/components/ui/pagination"
import { IVatTuDuTru } from "@/data/mockData";
import { TabsContent } from "@radix-ui/react-tabs"
import { Calculator, CheckCircle2, Search, ChevronDown, ChevronRight, X, Loader2, AlertTriangle } from "lucide-react"
import React from "react"

interface IForecastTableProps {
    statistics: {
        totalForecast: number;
        totalOrder: number;
        totalValue: number;
        approvedCount: number;
    };
    tableData: {
        filteredData: IVatTuDuTru[];
        totalOnPage: number;
        searchTerm: string;
        isSearching: boolean;
        categories: string[];
        selectedCategories: string[];
        typeLevel1Options: string[];
        typeLevel2Options: string[];
        selectedTypeLevel1: string[];
        selectedTypeLevel2: string[];
        typeLevel1PopoverOpen: boolean;
        typeLevel2PopoverOpen: boolean;
        suppliers: string[];
        selectedSuppliers: string[];
        categoryPopoverOpen: boolean;
        supplierPopoverOpen: boolean;
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        error: string | null;
        loading: boolean;
        onSearchChange: (value: string) => void;
        onCategoryPopoverOpenChange: (open: boolean) => void;
        onCategoryToggle: (category: string) => void;
        onSelectAllCategories: () => void;
        onClearCategories: () => void;
        onTypeLevel1PopoverOpenChange: (open: boolean) => void;
        onTypeLevel1Toggle: (code: string) => void;
        onSelectAllTypeLevel1: () => void;
        onClearTypeLevel1: () => void;
        onTypeLevel2PopoverOpenChange: (open: boolean) => void;
        onTypeLevel2Toggle: (code: string) => void;
        onSelectAllTypeLevel2: () => void;
        onClearTypeLevel2: () => void;
        onSupplierPopoverOpenChange: (open: boolean) => void;
        onSupplierToggle: (supplier: string) => void;
        onSelectAllSuppliers: () => void;
        onClearSuppliers: () => void;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
    };
    handlers: {
        onRowClick: (item: IVatTuDuTru) => void;
        getStatusBadge: (item: IVatTuDuTru) => React.ReactNode;
        isForecastEditable: (item: IVatTuDuTru) => boolean;
        canEditForecastRole: boolean;
        onForecastChange: (item: IVatTuDuTru, value: string) => void;
        onForecastFocus: (item: IVatTuDuTru, value: number) => void;
        onForecastBlur: (item: IVatTuDuTru, newValue: number) => void;
        isRowSelected: (item: IVatTuDuTru) => boolean;
        isRowSelectable: (item: IVatTuDuTru) => boolean;
        canSelectRowsRole: boolean;
        onRowSelectToggle: (item: IVatTuDuTru, checked: boolean) => void;
        allSelectableRowsSelected: boolean;
        someSelectableRowsSelected: boolean;
        onToggleSelectAllRows: (checked: boolean) => void;
    };
}

type TypeLevel1Group = {
    key: string;
    code: string;
    level1Code: string;
    label: string;
    items: IVatTuDuTru[];
};

const getTypeLevel1 = (typeName?: string): string => {
    if (!typeName) return '';
    const parts = typeName
        .split('-')
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length >= 1 ? parts[0] : '';
};

const ForecastTable = ({
    statistics,
    tableData,
    handlers,
}: IForecastTableProps) => {
    const [supplierSearchTerm, setSupplierSearchTerm] = React.useState('');
    const { totalForecast, totalOrder, totalValue, approvedCount } = statistics;
    const {
        filteredData,
        totalOnPage,
        searchTerm,
        isSearching,
        categories,
        selectedCategories,
        typeLevel1Options,
        typeLevel2Options,
        selectedTypeLevel1,
        selectedTypeLevel2,
        typeLevel1PopoverOpen,
        typeLevel2PopoverOpen,
        suppliers,
        selectedSuppliers,
        categoryPopoverOpen,
        supplierPopoverOpen,
        page,
        pageSize,
        total,
        totalPages,
        error,
        loading,
        onSearchChange,
        onCategoryPopoverOpenChange,
        onCategoryToggle,
        onSelectAllCategories,
        onClearCategories,
        onTypeLevel1PopoverOpenChange,
        onTypeLevel1Toggle,
        onSelectAllTypeLevel1,
        onClearTypeLevel1,
        onTypeLevel2PopoverOpenChange,
        onTypeLevel2Toggle,
        onSelectAllTypeLevel2,
        onClearTypeLevel2,
        onSupplierPopoverOpenChange,
        onSupplierToggle,
        onSelectAllSuppliers,
        onClearSuppliers,
        onPageChange,
        onPageSizeChange,
    } = tableData;
    const {
        onRowClick,
        getStatusBadge,
        isForecastEditable,
        canEditForecastRole,
        onForecastChange,
        onForecastFocus,
        onForecastBlur,
        isRowSelected,
        isRowSelectable,
        canSelectRowsRole,
        onRowSelectToggle,
        allSelectableRowsSelected,
        someSelectableRowsSelected,
        onToggleSelectAllRows,
    } = handlers;

    const typeGroups = React.useMemo<TypeLevel1Group[]>(() => {
        const groups = new Map<string, TypeLevel1Group>();

        filteredData.forEach((item) => {
            const level1Code = getTypeLevel1(item.typeName);
            const groupName = (item.tenNhom || '').trim();
            const code = level1Code || groupName || 'unknown';
            const fallbackLabel = groupName || level1Code || 'Chưa phân nhóm';

            if (!groups.has(code)) {
                groups.set(code, {
                    key: code,
                    code,
                    level1Code: level1Code || '',
                    label: groupName || fallbackLabel,
                    items: [],
                });
            } else if (groupName) {
                const existing = groups.get(code)!;
                if (!existing.label || existing.label === fallbackLabel) {
                    existing.label = groupName;
                }
                if (!existing.level1Code && level1Code) {
                    existing.level1Code = level1Code;
                }
            }

            groups.get(code)!.items.push(item);
        });

        return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [filteredData]);

    const [expandedTypeGroups, setExpandedTypeGroups] = React.useState<Set<string>>(new Set());

    const toggleExpand = (groupKey: string) => {
        setExpandedTypeGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    const visibleSuppliers = React.useMemo(() => {
        const keyword = supplierSearchTerm.trim().toLowerCase();
        if (!keyword) return suppliers;
        return suppliers.filter((supplier) => supplier.toLowerCase().includes(keyword));
    }, [suppliers, supplierSearchTerm]);

    const isTypeLevel2Disabled = selectedTypeLevel1.length === 0;
    const isAllTypeLevel1Selected = selectedTypeLevel1.length > 0 && selectedTypeLevel1.length === typeLevel1Options.length;
    const isAllTypeLevel2Selected = selectedTypeLevel2.length > 0 && selectedTypeLevel2.length === typeLevel2Options.length;
    const hasSelectableRows = filteredData.some((item) => isRowSelectable(item));
    const approveRoleOnlyTooltip = 'Chỉ Admin hoặc Thủ kho mới được thực hiện thao tác này.';
    const editForecastRoleOnlyTooltip = 'Chỉ Admin hoặc Nhân viên thầu mới được thực hiện thao tác này.';
    const selectAllDisabledTooltip = !canSelectRowsRole
        ? approveRoleOnlyTooltip
        : !hasSelectableRows
            ? 'Không có vật tư nào đang chờ duyệt.'
            : undefined;
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

    return (
        <TabsContent value="forecast" className="space-y-6">
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số lượng dự trù</p>
                                <p className="text-2xl font-semibold text-foreground">{totalForecast.toLocaleString('vi-VN')}</p>
                            </div>
                            <Calculator className="w-8 h-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng số gói hàng</p>
                                <p className="text-2xl font-semibold text-foreground">{totalOrder.toLocaleString('vi-VN')}</p>
                            </div>
                            <Calculator className="w-8 h-8 text-secondary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng giá trị ước tính</p>
                                <p className="text-2xl font-semibold text-foreground">{totalValue.toLocaleString('vi-VN')}đ</p>
                            </div>
                            <Calculator className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-neutral border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Tiến độ phê duyệt</p>
                                <p className="text-2xl font-semibold text-foreground">
                                    {approvedCount}/{totalOnPage}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${totalOnPage > 0 ? (approvedCount / totalOnPage) * 100 : 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bộ lọc */}
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
                                placeholder="Tìm theo tên, mã vật tư hoặc nhà thầu..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 bg-neutral text-foreground border-border"
                            />
                        </div>

                        <Popover open={categoryPopoverOpen} onOpenChange={onCategoryPopoverOpenChange}>
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
                                                onClick={onSelectAllCategories}
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
                                            onClick={() => onCategoryToggle(category)}
                                        >
                                            <Checkbox
                                                id={category}
                                                checked={selectedCategories.includes(category)}
                                                onCheckedChange={() => onCategoryToggle(category)}
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
                                            onClick={onClearCategories}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        <Popover open={typeLevel1PopoverOpen} onOpenChange={onTypeLevel1PopoverOpenChange}>
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
                                                onClick={onSelectAllTypeLevel1}
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
                                            onClick={() => onTypeLevel1Toggle(code)}
                                        >
                                            <Checkbox
                                                id={`type-level1-${code}`}
                                                checked={selectedTypeLevel1.includes(code)}
                                                onCheckedChange={() => onTypeLevel1Toggle(code)}
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
                                            onClick={onClearTypeLevel1}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        <Popover open={typeLevel2PopoverOpen} onOpenChange={onTypeLevel2PopoverOpenChange}>
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
                                                onClick={onSelectAllTypeLevel2}
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
                                            onClick={() => onTypeLevel2Toggle(code)}
                                        >
                                            <Checkbox
                                                id={`type-level2-${code}`}
                                                checked={selectedTypeLevel2.includes(code)}
                                                onCheckedChange={() => onTypeLevel2Toggle(code)}
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
                                            onClick={onClearTypeLevel2}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        <Popover open={supplierPopoverOpen} onOpenChange={onSupplierPopoverOpenChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full md:w-72 bg-neutral text-foreground border-border justify-between font-normal"
                                >
                                    <span className="truncate">
                                        {selectedSuppliers.length === 0
                                            ? 'Tất cả công ty'
                                            : selectedSuppliers.length === 1
                                                ? selectedSuppliers[0]
                                                : `${selectedSuppliers.length} công ty đã chọn`}
                                    </span>
                                    <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="start">
                                <div className="p-3 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">Chọn công ty</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={onSelectAllSuppliers}
                                                className="text-xs text-secondary hover:text-secondary/80"
                                            >
                                                {selectedSuppliers.length === suppliers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <Input
                                            type="search"
                                            placeholder="Tìm tên công ty..."
                                            value={supplierSearchTerm}
                                            onChange={(e) => setSupplierSearchTerm(e.target.value)}
                                            className="h-8 bg-neutral text-foreground border-border"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2">
                                    {visibleSuppliers.map((supplier, index) => {
                                        const supplierId = `supplier-${index}`;
                                        return (
                                            <div
                                                key={supplier}
                                                className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                                                onClick={() => onSupplierToggle(supplier)}
                                            >
                                                <Checkbox
                                                    id={supplierId}
                                                    checked={selectedSuppliers.includes(supplier)}
                                                    onCheckedChange={() => onSupplierToggle(supplier)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <label
                                                    htmlFor={supplierId}
                                                    className="text-sm text-foreground cursor-pointer flex-1 truncate"
                                                    title={supplier}
                                                >
                                                    {supplier}
                                                </label>
                                            </div>
                                        );
                                    })}
                                    {visibleSuppliers.length === 0 && (
                                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                            Không tìm thấy công ty phù hợp
                                        </div>
                                    )}
                                </div>
                                {selectedSuppliers.length > 0 && (
                                    <div className="p-2 border-t border-border">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClearSuppliers}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Xóa bộ lọc công ty
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>

                        <Select value={pageSize.toString()} onValueChange={(v) => onPageSizeChange(Number(v))}>
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

                    {(selectedCategories.length > 0 || selectedSuppliers.length > 0 || selectedTypeLevel1.length > 0 || selectedTypeLevel2.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                            <span className="text-sm text-muted-foreground">Đang lọc:</span>
                            {selectedCategories.map((category) => (
                                <Badge
                                    key={category}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                    onClick={() => onCategoryToggle(category)}
                                >
                                    {category}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            {selectedSuppliers.map((supplier) => (
                                <Badge
                                    key={`supplier-${supplier}`}
                                    variant="secondary"
                                    className="bg-secondary/10 text-secondary border-secondary/20 cursor-pointer hover:bg-secondary/20"
                                    onClick={() => onSupplierToggle(supplier)}
                                    title={supplier}
                                >
                                    {supplier}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            {selectedTypeLevel1.map((code) => (
                                <Badge
                                    key={`type1-${code}`}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                                    onClick={() => onTypeLevel1Toggle(code)}
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
                                    onClick={() => onTypeLevel2Toggle(code)}
                                >
                                    Mã cấp 2: {code}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                            <button
                                onClick={() => {
                                    onClearCategories();
                                    onClearSuppliers();
                                    onClearTypeLevel1();
                                    onClearTypeLevel2();
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground underline"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {loading && (
                <Card className="bg-neutral border-border">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                    </CardContent>
                </Card>
            )}

            {error && !loading && (
                <Card className="bg-neutral border-border">
                    <CardContent className="p-8 flex flex-col items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-warning mb-4" />
                        <p className="text-foreground font-medium mb-2">Không thể tải dữ liệu</p>
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Bảng dữ liệu */}
            {!loading && !error && (
                <>
                    <Card className="bg-neutral border-border">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed">
                            <thead className="bg-primary text-primary-foreground">
                                <tr>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap w-9">
                                        <span className="inline-flex" title={selectAllDisabledTooltip}>
                                            <Checkbox
                                                checked={allSelectableRowsSelected ? true : (someSelectableRowsSelected ? 'indeterminate' : false)}
                                                disabled={!hasSelectableRows}
                                                onCheckedChange={(checked) => onToggleSelectAllRows(checked === true)}
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label="Chọn tất cả vật tư chưa duyệt trên trang"
                                            />
                                        </span>
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap w-[80px]">Mã VT</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium w-[300px]">Tên vật tư</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap w-[96px]">Mã hiệu</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap w-[80px] bg-amber-600">Đơn giá</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600 w-[56px]">SL Xuất</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600 w-[56px]">SL Nhập</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600 w-[56px]">SL Tồn</th>
                                    <th className="px-2 py-3 text-left text-xs font-medium whitespace-nowrap w-[120px]">Nhà thầu</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600 w-[80px]">Dự trù</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600 w-[70px]">Gọi hàng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {typeGroups.map((group) => {
                                    const isExpanded = expandedTypeGroups.has(group.key);

                                    return (
                                        <React.Fragment key={group.key}>
                                            <tr
                                                className="bg-muted/30 hover:bg-muted/50 cursor-pointer"
                                                onClick={() => toggleExpand(group.key)}
                                            >
                                                    <td colSpan={11} className="px-2 py-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                                                            ) : (
                                                                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm text-foreground truncate" title={group.code}>
                                                                    {group.label}
                                                                </p>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    Mã cấp 1: {group.level1Code || '—'}
                                                                </p>
                                                            </div>
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                {group.items.length} vật tư
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && group.items.map((item) => (
                                                <tr
                                                    key={item.stt}
                                                    className="hover:bg-tertiary transition-colors cursor-pointer"
                                                    onClick={() => onRowClick(item)}
                                                >
                                                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                        {(() => {
                                                            const rowSelectable = isRowSelectable(item);
                                                            const rowSelectDisabledTooltip = !canSelectRowsRole
                                                                ? approveRoleOnlyTooltip
                                                                : !rowSelectable
                                                                    ? 'Vật tư này không còn ở trạng thái chờ duyệt.'
                                                                    : undefined;

                                                            return (
                                                                <span className="inline-flex" title={rowSelectDisabledTooltip}>
                                                                    <Checkbox
                                                                        checked={isRowSelected(item)}
                                                                        disabled={!rowSelectable}
                                                                        onCheckedChange={(checked) => onRowSelectToggle(item, checked === true)}
                                                                        aria-label={`Chọn vật tư ${item.tenVtytBv}`}
                                                                    />
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-2 py-3 text-xs font-mono text-foreground whitespace-nowrap">{item.maVtytCu}</td>
                                                    <td className="px-2 py-3 text-xs text-foreground">
                                                        <div className="max-w-[300px]">
                                                            <div className="flex items-center gap-1 min-w-0">
                                                                <p className="font-semibold text-sm truncate" title={item.tenVtytBv}>{item.tenVtytBv}</p>
                                                                {getStatusBadge(item)}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground truncate" title={item.hangSx || ''}>
                                                                {item.hangSx || 'N/A'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground">
                                                        <div className="max-w-[96px] truncate font-mono" title={item.maHieu || ''}>
                                                            {item.maHieu || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground text-center font-medium whitespace-nowrap bg-amber-50 dark:bg-amber-950/30">
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                                            {item.donGia.toLocaleString('vi-VN')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                                        {item.slXuat}
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                                        {item.slNhap}
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                                        <Badge variant={item.slTon < 50 ? "destructive" : "secondary"} className="text-xs">
                                                            {item.slTon}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground">
                                                        <div className="max-w-[120px] break-words" title={item.nhaThau}>
                                                            {item.nhaThau}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3 bg-green-50 dark:bg-green-950/30" onClick={(e) => e.stopPropagation()}>
                                                        {(() => {
                                                            const forecastEditable = isForecastEditable(item);
                                                            const forecastInputDisabledTooltip = !canEditForecastRole
                                                                ? editForecastRoleOnlyTooltip
                                                                : !forecastEditable
                                                                    ? 'Vật tư đã được duyệt, không thể chỉnh sửa dự trù.'
                                                                    : undefined;

                                                            return (
                                                                <span className="inline-flex" title={forecastInputDisabledTooltip}>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        value={item.duTru}
                                                                        disabled={!forecastEditable}
                                                                        onChange={(e) => onForecastChange(item, e.target.value)}
                                                                        onFocus={() => onForecastFocus(item, item.duTru)}
                                                                        onBlur={(e) => onForecastBlur(item, parseInt(e.target.value) || 0)}
                                                                        className="w-20 h-8 text-xs text-center bg-white dark:bg-neutral border-green-300 focus:border-green-500"
                                                                    />
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-2 py-3 text-xs text-foreground text-center font-semibold bg-green-50 dark:bg-green-950/30">
                                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                            {item.goiHang}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-tertiary border-t-2 border-border">
                                <tr>
                                    <td colSpan={9} className="px-3 py-3 text-sm font-semibold text-foreground text-right">
                                        Tổng cộng:
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-foreground text-center bg-green-100 dark:bg-green-950/50">
                                        {totalForecast}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-semibold text-foreground text-center bg-green-100 dark:bg-green-950/50">
                                        {totalOrder}
                                    </td>
                                </tr>
                            </tfoot>
                                </table>
                            </div>

                            {filteredData.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Không tìm thấy vật tư nào
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {totalPages > 0 && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            pageSize={pageSize}
                            onPageChange={onPageChange}
                        />
                    )}

                    {(isSearching || selectedCategories.length > 0 || selectedSuppliers.length > 0 || selectedTypeLevel1.length > 0 || selectedTypeLevel2.length > 0) && (
                        <div className="text-center text-sm text-muted-foreground">
                            Đang hiển thị {filteredData.length} / {totalOnPage} vật tư (đã filter)
                        </div>
                    )}
                </>
            )}
        </TabsContent>
    )
}

export default ForecastTable
