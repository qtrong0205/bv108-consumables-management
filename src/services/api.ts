import { OrderHistory, OrderRequest } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const AUTH_TOKEN_KEY = 'bv108_auth_token';
const AUTH_USER_KEY = 'bv108_auth_user';

export interface ApiSupply {
  idx1: number;
  productId: { Int32: number; Valid: boolean } | null;
  groupName: { String: string; Valid: boolean } | null;
  id: { String: string; Valid: boolean } | null;
  idx2: { String: string; Valid: boolean } | null;
  maHieu: { String: string; Valid: boolean } | null;
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

export interface OrderListResponse<T> {
  data: T[];
}

export interface CreateForecastOrdersRequest {
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  nhaThau: string;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  maHieu: string;
  hangSx: string;
  donViTinh: string;
  quyCach: string;
  dotGoiHang: number;
  email?: string;
}

export interface MutationMessageResponse {
  message: string;
  count?: number;
}

export interface CompanyContactSuggestion {
  id: number;
  identityKey: string;
  companyName: string;
  taxId?: string;
  email: string;
}

export interface PlaceOrdersRequest {
  orderIds: number[];
}

export interface PlaceOrdersResponse {
  message: string;
  placedCount: number;
}

export interface OrderUnreadSnapshot {
  hasSupplierRedDot: boolean;
  unreadGroupKeys: string[];
}

export interface MarkGroupsSeenRequest {
  groupKeys: string[];
}

export interface ApiForecastApproval {
  id: number;
  forecastMonth: number;
  forecastYear: number;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  status: 'approved' | 'rejected' | 'edited';
  lyDo?: string;
  duTruGoc?: number;
  duTruSua?: number;
  nguoiDuyet: string;
  nguoiDuyetEmail?: string;
  thoiGianDuyet: string;
}

export interface SaveForecastApprovalRequest {
  forecastMonth: number;
  forecastYear: number;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  status: 'approved' | 'rejected' | 'edited';
  lyDo?: string;
  duTruGoc?: number;
  duTruSua?: number;
}

export interface SaveForecastApprovalsBulkRequest {
  items: SaveForecastApprovalRequest[];
}

export interface ApiForecastChangeHistoryRecord {
  id: number;
  forecastMonth: number;
  forecastYear: number;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  actionType: 'approve' | 'reject' | 'edit';
  statusBefore?: string;
  statusAfter?: 'approved' | 'rejected' | 'edited';
  duTruGoc?: number;
  duTruSua?: number;
  nguoiThucHien: string;
  nguoiThucHienEmail?: string;
  thoiGianThucHien: string;
}

export interface ApiMonthlyForecastHistoryItem {
  stt: number;
  maVtyt: string;
  tenVtyt: string;
  quyCach: string;
  donViTinh: string;
  duTru: number;
  goiHang: number;
  donGia: number;
  thanhTien: number;
  trangThai: 'approved' | 'rejected' | 'edited';
  nguoiDuyet: string;
  ngayDuyet: string;
}

export interface ApiMonthlyForecastHistoryRecord {
  id: string;
  thang: number;
  nam: number;
  ngayTao: string;
  ngayDuyet: string;
  nguoiTao: string;
  nguoiDuyet: string;
  tongSoVatTu: number;
  tongGiaTri: number;
  trangThai: 'approved' | 'partial' | 'rejected';
  danhSachVatTu: ApiMonthlyForecastHistoryItem[];
}

export interface ApiInvoiceReconciliationRecord {
  id: number;
  orderHistoryId: number;
  orderBatchKey: string;
  companyContactId?: number;
  nhaThau: string;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  orderedQty: number;
  orderTime?: string;
  invoiceNumber: string;
  invoiceIdHoaDon?: string;
  invoiceRowId?: number;
  invoiceCompanyContactId?: number;
  invoiceCompanyName?: string;
  invoiceItemCode?: string;
  invoiceItemName?: string;
  invoiceQty: number;
  invoiceTime?: string;
  hasInvoice: boolean;
  detailStatus: string;
  detailNote?: string;
  matchScore: number;
  quantityDiff: number;
  matchedByUserId?: number;
  matchedByUsername: string;
  matchedByEmail?: string;
  matchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchedInvoiceNumbersResponse {
  data: string[];
  month?: number;
  year?: number;
  all?: boolean;
}

export interface SaveInvoiceReconciliationItemRequest {
  orderHistoryId: number;
  orderBatchKey: string;
  companyContactId?: number;
  nhaThau: string;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  orderedQty: number;
  orderTime?: string;
  invoiceNumber: string;
  invoiceIdHoaDon?: string;
  invoiceRowId?: number;
  invoiceCompanyContactId?: number;
  invoiceCompanyName?: string;
  invoiceItemCode?: string;
  invoiceItemName?: string;
  invoiceQty: number;
  invoiceTime?: string;
  hasInvoice: boolean;
  detailStatus: string;
  detailNote?: string;
  matchScore: number;
  quantityDiff: number;
  matchedAt?: string;
}

export interface SaveInvoiceReconciliationsBulkRequest {
  items: SaveInvoiceReconciliationItemRequest[];
}

export interface ApiCompareSupply {
  stt: number;
  tenCongTy: { String: string; Valid: boolean } | null;
  maThuVien: { String: string; Valid: boolean } | null;
  maThongTu04: { String: string; Valid: boolean } | null;
  tenVatTu: { String: string; Valid: boolean } | null;
  tenThuongMai: { String: string; Valid: boolean } | null;
  tskt2025: { String: string; Valid: boolean } | null;
  tskt2026: { String: string; Valid: boolean } | null;
  chatLieuVatLieu: { String: string; Valid: boolean } | null;
  dacTinhCauTao: { String: string; Valid: boolean } | null;
  kichThuoc: { String: string; Valid: boolean } | null;
  chieuDai: { String: string; Valid: boolean } | null;
  tinhNangSuDung: { String: string; Valid: boolean } | null;
  tsktKhac: { String: string; Valid: boolean } | null;
  dvt: { String: string; Valid: boolean } | null;
  soLuongSuDung12Thang: { Float64: number; Valid: boolean } | null;
  soLuongTrungThau2025BoSung: { Float64: number; Valid: boolean } | null;
  donGiaTrungThau2025: { Float64: number; Valid: boolean } | null;
  donGiaDeXuat2026: { Float64: number; Valid: boolean } | null;
  ketQuaTrungThauThapNhat: { Float64: number; Valid: boolean } | null;
  thoiGianDangTaiThapNhat: { String: string; Valid: boolean } | null;
  ketQuaTrungThauCaoNhat: { Float64: number; Valid: boolean } | null;
  thoiGianDangTaiCaoNhat: { String: string; Valid: boolean } | null;
  maSoThue: { String: string; Valid: boolean } | null;
  maHieu: { String: string; Valid: boolean } | null;
  hangSx: { String: string; Valid: boolean } | null;
  nuocSx: { String: string; Valid: boolean } | null;
  nhomNuoc: { String: string; Valid: boolean } | null;
  chatLuong: { String: string; Valid: boolean } | null;
  ma5086: { String: string; Valid: boolean } | null;
}

export interface CompareSuppliesResponse {
  data: ApiCompareSupply[];
  total: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'nhan_vien' | 'truong_khoa';
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: 'nhan_vien' | 'truong_khoa';
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: AuthUser;
}

export interface GetProfileResponse {
  user: AuthUser;
}

export interface StoredAuth {
  token: string;
  user: AuthUser;
}

export const getNullableString = (value: { String: string; Valid: boolean } | null | undefined): string => {
  return value?.Valid ? value.String : '';
};

export const getNullableNumber = (value: { Int32: number; Valid: boolean } | { Float64: number; Valid: boolean } | null | undefined): number => {
  if (!value?.Valid) return 0;
  return 'Int32' in value ? value.Int32 : value.Float64;
};

export const storeAuth = (auth: AuthResponse): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(auth.user));
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getStoredAuth = (): StoredAuth | null => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!token || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser;
    return { token, user };
  } catch {
    clearStoredAuth();
    return null;
  }
};

export const updateStoredAuthUser = (updatedUser: AuthUser): StoredAuth | null => {
  const currentAuth = getStoredAuth();
  if (!currentAuth) {
    return null;
  }

  const nextAuth: StoredAuth = {
    token: currentAuth.token,
    user: updatedUser,
  };

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextAuth.user));
  return nextAuth;
};

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}, includeAuth: boolean = false): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (includeAuth) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let message = 'Yêu cầu thất bại';
      try {
        const error = (await response.json()) as ErrorResponse;
        message = error.message || message;
      } catch {
        message = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProfile(payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    return this.request<UpdateProfileResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true);
  }

  async getProfile(): Promise<GetProfileResponse> {
    return this.request<GetProfileResponse>('/auth/profile', {
      method: 'GET',
    }, true);
  }

  async getSupplies(page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies?page=${page}&pageSize=${pageSize}`);
  }

  async getSupplyById(id: number): Promise<ApiSupply> {
    return this.request<ApiSupply>(`/supplies/${id}`);
  }

  async searchSupplies(keyword: string, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`);
  }

  async getGroups(): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>('/supplies/groups');
  }

  async getSuppliesByGroup(groupName: string, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies/group?groupName=${encodeURIComponent(groupName)}&page=${page}&pageSize=${pageSize}`);
  }

  async getLowStockSupplies(threshold: number = 20, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies/low-stock?threshold=${threshold}&page=${page}&pageSize=${pageSize}`);
  }

  async getCompareLevel1Options(): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>('/supplies/compare-level1');
  }

  async getCompareLevel2Options(level1: string = ''): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>(
      `/supplies/compare-level2?level1=${encodeURIComponent(level1)}`,
    );
  }

  async getCompareCatalog(
    keyword: string = '',
    page: number = 1,
    pageSize: number = 20,
    level1Filter: string = '',
    level2Filter: string = '',
  ): Promise<PaginationResponse<ApiCompareSupply>> {
    return this.request<PaginationResponse<ApiCompareSupply>>(
      `/supplies/compare-catalog?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}&level1Filter=${encodeURIComponent(level1Filter)}&level2Filter=${encodeURIComponent(level2Filter)}`,
    );
  }

  async compareSupplies(maThuVien: string[]): Promise<CompareSuppliesResponse> {
    return this.request<CompareSuppliesResponse>('/supplies/compare', {
      method: 'POST',
      body: JSON.stringify({ maThuVien }),
    });
  }

  async getPendingOrders(): Promise<OrderListResponse<OrderRequest>> {
    return this.request<OrderListResponse<OrderRequest>>('/orders/pending', {
      method: 'GET',
    }, true);
  }

  async getOrderHistory(): Promise<OrderListResponse<OrderHistory>> {
    return this.request<OrderListResponse<OrderHistory>>('/orders/history', {
      method: 'GET',
    }, true);
  }

  async createForecastOrders(payload: CreateForecastOrdersRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/orders/pending/forecast', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async createManualOrder(payload: CreateOrderItemRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/orders/pending/manual', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async searchCompanyContacts(keyword: string, limit: number = 8): Promise<OrderListResponse<CompanyContactSuggestion>> {
    return this.request<OrderListResponse<CompanyContactSuggestion>>(
      `/orders/company-contacts/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`,
      { method: 'GET' },
      true,
    );
  }

  async placeOrders(payload: PlaceOrdersRequest): Promise<PlaceOrdersResponse> {
    return this.request<PlaceOrdersResponse>('/orders/place', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async getOrderUnreadSnapshot(): Promise<{ data: OrderUnreadSnapshot }> {
    return this.request<{ data: OrderUnreadSnapshot }>('/orders/unread-snapshot', {
      method: 'GET',
    }, true);
  }

  async markSupplierAlertSeen(): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/orders/alerts/suppliers/seen', {
      method: 'POST',
    }, true);
  }

  async markOrderGroupsSeen(payload: MarkGroupsSeenRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/orders/groups/seen', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async saveInvoiceReconciliationsBulk(payload: SaveInvoiceReconciliationsBulkRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/orders/invoice-reconciliations/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async getInvoiceReconciliationHistory(month: number, year: number): Promise<OrderListResponse<ApiInvoiceReconciliationRecord>> {
    return this.request<OrderListResponse<ApiInvoiceReconciliationRecord>>(
      `/orders/invoice-reconciliations?month=${month}&year=${year}`,
      { method: 'GET' },
      true,
    );
  }

  async getMatchedInvoiceNumbers(options: { month?: number; year?: number; all?: boolean } = {}): Promise<MatchedInvoiceNumbersResponse> {
    const params = new URLSearchParams();
    if (options.all) {
      params.set('all', '1');
    } else {
      if (options.month) params.set('month', String(options.month));
      if (options.year) params.set('year', String(options.year));
    }

    const query = params.toString();
    const path = query
      ? `/orders/invoice-reconciliations/matched-invoices?${query}`
      : '/orders/invoice-reconciliations/matched-invoices';

    return this.request<MatchedInvoiceNumbersResponse>(path, { method: 'GET' }, true);
  }

  async getMatchedOrderReconciliations(): Promise<OrderListResponse<ApiInvoiceReconciliationRecord>> {
    return this.request<OrderListResponse<ApiInvoiceReconciliationRecord>>(
      '/orders/invoice-reconciliations/matched-orders',
      { method: 'GET' },
      true,
    );
  }

  async getForecastApprovals(month: number, year: number): Promise<OrderListResponse<ApiForecastApproval>> {
    return this.request<OrderListResponse<ApiForecastApproval>>(`/forecast-approvals?month=${month}&year=${year}`, {
      method: 'GET',
    }, true);
  }

  async saveForecastApproval(payload: SaveForecastApprovalRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/forecast-approvals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async saveForecastApprovalsBulk(payload: SaveForecastApprovalsBulkRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/forecast-approvals/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async getForecastChangeHistory(limit: number = 1000): Promise<OrderListResponse<ApiForecastChangeHistoryRecord>> {
    return this.request<OrderListResponse<ApiForecastChangeHistoryRecord>>(`/forecast-approvals/history?limit=${limit}`, {
      method: 'GET',
    }, true);
  }

  async getLatestForecastChanges(month: number, year: number): Promise<OrderListResponse<ApiForecastChangeHistoryRecord>> {
    return this.request<OrderListResponse<ApiForecastChangeHistoryRecord>>(
      `/forecast-approvals/history?month=${month}&year=${year}&latestOnly=1&limit=0`,
      { method: 'GET' },
      true,
    );
  }

  async getForecastMonthlyHistory(): Promise<OrderListResponse<ApiMonthlyForecastHistoryRecord>> {
    return this.request<OrderListResponse<ApiMonthlyForecastHistoryRecord>>('/forecast-approvals/monthly-history', {
      method: 'GET',
    }, true);
  }
}

export const apiService = new ApiService(API_BASE_URL);
