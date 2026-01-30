export interface MedicalSupply {
    id: number;                // MA_QUAN_LY
    maVtyt: string;            // MA_VTYT_C
    tenVtyt: string;           // TEN_VTYT_B
    tenThuongMai: string;      // TEN_THUON
    maHieu: string;            // MA_HIEU
    maNhom: string;            // MA_NHOM
    tenNhom: string;           // TEN_NHOM
    quyCach: string;           // QUY_CACH
    nuocSanXuat: string;       // NUOC_SX
    hangSanXuat: string;       // HANG_SX
    donViTinh: string;         // DON_VI_TINH
    donGia: number;            // DON_GIA
    soLuongKeHoach: number;    // D_LUONG_KH
    nhaThau: string;           // NHA_THAU
    quyetDinh: string;         // QUYET_DINH
    soLuongTon: number;        // Số lượng tồn kho hiện tại
    soLuongToiThieu: number;   // Số lượng tối thiểu (ngưỡng cảnh báo)
    soLuongTieuHao: number;    // Số lượng đã tiêu hao trong tháng
}

export interface OrderRequest {
    id: number;                // STT
    nhaThau: string;           // NHA_THAU
    maQuanLy: string;          // MA_QUAN_LY
    maVtytCu: string;          // MA_VTYT_CU
    tenVtytBv: string;         // TEN_VTYT_BV
    maHieu: string;            // MA_HIEU
    hangSx: string;            // HANG_SX
    donViTinh: string;         // DON_VI_TINH
    quyCach: string;           // QUY_CACH
    dotGoiHang: number;        // Đợt gọi hàng
    email?: string;            // Email của nhà thầu
}

export interface OrderHistory extends OrderRequest {
    ngayDatHang: Date;         // Ngày đặt hàng
    trangThai: string;         // Trạng thái đơn hàng
    emailSent?: boolean;       // Đã gửi email chưa
}

// Hóa đơn từ uBot
export interface Invoice {
    id: string;
    maHoaDon: string;          // Mã hóa đơn
    maQuanLy: string;          // Mã quản lý (để map với đơn hàng)
    soLuong: number;           // Số lượng trên hóa đơn
    ngayTaoHoaDon: Date;
    trangThaiHoaDon: string;   // Đã nhận / Đang xử lý
    ghiChu?: string;
}
