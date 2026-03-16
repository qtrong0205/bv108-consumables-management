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

export interface ApiCompareSupply {
  stt: number;
  tenCongTy: { String: string; Valid: boolean } | null;
  maThuVien: { String: string; Valid: boolean } | null;
  maThongTu04: { String: string; Valid: boolean } | null;
  tenVatTu2025: { String: string; Valid: boolean } | null;
  thongSoMoiThau2025: { String: string; Valid: boolean } | null;
  thongSoHieuChinh2026: { String: string; Valid: boolean } | null;
  thongSoKyThuat1: { String: string; Valid: boolean } | null;
  thongSoKyThuat2: { String: string; Valid: boolean } | null;
  thongSoKyThuat3: { String: string; Valid: boolean } | null;
  thongSoKyThuat4: { String: string; Valid: boolean } | null;
  thongSoKyThuat5: { String: string; Valid: boolean } | null;
  thongSoKyThuat9: { String: string; Valid: boolean } | null;
  maVtthTuongDuong: { String: string; Valid: boolean } | null;
  congTyVtthTuongDuong: { String: string; Valid: boolean } | null;
  dvt: { String: string; Valid: boolean } | null;
  soLuongSuDung12Thang: { Float64: number; Valid: boolean } | null;
  soLuongTrungThau2025BoSung: { Int32: number; Valid: boolean } | null;
  donGiaTrungThau2025: { Float64: number; Valid: boolean } | null;
  donGiaDeXuat2026: { Float64: number; Valid: boolean } | null;
  ketQuaTrungThauThapNhat: { Float64: number; Valid: boolean } | null;
  thoiGianDangTaiThapNhat: { String: string; Valid: boolean } | null;
  ketQuaTrungThauCaoNhat: { Float64: number; Valid: boolean } | null;
  thoiGianDangTaiCaoNhat: { String: string; Valid: boolean } | null;
  congTyThamKhao: { String: string; Valid: boolean } | null;
  maSoThue: { String: string; Valid: boolean } | null;
  kyMaHieu: { String: string; Valid: boolean } | null;
  hangSanXuat: { String: string; Valid: boolean } | null;
  nuocSanXuat: { String: string; Valid: boolean } | null;
  nhomNuoc: { String: string; Valid: boolean } | null;
  chatLuong: { String: string; Valid: boolean } | null;
  ma5086: { String: string; Valid: boolean } | null;
  tenThuongMai: { String: string; Valid: boolean } | null;
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

  async getCompareGroups(): Promise<{ groups: string[]; total: number }> {
    return this.request<{ groups: string[]; total: number }>('/supplies/compare-groups');
  }

  async getCompareCatalog(keyword: string = '', page: number = 1, pageSize: number = 20, groupFilter: string = ''): Promise<PaginationResponse<ApiCompareSupply>> {
    return this.request<PaginationResponse<ApiCompareSupply>>(
      `/supplies/compare-catalog?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}&groupFilter=${encodeURIComponent(groupFilter)}`,
    );
  }

  async compareSupplies(maThuVien: string[]): Promise<CompareSuppliesResponse> {
    return this.request<CompareSuppliesResponse>('/supplies/compare', {
      method: 'POST',
      body: JSON.stringify({ maThuVien }),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
