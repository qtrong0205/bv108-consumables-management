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