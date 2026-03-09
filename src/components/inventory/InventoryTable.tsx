import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicalSupply } from '@/types';
import { ChevronRight, AlertTriangle } from 'lucide-react';

interface InventoryTableProps {
    items: MedicalSupply[];
    lowStockItems: string[];
    onRowClick: (item: MedicalSupply) => void;
}

export default function InventoryTable({ items, lowStockItems, onRowClick }: InventoryTableProps) {
    const isLowStock = (maVtyt: string) => lowStockItems.includes(maVtyt);
    
    // Helper để hiển thị giá trị hoặc để trống
    const displayValue = (value: any) => value || '';

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
                                className={`p-4 hover:bg-tertiary transition-colors cursor-pointer active:bg-tertiary/80 ${isLowStock(item.maVtyt) ? 'bg-warning/5' : ''}`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">{displayValue(item.maVtyt)}</span>
                                            {isLowStock(item.maVtyt) && (
                                                <Badge variant="outline" className="bg-warning/20 text-warning border-warning text-[10px] px-1.5 py-0 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Sắp hết
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-medium text-sm text-foreground truncate">{displayValue(item.tenVtyt)}</p>
                                        <p className="text-xs text-muted-foreground truncate">{displayValue(item.hangSanXuat)} - {displayValue(item.nuocSanXuat)}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="text-muted-foreground">Mã hiệu: <span className="text-foreground font-medium">{displayValue(item.maHieu) || 'N/A'}</span></span>
                                        <span className="text-muted-foreground">SL Thầu: <span className="text-foreground font-medium">{item.soLuongThau || 0}</span></span>
                                    </div>
                                    <span className="text-sm font-semibold text-primary">{(item.donGia || 0).toLocaleString('vi-VN')}đ</span>
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
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã hiệu</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Quy cách</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">SL Thầu</th>
                                <th className="px-4 py-3 text-right text-xs font-medium whitespace-nowrap">Đơn giá</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">SL KH</th>
                                <th className="px-4 py-3 text-center text-xs font-medium whitespace-nowrap">Trạng thái</th>
                                <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà thầu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick(item)}
                                    className={`hover:bg-tertiary transition-colors cursor-pointer ${isLowStock(item.maVtyt) ? 'bg-warning/5' : ''}`}
                                >
                                    <td className="px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap">
                                        {displayValue(item.maVtyt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">
                                        <div className="max-w-[200px]">
                                            <p className="font-medium truncate" title={displayValue(item.tenVtyt)}>{displayValue(item.tenVtyt)}</p>
                                            <p className="text-xs text-muted-foreground truncate" title={displayValue(item.tenThuongMai)}>{displayValue(item.tenThuongMai)}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{displayValue(item.maHieu) || 'N/A'}</td>
                                    <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{displayValue(item.quyCach)}</td>
                                    <td className="px-4 py-3 text-xs text-foreground">
                                        <div className="max-w-[100px]">
                                            <p className="truncate" title={displayValue(item.hangSanXuat)}>{displayValue(item.hangSanXuat)}</p>
                                            <p className="text-muted-foreground truncate" title={displayValue(item.nuocSanXuat)}>{displayValue(item.nuocSanXuat)}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground text-center font-medium">{item.soLuongThau || 0}</td>
                                    <td className="px-4 py-3 text-xs text-foreground text-right font-medium whitespace-nowrap">
                                        {(item.donGia || 0).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground text-center font-medium">
                                        {item.soLuongKeHoach || 0}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isLowStock(item.maVtyt) ? (
                                            <Badge variant="outline" className="bg-warning/20 text-warning border-warning text-xs flex items-center gap-1 w-fit mx-auto">
                                                <AlertTriangle className="w-3 h-3" />
                                                Sắp hết
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500 text-xs">
                                                Đủ hàng
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-foreground">
                                        <div className="max-w-[120px] truncate" title={displayValue(item.nhaThau)}>
                                            {displayValue(item.nhaThau)}
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
