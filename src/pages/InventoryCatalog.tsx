import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle, FileDown, FileUp } from 'lucide-react';
import InventoryTable from '@/components/inventory/InventoryTable';
import ItemDetailModal from '@/components/inventory/ItemDetailModal';
import { MedicalSupply } from '@/types';
import { MOCK_MEDICAL_SUPPLIES } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function InventoryCatalog() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low-stock'>('all');
    const [filteredItems, setFilteredItems] = useState(MOCK_MEDICAL_SUPPLIES);
    const [selectedItem, setSelectedItem] = useState<MedicalSupply | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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

    useEffect(() => {
        let filtered = MOCK_MEDICAL_SUPPLIES;

        // Filter theo tìm kiếm
        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.tenVtyt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.maVtyt.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter theo danh mục
        if (categoryFilter !== 'all') {
            filtered = filtered.filter((item) => item.tenNhom === categoryFilter);
        }

        // Filter theo tình trạng tồn kho
        if (stockFilter === 'low-stock') {
            filtered = filtered.filter((item) => item.soLuongTon < item.soLuongToiThieu);
        }

        setFilteredItems(filtered);
    }, [searchTerm, categoryFilter, stockFilter]);

    const categories = ['all', ...Array.from(new Set(MOCK_MEDICAL_SUPPLIES.map((item) => item.tenNhom)))];
    const lowStock = MOCK_MEDICAL_SUPPLIES.map((item) => {
        if (item.soLuongTon < item.soLuongToiThieu) return item.maVtyt
    }).filter((item) => item)
    console.log(lowStock)
    const lowStockCount = lowStock.length

    const handleStockFilterChange = (value: 'all' | 'low-stock') => {
        setStockFilter(value);
        if (value === 'low-stock') {
            setSearchParams({ filter: 'low-stock' });
        } else {
            setSearchParams({});
        }
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Danh mục tồn kho</h1>
                    <p className="text-muted-foreground">Quản lý và giám sát tồn kho vật tư y tế</p>
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
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-neutral text-foreground border-border"
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full md:w-64 bg-neutral text-foreground border-border">
                                <SelectValue placeholder="Lọc theo danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category === 'all' ? 'Tất cả danh mục' : category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={stockFilter} onValueChange={(v) => handleStockFilterChange(v as 'all' | 'low-stock')}>
                            <SelectTrigger className="w-full md:w-48 bg-neutral text-foreground border-border">
                                <SelectValue placeholder="Tình trạng tồn kho" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="low-stock">Sắp hết hàng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <InventoryTable items={filteredItems} lowStockItems={lowStock} onRowClick={setSelectedItem} />

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
