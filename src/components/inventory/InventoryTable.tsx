import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { InventoryItem } from '@/pages/InventoryCatalog';

interface InventoryTableProps {
    items: InventoryItem[];
    onRowClick: (item: InventoryItem) => void;
}

export default function InventoryTable({ items, onRowClick }: InventoryTableProps) {
    return (
        <Card className="bg-neutral border-border">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium">Mã vật tư</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Tên vật tư</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Đơn vị</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Nhà cung cấp</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Danh mục</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Tồn kho</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Tồn kho tối thiểu</th>
                                <th className="px-6 py-4 text-left text-sm font-medium">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => {
                                const isLowStock = item.currentStock < item.minInventory;
                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => onRowClick(item)}
                                        className="hover:bg-tertiary transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 text-sm font-mono text-foreground">{item.itemCode}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{item.itemName}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{item.unit}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{item.supplier}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">
                                            <Badge variant="outline" className="bg-tertiary text-foreground border-border">
                                                {item.category}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={isLowStock ? 'text-destructive font-medium' : 'text-success font-medium'}>
                                                {item.currentStock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground">{item.minInventory}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {isLowStock ? (
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={2} />
                                                    <Badge className="bg-destructive text-destructive-foreground">Sắp hết</Badge>
                                                </div>
                                            ) : (
                                                <Badge className="bg-success text-success-foreground">Còn hàng</Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
