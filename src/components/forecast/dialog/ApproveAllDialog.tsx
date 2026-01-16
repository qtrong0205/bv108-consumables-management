import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCheck } from "lucide-react";

interface IApproveAllDialogProps {
    isApproveAllDialogOpen: boolean;
    setIsApproveAllDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    pendingCount: number;
    pendingTotalValue: number;
    handleApproveAll: () => void;
}

const ApproveAllDialog = ({
    isApproveAllDialogOpen,
    setIsApproveAllDialogOpen,
    pendingCount,
    pendingTotalValue,
    handleApproveAll
}: IApproveAllDialogProps) => {
    return (
        <Dialog open={isApproveAllDialogOpen} onOpenChange={setIsApproveAllDialogOpen}>
            <DialogContent className="sm:max-w-[450px] bg-neutral border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <CheckCheck className="w-5 h-5 text-green-500" />
                        Xác nhận phê duyệt tất cả
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Bạn có chắc chắn muốn phê duyệt tất cả vật tư đang chờ duyệt?
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Số vật tư sẽ được duyệt:</span>
                            <span className="font-semibold text-green-500">{pendingCount} vật tư</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Tổng giá trị:</span>
                            <span className="font-semibold text-foreground">{pendingTotalValue.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                    </div>
                    <p className="text-sm text-yellow-500 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Hành động này không thể hoàn tác sau khi thực hiện.
                    </p>
                </div>
                <DialogFooter className="gap-2">
                    <Button
                        onClick={() => setIsApproveAllDialogOpen(false)}
                        variant="outline"
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        onClick={handleApproveAll}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Xác nhận duyệt tất cả
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ApproveAllDialog