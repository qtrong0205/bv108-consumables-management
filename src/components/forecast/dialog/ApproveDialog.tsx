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
        getStatusBadge: (stt: number) => React.ReactNode;
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
        onEditAndApprove: () => void;
    };
}

const ApproveDialog = ({
    dialog,
    editMode,
    rejectMode,
    actions,
}: IApproveDialogProps) => {
    const { open, onOpenChange, selectedItem, approvalStates, getStatusBadge } = dialog;
    const { isActive: isEditMode, setActive: setIsEditMode, editValue: editDuTru, setEditValue: setEditDuTru } = editMode;
    const { isActive: isRejectMode, setActive: setIsRejectMode, reason: lyDoTuChoi, setReason: setLyDoTuChoi } = rejectMode;
    const { onApprove, onReject, onEditAndApprove } = actions;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Phê duyệt dự trù vật tư
                        {selectedItem && getStatusBadge(selectedItem.stt)}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedItem?.tenVtytBv}
                    </DialogDescription>
                </DialogHeader>

                {selectedItem && (
                    <div className="space-y-4 py-4">
                        {/* Thông tin vật tư */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-tertiary p-3 rounded-lg">
                                <p className="text-muted-foreground text-xs">Mã vật tư</p>
                                <p className="font-medium">{selectedItem.maVtytCu}</p>
                            </div>
                            <div className="bg-tertiary p-3 rounded-lg">
                                <p className="text-muted-foreground text-xs">Quy cách</p>
                                <p className="font-medium">{selectedItem.quyCach}</p>
                            </div>
                            <div className="bg-tertiary p-3 rounded-lg">
                                <p className="text-muted-foreground text-xs">SL Tồn kho</p>
                                <p className="font-medium">{selectedItem.slTon}</p>
                            </div>
                            <div className="bg-tertiary p-3 rounded-lg">
                                <p className="text-muted-foreground text-xs">Đơn giá</p>
                                <p className="font-medium">{selectedItem.donGia.toLocaleString('vi-VN')}đ</p>
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
                                    <p className="text-2xl font-bold text-green-700">
                                        {isEditMode
                                            ? Math.ceil(editDuTru / selectedItem.slTrongQuyCach)
                                            : selectedItem.goiHang
                                        }
                                    </p>
                                </div>
                            </div>
                            {isEditMode && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Giá trị: {(Math.ceil(editDuTru / selectedItem.slTrongQuyCach) * selectedItem.donGia * selectedItem.slTrongQuyCach).toLocaleString('vi-VN')}đ
                                </p>
                            )}
                        </div>

                        {/* Hiển thị trạng thái đã phê duyệt */}
                        {approvalStates[selectedItem.stt] && (
                            <div className={`p-3 rounded-lg border ${approvalStates[selectedItem.stt].status === 'approved'
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/30'
                                : approvalStates[selectedItem.stt].status === 'rejected'
                                    ? 'bg-red-50 border-red-200 dark:bg-red-950/30'
                                    : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30'
                                }`}>
                                <p className="text-sm font-medium">
                                    {approvalStates[selectedItem.stt].status === 'approved' && '✅ Đã phê duyệt'}
                                    {approvalStates[selectedItem.stt].status === 'rejected' && '❌ Đã từ chối'}
                                    {approvalStates[selectedItem.stt].status === 'edited' && '✏️ Đã sửa và duyệt'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Bởi: {approvalStates[selectedItem.stt].nguoiDuyet} - {approvalStates[selectedItem.stt].thoiGian?.toLocaleString('vi-VN')}
                                </p>
                                {approvalStates[selectedItem.stt].lyDo && (
                                    <p className="text-sm text-red-600 mt-1">Lý do: {approvalStates[selectedItem.stt].lyDo}</p>
                                )}
                                {approvalStates[selectedItem.stt].duTruGoc !== undefined && (
                                    <p className="text-sm text-orange-600 mt-1">
                                        Đã sửa: {approvalStates[selectedItem.stt].duTruGoc} → {approvalStates[selectedItem.stt].duTruSua}
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
                    {!approvalStates[selectedItem?.stt ?? 0] && !isEditMode && !isRejectMode && (
                        <>
                            <Button
                                onClick={onApprove}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Phê duyệt
                            </Button>
                            <Button
                                onClick={() => setIsRejectMode(true)}
                                variant="destructive"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Từ chối
                            </Button>
                            <Button
                                onClick={() => setIsEditMode(true)}
                                variant="outline"
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                                <FilePen className="w-4 h-4 mr-2" />
                                Sửa và duyệt
                            </Button>
                        </>
                    )}

                    {isEditMode && (
                        <>
                            <Button
                                onClick={onEditAndApprove}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Xác nhận sửa và duyệt
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

                    {isRejectMode && (
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

                    {approvalStates[selectedItem?.stt ?? 0] && !isEditMode && !isRejectMode && (
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