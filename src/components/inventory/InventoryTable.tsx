import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicalSupply } from '@/pages/InventoryCatalog';
import { ChevronRight } from 'lucide-react';

interface InventoryTableProps {
    items: MedicalSupply[];
    onRowClick: (item: MedicalSupply) => void;
}

export default function InventoryTable({ items, onRowClick }: InventoryTableProps) {
    return (
        <Card className="bg-neutral border-border">
            <CardContent className="p-0">
                {/* Mobile Card View */}
                <div className="block md:hidden">
                    <div className="divide-y divide-border">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onRowClick(item)}
                                className="p-4 hover:bg-tertiary transition-colors cursor-pointer active:bg-tertiary/80"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">{item.maVtyt}</span>
                                            <Badge variant="outline" className="bg-tertiary text-foreground border-border text-[10px] px-1.5 py-0">
                                                {item.tenNhom.length > 12 ? item.tenNhom.substring(0, 12) + '...' : item.tenNhom}
                                            </Badge>
                                        </div>
                                        <p className="font-medium text-sm text-foreground truncate">{item.tenVtyt}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.hangSanXuat} - {item.nuocSanXuat}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-muted-foreground">{item.donViTinh}</span>
                                        <span className="text-muted-foreground">SL: <span className="text-foreground font-medium">{item.soLuongKeHoach}</span></span>
                                    </div>
                                    <span className="text-sm font-semibold text-primary">{item.donGia.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT</th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Nhóm</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Quy cách</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">ĐVT</th>
                                <th className="px-4 py-3 text-right text-xs font-medium whitespace-nowrap">Đơn giá</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">SL KH</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà thầu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick(item)}
                                    className="hover:bg-tertiary transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap">
                                        {item.maVtyt}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">
                                        <div className="max-w-[200px]">
                                            <p className="font-medium truncate" title={item.tenVtyt}>{item.tenVtyt}</p>
                                            <p className="text-xs text-muted-foreground truncate" title={item.maHieu}>{item.maHieu}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="bg-tertiary text-foreground border-border text-xs whitespace-nowrap">
                                            {item.tenNhom.length > 15 ? item.tenNhom.substring(0, 15) + '...' : item.tenNhom}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{item.quyCach}</td>
                                    <td className="px-4 py-3 text-xs text-foreground">
                                        <div className="max-w-[100px]">
                                            <p className="truncate" title={item.hangSanXuat}>{item.hangSanXuat}</p>
                                            <p className="text-muted-foreground truncate" title={item.nuocSanXuat}>{item.nuocSanXuat}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{item.donViTinh}</td>
                                    <td className="px-4 py-3 text-xs text-foreground text-right font-medium whitespace-nowrap">
                                        {item.donGia.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground text-center font-medium">
                                        {item.soLuongKeHoach}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground">
                                        <div className="max-w-[120px] truncate" title={item.nhaThau}>
                                            {item.nhaThau}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy vật tư nào
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
