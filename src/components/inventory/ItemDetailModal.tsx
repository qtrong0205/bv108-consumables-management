import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MedicalSupply } from '@/types';

interface ItemDetailModalProps {
    item: MedicalSupply;
    isOpen: boolean;
    onClose: () => void;
}

export default function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
    const isLowStock = item.soLuongTon < item.soLuongToiThieu;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral text-foreground border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">{item.tenVtyt}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Mã vật tư: <span className="font-mono">{item.maVtyt}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Nhóm vật tư</p>
                            <Badge variant="outline" className="bg-tertiary text-foreground border-border">
                                {item.tenNhom}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Mã nhóm</p>
                            <p className="text-foreground font-medium font-mono">{item.maNhom}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tên thương mại</p>
                            <p className="text-foreground font-medium">{item.tenThuongMai}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Mã hiệu / Model</p>
                            <p className="text-foreground font-medium">{item.maHieu}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Hãng sản xuất</p>
                            <p className="text-foreground font-medium">{item.hangSanXuat}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Nước sản xuất</p>
                            <p className="text-foreground font-medium">{item.nuocSanXuat}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Đơn vị tính</p>
                            <p className="text-foreground font-medium">{item.donViTinh}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Quy cách đóng gói</p>
                            <p className="text-foreground font-medium">{item.quyCach}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Đơn giá</p>
                            <p className="text-foreground font-medium">{item.donGia.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tồn kho hiện tại</p>
                            <p className={`text-2xl font-semibold ${isLowStock ? 'text-destructive' : 'text-success'}`}>
                                {item.soLuongTon}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Ngưỡng tối thiểu</p>
                            <p className="text-2xl font-semibold text-foreground">{item.soLuongToiThieu}</p>
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

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">SL Kế hoạch</p>
                            <p className="text-foreground font-medium">{item.soLuongKeHoach}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tiêu hao trong tháng</p>
                            <p className="text-foreground font-medium">{item.soLuongTieuHao}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Nhà thầu trúng thầu</p>
                            <p className="text-foreground font-medium">{item.nhaThau}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Số quyết định</p>
                            <p className="text-foreground font-medium font-mono">{item.quyetDinh}</p>
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
