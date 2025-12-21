import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { InventoryItem } from '@/pages/InventoryCatalog';

interface ItemDetailModalProps {
    item: InventoryItem;
    isOpen: boolean;
    onClose: () => void;
}

export default function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
    const isLowStock = item.currentStock < item.minInventory;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral text-foreground border-border max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">{item.itemName}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Mã vật tư: <span className="font-mono">{item.itemCode}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Danh mục</p>
                            <Badge variant="outline" className="bg-tertiary text-foreground border-border">
                                {item.category}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Đơn vị</p>
                            <p className="text-foreground font-medium">{item.unit}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Nhà cung cấp</p>
                            <p className="text-foreground font-medium">{item.supplier}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                            {isLowStock ? (
                                <Badge className="bg-destructive text-destructive-foreground">Sắp hết</Badge>
                            ) : (
                                <Badge className="bg-success text-success-foreground">Còn hàng</Badge>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tồn kho hiện tại</p>
                            <p className={`text-2xl font-semibold ${isLowStock ? 'text-destructive' : 'text-success'}`}>
                                {item.currentStock}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Cảnh báo tồn kho tối thiểu</p>
                            <p className="text-2xl font-semibold text-foreground">{item.minInventory}</p>
                        </div>
                    </div>

                    {isLowStock && (
                        <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                            <p className="text-sm text-foreground">
                                <strong>Cảnh báo:</strong> Vật tư này dưới ngưỡng tồn kho tối thiểu. Cần đặt hàng bổ sung.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
