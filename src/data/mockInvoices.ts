import { Invoice } from '@/types';

/**
 * Mock data hóa đơn từ uBot
 * Trong thực tế sẽ được crawl từ uBot và đồng bộ vào hệ thống
 */
export const mockInvoices: Invoice[] = [
    {
        id: 'INV-001',
        maHoaDon: 'HD2026-001',
        maQuanLy: 'VT001',
        soLuong: 100,
        ngayTaoHoaDon: new Date('2026-01-20'),
        trangThaiHoaDon: 'Đã nhận',
        ghiChu: 'Đã nhận đầy đủ',
    },
    {
        id: 'INV-002',
        maHoaDon: 'HD2026-002',
        maQuanLy: 'VT002',
        soLuong: 45, // Thiếu 5 (đặt 50, nhận 45)
        ngayTaoHoaDon: new Date('2026-01-21'),
        trangThaiHoaDon: 'Đã nhận',
        ghiChu: 'Thiếu 5 đơn vị',
    },
    {
        id: 'INV-003',
        maHoaDon: 'HD2026-003',
        maQuanLy: 'VT003',
        soLuong: 250,
        ngayTaoHoaDon: new Date('2026-01-22'),
        trangThaiHoaDon: 'Đã nhận',
    },
    {
        id: 'INV-004',
        maHoaDon: 'HD2026-004',
        maQuanLy: 'VT005',
        soLuong: 85, // Thừa 5 (đặt 80, nhận 85)
        ngayTaoHoaDon: new Date('2026-01-23'),
        trangThaiHoaDon: 'Đã nhận',
        ghiChu: 'Nhà thầu gửi thừa 5 đơn vị',
    },
    {
        id: 'INV-005',
        maHoaDon: 'HD2026-005',
        maQuanLy: 'VT006',
        soLuong: 120,
        ngayTaoHoaDon: new Date('2026-01-24'),
        trangThaiHoaDon: 'Đã nhận',
    },
];
