import { OrderHistory, OrderRequest } from '@/types';
import { HoaDonUBot } from '@/types';
import { AssignableRole, AuthRole } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const AUTH_TOKEN_KEY = 'bv108_auth_token';
export const AUTH_USER_KEY = 'bv108_auth_user';
export const AUTH_EXPIRES_AT_KEY = 'bv108_auth_expires_at';
export const AUTH_LAST_ACTIVITY_AT_KEY = 'bv108_auth_last_activity_at';
export const AUTH_SESSION_INVALID_EVENT = 'bv108:auth-session-invalid';
export const AUTH_STATE_CHANGED_EVENT = 'bv108:auth-state-changed';

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
  tonKhoMin: { Int32: number; Valid: boolean } | null;
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
  companyContactId?: string;
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
  id: string;
  identityKey: string;
  companyName: string;
  taxId?: string;
  email: string;
  contractNumber?: string;
  contractDate?: string;
  companyAddress?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  decisionNumber?: string;
  packageNumber?: string;
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
  status: 'approved' | 'rejected' | 'edited' | 'submitted';
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
  status: 'approved' | 'rejected' | 'edited' | 'submitted';
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
  actionType: 'approve' | 'reject' | 'edit' | 'submit';
  statusBefore?: string;
  statusAfter?: 'approved' | 'rejected' | 'edited' | 'submitted';
  lyDo?: string;
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
  typeName?: string;
  quyCach: string;
  donViTinh: string;
  duTru: number;
  goiHang: number;
  donGia: number;
  thanhTien: number;
  trangThai: 'approved' | 'rejected' | 'edited' | 'submitted';
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
  companyContactId?: string;
  nhaThau: string;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  orderedQty: number;
  orderTime?: string;
  invoiceNumber: string;
  invoiceIdHoaDon?: string;
  invoiceRowId?: number;
  invoiceCompanyContactId?: string;
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
  note?: string;
  status: 'waiting' | 'done';
}

export interface MatchedInvoiceNumbersResponse {
  data: string[];
  month?: number;
  year?: number;
  all?: boolean;
}

export interface SaveInvoiceReconciliationItemRequest {
  id: number;
  action: 'note' | 'status';
  note?: string;
  status?: 'waiting' | 'done';
}

export interface SaveInvoiceReconciliationsBulkRequest {
  items: SaveInvoiceReconciliationItemRequest[];
}

export interface UpsertInvoiceReconciliationItemRequest {
  orderHistoryId: number;
  orderBatchKey: string;
  companyContactId?: string;
  nhaThau: string;
  maQuanLy: string;
  maVtytCu: string;
  tenVtytBv: string;
  orderedQty: number;
  orderTime?: string;
  invoiceNumber: string;
  invoiceIdHoaDon?: string;
  invoiceRowId?: number;
  invoiceCompanyContactId?: string;
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
  note?: string;
  status?: 'waiting' | 'done';
}

export interface UpsertInvoiceReconciliationsBulkRequest {
  items: UpsertInvoiceReconciliationItemRequest[];
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

export interface GeminiTextPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiTextPart[];
}

export interface GeminiGenerateRequest {
  contents: GeminiContent[];
}

export interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
}

export interface HoaDonListResponse {
  data: HoaDonUBot[];
  total: number;
  limit: number;
  offset: number;
}

export interface RefreshInvoicesResponse {
  success: boolean;
  message: string;
  total: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

const shouldInvalidateAuthSession = (status: number, errorCode?: string): boolean => {
  if (status === 401) {
    return true;
  }

  return status === 403 && errorCode === 'ACCOUNT_DISABLED';
};

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: AuthRole;
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
  role: AssignableRole;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: AuthUser;
}

export interface ManagedAccountUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface ManagedUsersResponse {
  users: ManagedAccountUser[];
}

export interface UpdateManagedUserRoleRequest {
  role: AssignableRole;
}

export interface ResetManagedUserPasswordRequest {
  password: string;
}

export interface GetProfileResponse {
  user: AuthUser;
}

export interface SupplyTaskUserState {
  id: number;
  username: string;
  email: string;
  role: string;
  assignedCount: number;
}

export interface SupplyTaskStateResponse {
  hideForOtherRoles: boolean;
  totalSupplies: number;
  users: SupplyTaskUserState[];
}

export interface SupplyTaskAssignmentItem {
  idx1: number;
  code: string;
  name: string;
}

export interface SupplyTaskAssignmentsResponse {
  userId: number;
  assignments: SupplyTaskAssignmentItem[];
}

export interface UpdateSupplyTaskVisibilityRequest {
  hideForOtherRoles: boolean;
}

export interface UpdateSupplyTaskAssignmentsRequest {
  userId: number;
  supplyIdx1List: number[];
}

export interface ImportSupplyTaskAssignmentsResponse {
  message: string;
  updatedCount: number;
  assignedCount: number;
  clearedCount: number;
}

export interface StoredAuth {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

const parseStoredTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getNumericClaim = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const deriveExpiresAtFromToken = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  const exp = getNumericClaim(payload?.exp);
  if (exp <= 0) {
    return null;
  }

  return new Date(exp * 1000).toISOString();
};

const dispatchAuthSessionInvalidEvent = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_INVALID_EVENT));
};

const dispatchAuthStateChangedEvent = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
};

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
  localStorage.setItem(AUTH_EXPIRES_AT_KEY, auth.expiresAt);
  localStorage.setItem(AUTH_LAST_ACTIVITY_AT_KEY, new Date().toISOString());
  dispatchAuthStateChangedEvent();
};

export const clearStoredAuth = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  localStorage.removeItem(AUTH_LAST_ACTIVITY_AT_KEY);
  dispatchAuthStateChangedEvent();
};

export const recordAuthActivity = (activityAt: string = new Date().toISOString()): void => {
  if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
    return;
  }

  localStorage.setItem(AUTH_LAST_ACTIVITY_AT_KEY, activityAt);
};

export const getStoredAuthLastActivityAt = (): string => {
  const activityAt = localStorage.getItem(AUTH_LAST_ACTIVITY_AT_KEY);
  return parseStoredTimestamp(activityAt) > 0 ? activityAt || '' : '';
};

export const getStoredAuth = (): StoredAuth | null => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  const rawExpiresAt = localStorage.getItem(AUTH_EXPIRES_AT_KEY);

  if (!token || !rawUser) {
    return null;
  }

  const expiresAt = parseStoredTimestamp(rawExpiresAt) > 0
    ? rawExpiresAt || ''
    : deriveExpiresAtFromToken(token);
  const expiresAtTimestamp = parseStoredTimestamp(expiresAt);

  if (!expiresAt || expiresAtTimestamp <= 0 || expiresAtTimestamp <= Date.now()) {
    clearStoredAuth();
    return null;
  }

  if (rawExpiresAt !== expiresAt) {
    localStorage.setItem(AUTH_EXPIRES_AT_KEY, expiresAt);
  }

  try {
    const user = JSON.parse(rawUser) as AuthUser;
    if (parseStoredTimestamp(localStorage.getItem(AUTH_LAST_ACTIVITY_AT_KEY)) <= 0) {
      recordAuthActivity();
    }

    return { token, expiresAt, user };
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
    expiresAt: currentAuth.expiresAt,
    user: updatedUser,
  };

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextAuth.user));
  dispatchAuthStateChangedEvent();
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
      let errorCode = '';
      try {
        const error = (await response.json()) as ErrorResponse;
        errorCode = error.error || '';
        message = error.message || message;
      } catch {
        message = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      }

      if (includeAuth && shouldInvalidateAuthSession(response.status, errorCode)) {
        clearStoredAuth();
        dispatchAuthSessionInvalidEvent();
      }

      throw new Error(message);
    }

    return response.json() as Promise<T>;
  }

  private getAuthHeaders(includeAuth: boolean = false): Headers {
    const headers = new Headers();
    if (includeAuth) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
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

  async getManagedUsers(): Promise<ManagedUsersResponse> {
    return this.request<ManagedUsersResponse>('/auth/users', {
      method: 'GET',
    }, true);
  }

  async updateManagedUserRole(userId: number, payload: UpdateManagedUserRoleRequest): Promise<UpdateProfileResponse> {
    return this.request<UpdateProfileResponse>(`/auth/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true);
  }

  async resetManagedUserPassword(userId: number, payload: ResetManagedUserPasswordRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>(`/auth/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true);
  }

  async deleteManagedUser(userId: number): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>(`/auth/users/${userId}`, {
      method: 'DELETE',
    }, true);
  }

  async getSupplies(page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    }, true);
  }

  async getSupplyById(id: number): Promise<ApiSupply> {
    return this.request<ApiSupply>(`/supplies/${id}`, {
      method: 'GET',
    }, true);
  }

  async searchSupplies(keyword: string, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    }, true);
  }

  async getGroups(): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>('/supplies/groups', {
      method: 'GET',
    }, true);
  }

  async getSuppliesByGroup(groupName: string, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies/group?groupName=${encodeURIComponent(groupName)}&page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    }, true);
  }

  async getLowStockSupplies(threshold: number = 20, page: number = 1, pageSize: number = 20): Promise<PaginationResponse<ApiSupply>> {
    return this.request<PaginationResponse<ApiSupply>>(`/supplies/low-stock?threshold=${threshold}&page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
    }, true);
  }

  async getCompareLevel1Options(): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>('/supplies/compare-level1', {
      method: 'GET',
    }, true);
  }

  async getCompareLevel2Options(level1: string = ''): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>(
      `/supplies/compare-level2?level1=${encodeURIComponent(level1)}`,
      { method: 'GET' },
      true,
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
      { method: 'GET' },
      true,
    );
  }

  async exportCompareCatalogExcel(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/supplies/compare-export`, {
      method: 'GET',
      headers: this.getAuthHeaders(true),
      credentials: 'include',
    });

    if (!response.ok) {
      let message = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json() as ErrorResponse;
        if (errorData?.message) {
          message = errorData.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') || '';
    const matchedFilename = disposition.match(/filename="?([^"]+)"?/i)?.[1];
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = matchedFilename || 'so-sanh-vat-tu-template.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async importCompareCatalogExcel(file: File): Promise<MutationMessageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/supplies/compare-import`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      let message = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json() as ErrorResponse;
        if (errorData?.message) {
          message = errorData.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return response.json() as Promise<MutationMessageResponse>;
  }

  async getForecastCatalog(keyword: string = ''): Promise<{ data: ApiSupply[]; total: number }> {
    return this.request<{ data: ApiSupply[]; total: number }>(
      `/supplies/forecast-catalog?keyword=${encodeURIComponent(keyword)}`,
      { method: 'GET' },
      true,
    );
  }

  async getSupplyTaskState(): Promise<SupplyTaskStateResponse> {
    return this.request<SupplyTaskStateResponse>('/supply-tasks/state', {
      method: 'GET',
    }, true);
  }

  async getSupplyTaskCatalog(keyword: string = ''): Promise<{ data: ApiSupply[]; total: number }> {
    return this.request<{ data: ApiSupply[]; total: number }>(
      `/supply-tasks/catalog?keyword=${encodeURIComponent(keyword)}`,
      { method: 'GET' },
      true,
    );
  }

  async getSupplyTaskAssignments(userId: number): Promise<SupplyTaskAssignmentsResponse> {
    return this.request<SupplyTaskAssignmentsResponse>(`/supply-tasks/assignments?userId=${userId}`, {
      method: 'GET',
    }, true);
  }

  async updateSupplyTaskVisibility(payload: UpdateSupplyTaskVisibilityRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/supply-tasks/visibility', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true);
  }

  async updateSupplyTaskAssignments(payload: UpdateSupplyTaskAssignmentsRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/supply-tasks/assignments', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, true);
  }

  async downloadSupplyTaskAssignmentsExport(): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${this.baseUrl}/supply-tasks/assignments/export`, {
      method: 'GET',
      headers: this.getAuthHeaders(true),
    });

    if (!response.ok) {
      let message = 'Không tải được file export';
      let errorCode = '';
      try {
        const error = (await response.json()) as ErrorResponse;
        errorCode = error.error || '';
        message = error.message || message;
      } catch {
        message = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      }

      if (shouldInvalidateAuthSession(response.status, errorCode)) {
        clearStoredAuth();
        dispatchAuthSessionInvalidEvent();
      }

      throw new Error(message);
    }

    const disposition = response.headers.get('Content-Disposition') || '';
    const matchedFilename = disposition.match(/filename="?([^"]+)"?/i)?.[1]?.trim();
    const blob = await response.blob();

    return {
      blob,
      filename: matchedFilename || 'phan-quyen-vat-tu.xlsx',
    };
  }

  async importSupplyTaskAssignments(file: File): Promise<ImportSupplyTaskAssignmentsResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/supply-tasks/assignments/import`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: formData,
    });

    if (!response.ok) {
      let message = 'Không import được file phân quyền';
      let errorCode = '';
      try {
        const error = (await response.json()) as ErrorResponse;
        errorCode = error.error || '';
        message = error.message || message;
      } catch {
        message = `Lỗi HTTP ${response.status}: ${response.statusText}`;
      }

      if (shouldInvalidateAuthSession(response.status, errorCode)) {
        clearStoredAuth();
        dispatchAuthSessionInvalidEvent();
      }

      throw new Error(message);
    }

    return response.json() as Promise<ImportSupplyTaskAssignmentsResponse>;
  }

  async compareSupplies(maThuVien: string[]): Promise<CompareSuppliesResponse> {
    return this.request<CompareSuppliesResponse>('/supplies/compare', {
      method: 'POST',
      body: JSON.stringify({ maThuVien }),
    }, true);
  }

  async generateGeminiCompare(payload: GeminiGenerateRequest): Promise<GeminiGenerateResponse> {
    return this.request<GeminiGenerateResponse>('/reports/gemini-compare', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
  }

  async getHoaDons(limit: number = 1000, offset: number = 0): Promise<HoaDonListResponse> {
    return this.request<HoaDonListResponse>(`/hoa-don?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    }, true);
  }

  async refreshHoaDons(): Promise<RefreshInvoicesResponse> {
    return this.request<RefreshInvoicesResponse>('/hoa-don/refresh', {
      method: 'POST',
    }, true);
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

  async reorderHistoryOrders(payload: PlaceOrdersRequest): Promise<PlaceOrdersResponse> {
    return this.request<PlaceOrdersResponse>('/orders/history/reorder', {
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

  async upsertInvoiceReconciliationsBulk(payload: UpsertInvoiceReconciliationsBulkRequest): Promise<MutationMessageResponse> {
    return this.request<MutationMessageResponse>('/orders/invoice-reconciliations/upsert', {
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
