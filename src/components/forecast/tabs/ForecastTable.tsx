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
import { Calculator, CheckCircle2, Search, ChevronDown, X, Loader2, AlertTriangle } from "lucide-react"
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
        onSupplierPopoverOpenChange: (open: boolean) => void;
        onSupplierToggle: (supplier: string) => void;
        onSelectAllSuppliers: () => void;
        onClearSuppliers: () => void;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
    };
    handlers: {
        onRowClick: (item: IVatTuDuTru) => void;
        getStatusBadge: (stt: number) => React.ReactNode;
        onForecastChange: (stt: number, value: string) => void;
        onForecastFocus: (stt: number, value: number) => void;
        onForecastBlur: (stt: number, newValue: number) => void;
        isRowSelected: (item: IVatTuDuTru) => boolean;
        isRowSelectable: (item: IVatTuDuTru) => boolean;
        onRowSelectToggle: (item: IVatTuDuTru, checked: boolean) => void;
        allSelectableRowsSelected: boolean;
        someSelectableRowsSelected: boolean;
        onToggleSelectAllRows: (checked: boolean) => void;
    };
}

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
        onForecastChange,
        onForecastFocus,
        onForecastBlur,
        isRowSelected,
        isRowSelectable,
        onRowSelectToggle,
        allSelectableRowsSelected,
        someSelectableRowsSelected,
        onToggleSelectAllRows,
    } = handlers;

    const visibleSuppliers = React.useMemo(() => {
        const keyword = supplierSearchTerm.trim().toLowerCase();
        if (!keyword) return suppliers;
        return suppliers.filter((supplier) => supplier.toLowerCase().includes(keyword));
    }, [suppliers, supplierSearchTerm]);

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
                                    {approvedCount}/{filteredData.length}
                                </p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${filteredData.length > 0 ? (approvedCount / filteredData.length) * 100 : 0}%` }}
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

                    {(selectedCategories.length > 0 || selectedSuppliers.length > 0) && (
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
                            <button
                                onClick={() => {
                                    onClearCategories();
                                    onClearSuppliers();
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
                                <table className="w-full min-w-[1200px]">
                            <thead className="bg-primary text-primary-foreground">
                                <tr>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap">
                                        <Checkbox
                                            checked={allSelectableRowsSelected ? true : (someSelectableRowsSelected ? 'indeterminate' : false)}
                                            onCheckedChange={(checked) => onToggleSelectAllRows(checked === true)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label="Chọn tất cả vật tư chưa duyệt trên trang"
                                        />
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">STT</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Quy cách</th>
                                    <th className="px-3 py-3 text-right text-xs font-medium whitespace-nowrap">Đơn giá</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Xuất</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Nhập</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Tồn</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà thầu</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600">Dự trù</th>
                                    <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600">Gọi hàng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredData.map((item) => (
                                    <tr
                                        key={item.stt}
                                        className="hover:bg-tertiary transition-colors cursor-pointer"
                                        onClick={() => onRowClick(item)}
                                    >
                                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isRowSelected(item)}
                                                disabled={!isRowSelectable(item)}
                                                onCheckedChange={(checked) => onRowSelectToggle(item, checked === true)}
                                                aria-label={`Chọn vật tư ${item.tenVtytBv}`}
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center">{item.stt}</td>
                                        <td className="px-3 py-3 text-xs font-mono text-foreground whitespace-nowrap">{item.maVtytCu}</td>
                                        <td className="px-3 py-3 text-xs text-foreground">
                                            <div className="max-w-[200px]">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <p className="font-semibold text-sm truncate" title={item.tenVtytBv}>{item.tenVtytBv}</p>
                                                    {getStatusBadge(item.stt)}
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate" title={item.maHieu || ''}>
                                                    {item.maHieu || 'N/A'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground">
                                            <div className="max-w-[184px] truncate" title={item.hangSx}>
                                                {item.hangSx}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground">
                                            <div className="max-w-[80px] truncate" title={`${item.quyCach} (${item.slTrongQuyCach} ${item.donViTinh})`}>
                                                {item.quyCach} ({item.slTrongQuyCach} {item.donViTinh})
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-right font-medium whitespace-nowrap">
                                            {item.donGia.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                            {item.slXuat}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                            {item.slNhap}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                            <Badge variant={item.slTon < 50 ? "destructive" : "secondary"} className="text-xs">
                                                {item.slTon}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground">
                                            <div className="max-w-[100px] truncate" title={item.nhaThau}>
                                                {item.nhaThau}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 bg-green-50 dark:bg-green-950/30" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.duTru}
                                                onChange={(e) => onForecastChange(item.stt, e.target.value)}
                                                onFocus={() => onForecastFocus(item.stt, item.duTru)}
                                                onBlur={(e) => onForecastBlur(item.stt, parseInt(e.target.value) || 0)}
                                                className="w-20 h-8 text-xs text-center bg-white dark:bg-neutral border-green-300 focus:border-green-500"
                                            />
                                        </td>
                                        <td className="px-3 py-3 text-xs text-foreground text-center font-semibold bg-green-50 dark:bg-green-950/30">
                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                {item.goiHang}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-tertiary border-t-2 border-border">
                                <tr>
                                    <td colSpan={11} className="px-3 py-3 text-sm font-semibold text-foreground text-right">
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

                    {(isSearching || selectedCategories.length > 0 || selectedSuppliers.length > 0) && (
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