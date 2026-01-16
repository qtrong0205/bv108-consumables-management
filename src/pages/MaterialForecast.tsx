import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, FileUp, Save, Calculator, CheckCircle2, XCircle, FilePen, CheckCheck, AlertTriangle, History, Clock } from 'lucide-react';
import { DATA_DU_TRU_MAU, IVatTuDuTru } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApproveDialog from '@/components/forecast/dialog/ApproveDialog';
import ApproveAllDialog from '@/components/forecast/dialog/ApproveAllDialog';
import RejectReasonDetailDialog from '@/components/forecast/dialog/RejectReasonDetailDialog';
import { ApprovalState, HistoryEntry } from '@/data/forecast/type';
import ForecastTable from '@/components/forecast/tabs/ForecastTable';
import HistoryForecast from '@/components/forecast/tabs/HistoryForecast';

// Trạng thái phê duyệt cho mỗi vật tư
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

// Loại hành động trong lịch sử
type HistoryActionType = 'approve' | 'reject' | 'edit' | 'edit_quantity' | 'approve_all';

export default function MaterialForecast() {
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState<IVatTuDuTru[]>(DATA_DU_TRU_MAU);
    const [filteredData, setFilteredData] = useState<IVatTuDuTru[]>(DATA_DU_TRU_MAU);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('forecast');

    // State cho dialog phê duyệt
    const [selectedItem, setSelectedItem] = useState<IVatTuDuTru | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editDuTru, setEditDuTru] = useState(0);
    const [lyDoTuChoi, setLyDoTuChoi] = useState('');
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
    const [isApproveAllDialogOpen, setIsApproveAllDialogOpen] = useState(false);

    // State cho lịch sử thay đổi
    const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
    const [historyIdCounter, setHistoryIdCounter] = useState(1);

    // State cho dialog chi tiết lịch sử
    const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
    const [isHistoryDetailDialogOpen, setIsHistoryDetailDialogOpen] = useState(false);

    // Người dùng hiện tại (giả lập)
    const CURRENT_USER = 'TS. Phạm Văn Dũng';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        let filtered = data;

        if (searchTerm) {
            filtered = filtered.filter(
                (item) =>
                    item.tenVtytBv.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.maVtytCu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.nhaThau.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredData(filtered);
    }, [searchTerm, data]);

    // Hàm thêm entry vào lịch sử
    const addHistoryEntry = (entry: Omit<HistoryEntry, 'id'>) => {
        setHistoryLog(prev => [{
            ...entry,
            id: historyIdCounter,
        }, ...prev]);
        setHistoryIdCounter(prev => prev + 1);
    };

    // Lưu giá trị gốc khi focus vào input
    const [originalDuTru, setOriginalDuTru] = useState<{ stt: number; value: number } | null>(null);

    // Xử lý thay đổi giá trị dự trù
    const handleForecastChange = (stt: number, value: string) => {
        const numValue = parseInt(value) || 0;

        setData(prevData =>
            prevData.map(item => {
                if (item.stt === stt) {
                    const goiHang = Math.ceil(numValue / item.slTrongQuyCach);
                    return { ...item, duTru: numValue, goiHang };
                }
                return item;
            })
        );
    };

    // Lưu giá trị gốc khi focus
    const handleForecastFocus = (stt: number, value: number) => {
        setOriginalDuTru({ stt, value });
    };

    // Ghi lịch sử khi blur (nếu có thay đổi)
    const handleForecastBlur = (stt: number, newValue: number) => {
        if (originalDuTru && originalDuTru.stt === stt && originalDuTru.value !== newValue) {
            const item = data.find(i => i.stt === stt);
            if (item) {
                addHistoryEntry({
                    stt: item.stt,
                    maVtyt: item.maVtytCu,
                    tenVtyt: item.tenVtytBv,
                    actionType: 'edit_quantity',
                    nguoiThucHien: CURRENT_USER,
                    thoiGian: new Date(),
                    chiTiet: {
                        duTruGoc: originalDuTru.value,
                        duTruMoi: newValue,
                    },
                });
            }
        }
        setOriginalDuTru(null);
    };

    // Tính toán tổng
    const totalForecast = filteredData.reduce((sum, item) => sum + item.duTru, 0);
    const totalOrder = filteredData.reduce((sum, item) => sum + item.goiHang, 0);
    const totalValue = filteredData.reduce((sum, item) => sum + (item.goiHang * item.donGia * item.slTrongQuyCach), 0);

    // Lưu dữ liệu
    const handleSave = () => {
        toast({
            title: "Lưu thành công",
            description: "Dữ liệu dự trù đã được cập nhật",
        });
    };

    // Xuất Excel
    const handleExport = () => {
        toast({
            title: "Xuất file thành công",
            description: "File Excel đã được tải xuống",
        });
    };

    // Mở dialog phê duyệt khi click vào row
    const handleRowClick = (item: IVatTuDuTru) => {
        setSelectedItem(item);
        setEditDuTru(item.duTru);
        setIsEditMode(false);
        setIsRejectMode(false);
        setLyDoTuChoi('');
        setIsDialogOpen(true);
    };

    // Phê duyệt
    const handleApprove = () => {
        if (!selectedItem) return;

        const now = new Date();

        setApprovalStates(prev => ({
            ...prev,
            [selectedItem.stt]: {
                status: 'approved',
                nguoiDuyet: CURRENT_USER,
                thoiGian: now,
            }
        }));

        // Ghi lịch sử
        addHistoryEntry({
            stt: selectedItem.stt,
            maVtyt: selectedItem.maVtytCu,
            tenVtyt: selectedItem.tenVtytBv,
            actionType: 'approve',
            nguoiThucHien: CURRENT_USER,
            thoiGian: now,
        });

        toast({
            title: "Phê duyệt thành công",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã được phê duyệt`,
        });

        setIsDialogOpen(false);
    };

    // Từ chối
    const handleReject = () => {
        if (!selectedItem) return;

        if (!lyDoTuChoi.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập lý do từ chối",
                variant: "destructive",
            });
            return;
        }

        const now = new Date();

        setApprovalStates(prev => ({
            ...prev,
            [selectedItem.stt]: {
                status: 'rejected',
                lyDo: lyDoTuChoi,
                nguoiDuyet: CURRENT_USER,
                thoiGian: now,
            }
        }));

        // Ghi lịch sử
        addHistoryEntry({
            stt: selectedItem.stt,
            maVtyt: selectedItem.maVtytCu,
            tenVtyt: selectedItem.tenVtytBv,
            actionType: 'reject',
            nguoiThucHien: CURRENT_USER,
            thoiGian: now,
            chiTiet: {
                lyDo: lyDoTuChoi,
            },
        });

        toast({
            title: "Đã từ chối",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã bị từ chối`,
            variant: "destructive",
        });

        setIsDialogOpen(false);
        setIsRejectMode(false);
        setLyDoTuChoi('');
    };

    // Sửa và duyệt
    const handleEditAndApprove = () => {
        if (!selectedItem) return;

        const goiHang = Math.ceil(editDuTru / selectedItem.slTrongQuyCach);
        const now = new Date();

        // Cập nhật data
        setData(prevData =>
            prevData.map(item => {
                if (item.stt === selectedItem.stt) {
                    return { ...item, duTru: editDuTru, goiHang };
                }
                return item;
            })
        );

        // Cập nhật trạng thái phê duyệt
        setApprovalStates(prev => ({
            ...prev,
            [selectedItem.stt]: {
                status: 'edited',
                duTruGoc: selectedItem.duTru,
                duTruSua: editDuTru,
                nguoiDuyet: CURRENT_USER,
                thoiGian: now,
            }
        }));

        // Ghi lịch sử
        addHistoryEntry({
            stt: selectedItem.stt,
            maVtyt: selectedItem.maVtytCu,
            tenVtyt: selectedItem.tenVtytBv,
            actionType: 'edit',
            nguoiThucHien: CURRENT_USER,
            thoiGian: now,
            chiTiet: {
                duTruGoc: selectedItem.duTru,
                duTruMoi: editDuTru,
            },
        });

        toast({
            title: "Sửa và duyệt thành công",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã được sửa từ ${selectedItem.duTru} → ${editDuTru} và phê duyệt`,
        });

        setIsDialogOpen(false);
        setIsEditMode(false);
    };

    // Lấy badge trạng thái
    const getStatusBadge = (stt: number) => {
        const state = approvalStates[stt];
        if (!state) return null;

        const baseClass = "text-[10px] whitespace-nowrap shrink-0 min-w-[85px] justify-center cursor-pointer transition-all";

        switch (state.status) {
            case 'approved':
                return <Badge className={`bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:border-green-400 ${baseClass}`}><CheckCircle2 className="w-3 h-3 mr-1" />Đã duyệt</Badge>;
            case 'rejected':
                return <Badge className={`bg-red-100 text-red-700 border-red-300 hover:bg-red-200 hover:border-red-400 ${baseClass}`}><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
            case 'edited':
                return <Badge className={`bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 hover:border-orange-400 ${baseClass}`}><FilePen className="w-3 h-3 mr-1" />Đã sửa</Badge>;
            default:
                return null;
        }
    };

    // Đếm số vật tư chưa duyệt
    const pendingCount = filteredData.filter(item => !approvalStates[item.stt]).length;
    const approvedCount = filteredData.filter(item => approvalStates[item.stt]?.status === 'approved' || approvalStates[item.stt]?.status === 'edited').length;

    // Duyệt tất cả
    const handleApproveAll = () => {
        const newApprovalStates: ApprovalState = { ...approvalStates };
        const now = new Date();
        const pendingItems = filteredData.filter(item => !approvalStates[item.stt]);

        pendingItems.forEach(item => {
            newApprovalStates[item.stt] = {
                status: 'approved',
                nguoiDuyet: CURRENT_USER,
                thoiGian: now,
            };
        });

        setApprovalStates(newApprovalStates);
        setIsApproveAllDialogOpen(false);

        // Ghi lịch sử duyệt tất cả
        addHistoryEntry({
            stt: 0, // Không liên quan đến item cụ thể
            maVtyt: '',
            tenVtyt: `Duyệt hàng loạt ${pendingItems.length} vật tư`,
            actionType: 'approve_all',
            nguoiThucHien: CURRENT_USER,
            thoiGian: now,
            chiTiet: {
                soLuongDuyet: pendingItems.length,
            },
        });

        toast({
            title: "Duyệt tất cả thành công",
            description: `Đã phê duyệt ${pendingCount} vật tư chưa duyệt`,
        });
    };

    // Tính tổng giá trị của các vật tư chưa duyệt
    const pendingTotalValue = filteredData
        .filter(item => !approvalStates[item.stt])
        .reduce((sum, item) => sum + (item.goiHang * item.donGia * item.slTrongQuyCach), 0);

    // Lấy badge cho loại hành động trong lịch sử
    const getActionBadge = (actionType: HistoryActionType) => {
        const baseClass = "text-[10px] whitespace-nowrap";
        switch (actionType) {
            case 'approve':
                return <Badge className={`bg-green-100 text-green-700 border-green-300 ${baseClass}`}><CheckCircle2 className="w-3 h-3 mr-1" />Phê duyệt</Badge>;
            case 'reject':
                return <Badge className={`bg-red-100 text-red-700 border-red-300 ${baseClass}`}><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
            case 'edit':
                return <Badge className={`bg-orange-100 text-orange-700 border-orange-300 ${baseClass}`}><FilePen className="w-3 h-3 mr-1" />Sửa & Duyệt</Badge>;
            case 'edit_quantity':
                return <Badge className={`bg-blue-100 text-blue-700 border-blue-300 ${baseClass}`}><FilePen className="w-3 h-3 mr-1" />Sửa SL</Badge>;
            case 'approve_all':
                return <Badge className={`bg-emerald-100 text-emerald-700 border-emerald-300 ${baseClass}`}><CheckCheck className="w-3 h-3 mr-1" />Duyệt tất cả</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">Dự trù vật tư</h1>
                    <p className="text-muted-foreground">Lập kế hoạch dự trù và gọi hàng vật tư y tế</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
                        onClick={handleExport}
                    >
                        <FileUp className="w-4 h-4 mr-2" strokeWidth={2} />
                        Xuất Excel
                    </Button>
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                        onClick={handleSave}
                    >
                        <Save className="w-4 h-4 mr-2" strokeWidth={2} />
                        Lưu dự trù
                    </Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white font-normal"
                        onClick={() => setIsApproveAllDialogOpen(true)}
                        disabled={pendingCount === 0}
                    >
                        <CheckCheck className="w-4 h-4 mr-2" strokeWidth={2} />
                        Duyệt tất cả ({pendingCount})
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-neutral border border-border">
                    <TabsTrigger value="forecast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Calculator className="w-4 h-4 mr-2" />
                        Dự trù vật tư
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <History className="w-4 h-4 mr-2" />
                        Lịch sử thay đổi ({historyLog.length})
                    </TabsTrigger>
                </TabsList>

                <ForecastTable
                    totalForecast={totalForecast}
                    totalOrder={totalOrder}
                    totalValue={totalValue}
                    approvedCount={approvedCount}
                    filteredData={filteredData}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    handleRowClick={handleRowClick}
                    getStatusBadge={getStatusBadge}
                    handleForecastChange={handleForecastChange}
                    handleForecastFocus={handleForecastFocus}
                    handleForecastBlur={handleForecastBlur}
                />

                {/* Tab Lịch sử thay đổi */}
                <HistoryForecast
                    historyLog={historyLog}
                    getActionBadge={getActionBadge}
                    setSelectedHistoryEntry={setSelectedHistoryEntry}
                    setIsHistoryDetailDialogOpen={setIsHistoryDetailDialogOpen}
                />
            </Tabs>

            {/* Dialog phê duyệt */}
            <ApproveDialog
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                selectedItem={selectedItem}
                getStatusBadge={getStatusBadge}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                editDuTru={editDuTru}
                setEditDuTru={setEditDuTru}
                approvalStates={approvalStates}
                isRejectMode={isRejectMode}
                setIsRejectMode={setIsRejectMode}
                lyDoTuChoi={lyDoTuChoi}
                setLyDoTuChoi={setLyDoTuChoi}
                handleApprove={handleApprove}
                handleReject={handleReject}
                handleEditAndApprove={handleEditAndApprove}
            />

            {/* Dialog xác nhận duyệt tất cả */}
            <ApproveAllDialog
                isApproveAllDialogOpen={isApproveAllDialogOpen}
                setIsApproveAllDialogOpen={setIsApproveAllDialogOpen}
                pendingCount={pendingCount}
                pendingTotalValue={pendingTotalValue}
                handleApproveAll={handleApproveAll}
            />

            {/* Dialog chi tiết lý do từ chối */}
            <RejectReasonDetailDialog
                isHistoryDetailDialogOpen={isHistoryDetailDialogOpen}
                setIsHistoryDetailDialogOpen={setIsHistoryDetailDialogOpen}
                selectedHistoryEntry={selectedHistoryEntry}
            />
        </div>
    );
}
