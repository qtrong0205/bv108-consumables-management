import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertTriangle } from 'lucide-react';
import InventoryTable from '@/components/inventory/InventoryTable';
import ItemDetailModal from '@/components/inventory/ItemDetailModal';

export interface InventoryItem {
    id: string;
    itemCode: string;
    itemName: string;
    unit: string;
    supplier: string;
    category: string;
    currentStock: number;
    minInventory: number;
}

const mockInventory: InventoryItem[] = [
    {
        id: '1',
        itemCode: 'SG-001',
        itemName: 'Găng tay phẫu thuật (Size M)',
        unit: 'Hộp',
        supplier: 'Công ty Vật tư Y tế',
        category: 'Đồ bảo hộ',
        currentStock: 450,
        minInventory: 200,
    },
    {
        id: '2',
        itemCode: 'SY-005',
        itemName: 'Ống tiêm 5ml',
        unit: 'Gói',
        supplier: 'Công ty Y tế Sức khỏe',
        category: 'Vật tư tiêm',
        currentStock: 180,
        minInventory: 150,
    },
    {
        id: '3',
        itemCode: 'GP-012',
        itemName: 'Gạc y tế 4x4',
        unit: 'Gói',
        supplier: 'Công ty Vật tư Y tế',
        category: 'Chăm sóc vết thương',
        currentStock: 85,
        minInventory: 100,
    },
    {
        id: '4',
        itemCode: 'IV-020',
        itemName: 'Catheter tĩnh mạch 18G',
        unit: 'Hộp',
        supplier: 'Công ty Chăm sóc Tĩnh mạch',
        category: 'Vật tư truyền dịch',
        currentStock: 320,
        minInventory: 150,
    },
    {
        id: '5',
        itemCode: 'AS-008',
        itemName: 'Bông cồn',
        unit: 'Hộp',
        supplier: 'Công ty Vệ sinh Y tế',
        category: 'Khử trùng',
        currentStock: 45,
        minInventory: 80,
    },
    {
        id: '6',
        itemCode: 'BD-015',
        itemName: 'Băng đàn hồi 3"',
        unit: 'Cuộn',
        supplier: 'Công ty Vật tư Y tế',
        category: 'Chăm sóc vết thương',
        currentStock: 210,
        minInventory: 100,
    },
];

export default function InventoryCatalog() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [filteredItems, setFilteredItems] = useState(mockInventory);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        let filtered = mockInventory;

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter((item) => item.category === categoryFilter);
        }

        setFilteredItems(filtered);
    }, [searchTerm, categoryFilter]);

    const categories = ['all', ...Array.from(new Set(mockInventory.map((item) => item.category)))];
    const lowStockCount = mockInventory.filter((item) => item.currentStock < item.minInventory).length;

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Danh mục tồn kho</h1>
                    <p className="text-muted-foreground">Quản lý và giám sát tồn kho vật tư y tế</p>
                </div>
                {lowStockCount > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={2} />
                        <span className="text-sm font-medium text-foreground">{lowStockCount} vật tư sắp hết</span>
                    </div>
                )}
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
                    </div>
                </CardContent>
            </Card>

            <InventoryTable items={filteredItems} onRowClick={setSelectedItem} />

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
