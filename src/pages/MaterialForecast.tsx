import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, FileUp, Save, Calculator, CheckCircle2, XCircle, FilePen, X, CheckCheck, AlertTriangle, History, Clock } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Trạng thái phê duyệt cho mỗi vật tư
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

// Loại hành động trong lịch sử
type HistoryActionType = 'approve' | 'reject' | 'edit' | 'edit_quantity' | 'approve_all';

interface HistoryEntry {
    id: number;
    stt: number;
    maVtyt: string;
    tenVtyt: string;
    actionType: HistoryActionType;
    nguoiThucHien: string;
    thoiGian: Date;
    chiTiet?: {
        lyDo?: string;
        duTruGoc?: number;
        duTruMoi?: number;
        soLuongDuyet?: number;
    };
}

interface ApprovalState {
    [stt: number]: {
        status: ApprovalStatus;
        lyDo?: string;
        duTruGoc?: number;
        duTruSua?: number;
        nguoiDuyet?: string;
        thoiGian?: Date;
    };
}

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
    const handleDuTruChange = (stt: number, value: string) => {
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
    const handleDuTruFocus = (stt: number, value: number) => {
        setOriginalDuTru({ stt, value });
    };

    // Ghi lịch sử khi blur (nếu có thay đổi)
    const handleDuTruBlur = (stt: number, newValue: number) => {
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
    const totalDuTru = filteredData.reduce((sum, item) => sum + item.duTru, 0);
    const totalGoiHang = filteredData.reduce((sum, item) => sum + item.goiHang, 0);
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

                <TabsContent value="forecast" className="space-y-6">
                    {/* Thống kê tổng quan */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-neutral border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng số lượng dự trù</p>
                                        <p className="text-2xl font-semibold text-foreground">{totalDuTru.toLocaleString('vi-VN')}</p>
                                    </div>
                                    <Calculator className="w-8 h-8 text-primary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng số gói hàng</p>
                                        <p className="text-2xl font-semibold text-foreground">{totalGoiHang.toLocaleString('vi-VN')}</p>
                                    </div>
                                    <Calculator className="w-8 h-8 text-secondary opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng giá trị ước tính</p>
                                        <p className="text-2xl font-semibold text-foreground">{totalValue.toLocaleString('vi-VN')}đ</p>
                                    </div>
                                    <Calculator className="w-8 h-8 text-green-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-neutral border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tiến độ phê duyệt</p>
                                        <p className="text-2xl font-semibold text-foreground">
                                            {approvedCount}/{filteredData.length}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                                </div>
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${filteredData.length > 0 ? (approvedCount / filteredData.length) * 100 : 0}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Bộ lọc */}
                    <Card className="bg-neutral border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Tìm kiếm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={2} />
                                <Input
                                    type="search"
                                    placeholder="Tìm theo tên, mã vật tư hoặc nhà thầu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-neutral text-foreground border-border"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bảng dữ liệu */}
                    <Card className="bg-neutral border-border">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px]">
                                    <thead className="bg-primary text-primary-foreground">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">STT</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Mã VT</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium">Tên vật tư</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Mã hiệu</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Hãng SX</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Quy cách</th>
                                            <th className="px-3 py-3 text-right text-xs font-medium whitespace-nowrap">Đơn giá</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Xuất</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Nhập</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-blue-600">SL Tồn</th>
                                            <th className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap">Nhà thầu</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600">Dự trù</th>
                                            <th className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap bg-green-600">Gọi hàng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredData.map((item) => (
                                            <tr
                                                key={item.stt}
                                                className="hover:bg-tertiary transition-colors cursor-pointer"
                                                onClick={() => handleRowClick(item)}
                                            >
                                                <td className="px-3 py-3 text-xs text-foreground text-center">{item.stt}</td>
                                                <td className="px-3 py-3 text-xs font-mono text-foreground whitespace-nowrap">{item.maVtytCu}</td>
                                                <td className="px-3 py-3 text-sm text-foreground">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <p className="font-medium truncate flex-1 min-w-0" title={item.tenVtytBv}>{item.tenVtytBv}</p>
                                                        {getStatusBadge(item.stt)}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{item.maHieu}</td>
                                                <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">{item.hangSx}</td>
                                                <td className="px-3 py-3 text-xs text-foreground whitespace-nowrap">
                                                    {item.quyCach} ({item.slTrongQuyCach} {item.donViTinh})
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground text-right font-medium whitespace-nowrap">
                                                    {item.donGia.toLocaleString('vi-VN')}
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                                    {item.slXuat}
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                                    {item.slNhap}
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground text-center bg-blue-50 dark:bg-blue-950/30">
                                                    <Badge variant={item.slTon < 50 ? "destructive" : "secondary"} className="text-xs">
                                                        {item.slTon}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground">
                                                    <div className="max-w-[100px] truncate" title={item.nhaThau}>
                                                        {item.nhaThau}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 bg-green-50 dark:bg-green-950/30" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={item.duTru}
                                                        onChange={(e) => handleDuTruChange(item.stt, e.target.value)}
                                                        onFocus={() => handleDuTruFocus(item.stt, item.duTru)}
                                                        onBlur={(e) => handleDuTruBlur(item.stt, parseInt(e.target.value) || 0)}
                                                        className="w-20 h-8 text-xs text-center bg-white dark:bg-neutral border-green-300 focus:border-green-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-xs text-foreground text-center font-semibold bg-green-50 dark:bg-green-950/30">
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                        {item.goiHang}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-tertiary border-t-2 border-border">
                                        <tr>
                                            <td colSpan={11} className="px-3 py-3 text-sm font-semibold text-foreground text-right">
                                                Tổng cộng:
                                            </td>
                                            <td className="px-3 py-3 text-sm font-semibold text-foreground text-center bg-green-100 dark:bg-green-950/50">
                                                {totalDuTru}
                                            </td>
                                            <td className="px-3 py-3 text-sm font-semibold text-foreground text-center bg-green-100 dark:bg-green-950/50">
                                                {totalGoiHang}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {filteredData.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Không tìm thấy vật tư nào
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Lịch sử thay đổi */}
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
            </Tabs>

            {/* Dialog phê duyệt */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                                    onClick={handleApprove}
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
                                    onClick={handleEditAndApprove}
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
                                    onClick={handleReject}
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
                                onClick={() => setIsDialogOpen(false)}
                                variant="outline"
                            >
                                Đóng
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog xác nhận duyệt tất cả */}
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

            {/* Dialog chi tiết lý do từ chối */}
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
        </div>
    );
}
