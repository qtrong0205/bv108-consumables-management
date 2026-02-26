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
import { Package, ImageOff, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ItemDetailModalProps {
    item: MedicalSupply;
    isOpen: boolean;
    onClose: () => void;
    allSupplies?: MedicalSupply[]; // Danh sách tất cả vật tư để lọc vật tư liên quan
    onItemChange?: (item: MedicalSupply) => void; // Callback khi chuyển sang vật tư khác
}

export default function ItemDetailModal({ item, isOpen, onClose, allSupplies = [], onItemChange }: ItemDetailModalProps) {
    const [imageError, setImageError] = useState(false);

    // Giả lập URL ảnh - trong thực tế sẽ lấy từ item.imageUrl
    const imageUrl = item.imageUrl || null;

    // Lấy danh sách vật tư cùng nhóm (trừ vật tư hiện tại)
    const relatedItems = useMemo(() => {
        return allSupplies.filter(
            supply => supply.maNhom === item.maNhom && supply.id !== item.id
        );
    }, [allSupplies, item.maNhom, item.id]);
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-neutral text-foreground border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-xl">{item.tenVtyt}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Mã vật tư: <span className="font-mono">{item.maVtyt}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Khu vực ảnh và thông tin cơ bản */}
                    <div className="flex gap-6">
                        {/* Ảnh vật tư */}
                        <div className="flex-shrink-0">
                            <div className="w-40 h-40 rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center">
                                {imageUrl && !imageError ? (
                                    <img
                                        src={imageUrl}
                                        alt={item.tenVtyt}
                                        className="w-full h-full object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        {imageError ? (
                                            <>
                                                <ImageOff className="w-12 h-12 mb-2" />
                                                <span className="text-xs">Lỗi tải ảnh</span>
                                            </>
                                        ) : (
                                            <>
                                                <Package className="w-12 h-12 mb-2" />
                                                <span className="text-xs">Chưa có ảnh</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin chính */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Tên thương mại</p>
                                <p className="text-foreground font-medium">{item.tenThuongMai}</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Nhóm vật tư</p>
                                    <Badge variant="outline" className="bg-tertiary text-foreground border-border">
                                        {item.tenNhom}
                                    </Badge>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Mã nhóm</p>
                                    <p className="text-foreground font-medium font-mono">{item.maNhom}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground mb-1">Tồn kho</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {item.soLuongTon} {item.donViTinh}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Thông tin sản xuất */}
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Mã hiệu / Model</p>
                            <p className="text-foreground font-medium">{item.maHieu}</p>
                        </div>
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

                    {/* Danh sách vật tư cùng nhóm */}
                    {relatedItems.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Vật tư cùng nhóm "{item.maNhom}"
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                        {relatedItems.length} vật tư
                                    </Badge>
                                </div>
                                <ScrollArea className="h-[200px] rounded-md border border-border">
                                    <div className="divide-y divide-border">
                                        {relatedItems.map((related) => (
                                            <div
                                                key={related.id}
                                                onClick={() => onItemChange?.(related)}
                                                className={`p-3 hover:bg-muted/50 transition-colors ${onItemChange ? 'cursor-pointer' : ''}`}
                                                title={`Xem chi tiết: ${related.tenVtyt}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className="text-sm font-medium text-foreground line-clamp-2 leading-tight"
                                                            title={related.tenVtyt}
                                                        >
                                                            {related.tenVtyt}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono mt-1">
                                                            {related.maVtyt}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-sm font-medium text-foreground whitespace-nowrap">
                                                                {related.donGia.toLocaleString('vi-VN')}đ
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                /{related.donViTinh}
                                                            </p>
                                                        </div>
                                                        <div className="text-right min-w-[50px]">
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {related.soLuongTon}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                tồn kho
                                                            </p>
                                                        </div>
                                                        {onItemChange && (
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
