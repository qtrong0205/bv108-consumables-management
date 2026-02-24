import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle, FileDown, FileUp, ChevronDown, X, Loader2 } from 'lucide-react';
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

export default function InventoryCatalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [stockFilter, setStockFilter] = useState<'all' | 'low-stock'>('all');
    const [selectedItem, setSelectedItem] = useState<MedicalSupply | null>(null);
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
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

        // Filter theo tình trạng tồn kho
        if (stockFilter === 'low-stock') {
            filtered = filtered.filter((item) => item.soLuongTon < item.soLuongToiThieu);
        }

        return filtered;
    }, [supplies, selectedCategories, stockFilter]);
    
    // Tính toán lowStock từ dữ liệu supplies
    const lowStock = useMemo(() => {
        return supplies
            .filter((item) => item.soLuongTon < item.soLuongToiThieu)
            .map((item) => item.maVtyt);
    }, [supplies]);
    
    const lowStockCount = lowStock.length;

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

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Debug Component */}
            {error && <ApiDebug />}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                    {selectedCategories.length > 0 && (
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
                            <button
                                onClick={handleClearCategories}
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
                    {!searchInput && selectedCategories.length === 0 && stockFilter === 'all' && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            pageSize={pageSize}
                            onPageChange={setPage}
                        />
                    )}
                    
                    {/* Thông tin khi có filter */}
                    {(searchInput || selectedCategories.length > 0 || stockFilter === 'low-stock') && (
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
                />
            )}
        </div>
    );
}
