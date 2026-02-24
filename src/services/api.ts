
// Cấu hình API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Kiểu dữ liệu API Response
export interface ApiSupply {
  idx1: number;
  productId: { Int32: number; Valid: boolean } | null;
  groupName: { String: string; Valid: boolean } | null;
  id: { String: string; Valid: boolean } | null;
  idx2: { String: string; Valid: boolean } | null;
  typeName: { String: string; Valid: boolean } | null;
  name: { String: string; Valid: boolean } | null;
  unit: { String: string; Valid: boolean } | null;
  quyCach: { String: string; Valid: boolean } | null;
  thongTinThau: { String: string; Valid: boolean } | null;
  tongThau: { String: string; Valid: boolean } | null;
  hangSx: { String: string; Valid: boolean } | null;
  nuocSx: { String: string; Valid: boolean } | null;
  nhaCungCap: { String: string; Valid: boolean } | null;
  price: { Float64: number; Valid: boolean } | null;
  tonDauKy: { Int32: number; Valid: boolean } | null;
  nhapTrongKy: { Int32: number; Valid: boolean } | null;
  xuatTrongKy: { Int32: number; Valid: boolean } | null;
  tongNhap: { Int32: number; Valid: boolean } | null;
  tonCuoiKy: number;
}

export interface PaginationResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

// Hàm trợ giúp để lấy giá trị nullable
export const getNullableString = (value: { String: string; Valid: boolean } | null | undefined): string => {
  return value?.Valid ? value.String : '';
};

export const getNullableNumber = (value: { Int32: number; Valid: boolean } | { Float64: number; Valid: boolean } | null | undefined): number => {
  if (!value?.Valid) return 0;
  return 'Int32' in value ? value.Int32 : value.Float64;
};

// Service API
class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Lấy tất cả vật tư có phân trang
  async getSupplies(page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    try {
      console.log('🔄 Đang gọi API:', `${this.baseUrl}/supplies?page=${page}&pageSize=${pageSize}`);
      const response = await fetch(`${this.baseUrl}/supplies?page=${page}&pageSize=${pageSize}`);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Không thể tải dữ liệu vật tư';
        try {
          const error: ErrorResponse = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = `Lỗi HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Đã tải dữ liệu thành công:', data.total, 'items');
      return data;
    } catch (error) {
      console.error('❌ Lỗi khi gọi API:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra backend đã chạy chưa.');
      }
      throw error;
    }
  }

  // Lấy chi tiết vật tư theo ID
  async getSupplyById(id: number): Promise<ApiSupply> {
    const response = await fetch(`${this.baseUrl}/supplies/${id}`);
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || 'Failed to fetch supply');
    }
    return response.json();
  }

  // Tìm kiếm vật tư
  async searchSupplies(keyword: string, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    const response = await fetch(`${this.baseUrl}/supplies/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`);
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || 'Failed to search supplies');
    }
    return response.json();
  }

  // Lấy tất cả nhóm vật tư
  async getGroups(): Promise<{ groups: string[]; total: number }> {
    const response = await fetch(`${this.baseUrl}/supplies/groups`);
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || 'Failed to fetch groups');
    }
    return response.json();
  }

  // Lấy vật tư theo nhóm
  async getSuppliesByGroup(groupName: string, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    const response = await fetch(`${this.baseUrl}/supplies/group?groupName=${encodeURIComponent(groupName)}&page=${page}&pageSize=${pageSize}`);
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || 'Failed to fetch supplies by group');
    }
    return response.json();
  }

  // Lấy vật tư tồn kho thấp
  async getLowStockSupplies(threshold: number = 20, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    const response = await fetch(`${this.baseUrl}/supplies/low-stock?threshold=${threshold}&page=${page}&pageSize=${pageSize}`);
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.message || 'Failed to fetch low stock supplies');
    }
    return response.json();
  }
}

export const apiService = new ApiService(API_BASE_URL);
