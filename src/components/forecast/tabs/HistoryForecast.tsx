import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryEntry, HistoryActionType } from "@/data/forecast/type";
import { TabsContent } from "@radix-ui/react-tabs";
import { Clock, History, XCircle } from "lucide-react";
import React from "react";

interface IHistoryForecastProps {
    historyLog: HistoryEntry[];
    getActionBadge: (actionType: HistoryActionType) => React.ReactNode;
    setSelectedHistoryEntry: React.Dispatch<React.SetStateAction<HistoryEntry | null>>;
    setIsHistoryDetailDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const HistoryForecast = ({
    historyLog,
    getActionBadge,
    setSelectedHistoryEntry,
    setIsHistoryDetailDialogOpen
}: IHistoryForecastProps) => {
    return (
        <TabsContent value="history" className="space-y-6">
            <Card className="bg-neutral border-border">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Lịch sử thay đổi dự trù
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {historyLog.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Chưa có thay đổi nào được ghi nhận</p>
                            <p className="text-sm mt-2">Các thay đổi về phê duyệt, từ chối, sửa số lượng sẽ được hiển thị ở đây</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-primary text-primary-foreground">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Thời gian</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Hành động</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium">Chi tiết</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap">Người thực hiện</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {historyLog.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-tertiary transition-colors">
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    {entry.thoiGian.toLocaleString('vi-VN')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getActionBadge(entry.actionType)}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono text-foreground whitespace-nowrap">
                                                {entry.maVtyt || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-foreground">
                                                <div className="max-w-[300px] truncate" title={entry.tenVtyt}>
                                                    {entry.tenVtyt}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-foreground">
                                                {entry.chiTiet?.lyDo && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setSelectedHistoryEntry(entry);
                                                            setIsHistoryDetailDialogOpen(true);
                                                        }}
                                                    >
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Xem lý do
                                                    </Button>
                                                )}
                                                {entry.chiTiet?.duTruGoc !== undefined && entry.chiTiet?.duTruMoi !== undefined && (
                                                    <span className="text-orange-600">
                                                        SL: {entry.chiTiet.duTruGoc} → {entry.chiTiet.duTruMoi}
                                                    </span>
                                                )}
                                                {entry.chiTiet?.soLuongDuyet !== undefined && (
                                                    <span className="text-emerald-600">
                                                        {entry.chiTiet.soLuongDuyet} vật tư
                                                    </span>
                                                )}
                                                {!entry.chiTiet?.lyDo && entry.chiTiet?.duTruGoc === undefined && entry.chiTiet?.soLuongDuyet === undefined && (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">
                                                {entry.nguoiThucHien}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    )
}

export default HistoryForecast