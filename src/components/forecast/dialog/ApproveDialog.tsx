import { IVatTuDuTru } from "@/data/mockData";
import { ApprovalState } from "@/data/forecast/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, FilePen, Save, X } from "lucide-react";
import React from "react";

interface IApproveDialogProps {
    dialog: {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        selectedItem: IVatTuDuTru | null;
        approvalStates: ApprovalState;
        getStatusBadge: (item: IVatTuDuTru) => React.ReactNode;
    };
    editMode: {
        isActive: boolean;
        setActive: (value: boolean) => void;
        editValue: number;
        setEditValue: (value: number) => void;
    };
    rejectMode: {
        isActive: boolean;
        setActive: (value: boolean) => void;
        reason: string;
        setReason: (value: string) => void;
    };
    actions: {
        onApprove: () => void;
        onReject: () => void;
        onEditAndSave: () => void;
        approveLabel?: string;
    };
    permissions: {
        canApproveReject: boolean;
        canEditForecast: boolean;
        approveRejectTooltip?: string;
        lockApproveReject?: boolean;
        lockApproveRejectTooltip?: string;
    };
}

const ApproveDialog = ({
    dialog,
    editMode,
    rejectMode,
    actions,
    permissions,
}: IApproveDialogProps) => {
    const { open, onOpenChange, selectedItem, approvalStates, getStatusBadge } = dialog;
    const { isActive: isEditMode, setActive: setIsEditMode, editValue: editDuTru, setEditValue: setEditDuTru } = editMode;
    const { isActive: isRejectMode, setActive: setIsRejectMode, reason: lyDoTuChoi, setReason: setLyDoTuChoi } = rejectMode;
    const { onApprove, onReject, onEditAndSave, approveLabel = 'Phê duyệt' } = actions;
    const { canApproveReject, canEditForecast, approveRejectTooltip, lockApproveReject, lockApproveRejectTooltip } = permissions;

    const getMaterialKey = (item: Pick<IVatTuDuTru, 'maVtytCu' | 'maQuanLy' | 'stt'>): string => {
        const maVtytCu = (item.maVtytCu || '').trim();
        const maQuanLy = (item.maQuanLy || '').trim();

        if (maVtytCu && maQuanLy) {
            return `${maVtytCu}::${maQuanLy}`;
        }
        if (maVtytCu) {
            return maVtytCu;
        }
        if (maQuanLy) {
            return maQuanLy;
        }
        return `stt:${item.stt}`;
    };

    const selectedItemApproval = selectedItem ? approvalStates[getMaterialKey(selectedItem)] : undefined;
    const isApprovedLocked = selectedItemApproval?.status === 'approved';
    const isThuKhoUnsubmitState = selectedItemApproval?.status === 'edited'
        && typeof selectedItemApproval.duTruGoc !== 'number'
        && typeof selectedItemApproval.duTruSua !== 'number';
    const canShowActionButtons = !selectedItemApproval || selectedItemApproval.status === 'edited' || selectedItemApproval.status === 'submitted' || selectedItemApproval.status === 'approved';
    const currentGoiHang = isEditMode ? editDuTru : selectedItem?.goiHang ?? 0;
    const approveRejectRoleTooltip = approveRejectTooltip || 'Chỉ Admin, Chỉ huy khoa hoặc Thủ kho mới được thực hiện thao tác này.';
    const editForecastRoleTooltip = 'Chỉ Admin hoặc Nhân viên thầu mới được thực hiện thao tác này.';
    const approvedLockTooltip = 'Vật tư đã được duyệt, không thể từ chối hoặc gửi duyệt lại.';
    const isApproveRejectLocked = Boolean(lockApproveReject) || isApprovedLocked;
    const approveRejectLockTooltip = isApprovedLocked
        ? approvedLockTooltip
        : (lockApproveRejectTooltip || 'Vật tư đã gửi CHK. Thủ kho chỉ có thể hủy duyệt gửi ở danh sách bên ngoài.');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Phê duyệt dự trù vật tư
                        {selectedItem && getStatusBadge(selectedItem)}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedItem?.tenVtytBv}
                    </DialogDescription>
                </DialogHeader>

                {selectedItem && (
                    <div className="space-y-4 py-4">
                        {/* Thông tin vật tư - compact key-value */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs p-3 bg-tertiary rounded-lg">
                            <div className="flex gap-1.5">
                                <span className="text-muted-foreground w-16 shrink-0">Mã VT</span>
                                <span className="font-medium font-mono">{selectedItem.maVtytCu}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="text-muted-foreground w-16 shrink-0">Hãng SX</span>
                                <span className="font-medium">{selectedItem.hangSx || '—'}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="text-muted-foreground w-16 shrink-0">Mã hiệu</span>
                                <span className="font-medium">{selectedItem.maHieu || '—'}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="text-muted-foreground w-16 shrink-0">Đơn vị</span>
                                <span className="font-medium">{selectedItem.donViTinh || '—'}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="text-muted-foreground w-16 shrink-0">Quy cách</span>
                                <span className="font-medium">{selectedItem.quyCach} ({selectedItem.slTrongQuyCach} {selectedItem.donViTinh})</span>
                            </div>
                            <div className="flex gap-1.5 min-w-0">
                                <span className="text-muted-foreground w-16 shrink-0">Nhà thầu</span>
                                <span className="font-medium break-words">{selectedItem.nhaThau || '—'}</span>
                            </div>
                            {selectedItem.tenNhom && (
                                <div className="flex gap-1.5 col-span-2">
                                    <span className="text-muted-foreground w-16 shrink-0">Danh mục</span>
                                    <span className="font-medium">{selectedItem.tenNhom}</span>
                                </div>
                            )}
                        </div>

                        {/* Số liệu trong kỳ */}
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground">SL Xuất</p>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{selectedItem.slXuat.toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground">SL Nhập</p>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{selectedItem.slNhap.toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground">SL Tồn</p>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{selectedItem.slTon.toLocaleString('vi-VN')}</p>
                            </div>
                            <div className="bg-tertiary border border-border rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground">Đơn giá</p>
                                <p className="text-sm font-semibold">{selectedItem.donGia.toLocaleString('vi-VN')}đ</p>
                            </div>
                        </div>

                        {/* Số lượng dự trù */}
                        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Số lượng dự trù</p>
                                    {isEditMode ? (
                                        <Input
                                            type="number"
                                            min="0"
                                            value={editDuTru}
                                            onChange={(e) => setEditDuTru(parseInt(e.target.value) || 0)}
                                            className="w-32 mt-1 bg-white"
                                        />
                                    ) : (
                                        <p className="text-2xl font-bold text-green-700">{selectedItem.duTru}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Gọi hàng</p>
                                    <p className="text-2xl font-bold text-green-700">{currentGoiHang}</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Giá trị ước tính:{' '}
                                <span className="font-semibold text-green-700">
                                    {(
                                        (isEditMode
                                            ? currentGoiHang
                                            : selectedItem.goiHang
                                        ) * selectedItem.donGia
                                    ).toLocaleString('vi-VN')}đ
                                </span>
                            </p>
                        </div>

                        {/* Hiển thị trạng thái đã phê duyệt */}
                        {selectedItemApproval && (
                            <div className={`p-3 rounded-lg border ${selectedItemApproval.status === 'approved'
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/30'
                                : selectedItemApproval.status === 'rejected'
                                    ? 'bg-red-50 border-red-200 dark:bg-red-950/30'
                                    : selectedItemApproval.status === 'submitted'
                                        ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30'
                                        : isThuKhoUnsubmitState
                                            ? 'bg-slate-50 border-slate-200 dark:bg-slate-950/30'
                                    : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30'
                                }`}>
                                <p className="text-sm font-medium">
                                    {selectedItemApproval.status === 'approved' && '✅ Đã phê duyệt'}
                                    {selectedItemApproval.status === 'rejected' && '❌ Đã từ chối'}
                                    {selectedItemApproval.status === 'edited' && (isThuKhoUnsubmitState ? '↩️ Thủ kho hủy duyệt' : '✏️ Đã sửa')}
                                    {selectedItemApproval.status === 'submitted' && '📨 Đã gửi lên chỉ huy khoa'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Bởi: {selectedItemApproval.nguoiDuyet} - {selectedItemApproval.thoiGian?.toLocaleString('vi-VN')}
                                </p>
                                {selectedItemApproval.lyDo && (
                                    <p className="text-sm text-red-600 mt-1">Lý do: {selectedItemApproval.lyDo}</p>
                                )}
                                {selectedItemApproval.duTruGoc !== undefined && (
                                    <p className="text-sm text-orange-600 mt-1">
                                        Đã sửa: {selectedItemApproval.duTruGoc} → {selectedItemApproval.duTruSua}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Form từ chối */}
                        {isRejectMode && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Lý do từ chối</label>
                                <Textarea
                                    placeholder="Nhập lý do từ chối..."
                                    value={lyDoTuChoi}
                                    onChange={(e) => setLyDoTuChoi(e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {canShowActionButtons && !isEditMode && !isRejectMode && (
                        <>
                            <span className="inline-flex" title={isApproveRejectLocked ? approveRejectLockTooltip : (!canApproveReject ? approveRejectRoleTooltip : undefined)}>
                                <Button
                                    onClick={onApprove}
                                    disabled={!canApproveReject || isApproveRejectLocked}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    {approveLabel}
                                </Button>
                            </span>
                            <span className="inline-flex" title={isApproveRejectLocked ? approveRejectLockTooltip : (!canApproveReject ? approveRejectRoleTooltip : undefined)}>
                                <Button
                                    onClick={() => setIsRejectMode(true)}
                                    disabled={!canApproveReject || isApproveRejectLocked}
                                    variant="destructive"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Từ chối
                                </Button>
                            </span>
                            <span className="inline-flex" title={!canEditForecast ? editForecastRoleTooltip : undefined}>
                                <Button
                                    onClick={() => setIsEditMode(true)}
                                    disabled={!canEditForecast}
                                    variant="outline"
                                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                >
                                    <FilePen className="w-4 h-4 mr-2" />
                                    Sửa và lưu
                                </Button>
                            </span>
                        </>
                    )}

                    {isEditMode && canEditForecast && (
                        <>
                            <Button
                                onClick={onEditAndSave}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Xác nhận sửa và lưu
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditDuTru(selectedItem?.duTru ?? 0);
                                }}
                                variant="outline"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                            </Button>
                        </>
                    )}

                    {isRejectMode && canApproveReject && (
                        <>
                            <Button
                                onClick={onReject}
                                variant="destructive"
                            >
                                Xác nhận từ chối
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsRejectMode(false);
                                    setLyDoTuChoi('');
                                }}
                                variant="outline"
                            >
                                Hủy
                            </Button>
                        </>
                    )}

                    {selectedItemApproval && selectedItemApproval.status !== 'edited' && selectedItemApproval.status !== 'submitted' && !isEditMode && !isRejectMode && (
                        <Button
                            onClick={() => onOpenChange(false)}
                            variant="outline"
                        >
                            Đóng
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApproveDialog;
