import { useState, useEffect, useMemo } from 'react';
import { FileUp, Save, Calculator, CheckCircle2, XCircle, FilePen, CheckCheck, History, Calendar } from 'lucide-react';
import { IVatTuDuTru } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApproveDialog from '@/components/forecast/dialog/ApproveDialog';
import ApproveAllDialog from '@/components/forecast/dialog/ApproveAllDialog';
import RejectReasonDetailDialog from '@/components/forecast/dialog/RejectReasonDetailDialog';
import { ApprovalState, HistoryEntry, HistoryActionType, MonthlyForecastRecord } from '@/data/forecast/type';
import ForecastTable from '@/components/forecast/tabs/ForecastTable';
import HistoryForecast from '@/components/forecast/tabs/HistoryForecast';
import MonthlyForecastHistory from '@/components/forecast/tabs/MonthlyForecastHistory';
import { useOrder } from '@/context/OrderContext';
import { apiService, ApiForecastApproval, ApiForecastChangeHistoryRecord, ApiSupply, getNullableNumber, getNullableString, getStoredAuth, SaveForecastApprovalRequest } from '@/services/api';
import { useSupplyGroups } from '@/hooks/use-supplies';
import { canApproveAllForecast, canApproveForecast as canApproveForecastRole, canEditForecast } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Trạng thái phê duyệt cho mỗi vật tư
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

// Lấy tháng và năm hiện tại
const CURRENT_DATE = new Date();
const CURRENT_MONTH = CURRENT_DATE.getMonth() + 1; // 1-12
const CURRENT_YEAR = CURRENT_DATE.getFullYear();

type MaterialForecastUiCache = {
    searchTerm: string;
    selectedCategories: string[];
    selectedSuppliers: string[];
    selectedTypeLevel1: string[];
    selectedTypeLevel2: string[];
    page: number;
    pageSize: number;
    activeTab: string;
    selectedRowKeys: string[];
    forecastOverrides: Record<string, number>;
};

const materialForecastUiCache: MaterialForecastUiCache = {
    searchTerm: '',
    selectedCategories: [],
    selectedSuppliers: [],
    selectedTypeLevel1: [],
    selectedTypeLevel2: [],
    page: 1,
    pageSize: 100,
    activeTab: 'forecast',
    selectedRowKeys: [],
    forecastOverrides: {},
};

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

const extractPackQuantity = (quyCach: string): number => {
    const matched = quyCach.match(/\d+/);
    if (!matched) return 1;
    const parsed = parseInt(matched[0], 10);
    return Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed;
};

const getTypeLevel1 = (typeName?: string): string => {
    if (!typeName) return '';
    const parts = typeName
        .split('-')
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length >= 1 ? parts[0] : '';
};

const getTypeLevel2 = (typeName?: string): string => {
    if (!typeName) return '';
    const parts = typeName
        .split('-')
        .map((part) => part.trim())
        .filter(Boolean);
    return parts.length >= 2 ? parts[1] : '';
};

const shouldShowInForecast = (item: ApiSupply): boolean => {
    const tonDauKy = getNullableNumber(item.tonDauKy);
    const nhapTrongKy = getNullableNumber(item.nhapTrongKy);
    const xuatTrongKy = getNullableNumber(item.xuatTrongKy);
    const tongNhap = getNullableNumber(item.tongNhap);

    return !(tonDauKy === 0 && nhapTrongKy === 0 && xuatTrongKy === 0 && tongNhap === 0);
};

const calculateOrderQuantity = (duTru: number): number => duTru;

const calculateEstimatedValue = (quantity: number, donGia: number): number => quantity * donGia;

const mapSupplyToForecastItem = (item: ApiSupply, index: number): IVatTuDuTru => {
    const quyCach = getNullableString(item.quyCach);
    const slTrongQuyCach = extractPackQuantity(quyCach);
    const slXuat = getNullableNumber(item.xuatTrongKy);
    const slTon = getNullableNumber(item.tonDauKy); // Dùng tồn đầu kỳ, không phải cuối kỳ
    const diff = slXuat - slTon;
    // Công thức: dự trù = SL_XUAT nếu (SL_XUAT - SL_TON) <= 0, ngược lại = SL_XUAT - SL_TON
    const duTru = diff <= 0 ? slXuat : diff;

    return {
        stt: index + 1,
        maQuanLy: getNullableString(item.id),
        maVtytCu: getNullableString(item.id),
        tenNhom: getNullableString(item.groupName),
        typeName: getNullableString(item.typeName),
        tenVtytBv: getNullableString(item.name),
        maHieu: getNullableString(item.maHieu),
        hangSx: getNullableString(item.hangSx),
        donViTinh: getNullableString(item.unit),
        quyCach,
        slTrongQuyCach,
        donGia: getNullableNumber(item.price),
        slXuat: getNullableNumber(item.xuatTrongKy), // SL xuất trong kỳ
        slNhap: getNullableNumber(item.nhapTrongKy), // SL nhập trong kỳ
        slTon: slTon, // SL tồn đầu kỳ
        nhaThau: getNullableString(item.nhaCungCap),
        duTru,
        goiHang: calculateOrderQuantity(duTru),
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

const getLatestForecastChangeValue = (record: ApiForecastChangeHistoryRecord): number | undefined => {
    if (typeof record.duTruSua === 'number') {
        return record.duTruSua;
    }
    if (typeof record.duTruGoc === 'number') {
        return record.duTruGoc;
    }
    return undefined;
};

const isHistoryActionType = (
    actionType: ApiForecastChangeHistoryRecord['actionType']
): actionType is HistoryActionType => actionType === 'approve' || actionType === 'reject' || actionType === 'edit';

const applyForecastHistoryValues = (rows: IVatTuDuTru[], records: ApiForecastChangeHistoryRecord[]): IVatTuDuTru[] => {
    const latestRecordMap = new Map<string, ApiForecastChangeHistoryRecord>();

    records.forEach((record) => {
        const materialKey = getMaterialKey({
            stt: 0,
            maQuanLy: record.maQuanLy,
            maVtytCu: record.maVtytCu,
        });
        const fallbackKey = (record.maVtytCu || '').trim();

        latestRecordMap.set(materialKey, record);
        if (fallbackKey && fallbackKey !== materialKey) {
            latestRecordMap.set(fallbackKey, record);
        }
    });

    return rows.map((row) => {
        const rowKey = getMaterialKey(row);
        const fallbackKey = (row.maVtytCu || '').trim();
        const latestRecord = latestRecordMap.get(rowKey) || (fallbackKey ? latestRecordMap.get(fallbackKey) : undefined);

        if (!latestRecord) {
            return row;
        }

        const latestDuTru = getLatestForecastChangeValue(latestRecord);
        const nextRow = {
            ...row,
            maQuanLy: latestRecord.maQuanLy?.trim() || row.maQuanLy,
            maVtytCu: latestRecord.maVtytCu?.trim() || row.maVtytCu,
            tenVtytBv: latestRecord.tenVtytBv?.trim() || row.tenVtytBv,
        };

        if (typeof latestDuTru !== 'number') {
            return nextRow;
        }

        return {
            ...nextRow,
            duTru: latestDuTru,
            goiHang: calculateOrderQuantity(latestDuTru),
        };
    });
};

const dedupeForecastRows = (rows: IVatTuDuTru[]): IVatTuDuTru[] => {
    const uniqueRows = new Map<string, IVatTuDuTru>();

    rows.forEach((row) => {
        const materialKey = getMaterialKey(row);
        const fallbackKey = [
            (row.tenVtytBv || '').trim().toLowerCase(),
            (row.maHieu || '').trim().toLowerCase(),
            (row.hangSx || '').trim().toLowerCase(),
        ].join('::');
        const dedupeKey = materialKey.startsWith('stt:') && fallbackKey !== '::::' ? fallbackKey : materialKey;

        if (!dedupeKey) {
            uniqueRows.set(`row-${row.stt}`, row);
            return;
        }

        const existing = uniqueRows.get(dedupeKey);
        if (!existing) {
            uniqueRows.set(dedupeKey, row);
            return;
        }

        uniqueRows.set(dedupeKey, {
            ...existing,
            ...row,
            stt: existing.stt,
            maQuanLy: existing.maQuanLy || row.maQuanLy,
            maVtytCu: existing.maVtytCu || row.maVtytCu,
            tenVtytBv: existing.tenVtytBv || row.tenVtytBv,
            maHieu: existing.maHieu || row.maHieu,
            hangSx: existing.hangSx || row.hangSx,
            donViTinh: existing.donViTinh || row.donViTinh,
            quyCach: existing.quyCach || row.quyCach,
            typeName: existing.typeName || row.typeName,
            tenNhom: existing.tenNhom || row.tenNhom,
            nhaThau: existing.nhaThau || row.nhaThau,
        });
    });

    return Array.from(uniqueRows.values()).map((row, index) => ({
        ...row,
        stt: index + 1,
    }));
};

const applyForecastOverrides = (rows: IVatTuDuTru[]): IVatTuDuTru[] => {
    return rows.map((row) => {
        const rowKey = getMaterialKey(row);
        const overrideDuTru = materialForecastUiCache.forecastOverrides[rowKey];

        if (typeof overrideDuTru !== 'number') {
            return row;
        }

        return {
            ...row,
            duTru: overrideDuTru,
            goiHang: calculateOrderQuantity(overrideDuTru),
        };
    });
};

export default function MaterialForecast() {
    const [searchTerm, setSearchTerm] = useState(materialForecastUiCache.searchTerm);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(materialForecastUiCache.selectedCategories);
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(materialForecastUiCache.selectedSuppliers);
    const [selectedTypeLevel1, setSelectedTypeLevel1] = useState<string[]>(materialForecastUiCache.selectedTypeLevel1);
    const [selectedTypeLevel2, setSelectedTypeLevel2] = useState<string[]>(materialForecastUiCache.selectedTypeLevel2);
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
    const [typeLevel1PopoverOpen, setTypeLevel1PopoverOpen] = useState(false);
    const [typeLevel2PopoverOpen, setTypeLevel2PopoverOpen] = useState(false);
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
    const [page, setPage] = useState(materialForecastUiCache.page);
    const [pageSize, setPageSize] = useState(materialForecastUiCache.pageSize);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<IVatTuDuTru[]>([]);
    const [approvalStates, setApprovalStates] = useState<ApprovalState>({});
    const suppliers = useMemo(
        () => [...new Set(data.map((item) => item.nhaThau).filter((supplier) => supplier && supplier.trim().length > 0))].sort((a, b) => a.localeCompare(b)),
        [data]
    );
    const typeLevel1Options = useMemo(
        () =>
            [...new Set(data.map((item) => getTypeLevel1(item.typeName)).filter(Boolean))].sort((a, b) =>
                a.localeCompare(b)
            ),
        [data]
    );
    const typeLevel2Options = useMemo(() => {
        if (selectedTypeLevel1.length === 0) return [];
        const base = data.filter((item) => selectedTypeLevel1.includes(getTypeLevel1(item.typeName)));
        return [...new Set(base.map((item) => getTypeLevel2(item.typeName)).filter(Boolean))].sort((a, b) =>
            a.localeCompare(b)
        );
    }, [data, selectedTypeLevel1]);
    const filteredData = useMemo(() => {
        let filtered = data;

        if (selectedCategories.length > 0) {
            filtered = filtered.filter((item) => selectedCategories.includes(item.tenNhom || ''));
        }

        if (selectedSuppliers.length > 0) {
            filtered = filtered.filter((item) => selectedSuppliers.includes(item.nhaThau || ''));
        }

        if (selectedTypeLevel1.length > 0) {
            filtered = filtered.filter((item) => selectedTypeLevel1.includes(getTypeLevel1(item.typeName)));
        }

        if (selectedTypeLevel1.length > 0 && selectedTypeLevel2.length > 0) {
            filtered = filtered.filter((item) => selectedTypeLevel2.includes(getTypeLevel2(item.typeName)));
        }

        // Đưa các dòng đã phê duyệt xuống cuối để dòng chưa phê duyệt nổi lên trên.
        return [...filtered].sort((a, b) => {
            const aStatus = approvalStates[getMaterialKey(a)]?.status;
            const bStatus = approvalStates[getMaterialKey(b)]?.status;

            const aRank = aStatus === 'approved' ? 1 : 0;
            const bRank = bStatus === 'approved' ? 1 : 0;

            if (aRank !== bRank) {
                return aRank - bRank;
            }

            return a.stt - b.stt;
        });
    }, [data, selectedCategories, selectedSuppliers, selectedTypeLevel1, selectedTypeLevel2, approvalStates]);

    useEffect(() => {
        if (selectedTypeLevel1.length === 0) return;
        const valid = selectedTypeLevel1.filter((code) => typeLevel1Options.includes(code));
        if (valid.length !== selectedTypeLevel1.length) {
            setSelectedTypeLevel1(valid);
        }
    }, [selectedTypeLevel1, typeLevel1Options]);

    useEffect(() => {
        if (selectedTypeLevel2.length === 0) return;
        const valid = selectedTypeLevel2.filter((code) => typeLevel2Options.includes(code));
        if (valid.length !== selectedTypeLevel2.length) {
            setSelectedTypeLevel2(valid);
        }
    }, [selectedTypeLevel2, typeLevel2Options]);

    useEffect(() => {
        if (selectedTypeLevel1.length === 0 && selectedTypeLevel2.length > 0) {
            setSelectedTypeLevel2([]);
        }
    }, [selectedTypeLevel1, selectedTypeLevel2]);

    useEffect(() => {
        if (selectedTypeLevel1.length === 0 && typeLevel2PopoverOpen) {
            setTypeLevel2PopoverOpen(false);
        }
    }, [selectedTypeLevel1, typeLevel2PopoverOpen]);
    const total = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paginatedFilteredData = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredData.slice(startIndex, startIndex + pageSize);
    }, [filteredData, page, pageSize]);
    const [loadingSupplies, setLoadingSupplies] = useState(true);
    const { toast } = useToast();
    const { groups: categories } = useSupplyGroups();
    const [activeTab, setActiveTab] = useState(materialForecastUiCache.activeTab);

    // Sử dụng OrderContext để chuyển dữ liệu sang trang gọi hàng
    const { addApprovedOrder, addApprovedOrdersBulk, realtimeEventVersion, lastRealtimeEvent } = useOrder();

    // State cho dialog phê duyệt
    const [selectedItem, setSelectedItem] = useState<IVatTuDuTru | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editDuTru, setEditDuTru] = useState(0);
    const [lyDoTuChoi, setLyDoTuChoi] = useState('');
    const [isRejectMode, setIsRejectMode] = useState(false);
    const [approvalRecords, setApprovalRecords] = useState<ApiForecastApproval[]>([]);
    const [latestForecastChanges, setLatestForecastChanges] = useState<ApiForecastChangeHistoryRecord[]>([]);
    const [isApproveAllDialogOpen, setIsApproveAllDialogOpen] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(materialForecastUiCache.selectedRowKeys);

    // State cho lịch sử thay đổi
    const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);

    // Lưu các chỉnh sửa dự trù chưa bấm "Lưu dự trù"
    const [pendingForecastEdits, setPendingForecastEdits] = useState<Record<string, { originalDuTru: number; updatedDuTru: number }>>({});

    // State cho dialog chi tiết lịch sử
    const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
    const [isHistoryDetailDialogOpen, setIsHistoryDetailDialogOpen] = useState(false);

    // State cho lịch sử dự trù theo tháng
    const [monthlyForecastHistory, setMonthlyForecastHistory] = useState<MonthlyForecastRecord[]>([]);

    const storedAuth = useMemo(() => getStoredAuth(), []);
    const currentUser = storedAuth?.user.username || 'Người dùng hệ thống';
    const currentRole = storedAuth?.user.role ?? '';
    const canEditForecastValues = canEditForecast(currentRole);
    const canApproveForecastItems = canApproveForecastRole(currentRole);
    const canApproveAllForecastItems = canApproveAllForecast(currentRole);
    const editForecastRoleTooltip = 'Chỉ Admin hoặc Nhân viên thầu mới được thực hiện thao tác này.';
    const approveAllRoleTooltip = 'Chỉ Admin hoặc Thủ kho mới được thực hiện thao tác này.';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        materialForecastUiCache.searchTerm = searchTerm;
        materialForecastUiCache.selectedCategories = selectedCategories;
        materialForecastUiCache.selectedSuppliers = selectedSuppliers;
        materialForecastUiCache.selectedTypeLevel1 = selectedTypeLevel1;
        materialForecastUiCache.selectedTypeLevel2 = selectedTypeLevel2;
        materialForecastUiCache.page = page;
        materialForecastUiCache.pageSize = pageSize;
        materialForecastUiCache.activeTab = activeTab;
        materialForecastUiCache.selectedRowKeys = selectedRowKeys;
    }, [searchTerm, selectedCategories, selectedSuppliers, selectedTypeLevel1, selectedTypeLevel2, page, pageSize, activeTab, selectedRowKeys]);

    const refreshApprovalRecords = async () => {
        const response = await apiService.getForecastApprovals(CURRENT_MONTH, CURRENT_YEAR);
        setApprovalRecords(response.data);
    };

    const refreshLatestForecastChanges = async () => {
        const response = await apiService.getLatestForecastChanges(CURRENT_MONTH, CURRENT_YEAR);
        setLatestForecastChanges(response.data);
    };

    const refreshHistoryTabs = async () => {
        const [historyResponse, monthlyResponse] = await Promise.all([
            apiService.getForecastChangeHistory(1000),
            apiService.getForecastMonthlyHistory(),
        ]);

        setHistoryLog(
            historyResponse.data
                .filter((entry): entry is ApiForecastChangeHistoryRecord & { actionType: HistoryActionType } =>
                    isHistoryActionType(entry.actionType)
                )
                .map((entry) => ({
                    id: entry.id,
                    stt: entry.id,
                    maVtyt: entry.maVtytCu,
                    tenVtyt: entry.tenVtytBv,
                    actionType: entry.actionType,
                    nguoiThucHien: entry.nguoiThucHien || 'Hệ thống',
                    thoiGian: new Date(entry.thoiGianThucHien),
                    chiTiet: {
                        lyDo: entry.lyDo,
                        duTruGoc: entry.duTruGoc,
                        duTruMoi: entry.duTruSua,
                    },
                }))
                .sort((left, right) => right.thoiGian.getTime() - left.thoiGian.getTime())
        );

        setMonthlyForecastHistory(monthlyResponse.data.map((record) => ({
            id: record.id,
            thang: record.thang,
            nam: record.nam,
            ngayTao: new Date(record.ngayTao),
            ngayDuyet: new Date(record.ngayDuyet),
            nguoiTao: record.nguoiTao || 'Hệ thống',
            nguoiDuyet: record.nguoiDuyet || 'Hệ thống',
            tongSoVatTu: record.tongSoVatTu,
            tongGiaTri: record.tongGiaTri,
            trangThai: record.trangThai,
            danhSachVatTu: record.danhSachVatTu.map((item) => ({
                stt: item.stt,
                maVtyt: item.maVtyt,
                tenVtyt: item.tenVtyt,
                quyCach: item.quyCach,
                donViTinh: item.donViTinh,
                duTru: item.duTru,
                goiHang: item.goiHang,
                donGia: item.donGia,
                thanhTien: item.thanhTien,
                trangThai: item.trangThai,
                nguoiDuyet: item.nguoiDuyet,
                ngayDuyet: new Date(item.ngayDuyet),
            })),
        })));
    };

    useEffect(() => {
        void refreshApprovalRecords().catch((fetchError) => {
            toast({
                title: 'Lỗi tải phê duyệt',
                description: fetchError instanceof Error ? fetchError.message : 'Không tải được trạng thái phê duyệt',
                variant: 'destructive',
            });
        });

        void refreshLatestForecastChanges().catch((fetchError) => {
            toast({
                title: 'Lá»—i táº£i thay Ä‘á»•i dá»± trÃ¹',
                description: fetchError instanceof Error ? fetchError.message : 'KhÃ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u dá»± trÃ¹ Ä‘Ã£ sá»­a',
                variant: 'destructive',
            });
        });

        void refreshHistoryTabs().catch((fetchError) => {
            toast({
                title: 'Lỗi tải lịch sử',
                description: fetchError instanceof Error ? fetchError.message : 'Không tải được dữ liệu lịch sử thay đổi',
                variant: 'destructive',
            });
        });
    }, [toast]);

    useEffect(() => {
        if (!lastRealtimeEvent || lastRealtimeEvent.type !== 'forecast.approvals_updated') {
            return;
        }

        void Promise.all([
            refreshApprovalRecords(),
            refreshLatestForecastChanges(),
            refreshHistoryTabs(),
        ]).catch(() => undefined);
    }, [realtimeEventVersion]);

    useEffect(() => {
        if (page <= totalPages) return;
        setPage(totalPages);
    }, [page, totalPages]);

    useEffect(() => {
        let isDisposed = false;

        const fetchSupplies = async () => {
            try {
                setLoadingSupplies(true);
                setError(null);

                const keyword = searchTerm.trim();
                const apiPageSize = 1000;
                const firstResponse = keyword
                    ? await apiService.searchSupplies(keyword, 1, apiPageSize)
                    : await apiService.getSupplies(1, apiPageSize);

                let allSupplies = [...firstResponse.data];
                const apiTotalPages = firstResponse.totalPages || 1;

                if (apiTotalPages > 1) {
                    const pendingRequests: Promise<{ data: ApiSupply[] }>[] = [];
                    for (let current = 2; current <= apiTotalPages; current += 1) {
                        pendingRequests.push(
                            keyword
                                ? apiService.searchSupplies(keyword, current, apiPageSize)
                                : apiService.getSupplies(current, apiPageSize)
                        );
                    }

                    const remainingResponses = await Promise.all(pendingRequests);
                    remainingResponses.forEach((response) => {
                        allSupplies = allSupplies.concat(response.data);
                    });
                }

                const forecastRows = allSupplies
                    .filter(shouldShowInForecast)
                    .map((item, index) => mapSupplyToForecastItem(item, index));
                const forecastRowsWithPersistedEdits = applyForecastHistoryValues(forecastRows, latestForecastChanges);
                const forecastRowsWithOverrides = applyForecastOverrides(forecastRowsWithPersistedEdits);

                if (isDisposed) return;
                setData(dedupeForecastRows(forecastRowsWithOverrides));
            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : 'Không tải được dữ liệu vật tư';
                if (isDisposed) return;
                setError(message);
                setData([]);
            } finally {
                if (isDisposed) return;
                setLoadingSupplies(false);
            }
        };

        const timeoutId = setTimeout(fetchSupplies, 300);
        return () => {
            isDisposed = true;
            clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    useEffect(() => {
        if (latestForecastChanges.length === 0) return;
        setData((prevData) => {
            const withHistory = applyForecastHistoryValues(prevData, latestForecastChanges);
            const withOverrides = applyForecastOverrides(withHistory);
            return dedupeForecastRows(withOverrides);
        });
    }, [latestForecastChanges]);

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
        const approvalRecordMap = new Map<string, ApiForecastApproval>();

        approvalRecords.forEach((record) => {
            const materialKey = getMaterialKey({
                stt: record.id,
                maQuanLy: record.maQuanLy,
                maVtytCu: record.maVtytCu,
            });
            const fallbackKey = (record.maVtytCu || '').trim();

            approvalRecordMap.set(materialKey, record);
            if (fallbackKey && fallbackKey !== materialKey) {
                approvalRecordMap.set(fallbackKey, record);
            }
        });

        data.forEach((item) => {
            const savedRecord = approvalRecordMap.get(getMaterialKey(item)) || approvalRecordMap.get((item.maVtytCu || '').trim());
            if (!savedRecord) {
                return;
            }

            nextApprovalStates[getMaterialKey(item)] = mapApprovalRecordToState(savedRecord);
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
        setPage(1);
    };

    const handleSelectAllCategories = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
            setPage(1);
            return;
        }
        setSelectedCategories([...categories]);
        setPage(1);
    };

    const handleClearCategories = () => {
        setSelectedCategories([]);
        setPage(1);
    };

    const handleTypeLevel1Toggle = (code: string) => {
        setSelectedTypeLevel1((prev) => {
            if (prev.includes(code)) {
                return prev.filter((item) => item !== code);
            }
            return [...prev, code];
        });
        setPage(1);
    };

    const handleSelectAllTypeLevel1 = () => {
        if (selectedTypeLevel1.length === typeLevel1Options.length) {
            setSelectedTypeLevel1([]);
            setPage(1);
            return;
        }
        setSelectedTypeLevel1([...typeLevel1Options]);
        setPage(1);
    };

    const handleClearTypeLevel1 = () => {
        setSelectedTypeLevel1([]);
        setPage(1);
    };

    const handleTypeLevel2Toggle = (code: string) => {
        if (selectedTypeLevel1.length === 0) return;
        setSelectedTypeLevel2((prev) => {
            if (prev.includes(code)) {
                return prev.filter((item) => item !== code);
            }
            return [...prev, code];
        });
        setPage(1);
    };

    const handleSelectAllTypeLevel2 = () => {
        if (selectedTypeLevel1.length === 0) return;
        if (selectedTypeLevel2.length === typeLevel2Options.length) {
            setSelectedTypeLevel2([]);
            setPage(1);
            return;
        }
        setSelectedTypeLevel2([...typeLevel2Options]);
        setPage(1);
    };

    const handleClearTypeLevel2 = () => {
        setSelectedTypeLevel2([]);
        setPage(1);
    };

    const handleSupplierToggle = (supplier: string) => {
        setSelectedSuppliers((prev) => {
            if (prev.includes(supplier)) {
                return prev.filter((s) => s !== supplier);
            }
            return [...prev, supplier];
        });
        setPage(1);
    };

    const handleSelectAllSuppliers = () => {
        if (selectedSuppliers.length === suppliers.length) {
            setSelectedSuppliers([]);
            setPage(1);
            return;
        }
        setSelectedSuppliers([...suppliers]);
        setPage(1);
    };

    const handleClearSuppliers = () => {
        setSelectedSuppliers([]);
        setPage(1);
    };

    const getRowSelectionKey = (item: IVatTuDuTru) => getMaterialKey(item);

    const isRowSelectable = (item: IVatTuDuTru) => {
        if (!canApproveAllForecastItems) {
            return false;
        }
        const status = approvalStates[getMaterialKey(item)]?.status;
        return !status || status === 'edited';
    };

    const selectableItems = useMemo(
        () => filteredData.filter((item) => isRowSelectable(item)),
        [filteredData, approvalStates]
    );

    const selectedPendingItems = useMemo(() => {
        if (selectedRowKeys.length === 0) return [];
        const selectedKeySet = new Set(selectedRowKeys);
        return data.filter((item) => selectedKeySet.has(getRowSelectionKey(item)) && isRowSelectable(item));
    }, [data, selectedRowKeys, approvalStates]);

    const isRowSelected = (item: IVatTuDuTru) => selectedRowKeys.includes(getRowSelectionKey(item));

    const handleRowSelectToggle = (item: IVatTuDuTru, checked: boolean) => {
        if (!isRowSelectable(item)) return;

        const key = getRowSelectionKey(item);
        setSelectedRowKeys((prev) => {
            if (checked) {
                return prev.includes(key) ? prev : [...prev, key];
            }
            return prev.filter((rowKey) => rowKey !== key);
        });
    };

    const handleToggleSelectAllRows = (checked: boolean) => {
        if (!checked) {
            const visibleKeys = new Set(selectableItems.map((item) => getRowSelectionKey(item)));
            setSelectedRowKeys((prev) => prev.filter((key) => !visibleKeys.has(key)));
            return;
        }

        setSelectedRowKeys((prev) => {
            const merged = new Set(prev);
            selectableItems.forEach((item) => merged.add(getRowSelectionKey(item)));
            return Array.from(merged);
        });
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

    // Lưu giá trị gốc khi focus vào input
    const [originalDuTru, setOriginalDuTru] = useState<{ rowKey: string; value: number } | null>(null);

    const isForecastEditable = (item: IVatTuDuTru) => {
        return canEditForecastValues && approvalStates[getMaterialKey(item)]?.status !== 'approved';
    };

    // Xử lý thay đổi giá trị dự trù
    const handleForecastChange = (item: IVatTuDuTru, value: string) => {
        if (!isForecastEditable(item)) {
            return;
        }

        const numValue = parseInt(value) || 0;
        const rowKey = getMaterialKey(item);

        materialForecastUiCache.forecastOverrides[rowKey] = numValue;

        setData(prevData =>
            prevData.map(item => {
                if (getMaterialKey(item) === rowKey) {
                    const goiHang = calculateOrderQuantity(numValue);
                    return { ...item, duTru: numValue, goiHang };
                }
                return item;
            })
        );
    };

    // Lưu giá trị gốc khi focus
    const handleForecastFocus = (item: IVatTuDuTru, value: number) => {
        if (!isForecastEditable(item)) {
            return;
        }
        setOriginalDuTru({ rowKey: getMaterialKey(item), value });
    };

    // Ghi lịch sử khi blur (nếu có thay đổi)
    const handleForecastBlur = (item: IVatTuDuTru, newValue: number) => {
        if (!isForecastEditable(item)) {
            setOriginalDuTru(null);
            return;
        }

        const rowKey = getMaterialKey(item);

        if (originalDuTru && originalDuTru.rowKey === rowKey && originalDuTru.value !== newValue) {
            setPendingForecastEdits((prev) => ({
                ...prev,
                [rowKey]: {
                    originalDuTru: originalDuTru.value,
                    updatedDuTru: newValue,
                },
            }));
        } else {
            setPendingForecastEdits((prev) => {
                if (!prev[rowKey]) {
                    return prev;
                }

                const next = { ...prev };
                delete next[rowKey];
                return next;
            });
        }

        materialForecastUiCache.forecastOverrides[rowKey] = newValue;

        setData((prevData) =>
            prevData.map((dataItem) => {
                if (getMaterialKey(dataItem) !== rowKey) {
                    return dataItem;
                }

                const goiHang = calculateOrderQuantity(newValue);
                return { ...dataItem, duTru: newValue, goiHang };
            })
        );

        setOriginalDuTru(null);
    };

    // Tính toán tổng
    const totalForecast = filteredData.reduce((sum, item) => sum + item.duTru, 0);
    const totalOrder = filteredData.reduce((sum, item) => sum + item.goiHang, 0);
    const totalValue = filteredData.reduce((sum, item) => sum + calculateEstimatedValue(item.goiHang, item.donGia), 0);

    // Lưu dữ liệu
    const handleSave = async () => {
        if (!canEditForecastValues) {
            toast({
                title: 'Không có quyền lưu dự trù',
                description: 'Chỉ Admin hoặc Nhân viên thầu mới được chỉnh sửa và lưu dự trù.',
                variant: 'destructive',
            });
            return;
        }

        const pendingEntries = Object.entries(pendingForecastEdits);

        if (pendingEntries.length === 0) {
            toast({
                title: 'Không có thay đổi',
                description: 'Bạn chưa chỉnh sửa dự trù nào để lưu',
            });
            return;
        }

        const payloadItems: SaveForecastApprovalRequest[] = pendingEntries
            .map(([rowKey, edit]) => {
                const item = data.find((row) => getMaterialKey(row) === rowKey);
                if (!item || !isForecastEditable(item)) {
                    return null;
                }

                return buildForecastApprovalPayload(item, 'edited', {
                    duTruGoc: edit.originalDuTru,
                    duTruSua: edit.updatedDuTru,
                });
            })
            .filter((item): item is SaveForecastApprovalRequest => item !== null);

        if (payloadItems.length === 0) {
            toast({
                title: 'Không thể lưu',
                description: 'Không có chỉnh sửa hợp lệ để lưu',
                variant: 'destructive',
            });
            return;
        }

        try {
            await apiService.saveForecastApprovalsBulk({ items: payloadItems });
            await refreshApprovalRecords();
            await refreshLatestForecastChanges();
            await refreshHistoryTabs();

            setPendingForecastEdits((prev) => {
                const next = { ...prev };
                payloadItems.forEach((item) => {
                    const matchingRow = data.find((row) => getMaterialKey(row) === getMaterialKey({
                        stt: 0,
                        maQuanLy: item.maQuanLy,
                        maVtytCu: item.maVtytCu,
                    }));
                    if (!matchingRow) return;
                    delete next[getMaterialKey(matchingRow)];
                });
                return next;
            });

            toast({
                title: 'Lưu thành công',
                description: `Đã lưu ${payloadItems.length} chỉnh sửa dự trù`,
            });
        } catch (error) {
            toast({
                title: 'Lưu thất bại',
                description: error instanceof Error ? error.message : 'Không thể lưu dữ liệu dự trù',
                variant: 'destructive',
            });
        }
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
        if (!canApproveForecastItems) {
            toast({
                title: 'Không có quyền phê duyệt',
                description: 'Chỉ Admin hoặc Thủ kho mới được phê duyệt hoặc từ chối dự trù.',
                variant: 'destructive',
            });
            return;
        }

        const now = new Date();

        try {
            await apiService.saveForecastApproval(
                buildForecastApprovalPayload(selectedItem, 'approved')
            );
            await refreshApprovalRecords();
            await refreshHistoryTabs();
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
            [getMaterialKey(selectedItem)]: {
                status: 'approved',
                nguoiDuyet: currentUser,
                thoiGian: now,
            }
        }));

        // Lịch sử theo tháng chỉ dùng dữ liệu backend để tránh trùng bản ghi tạm thời.

        toast({
            title: "Phê duyệt thành công",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã được phê duyệt`,
        });

        setIsDialogOpen(false);
    };

    // Từ chối
    const handleReject = async () => {
        if (!selectedItem) return;
        if (!canApproveForecastItems) {
            toast({
                title: 'Không có quyền từ chối',
                description: 'Chỉ Admin hoặc Thủ kho mới được phê duyệt hoặc từ chối dự trù.',
                variant: 'destructive',
            });
            return;
        }

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
            await refreshHistoryTabs();
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
            [getMaterialKey(selectedItem)]: {
                status: 'rejected',
                lyDo: lyDoTuChoi,
                nguoiDuyet: currentUser,
                thoiGian: now,
            }
        }));

        // Lịch sử theo tháng chỉ dùng dữ liệu backend để tránh trùng bản ghi tạm thời.

        toast({
            title: "Đã từ chối",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã bị từ chối`,
            variant: "destructive",
        });

        setIsDialogOpen(false);
        setIsRejectMode(false);
        setLyDoTuChoi('');
    };

    // Sửa và lưu
    const handleEditAndSave = async () => {
        if (!selectedItem) return;
        if (!canEditForecastValues) {
            toast({
                title: 'Không có quyền sửa dự trù',
                description: 'Chỉ Admin hoặc Nhân viên thầu mới được sửa và lưu số lượng dự trù.',
                variant: 'destructive',
            });
            return;
        }

        const selectedItemKey = getMaterialKey(selectedItem);
        const goiHang = calculateOrderQuantity(editDuTru);

        if (selectedItem.duTru === editDuTru) {
            setIsDialogOpen(false);
            setIsEditMode(false);
            return;
        }

        try {
            await apiService.saveForecastApproval(
                buildForecastApprovalPayload(selectedItem, 'edited', {
                    duTruGoc: selectedItem.duTru,
                    duTruSua: editDuTru,
                })
            );
            await refreshApprovalRecords();
            await refreshLatestForecastChanges();
            await refreshHistoryTabs();
        } catch (error) {
            toast({
                title: 'Lưu chỉnh sửa thất bại',
                description: error instanceof Error ? error.message : 'Không thể lưu chỉnh sửa dự trù',
                variant: 'destructive',
            });
            return;
        }

        setData(prevData =>
            prevData.map(item => {
                if (getMaterialKey(item) === selectedItemKey) {
                    return { ...item, duTru: editDuTru, goiHang };
                }
                return item;
            })
        );

        materialForecastUiCache.forecastOverrides[selectedItemKey] = editDuTru;
        setPendingForecastEdits((prev) => {
            const next = { ...prev };
            delete next[selectedItemKey];
            return next;
        });
        setSelectedItem({ ...selectedItem, duTru: editDuTru, goiHang });

        toast({
            title: "Đã lưu thay đổi",
            description: `Vật tư "${selectedItem.tenVtytBv}" đã được cập nhật dự trù`,
        });

        setIsDialogOpen(false);
        setIsEditMode(false);
    };

    // Lấy badge trạng thái
    const getStatusBadge = (item: IVatTuDuTru) => {
        const state = approvalStates[getMaterialKey(item)];
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
    const pendingCount = filteredData.filter((item) => {
        const status = approvalStates[getMaterialKey(item)]?.status;
        return !status || status === 'edited';
    }).length;
    const selectedPendingCount = selectedPendingItems.length;
    const selectedPendingVisibleCount = selectableItems.filter((item) => selectedRowKeys.includes(getRowSelectionKey(item))).length;
    const allSelectableRowsSelected = selectableItems.length > 0 && selectedPendingVisibleCount === selectableItems.length;
    const someSelectableRowsSelected = selectedPendingVisibleCount > 0 && selectedPendingVisibleCount < selectableItems.length;
    const approvedCount = filteredData.filter((item) => {
        const status = approvalStates[getMaterialKey(item)]?.status;
        return status === 'approved';
    }).length;

    // Duyệt tất cả
    const handleApproveAll = async () => {
        if (!canApproveAllForecastItems) {
            toast({
                title: 'Không có quyền duyệt tất cả',
                description: 'Chỉ Admin hoặc Thủ kho mới được bấm nút Duyệt tất cả.',
                variant: 'destructive',
            });
            return;
        }

        const newApprovalStates: ApprovalState = { ...approvalStates };
        const now = new Date();
        const pendingItems = selectedPendingItems;

        if (pendingItems.length === 0) {
            toast({
                title: "Chưa chọn vật tư",
                description: "Vui lòng tick chọn ít nhất 1 vật tư để duyệt.",
                variant: "destructive",
            });
            return;
        }

        try {
            await apiService.saveForecastApprovalsBulk({
                items: pendingItems.map((item) => buildForecastApprovalPayload(item, 'approved')),
            });
            await refreshApprovalRecords();
            await refreshHistoryTabs();
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
            newApprovalStates[getMaterialKey(item)] = {
                status: 'approved',
                nguoiDuyet: currentUser,
                thoiGian: now,
            };
        });

        setApprovalStates(newApprovalStates);
        setSelectedRowKeys([]);
        setIsApproveAllDialogOpen(false);

        // Lịch sử theo tháng chỉ dùng dữ liệu backend để tránh trùng bản ghi tạm thời.

        toast({
            title: "Duyệt tất cả thành công",
            description: `Đã phê duyệt ${pendingItems.length} vật tư đã chọn`,
        });
    };

    // Tính tổng giá trị của các vật tư đã chọn để duyệt
    const pendingTotalValue = selectedPendingItems
        .reduce((sum, item) => sum + calculateEstimatedValue(item.goiHang, item.donGia), 0);

    // Lấy badge cho loại hành động trong lịch sử
    const getActionBadge = (actionType: HistoryActionType) => {
        const baseClass = "text-[10px] whitespace-nowrap";
        switch (actionType) {
            case 'approve':
                return <Badge className={`bg-green-100 text-green-700 border-green-300 ${baseClass}`}><CheckCircle2 className="w-3 h-3 mr-1" />Phê duyệt</Badge>;
            case 'reject':
                return <Badge className={`bg-red-100 text-red-700 border-red-300 ${baseClass}`}><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>;
            case 'edit':
                return <Badge className={`bg-orange-100 text-orange-700 border-orange-300 ${baseClass}`}><FilePen className="w-3 h-3 mr-1" />Sửa</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-tertiary/95 backdrop-blur supports-[backdrop-filter]:bg-tertiary/80 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                    <span className="inline-flex" title={!canEditForecastValues ? editForecastRoleTooltip : undefined}>
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-normal"
                            onClick={handleSave}
                            disabled={!canEditForecastValues}
                        >
                            <Save className="w-4 h-4 mr-2" strokeWidth={2} />
                            Lưu dự trù
                        </Button>
                    </span>
                    <span
                        className="inline-flex"
                        title={
                            !canApproveAllForecastItems
                                ? approveAllRoleTooltip
                                : selectedPendingCount === 0
                                    ? 'Vui lòng chọn ít nhất một vật tư đang chờ duyệt.'
                                    : undefined
                        }
                    >
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white font-normal"
                            onClick={() => setIsApproveAllDialogOpen(true)}
                            disabled={!canApproveAllForecastItems || selectedPendingCount === 0}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" strokeWidth={2} />
                            Duyệt tất cả ({selectedPendingCount})
                        </Button>
                    </span>
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
                        Lịch sử duyệt theo tháng
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
                        filteredData: paginatedFilteredData,
                        searchTerm,
                        isSearching: searchTerm.trim().length > 0,
                        categories,
                        selectedCategories,
                        typeLevel1Options,
                        typeLevel2Options,
                        selectedTypeLevel1,
                        selectedTypeLevel2,
                        typeLevel1PopoverOpen,
                        typeLevel2PopoverOpen,
                        suppliers,
                        selectedSuppliers,
                        categoryPopoverOpen,
                        supplierPopoverOpen,
                        page,
                        pageSize,
                        total,
                        totalPages,
                        error,
                        totalOnPage: total,
                        loading: loadingSupplies,
                        onSearchChange: handleSearchChange,
                        onCategoryPopoverOpenChange: setCategoryPopoverOpen,
                        onCategoryToggle: handleCategoryToggle,
                        onSelectAllCategories: handleSelectAllCategories,
                        onClearCategories: handleClearCategories,
                        onTypeLevel1PopoverOpenChange: setTypeLevel1PopoverOpen,
                        onTypeLevel1Toggle: handleTypeLevel1Toggle,
                        onSelectAllTypeLevel1: handleSelectAllTypeLevel1,
                        onClearTypeLevel1: handleClearTypeLevel1,
                        onTypeLevel2PopoverOpenChange: setTypeLevel2PopoverOpen,
                        onTypeLevel2Toggle: handleTypeLevel2Toggle,
                        onSelectAllTypeLevel2: handleSelectAllTypeLevel2,
                        onClearTypeLevel2: handleClearTypeLevel2,
                        onSupplierPopoverOpenChange: setSupplierPopoverOpen,
                        onSupplierToggle: handleSupplierToggle,
                        onSelectAllSuppliers: handleSelectAllSuppliers,
                        onClearSuppliers: handleClearSuppliers,
                        onPageChange: setPage,
                        onPageSizeChange: (size: number) => {
                            setPageSize(size);
                            setPage(1);
                        },
                    }}
                    handlers={{
                        onRowClick: handleRowClick,
                        getStatusBadge,
                        isForecastEditable,
                        canEditForecastRole: canEditForecastValues,
                        onForecastChange: handleForecastChange,
                        onForecastFocus: handleForecastFocus,
                        onForecastBlur: handleForecastBlur,
                        isRowSelected,
                        isRowSelectable,
                        canSelectRowsRole: canApproveAllForecastItems,
                        onRowSelectToggle: handleRowSelectToggle,
                        allSelectableRowsSelected,
                        someSelectableRowsSelected,
                        onToggleSelectAllRows: handleToggleSelectAllRows,
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
                    onEditAndSave: handleEditAndSave,
                }}
                permissions={{
                    canApproveReject: canApproveForecastItems,
                    canEditForecast: canEditForecastValues,
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
