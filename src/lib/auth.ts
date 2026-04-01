export type AuthRole =
  | 'admin'
  | 'chi_huy_khoa'
  | 'nhan_vien_kho'
  | 'thu_kho'
  | 'nhan_vien_ke_toan'
  | 'nhan_vien_thau'
  | 'truong_khoa'
  | 'nhan_vien';

export type AssignableRole =
  | 'admin'
  | 'chi_huy_khoa'
  | 'nhan_vien_kho'
  | 'thu_kho'
  | 'nhan_vien_ke_toan'
  | 'nhan_vien_thau';

export const ASSIGNABLE_ROLE_OPTIONS: Array<{ value: AssignableRole; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'chi_huy_khoa', label: 'Chỉ huy khoa' },
  { value: 'nhan_vien_kho', label: 'Nhân viên kho' },
  { value: 'thu_kho', label: 'Thủ kho' },
  { value: 'nhan_vien_ke_toan', label: 'Nhân viên kế toán' },
  { value: 'nhan_vien_thau', label: 'Nhân viên thầu' },
];

export const normalizeRole = (role?: string | null): AssignableRole | '' => {
  const normalizedInput = (role || '').trim().toLowerCase();
  switch (normalizedInput) {
    case 'truong_khoa':
      return 'admin';
    case 'nhan_vien':
      return 'nhan_vien_kho';
    case 'admin':
    case 'chi_huy_khoa':
    case 'nhan_vien_kho':
    case 'thu_kho':
    case 'nhan_vien_ke_toan':
    case 'nhan_vien_thau':
      return normalizedInput;
    default:
      return '';
  }
};

export const formatRoleLabel = (role: string): string => {
  switch (normalizeRole(role)) {
    case 'admin':
      return 'Admin';
    case 'chi_huy_khoa':
      return 'Chỉ huy khoa';
    case 'nhan_vien_kho':
      return 'Nhân viên kho';
    case 'thu_kho':
      return 'Thủ kho';
    case 'nhan_vien_ke_toan':
      return 'Nhân viên kế toán';
    case 'nhan_vien_thau':
      return 'Nhân viên thầu';
    default:
      return role;
  }
};

export const canCreateUsers = (role?: string | null): boolean => normalizeRole(role) === 'admin';

export const canCreateManualOrders = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'chi_huy_khoa';
};

export const canPlaceOrders = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'chi_huy_khoa';
};

export const canEditForecast = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'nhan_vien_thau';
};

export const canApproveForecast = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'thu_kho';
};

export const canApproveAllForecast = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'thu_kho';
};

export const canEditInvoiceNotes = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'chi_huy_khoa' || normalizedRole === 'nhan_vien_ke_toan';
};

export const canManageInvoiceWorkflow = (role?: string | null): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' || normalizedRole === 'chi_huy_khoa' || normalizedRole === 'nhan_vien_ke_toan';
};
