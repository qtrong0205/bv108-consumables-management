import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileUp, Save, Calculator, CheckCircle2, XCircle, FilePen, CheckCheck, History, Clock, Calendar } from 'lucide-react';
import { IVatTuDuTru } from '@/data/mockData';
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
import { ApprovalState, HistoryEntry, HistoryActionType, MonthlyForecastRecord, MonthlyForecastItem } from '@/data/forecast/type';
import ForecastTable from '@/components/forecast/tabs/ForecastTable';
import HistoryForecast from '@/components/forecast/tabs/HistoryForecast';
import MonthlyForecastHistory from '@/components/forecast/tabs/MonthlyForecastHistory';
import { MOCK_MONTHLY_FORECAST_HISTORY } from '@/data/forecast/mockMonthlyForecast';
import { useOrder } from '@/context/OrderContext';
import { apiService, ApiForecastApproval, ApiSupply, getNullableNumber, getNullableString, getStoredAuth, SaveForecastApprovalRequest } from '@/services/api';
import { useSupplyGroups } from '@/hooks/use-supplies';
import * as XLSX from 'xlsx';

// Trạng thái phê duyệt cho mỗi vật tư
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

// Lấy tháng và năm hiện tại
const CURRENT_DATE = new Date();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1; // 1-12
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

const extractPackQuantity = (quyCach: string): number => {
    const matched = quyCach.match(/\d+/);
    if (!matched) return 1;
    const parsed = parseInt(matched[0], 10);
    return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
};

const shouldShowInForecast = (item: ApiSupply): boolean => {
    const tonDauKy = getNullableNumber(item.tonDauKy);
    const nhapTrongKy = getNullableNumber(item.nhapTrongKy);
    const xuatTrongKy = getNullableNumber(item.xuatTrongKy);
    const tongNhap = getNullableNumber(item.tongNhap);

    return !(tonDauKy === 0 && nhapTrongKy === 0 && xuatTrongKy === 0 && tongNhap === 0);
};

const mapSupplyToForecastItem = (item: ApiSupply, index: number): IVatTuDuTru => {
    const quyCach = getNullableString(item.quyCach);
    const slTrongQuyCach = extractPackQuantity(quyCach);
    const slXuat = getNullableNumber(item.xuatTrongKy);
    const slTon = item.tonCuoiKy;
    const diff = slXuat - slTon;
    const duTru = diff <= 0 ? slXuat : diff;

    return {
        stt: index + 1,
        maQuanLy: getNullableString(item.id),
        maVtytCu: getNullableString(item.id),
        tenNhom: getNullableString(item.groupName),
        tenVtytBv: getNullableString(item.name),
        maHieu: getNullableString(item.maHieu),
        hangSx: getNullableString(item.hangSx),
        donViTinh: getNullableString(item.unit),
        quyCach,
        slTrongQuyCach,
        donGia: getNullableNumber(item.price),
        slXuat: getNullableNumber(item.xuatTrongKy),
        slNhap: getNullableNumber(item.nhapTrongKy),
        slTon: item.tonCuoiKy,
        nhaThau: getNullableString(item.nhaCungCap),
        duTru,
        goiHang: Math.ceil(duTru / slTrongQuyCach),
    };
};

const mapApprovalRecordToState = (record: ApiForecastApproval): {
    status: ApprovalStatus;
    lyDo?: string;
    duTruGoc?: number;
    duTruSua?: number;
    nguoiDuyet?: string;
    thoiGian?: Date;
} => ({
    status: record.status,
    lyDo: record.lyDo,
    duTruGoc: record.duTruGoc,
    duTruSua: record.duTruSua,
    nguoiDuyet: record.nguoiDuyet,
    thoiGian: record.thoiGianDuyet ? new Date(record.thoiGianDuyet) : undefined,
});

export default function MaterialForecast() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<IVatTuDuTru[]>([]);
    const filteredData = useMemo(() => {
        let filtered = data;

        if (selectedCategories.length > 0) {
            filtered = filtered.filter((item) => selectedCategories.includes(item.tenNhom || ''));
        }

        return filtered;
    }, [data, selectedCategories]);
    const [loadingSupplies, setLoadingSupplies] = useState(false);
    const { toast } = useToast();
    const { groups: categories } = useSupplyGroups();
    const [activeTab, setActiveTab] = useState('forecast');

    // Sử dụng OrderContext để chuyển dữ liệu sang trang gọi hàng
    const { addApprovedOrder, addApprovedOrdersBulk } = useOrder();

    // State cho dialog phê duyệt
    const [selectedItem, setSelectedItem] = useState<IVatTuDuTru | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editDuTru, setEditDuTru] = useState(0);
    const [lyDoTuChoi, setLyDoTuChoi] = useState('');
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
    const [approvalRecords, setApprovalRecords] = useState<ApiForecastApproval[]>([]);
    const [isApproveAllDialogOpen, setIsApproveAllDialogOpen] = useState(false);

    // State cho lịch sử thay đổi
    const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);

    // State cho dialog chi tiết lịch sử
    const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
    const [isHistoryDetailDialogOpen, setIsHistoryDetailDialogOpen] = useState(false);

    // State cho lịch sử dự trù theo tháng (ban đầu chỉ có mock data, chưa có tháng hiện tại)
    const [monthlyForecastHistory, setMonthlyForecastHistory] = useState<MonthlyForecastRecord[]>([
        ...MOCK_MONTHLY_FORECAST_HISTORY
    ]);

    const currentUser = useMemo(() => getStoredAuth()?.user.username || 'Người dùng hệ thống', []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const refreshApprovalRecords = async () => {
        const response = await apiService.getForecastApprovals(CURRENT_MONTH, CURRENT_YEAR);
        setApprovalRecords(response.data);
    };

    useEffect(() => {
        void refreshApprovalRecords().catch((fetchError) => {
            toast({
                title: 'Lỗi tải phê duyệt',
                description: fetchError instanceof Error ? fetchError.message : 'Không tải được trạng thái phê duyệt',
                variant: 'destructive',
            });
        });
    }, [toast]);

    useEffect(() => {
        const fetchSupplies = async () => {
            try {
                setLoadingSupplies(true);
                setError(null);

                const keyword = searchTerm.trim();
                const response = keyword
                    ? await apiService.searchSupplies(keyword, page, pageSize)
                    : await apiService.getSupplies(page, pageSize);

                const baseIndex = (response.page - 1) * response.pageSize;
                const forecastRows = response.data
                    .filter(shouldShowInForecast)
                    .map((item, index) => mapSupplyToForecastItem(item, baseIndex + index));

                setData(forecastRows);
                setTotal(response.total);
                setTotalPages(response.totalPages || 1);
            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : 'Không tải được dữ liệu vật tư';
                setError(message);
                setData([]);
                setTotal(0);
                setTotalPages(1);
            } finally {
                setLoadingSupplies(false);
            }
        };

        const timeoutId = setTimeout(fetchSupplies, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, page, pageSize]);

    useEffect(() => {
        if (!error) return;
        toast({
            title: 'Lỗi tải dữ liệu',
            description: error,
            variant: 'destructive',
        });
    }, [error, toast]);

    useEffect(() => {
        const nextApprovalStates: ApprovalState = {};
        const approvalRecordMap = new Map(approvalRecords.map((record) => [record.maVtytCu, record]));

        data.forEach((item) => {
            const savedRecord = approvalRecordMap.get(item.maVtytCu);
            if (!savedRecord) {
                return;
            }

            nextApprovalStates[item.stt] = mapApprovalRecordToState(savedRecord);
        });

        setApprovalStates(nextApprovalStates);
    }, [approvalRecords, data]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories((prev) => {
            if (prev.includes(category)) {
                return prev.filter((c) => c !== category);
            }
            return [...prev, category];
        });
    };

    const handleSelectAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
            return;
        }
        setSelectedCategories([...categories]);
    };

    const handleClearCategories = () => {
        setSelectedCategories([]);
    };

    const buildForecastApprovalPayload = (
        item: IVatTuDuTru,
        status: 'approved' | 'rejected' | 'edited',
        options?: {
            lyDo?: string;
            duTruGoc?: number;
            duTruSua?: number;
        }
    ): SaveForecastApprovalRequest => ({
        forecastMonth: CURRENT_MONTH,
        forecastYear: CURRENT_YEAR,
        maQuanLy: item.maQuanLy,
        maVtytCu: item.maVtytCu,
        tenVtytBv: item.tenVtytBv,
        status,
        lyDo: options?.lyDo,
        duTruGoc: options?.duTruGoc,
        duTruSua: options?.duTruSua,
    });

    // Hàm thêm entry vào lịch sử
    const addHistoryEntry = (entry: Omit<HistoryEntry, 'id'>) => {
        setHistoryLog(prev => [{
            ...entry,
            id: Date.now() + prev.length,
        }, ...prev]);
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
                    nguoiThucHien: currentUser,
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

    // Hàm cập nhật bản ghi tháng hiện tại
    const updateCurrentMonthRecord = (
        item: IVatTuDuTru,
        status: ApprovalStatus,
        nguoiDuyet: string,
        duTruValue?: number
    ) => {
        const now = new Date();
        const currentMonthId = `forecast-${CURRENT_YEAR}-${CURRENT_MONTH.toString().padStart(2, '0')}`;
        const finalDuTru = duTruValue ?? item.duTru;
        const goiHang = Math.ceil(finalDuTru / item.slTrongQuyCach);
        const thanhTien = goiHang * item.donGia * item.slTrongQuyCach;

        const newItem: MonthlyForecastItem = {
            stt: item.stt,
            maVtyt: item.maVtytCu,
            tenVtyt: item.tenVtytBv,
            quyCach: item.quyCach,
            donViTinh: item.donViTinh,
            duTru: finalDuTru,
            goiHang: goiHang,
            donGia: item.donGia,
            thanhTien: thanhTien,
            trangThai: status,
            nguoiDuyet: nguoiDuyet,
            ngayDuyet: now,
        };

        setMonthlyForecastHistory(prev => {
            // Kiểm tra xem bản ghi tháng hiện tại đã tồn tại chưa
            const existingRecordIndex = prev.findIndex(record => record.id === currentMonthId);

            if (existingRecordIndex === -1) {
                // Tạo bản ghi mới cho tháng hiện tại
                const newRecord: MonthlyForecastRecord = {
                    id: currentMonthId,
                    thang: CURRENT_MONTH,
                    nam: CURRENT_YEAR,
                    ngayTao: new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1),
                    ngayDuyet: now,
                    nguoiTao: currentUser,
                    nguoiDuyet: nguoiDuyet,
                    tongSoVatTu: 1,
                    tongGiaTri: thanhTien,
                    trangThai: status === 'rejected' ? 'rejected' : (status === 'approved' || status === 'edited' ? 'approved' : 'partial'),
                    danhSachVatTu: [newItem],
                };
                // Thêm vào đầu danh sách
                return [newRecord, ...prev];
            }

            // Cập nhật bản ghi đã có
            return prev.map(record => {
                if (record.id === currentMonthId) {
                    // Kiểm tra xem vật tư đã có trong danh sách chưa
                    const existingIndex = record.danhSachVatTu.findIndex(vt => vt.stt === item.stt);
                    let updatedList: MonthlyForecastItem[];

                    if (existingIndex >= 0) {
                        // Cập nhật vật tư đã có
                        updatedList = [...record.danhSachVatTu];
                        updatedList[existingIndex] = newItem;
                    } else {
                        // Thêm vật tư mới
                        updatedList = [...record.danhSachVatTu, newItem];
                    }

                    // Tính lại tổng
                    const tongGiaTri = updatedList.reduce((sum, vt) => sum + vt.thanhTien, 0);
                    const approvedOrEdited = updatedList.filter(vt => vt.trangThai === 'approved' || vt.trangThai === 'edited').length;
                    const rejected = updatedList.filter(vt => vt.trangThai === 'rejected').length;

                    // Xác định trạng thái tổng
                    let trangThai: 'approved' | 'partial' | 'rejected' = 'partial';
                    if (rejected === updatedList.length) {
                        trangThai = 'rejected';
                    } else if (approvedOrEdited === updatedList.length) {
                        trangThai = 'approved';
                    }

                    return {
                        ...record,
                        danhSachVatTu: updatedList,
                        tongSoVatTu: updatedList.length,
                        tongGiaTri: tongGiaTri,
                        nguoiDuyet: nguoiDuyet,
                        ngayDuyet: now,
                        trangThai: trangThai,
                    };
                }
                return record;
            });
        });
    };

    // Hàm cập nhật hàng loạt vào bản ghi tháng
    const updateCurrentMonthRecordBulk = (items: IVatTuDuTru[], nguoiDuyet: string) => {
        if (items.length === 0) return;

        const now = new Date();
        const currentMonthId = `forecast-${CURRENT_YEAR}-${CURRENT_MONTH.toString().padStart(2, '0')}`;

        const newItems: MonthlyForecastItem[] = items.map(item => ({
            stt: item.stt,
            maVtyt: item.maVtytCu,
            tenVtyt: item.tenVtytBv,
            quyCach: item.quyCach,
            donViTinh: item.donViTinh,
            duTru: item.duTru,
            goiHang: item.goiHang,
            donGia: item.donGia,
            thanhTien: item.goiHang * item.donGia * item.slTrongQuyCach,
            trangThai: 'approved' as ApprovalStatus,
            nguoiDuyet: nguoiDuyet,
            ngayDuyet: now,
        }));

        setMonthlyForecastHistory(prev => {
            // Kiểm tra xem bản ghi tháng hiện tại đã tồn tại chưa
            const existingRecordIndex = prev.findIndex(record => record.id === currentMonthId);

            if (existingRecordIndex === -1) {
                // Tạo bản ghi mới cho tháng hiện tại
                const tongGiaTri = newItems.reduce((sum, vt) => sum + vt.thanhTien, 0);
                const newRecord: MonthlyForecastRecord = {
                    id: currentMonthId,
                    thang: CURRENT_MONTH,
                    nam: CURRENT_YEAR,
                    ngayTao: new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1),
                    ngayDuyet: now,
                    nguoiTao: currentUser,
                    nguoiDuyet: nguoiDuyet,
                    tongSoVatTu: newItems.length,
                    tongGiaTri: tongGiaTri,
                    trangThai: 'approved',
                    danhSachVatTu: newItems,
                };
                // Thêm vào đầu danh sách
                return [newRecord, ...prev];
            }

            // Cập nhật bản ghi đã có
            return prev.map(record => {
                if (record.id === currentMonthId) {
                    // Merge danh sách - cập nhật hoặc thêm mới
                    const updatedList = [...record.danhSachVatTu];

                    newItems.forEach(newItem => {
                        const existingIndex = updatedList.findIndex(vt => vt.stt === newItem.stt);
                        if (existingIndex >= 0) {
                            updatedList[existingIndex] = newItem;
                        } else {
                            updatedList.push(newItem);
                        }
                    });

                    const tongGiaTri = updatedList.reduce((sum, vt) => sum + vt.thanhTien, 0);
                    const approvedOrEdited = updatedList.filter(vt => vt.trangThai === 'approved' || vt.trangThai === 'edited').length;

                    return {
                        ...record,
                        danhSachVatTu: updatedList,
                        tongSoVatTu: updatedList.length,
                        tongGiaTri: tongGiaTri,
                        nguoiDuyet: nguoiDuyet,
                        ngayDuyet: now,
                        trangThai: approvedOrEdited === updatedList.length ? 'approved' : 'partial',
                    };
                }
                return record;
            });
        });
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

    // Xuất Excel với thư viện xlsx
    const handleExport = () => {
        // Chuẩn bị dữ liệu cho Excel
        const excelData = filteredData.map((item) => ({
            'STT': item.stt,
            'Mã VT': item.maVtytCu,
            'Tên vật tư': item.tenVtytBv,
            'Mã hiệu': item.maHieu,
            'Hãng SX': item.hangSx,
            'Quy cách': `${item.quyCach} (${item.slTrongQuyCach} ${item.donViTinh})`,
            'Đơn giá': item.donGia,
            'SL Xuất': item.slXuat,
            'SL Nhập': item.slNhap,
            'SL Tồn': item.slTon,
            'Nhà thầu': item.nhaThau,
            'Dự trù': item.duTru,
            'Gọi hàng': item.goiHang,
        }));

        // Thêm dòng tổng cộng
        excelData.push({
            'STT': '' as any,
            'Mã VT': '',
            'Tên vật tư': '',
            'Mã hiệu': '',
            'Hãng SX': '',
            'Quy cách': '',
            'Đơn giá': '' as any,
            'SL Xuất': '' as any,
            'SL Nhập': '' as any,
            'SL Tồn': '' as any,
            'Nhà thầu': 'Tổng cộng:',
            'Dự trù': totalForecast,
            'Gọi hàng': totalOrder,
        });

        // Tạo workbook và worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Dự trù vật tư');

        // Điều chỉnh độ rộng cột
        const colWidths = [
            { wch: 3 },   // STT
            { wch: 8 },  // Mã VT
            { wch: 30 },  // Tên vật tư
            { wch: 12 },  // Mã hiệu
            { wch: 12 },  // Hãng SX
            { wch: 18 },  // Quy cách
            { wch: 10 },  // Đơn giá
            { wch: 8 },  // SL Xuất
            { wch: 8 },  // SL Nhập
            { wch: 8 },  // SL Tồn
            { wch: 15 },  // Nhà thầu
            { wch: 8 },  // Dự trù
            { wch: 8 },  // Gọi hàng
        ];
        ws['!cols'] = colWidths;

        // Xuất file
        const fileName = `bang_du_tru_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast({
            title: "Xuất file thành công",
            description: `File "${fileName}" đã được tải xuống`,
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
    const handleApprove = async () => {
        if (!selectedItem) return;

        const now = new Date();

        try {
            await apiService.saveForecastApproval(
                buildForecastApprovalPayload(selectedItem, 'approved')
            );
            await refreshApprovalRecords();
        } catch (error) {
            toast({
                title: "Phê duyệt thất bại",
                description: error instanceof Error ? error.message : 'Không thể lưu trạng thái phê duyệt',
                variant: "destructive",
            });
            return;
        }

        try {
            await addApprovedOrder(selectedItem);
        } catch (error) {
            toast({
                title: "Đã lưu phê duyệt",
                description: error instanceof Error ? `Tag đã được lưu nhưng chưa chuyển sang mục gọi hàng: ${error.message}` : 'Tag đã được lưu nhưng chưa chuyển sang mục gọi hàng',
                variant: "destructive",
            });
        }

        setApprovalStates(prev => ({
            ...prev,
            [selectedItem.stt]: {
                status: 'approved',
                nguoiDuyet: currentUser,
                thoiGian: now,
            }
        }));

        // Cập nhật vào bản ghi tháng hiện tại
        updateCurrentMonthRecord(selectedItem, 'approved', currentUser);

        // Ghi lịch sử
        addHistoryEntry({
            stt: selectedItem.stt,
            maVtyt: selectedItem.maVtytCu,
            tenVtyt: selectedItem.tenVtytBv,
            actionType: 'approve',
            nguoiThucHien: currentUser,
            thoiGian: now,
        });

        toast({
            title: "Phê duyệt thành công",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã được phê duyệt`,
        });

        setIsDialogOpen(false);
    };

    // Từ chối
    const handleReject = async () => {
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

        try {
            await apiService.saveForecastApproval(
                buildForecastApprovalPayload(selectedItem, 'rejected', {
                    lyDo: lyDoTuChoi,
                })
            );
            await refreshApprovalRecords();
        } catch (error) {
            toast({
                title: "Từ chối thất bại",
                description: error instanceof Error ? error.message : 'Không thể lưu trạng thái từ chối',
                variant: "destructive",
            });
            return;
        }

        setApprovalStates(prev => ({
            ...prev,
            [selectedItem.stt]: {
                status: 'rejected',
                lyDo: lyDoTuChoi,
                nguoiDuyet: currentUser,
                thoiGian: now,
            }
        }));

        // Cập nhật vào bản ghi tháng hiện tại
        updateCurrentMonthRecord(selectedItem, 'rejected', currentUser);

        // Ghi lịch sử
        addHistoryEntry({
            stt: selectedItem.stt,
            maVtyt: selectedItem.maVtytCu,
            tenVtyt: selectedItem.tenVtytBv,
            actionType: 'reject',
            nguoiThucHien: currentUser,
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
    const handleEditAndApprove = async () => {
        if (!selectedItem) return;

        const goiHang = Math.ceil(editDuTru / selectedItem.slTrongQuyCach);
        const now = new Date();

        try {
            await apiService.saveForecastApproval(
                buildForecastApprovalPayload(selectedItem, 'edited', {
                    duTruGoc: selectedItem.duTru,
                    duTruSua: editDuTru,
                })
            );
            await refreshApprovalRecords();
        } catch (error) {
            toast({
                title: "Sửa và duyệt thất bại",
                description: error instanceof Error ? error.message : 'Không thể lưu trạng thái phê duyệt',
                variant: "destructive",
            });
            return;
        }

        try {
            await addApprovedOrder(selectedItem, editDuTru);
        } catch (error) {
            toast({
                title: "Đã lưu trạng thái sửa và duyệt",
                description: error instanceof Error ? `Tag đã được lưu nhưng chưa chuyển sang mục gọi hàng: ${error.message}` : 'Tag đã được lưu nhưng chưa chuyển sang mục gọi hàng',
                variant: "destructive",
            });
        }

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
                nguoiDuyet: currentUser,
                thoiGian: now,
            }
        }));

        // Cập nhật vào bản ghi tháng hiện tại (với số lượng đã sửa)
        updateCurrentMonthRecord(selectedItem, 'edited', currentUser, editDuTru);

        // Ghi lịch sử
        addHistoryEntry({
            stt: selectedItem.stt,
            maVtyt: selectedItem.maVtytCu,
            tenVtyt: selectedItem.tenVtytBv,
            actionType: 'edit',
            nguoiThucHien: currentUser,
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
    const handleApproveAll = async () => {
        const newApprovalStates: ApprovalState = { ...approvalStates };
        const now = new Date();
        const pendingItems = filteredData.filter(item => !approvalStates[item.stt]);

        try {
            await apiService.saveForecastApprovalsBulk({
                items: pendingItems.map((item) => buildForecastApprovalPayload(item, 'approved')),
            });
            await refreshApprovalRecords();
        } catch (error) {
            toast({
                title: "Duyệt tất cả thất bại",
                description: error instanceof Error ? error.message : 'Không thể lưu trạng thái phê duyệt',
                variant: "destructive",
            });
            return;
        }

        try {
            await addApprovedOrdersBulk(pendingItems);
        } catch (error) {
            toast({
                title: "Đã lưu trạng thái duyệt",
                description: error instanceof Error ? `Tag đã được lưu nhưng chưa chuyển sang mục gọi hàng: ${error.message}` : 'Tag đã được lưu nhưng chưa chuyển sang mục gọi hàng',
                variant: "destructive",
            });
        }

        pendingItems.forEach(item => {
            newApprovalStates[item.stt] = {
                status: 'approved',
                nguoiDuyet: currentUser,
                thoiGian: now,
            };
        });

        setApprovalStates(newApprovalStates);
        setIsApproveAllDialogOpen(false);

        // Cập nhật hàng loạt vào bản ghi tháng hiện tại
        updateCurrentMonthRecordBulk(pendingItems, currentUser);

        // Ghi lịch sử duyệt tất cả
        addHistoryEntry({
            stt: 0, // Không liên quan đến item cụ thể
            maVtyt: '',
            tenVtyt: `Duyệt hàng loạt ${pendingItems.length} vật tư`,
            actionType: 'approve_all',
            nguoiThucHien: currentUser,
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
                    <TabsTrigger value="monthly-history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        Lịch sử theo tháng
                    </TabsTrigger>
                </TabsList>

                <ForecastTable
                    statistics={{
                        totalForecast,
                        totalOrder,
                        totalValue,
                        approvedCount,
                    }}
                    tableData={{
                        filteredData,
                        searchTerm,
                        isSearching: searchTerm.trim().length > 0,
                        categories,
                        selectedCategories,
                        categoryPopoverOpen,
                        page,
                        pageSize,
                        total,
                        totalPages,
                        error,
                        totalOnPage: data.length,
                        loading: loadingSupplies,
                        onSearchChange: handleSearchChange,
                        onCategoryPopoverOpenChange: setCategoryPopoverOpen,
                        onCategoryToggle: handleCategoryToggle,
                        onSelectAllCategories: handleSelectAllCategories,
                        onClearCategories: handleClearCategories,
                        onPageChange: setPage,
                        onPageSizeChange: (size: number) => {
                            setPageSize(size);
                            setPage(1);
                        },
                    }}
                    handlers={{
                        onRowClick: handleRowClick,
                        getStatusBadge,
                        onForecastChange: handleForecastChange,
                        onForecastFocus: handleForecastFocus,
                        onForecastBlur: handleForecastBlur,
                    }}
                />

                {/* Tab Lịch sử thay đổi */}
                <HistoryForecast
                    historyLog={historyLog}
                    getActionBadge={getActionBadge}
                    setSelectedHistoryEntry={setSelectedHistoryEntry}
                    setIsHistoryDetailDialogOpen={setIsHistoryDetailDialogOpen}
                />

                {/* Tab Lịch sử dự trù theo tháng */}
                <MonthlyForecastHistory data={monthlyForecastHistory} />
            </Tabs>

            {/* Dialog phê duyệt */}
            <ApproveDialog
                dialog={{
                    open: isDialogOpen,
                    onOpenChange: setIsDialogOpen,
                    selectedItem,
                    approvalStates,
                    getStatusBadge,
                }}
                editMode={{
                    isActive: isEditMode,
                    setActive: setIsEditMode,
                    editValue: editDuTru,
                    setEditValue: setEditDuTru,
                }}
                rejectMode={{
                    isActive: isRejectMode,
                    setActive: setIsRejectMode,
                    reason: lyDoTuChoi,
                    setReason: setLyDoTuChoi,
                }}
                actions={{
                    onApprove: handleApprove,
                    onReject: handleReject,
                    onEditAndApprove: handleEditAndApprove,
                }}
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
