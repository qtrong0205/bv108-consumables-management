import { MedicalSupply, OrderRequest, OrderHistory } from '@/types';

export const MOCK_MEDICAL_SUPPLIES: MedicalSupply[] = [
    {
        id: 1,
        maVtyt: "D05161",
        tenVtyt: "Miếng cầm máu",
        tenThuongMai: "Miếng cầm máu",
        maHieu: "UP801520B",
        maNhom: "N02.04.040",
        tenNhom: "Vật tư cầm máu",
        quyCach: "20 miếng/hộp",
        nuocSanXuat: "Thổ Nhĩ Kỳ",
        hangSanXuat: "GENCO",
        donViTinh: "Miếng",
        donGia: 94500,
        soLuongKeHoach: 100,
        nhaThau: "CÔNG TY TNHH Y TẾ ABC",
        quyetDinh: "8890/QĐ-BV;G1;N1;2024",
        soLuongTon: 85,
        soLuongToiThieu: 20,
        soLuongTieuHao: 45
    },
    {
        id: 2,
        maVtyt: "D05341",
        tenVtyt: "Mũi cắt xương",
        tenThuongMai: "Mũi cắt xương Carbide",
        maHieu: "Carbide burs M1",
        maNhom: "N08.00.000",
        tenNhom: "Vật tư tiêu hao",
        quyCach: "Vỉ/10 mũi",
        nuocSanXuat: "Nhật Bản",
        hangSanXuat: "Mani",
        donViTinh: "Mũi",
        donGia: 105000,
        soLuongKeHoach: 50,
        nhaThau: "CÔNG TY CP THIẾT BỊ Y TẾ XYZ",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 12,
        soLuongToiThieu: 15,
        soLuongTieuHao: 38
    },
    {
        id: 3,
        maVtyt: "D04432",
        tenVtyt: "Phin lọc khuẩn",
        tenThuongMai: "Phin lọc vi khuẩn",
        maHieu: "GM-001-010",
        maNhom: "N08.00.350",
        tenNhom: "Vật tư tiêu hao",
        quyCach: "100 cái/thùng",
        nuocSanXuat: "Trung Quốc",
        hangSanXuat: "Bain Medical",
        donViTinh: "Cái",
        donGia: 12880,
        soLuongKeHoach: 500,
        nhaThau: "CÔNG TY TNHH THIẾT BỊ Y TẾ DEF",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 320,
        soLuongToiThieu: 100,
        soLuongTieuHao: 180
    },
    {
        id: 4,
        maVtyt: "D06531",
        tenVtyt: "Sond tiểu nam",
        tenThuongMai: "Ống thông tiểu nam",
        maHieu: "1 way",
        maNhom: "N04.04.010",
        tenNhom: "Ống thông tiểu",
        quyCach: "10 cái/hộp",
        nuocSanXuat: "Trung Quốc",
        hangSanXuat: "Guangdong Ec",
        donViTinh: "Cái",
        donGia: 5345,
        soLuongKeHoach: 200,
        nhaThau: "CÔNG TY CP Y TẾ GHI",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 8,
        soLuongToiThieu: 30,
        soLuongTieuHao: 92
    },
    {
        id: 5,
        maVtyt: "D07123",
        tenVtyt: "Găng tay phẫu thuật",
        tenThuongMai: "Găng tay phẫu thuật vô trùng",
        maHieu: "Surgical Gloves Size 7",
        maNhom: "N01.01.010",
        tenNhom: "Găng tay y tế",
        quyCach: "50 đôi/hộp",
        nuocSanXuat: "Malaysia",
        hangSanXuat: "Top Glove",
        donViTinh: "Đôi",
        donGia: 8500,
        soLuongKeHoach: 1000,
        nhaThau: "CÔNG TY TNHH Y TẾ ABC",
        quyetDinh: "8890/QĐ-BV;G1;N1;2024",
        soLuongTon: 650,
        soLuongToiThieu: 200,
        soLuongTieuHao: 350
    },
    {
        id: 6,
        maVtyt: "D08234",
        tenVtyt: "Ống tiêm 5ml",
        tenThuongMai: "Ống tiêm nhựa 5ml",
        maHieu: "Syringe 5ml",
        maNhom: "N08.00.000",
        tenNhom: "Vật tư tiêu hao",
        quyCach: "100 cái/hộp",
        nuocSanXuat: "Việt Nam",
        hangSanXuat: "Vinahankook",
        donViTinh: "Cái",
        donGia: 1200,
        soLuongKeHoach: 2000,
        nhaThau: "CÔNG TY CP THIẾT BỊ Y TẾ XYZ",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 1500,
        soLuongToiThieu: 500,
        soLuongTieuHao: 500
    },
    {
        id: 7,
        maVtyt: "D09345",
        tenVtyt: "Gạc y tế vô trùng",
        tenThuongMai: "Gạc vô trùng 10x10cm",
        maHieu: "Gauze 10x10",
        maNhom: "N02.01.010",
        tenNhom: "Vật tư băng gạc",
        quyCach: "100 miếng/gói",
        nuocSanXuat: "Việt Nam",
        hangSanXuat: "Bông Bạch Tuyết",
        donViTinh: "Miếng",
        donGia: 500,
        soLuongKeHoach: 3000,
        nhaThau: "CÔNG TY TNHH THIẾT BỊ Y TẾ DEF",
        quyetDinh: "8890/QĐ-BV;G1;N1;2024",
        soLuongTon: 2200,
        soLuongToiThieu: 500,
        soLuongTieuHao: 800
    },
    {
        id: 8,
        maVtyt: "D10456",
        tenVtyt: "Catheter tĩnh mạch",
        tenThuongMai: "Catheter tĩnh mạch ngoại vi",
        maHieu: "IV Catheter 20G",
        maNhom: "N04.01.010",
        tenNhom: "Catheter",
        quyCach: "50 cái/hộp",
        nuocSanXuat: "Đức",
        hangSanXuat: "B.Braun",
        donViTinh: "Cái",
        donGia: 15000,
        soLuongKeHoach: 500,
        nhaThau: "CÔNG TY CP Y TẾ GHI",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 280,
        soLuongToiThieu: 100,
        soLuongTieuHao: 220
    },
    {
        id: 9,
        maVtyt: "D11567",
        tenVtyt: "Bông cồn sát trùng",
        tenThuongMai: "Bông tẩm cồn 70%",
        maHieu: "Alcohol Pad",
        maNhom: "N02.02.010",
        tenNhom: "Vật tư sát trùng",
        quyCach: "200 miếng/hộp",
        nuocSanXuat: "Việt Nam",
        hangSanXuat: "Bông Bạch Tuyết",
        donViTinh: "Miếng",
        donGia: 300,
        soLuongKeHoach: 5000,
        nhaThau: "CÔNG TY TNHH Y TẾ ABC",
        quyetDinh: "8890/QĐ-BV;G1;N1;2024",
        soLuongTon: 3800,
        soLuongToiThieu: 1000,
        soLuongTieuHao: 1200
    },
    {
        id: 10,
        maVtyt: "D12678",
        tenVtyt: "Kim tiêm 23G",
        tenThuongMai: "Kim tiêm nhọn 23G",
        maHieu: "Needle 23G x 1",
        maNhom: "N08.00.000",
        tenNhom: "Vật tư tiêu hao",
        quyCach: "100 cái/hộp",
        nuocSanXuat: "Nhật Bản",
        hangSanXuat: "Terumo",
        donViTinh: "Cái",
        donGia: 800,
        soLuongKeHoach: 3000,
        nhaThau: "CÔNG TY CP THIẾT BỊ Y TẾ XYZ",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 18,
        soLuongToiThieu: 500,
        soLuongTieuHao: 982
    },
    {
        id: 11,
        maVtyt: "D13789",
        tenVtyt: "Dây truyền dịch",
        tenThuongMai: "Bộ dây truyền dịch",
        maHieu: "IV Set Standard",
        maNhom: "N04.02.010",
        tenNhom: "Dây truyền",
        quyCach: "50 bộ/thùng",
        nuocSanXuat: "Trung Quốc",
        hangSanXuat: "Weigao",
        donViTinh: "Bộ",
        donGia: 12000,
        soLuongKeHoach: 800,
        nhaThau: "CÔNG TY TNHH THIẾT BỊ Y TẾ DEF",
        quyetDinh: "8896/QĐ-BV;G1;N1;2024",
        soLuongTon: 450,
        soLuongToiThieu: 150,
        soLuongTieuHao: 350
    },
    {
        id: 12,
        maVtyt: "D14890",
        tenVtyt: "Băng keo y tế",
        tenThuongMai: "Băng keo giấy y tế",
        maHieu: "Paper Tape 1 inch",
        maNhom: "N02.03.010",
        tenNhom: "Vật tư băng gạc",
        quyCach: "12 cuộn/hộp",
        nuocSanXuat: "Hàn Quốc",
        hangSanXuat: "3M",
        donViTinh: "Cuộn",
        donGia: 18000,
        soLuongKeHoach: 300,
        nhaThau: "CÔNG TY CP Y TẾ GHI",
        quyetDinh: "8890/QĐ-BV;G1;N1;2024",
        soLuongTon: 5,
        soLuongToiThieu: 50,
        soLuongTieuHao: 95
    }
];


/**
 * Interface đại diện cho một dòng dữ liệu trong bảng Dự trù vật tư
 */
export interface IVatTuDuTru {
    stt: number; // STT
    maQuanLy: string; // MA_QUAN_LY (K EDIT)
    maVtytCu: string; // MA_VTYT_CU (K EDIT)
    tenVtytBv: string; // TEN_VTYT_BV (K EDIT)
    maHieu: string; // MA_HIEU (K EDIT)
    hangSx: string; // HANG_SX (K EDIT)
    donViTinh: string; // DON_VI_TINH (HIDE)
    quyCach: string; // QUY_CACH (K EDIT)
    slTrongQuyCach: number; // SL trong 1 quy cách (HIDE)
    donGia: number; // DON_GIA (K EDIT)

    // Dữ liệu lấy từ phần mềm VIMES (K EDIT)
    slXuat: number; // SL_XUAT
    slNhap: number; // SL_NHAP
    slTon: number; // SL_TON

    nhaThau: string; // NHA_THAU (K EDIT)

    // Các trường cho phép chỉnh sửa (EDIT)
    duTru: number; // DU TRU
    goiHang: number; // GOI HANG (Tính toán dựa trên DU TRU và SL trong 1 quy cách)
}

export const DATA_DU_TRU_MAU: IVatTuDuTru[] = [
    {
        stt: 1,
        maQuanLy: "D05161",
        maVtytCu: "D05161",
        tenVtytBv: "Miếng cầm máu",
        maHieu: "UP801520B",
        hangSx: "GENCO",
        donViTinh: "Miếng",
        quyCach: "Hộp",
        slTrongQuyCach: 12,
        donGia: 94500,
        slXuat: 120, // Giả định số liệu từ VIMES
        slNhap: 200,
        slTon: 80,
        nhaThau: "CÔNG TY 1",
        duTru: 148,
        goiHang: 13, // (148 / 12) = 12.33 -> Làm tròn lên 13
    },
    {
        stt: 2,
        maQuanLy: "D05171",
        maVtytCu: "D05171",
        tenVtytBv: "Miếng cầm máu",
        maHieu: "UP1524",
        hangSx: "GENCO",
        donViTinh: "Miếng",
        quyCach: "Hộp",
        slTrongQuyCach: 10, // Giả định
        donGia: 105000,
        slXuat: 50,
        slNhap: 100,
        slTon: 50,
        nhaThau: "CÔNG TY 2",
        duTru: 30,
        goiHang: 3,
    },
    {
        stt: 3,
        maQuanLy: "D05341",
        maVtytCu: "D05341",
        tenVtytBv: "Mũi cắt xương carbide burs M1",
        maHieu: "Mani",
        hangSx: "Mani",
        donViTinh: "Mũi",
        quyCach: "Hộp",
        slTrongQuyCach: 5,
        donGia: 105000,
        slXuat: 20,
        slNhap: 50,
        slTon: 30,
        nhaThau: "CÔNG TY 3",
        duTru: 12,
        goiHang: 3, // (12 / 5) = 2.4 -> Làm tròn lên 3
    }
];

/**
 * Interface cho Log phê duyệt
 */
export interface IApprovalLog {
    id: number;
    action: 'created' | 'approved' | 'rejected' | 'edited';
    nguoiThucHien: string;
    thoiGian: Date;
    ghiChu: string;
    noiDungSua?: string; // Nếu có sửa đổi
}

/**
 * Interface cho Phiếu Dự trù
 */
export interface IPhieuDuTru {
    id: number;
    maPhieu: string;
    tenPhieu: string;
    khoaPhong: string;
    nguoiLap: string;
    ngayLap: Date;
    trangThai: 'cho_duyet' | 'da_duyet' | 'tu_choi' | 'huy';
    lyDoTuChoi?: string;
    danhSachVatTu: IVatTuDuTru[];
    approvalLog: IApprovalLog[];
    tongGiaTri: number;
}

/**
 * Mock data cho danh sách phiếu dự trù
 */
export const MOCK_PHIEU_DU_TRU: IPhieuDuTru[] = [
    {
        id: 1,
        maPhieu: 'PDT-2024-001',
        tenPhieu: 'Dự trù vật tư tháng 12/2024 - Khoa Ngoại',
        khoaPhong: 'Khoa Ngoại Tổng hợp',
        nguoiLap: 'BS. Nguyễn Văn An',
        ngayLap: new Date('2024-12-20'),
        trangThai: 'cho_duyet',
        danhSachVatTu: [
            {
                stt: 1,
                maQuanLy: "D05161",
                maVtytCu: "D05161",
                tenVtytBv: "Miếng cầm máu",
                maHieu: "UP801520B",
                hangSx: "GENCO",
                donViTinh: "Miếng",
                quyCach: "Hộp",
                slTrongQuyCach: 12,
                donGia: 94500,
                slXuat: 120,
                slNhap: 200,
                slTon: 80,
                nhaThau: "CÔNG TY 1",
                duTru: 148,
                goiHang: 13,
            },
            {
                stt: 2,
                maQuanLy: "D05171",
                maVtytCu: "D05171",
                tenVtytBv: "Miếng cầm máu loại 2",
                maHieu: "UP1524",
                hangSx: "GENCO",
                donViTinh: "Miếng",
                quyCach: "Hộp",
                slTrongQuyCach: 10,
                donGia: 105000,
                slXuat: 50,
                slNhap: 100,
                slTon: 50,
                nhaThau: "CÔNG TY 2",
                duTru: 30,
                goiHang: 3,
            },
        ],
        approvalLog: [
            {
                id: 1,
                action: 'created',
                nguoiThucHien: 'BS. Nguyễn Văn An',
                thoiGian: new Date('2024-12-20T09:00:00'),
                ghiChu: 'Tạo phiếu dự trù mới',
            }
        ],
        tongGiaTri: 14742000,
    },
    {
        id: 2,
        maPhieu: 'PDT-2024-002',
        tenPhieu: 'Dự trù vật tư tháng 12/2024 - Khoa Nội',
        khoaPhong: 'Khoa Nội Tim mạch',
        nguoiLap: 'BS. Trần Thị Bình',
        ngayLap: new Date('2024-12-21'),
        trangThai: 'cho_duyet',
        danhSachVatTu: [
            {
                stt: 1,
                maQuanLy: "D05341",
                maVtytCu: "D05341",
                tenVtytBv: "Mũi cắt xương carbide burs M1",
                maHieu: "Mani",
                hangSx: "Mani",
                donViTinh: "Mũi",
                quyCach: "Hộp",
                slTrongQuyCach: 5,
                donGia: 105000,
                slXuat: 20,
                slNhap: 50,
                slTon: 30,
                nhaThau: "CÔNG TY 3",
                duTru: 25,
                goiHang: 5,
            },
            {
                stt: 2,
                maQuanLy: "D04432",
                maVtytCu: "D04432",
                tenVtytBv: "Phin lọc khuẩn",
                maHieu: "GM-001-010",
                hangSx: "Bain Medical",
                donViTinh: "Cái",
                quyCach: "Hộp",
                slTrongQuyCach: 100,
                donGia: 12880,
                slXuat: 80,
                slNhap: 150,
                slTon: 70,
                nhaThau: "CÔNG TY 1",
                duTru: 200,
                goiHang: 2,
            },
        ],
        approvalLog: [
            {
                id: 1,
                action: 'created',
                nguoiThucHien: 'BS. Trần Thị Bình',
                thoiGian: new Date('2024-12-21T10:30:00'),
                ghiChu: 'Tạo phiếu dự trù mới',
            }
        ],
        tongGiaTri: 5201000,
    },
    {
        id: 3,
        maPhieu: 'PDT-2024-003',
        tenPhieu: 'Dự trù vật tư tháng 12/2024 - Khoa HSTC',
        khoaPhong: 'Khoa Hồi sức tích cực',
        nguoiLap: 'BS. Lê Văn Cường',
        ngayLap: new Date('2024-12-22'),
        trangThai: 'da_duyet',
        danhSachVatTu: [
            {
                stt: 1,
                maQuanLy: "D06531",
                maVtytCu: "D06531",
                tenVtytBv: "Sond tiểu nam",
                maHieu: "1 way",
                hangSx: "Guangdong Ec",
                donViTinh: "Cái",
                quyCach: "Hộp",
                slTrongQuyCach: 10,
                donGia: 5345,
                slXuat: 60,
                slNhap: 100,
                slTon: 40,
                nhaThau: "CÔNG TY 2",
                duTru: 50,
                goiHang: 5,
            },
        ],
        approvalLog: [
            {
                id: 1,
                action: 'created',
                nguoiThucHien: 'BS. Lê Văn Cường',
                thoiGian: new Date('2024-12-22T08:00:00'),
                ghiChu: 'Tạo phiếu dự trù mới',
            },
            {
                id: 2,
                action: 'approved',
                nguoiThucHien: 'TS. Phạm Văn Dũng',
                thoiGian: new Date('2024-12-22T14:30:00'),
                ghiChu: 'Phê duyệt phiếu dự trù',
            }
        ],
        tongGiaTri: 267250,
    },
    {
        id: 4,
        maPhieu: 'PDT-2024-004',
        tenPhieu: 'Dự trù vật tư tháng 12/2024 - Khoa Sản',
        khoaPhong: 'Khoa Sản',
        nguoiLap: 'BS. Hoàng Thị Em',
        ngayLap: new Date('2024-12-23'),
        trangThai: 'tu_choi',
        lyDoTuChoi: 'Số lượng dự trù vượt quá định mức cho phép. Yêu cầu điều chỉnh lại.',
        danhSachVatTu: [
            {
                stt: 1,
                maQuanLy: "D07123",
                maVtytCu: "D07123",
                tenVtytBv: "Găng tay phẫu thuật",
                maHieu: "Surgical Gloves Size 7",
                hangSx: "Top Glove",
                donViTinh: "Đôi",
                quyCach: "Hộp",
                slTrongQuyCach: 50,
                donGia: 8500,
                slXuat: 200,
                slNhap: 300,
                slTon: 100,
                nhaThau: "CÔNG TY 1",
                duTru: 500,
                goiHang: 10,
            },
        ],
        approvalLog: [
            {
                id: 1,
                action: 'created',
                nguoiThucHien: 'BS. Hoàng Thị Em',
                thoiGian: new Date('2024-12-23T09:00:00'),
                ghiChu: 'Tạo phiếu dự trù mới',
            },
            {
                id: 2,
                action: 'rejected',
                nguoiThucHien: 'TS. Phạm Văn Dũng',
                thoiGian: new Date('2024-12-23T16:00:00'),
                ghiChu: 'Số lượng dự trù vượt quá định mức cho phép. Yêu cầu điều chỉnh lại.',
            }
        ],
        tongGiaTri: 4250000,
    },
];

