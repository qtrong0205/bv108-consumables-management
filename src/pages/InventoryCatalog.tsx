import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import InventoryTable from '@/components/inventory/InventoryTable';
import ItemDetailModal from '@/components/inventory/ItemDetailModal';

export interface MedicalSupply {
    id: number;                // MA_QUAN_LY
    maVtyt: string;            // MA_VTYT_C
    tenVtyt: string;           // TEN_VTYT_B
    tenThuongMai: string;      // TEN_THUON
    maHieu: string;            // MA_HIEU
    maNhom: string;            // MA_NHOM
    tenNhom: string;           // TEN_NHOM
    quyCach: string;           // QUY_CACH
    nuocSanXuat: string;       // NUOC_SX
    hangSanXuat: string;       // HANG_SX
    donViTinh: string;         // DON_VI_TINH
    donGia: number;            // DON_GIA
    soLuongKeHoach: number;    // D_LUONG_KH
    nhaThau: string;           // NHA_THAU
    quyetDinh: string;         // QUYET_DINH
}

export const MOCK_MEDICAL_SUPPLIES: MedicalSupply[] = [
    {
        id: 1,
        maVtyt: "D05161",
        tenVtyt: "Miếng cầm",
        tenThuongMai: "Miếng cầm",
        maHieu: "UP801520B",
        maNhom: "N02.04.040",
        tenNhom: "Miếng cầm",
        quyCach: "20 miếng/ h",
        nuocSanXuat: "Thổ Nhĩ Kỳ",
        hangSanXuat: "GENCO",
        donViTinh: "Miếng",
        donGia: 94500,
        soLuongKeHoach: 1,
        nhaThau: "CÔNG TY 1",
        quyetDinh: "8890/QĐ-BV;G1;N1;2024"
    },
    {
        id: 3,
        maVtyt: "D05341",
        tenVtyt: "Mũi cắt xương",
        tenThuongMai: "Mũi cắt xương",
        maHieu: "Carbide burs M1",
        maNhom: "N08.00.000",
        tenNhom: "Nhóm 8. Vật tư tiêu hao",
        quyCach: "Vỉ/ 10 mũi",
        nuocSanXuat: "Nhật Bản",
        hangSanXuat: "Mani",
        donViTinh: "Mũi",
        donGia: 105000,
        soLuongKeHoach: 3,
        nhaThau: "CÔNG TY 3",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024"
    },
    {
        id: 9,
        maVtyt: "D04432",
        tenVtyt: "Phin lọc khuẩn",
        tenThuongMai: "Phin lọc khuẩn",
        maHieu: "GM-001-010",
        maNhom: "N08.00.350",
        tenNhom: "Phin lọc vi khuẩn",
        quyCach: "100 cái/ thùng",
        nuocSanXuat: "Trung Quốc",
        hangSanXuat: "Bain Medical",
        donViTinh: "Cái",
        donGia: 12880,
        soLuongKeHoach: 9,
        nhaThau: "CÔNG TY 9",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024"
    },
    {
        id: 11,
        maVtyt: "D06531",
        tenVtyt: "Sond tiểu nam",
        tenThuongMai: "Sond tiểu nam",
        maHieu: "1 way",
        maNhom: "N04.04.010",
        tenNhom: "Ống thông tiểu",
        quyCach: "10 cái/ Hộp",
        nuocSanXuat: "Trung Quốc",
        hangSanXuat: "Guangdong Ec",
        donViTinh: "Cái",
        donGia: 5345,
        soLuongKeHoach: 11,
        nhaThau: "CÔNG TY 11",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024"
    }
];

export default function InventoryCatalog() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [filteredItems, setFilteredItems] = useState(MOCK_MEDICAL_SUPPLIES);
    const [selectedItem, setSelectedItem] = useState<MedicalSupply | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        let filtered = MOCK_MEDICAL_SUPPLIES;

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.tenVtyt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.maVtyt.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter((item) => item.tenNhom === categoryFilter);
        }

        setFilteredItems(filtered);
    }, [searchTerm, categoryFilter]);

    const categories = ['all', ...Array.from(new Set(MOCK_MEDICAL_SUPPLIES.map((item) => item.tenNhom)))];

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Danh mục tồn kho</h1>
                    <p className="text-muted-foreground">Quản lý và giám sát tồn kho vật tư y tế</p>
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
