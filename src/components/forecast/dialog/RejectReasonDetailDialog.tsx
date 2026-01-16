import { HistoryEntry } from "@/pages/MaterialForecast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IRejectReasonDetailDialogProps {
    isHistoryDetailDialogOpen: boolean;
    setIsHistoryDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedHistoryEntry: HistoryEntry
}

const RejectReasonDetailDialog = ({
    isHistoryDetailDialogOpen,
    setIsHistoryDetailDialogOpen,
    selectedHistoryEntry,
}: IRejectReasonDetailDialogProps) => {
    return (
        <Dialog open={isHistoryDetailDialogOpen} onOpenChange={setIsHistoryDetailDialogOpen}>
            <DialogContent className="sm:max-w-md bg-neutral border-border">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-500" />
                        Chi tiết từ chối dự trù
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Thông tin chi tiết về lý do từ chối vật tư
                    </DialogDescription>
                </DialogHeader>
                {selectedHistoryEntry && (
                    <div className="space-y-4 py-4">
                        {/* Thông tin vật tư */}
                        <div className="bg-tertiary p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Mã vật tư:</span>
                                <span className="text-sm font-mono font-medium">{selectedHistoryEntry.maVtyt}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Tên vật tư:</span>
                                <p className="text-sm font-medium mt-1">{selectedHistoryEntry.tenVtyt}</p>
                            </div>
                        </div>

                        {/* Lý do từ chối */}
                        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Lý do từ chối:</p>
                            <p className="text-sm text-foreground">{selectedHistoryEntry.chiTiet?.lyDo}</p>
                        </div>

                        {/* Thông tin người từ chối */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {selectedHistoryEntry.thoiGian.toLocaleString('vi-VN')}
                            </div>
                            <span>Bởi: {selectedHistoryEntry.nguoiThucHien}</span>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button
                        onClick={() => setIsHistoryDetailDialogOpen(false)}
                        variant="outline"
                    >
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RejectReasonDetailDialog