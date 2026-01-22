export type HistoryActionType = 'approve' | 'reject' | 'edit' | 'edit_quantity' | 'approve_all';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface HistoryEntry {
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

export interface ApprovalState {
    [stt: number]: {
        status: ApprovalStatus;
        lyDo?: string;
        duTruGoc?: number;
        duTruSua?: number;
        nguoiDuyet?: string;
        thoiGian?: Date;
    };
}

// Lịch sử dự trù đã duyệt theo tháng
export interface MonthlyForecastItem {
    stt: number;
    maVtyt: string;
    tenVtyt: string;
    quyCach: string;
    donViTinh: string;
    duTru: number;
    goiHang: number;
    donGia: number;
    thanhTien: number;
    trangThai: ApprovalStatus;
    nguoiDuyet: string;
    ngayDuyet: Date;
}

export interface MonthlyForecastRecord {
    id: string;
    thang: number;
    nam: number;
    ngayTao: Date;
    ngayDuyet: Date;
    nguoiTao: string;
    nguoiDuyet: string;
    tongSoVatTu: number;
    tongGiaTri: number;
    trangThai: 'approved' | 'partial' | 'rejected';
    danhSachVatTu: MonthlyForecastItem[];
}