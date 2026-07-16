import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Loader2, ShieldCheck, Trash2, Upload, UserCog, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { apiService, ApiSupply, getNullableString, ManagedAccountUser } from '@/services/api';
import { AssignableRole, canAssignRole, canManageUserRole, canResetUserPassword, formatRoleLabel, getAssignableRoleOptions, normalizeRole } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useStoredAuth } from '@/hooks/use-stored-auth';

type AssignmentCatalogItem = {
  idx1: number;
  code: string;
  name: string;
  typeName: string;
};

const getTypeLevel1 = (typeName?: string): string => {
  if (!typeName) return '';
  const parts = typeName
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);
  const code = parts.length >= 1 ? parts[0] : '';
  const codeParts = code.split('.');
  if (codeParts.length <= 3) return code;
  return codeParts.slice(0, 3).join('.');
};

const toCatalogItem = (item: ApiSupply): AssignmentCatalogItem => ({
  idx1: item.idx1,
	code: String(item.materialCode || '').trim() || getNullableString(item.typeName) || getNullableString(item.id),
  name: getNullableString(item.name),
  typeName: getNullableString(item.typeName),
});

export default function TaskManagement() {
  const { toast } = useToast();
  const storedAuth = useStoredAuth();
  const currentUserRole = storedAuth?.user.role || '';
  const currentUserId = storedAuth?.user.id || 0;
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState('supplies');

  const [loadingState, setLoadingState] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [exportingAssignments, setExportingAssignments] = useState(false);
  const [importingAssignments, setImportingAssignments] = useState(false);
  const [loadingManagedUsers, setLoadingManagedUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [hideForOtherRoles, setHideForOtherRoles] = useState(false);
  const [totalSupplies, setTotalSupplies] = useState(0);
  const [users, setUsers] = useState<Array<{ id: number; username: string; email: string; role: string; assignedCount: number }>>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedAccountUser[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [catalog, setCatalog] = useState<AssignmentCatalogItem[]>([]);
  const [selectedSupplyIds, setSelectedSupplyIds] = useState<Set<number>>(new Set());
  const [typeLevel1PopoverOpen, setTypeLevel1PopoverOpen] = useState(false);
  const [selectedTypeLevel1, setSelectedTypeLevel1] = useState<string[]>([]);

  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffConfirmPassword, setStaffConfirmPassword] = useState('');
  const [staffRole, setStaffRole] = useState<AssignableRole | ''>('');
  const [resetPasswordUser, setResetPasswordUser] = useState<ManagedAccountUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordConfirmValue, setResetPasswordConfirmValue] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === selectedUserId) || null,
    [users, selectedUserId],
  );

  const selectedCount = selectedSupplyIds.size;
  const assignableRoleOptions = useMemo(
    () => getAssignableRoleOptions(currentUserRole),
    [currentUserRole],
  );
  const typeLevel1Options = useMemo(
    () => [...new Set(catalog.map((item) => getTypeLevel1(item.typeName)).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [catalog],
  );
  const filteredCatalog = useMemo(() => {
    const baseItems = selectedTypeLevel1.length === 0
      ? catalog
      : catalog.filter((item) => selectedTypeLevel1.includes(getTypeLevel1(item.typeName)));

    return [...baseItems].sort((left, right) => {
      const leftAssigned = selectedSupplyIds.has(left.idx1) ? 1 : 0;
      const rightAssigned = selectedSupplyIds.has(right.idx1) ? 1 : 0;

      if (leftAssigned !== rightAssigned) {
        return rightAssigned - leftAssigned;
      }

      return left.idx1 - right.idx1;
    });
  }, [catalog, selectedSupplyIds, selectedTypeLevel1]);
  const isAllTypeLevel1Selected = selectedTypeLevel1.length > 0 && selectedTypeLevel1.length === typeLevel1Options.length;
  const typeLevel1Label = selectedTypeLevel1.length === 0
    ? 'Tất cả mã cấp 1'
    : selectedTypeLevel1.length === 1
      ? selectedTypeLevel1[0]
      : `${selectedTypeLevel1.length} mã cấp 1 đã chọn`;

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const loadState = async () => {
    setLoadingState(true);
    try {
      const response = await apiService.getSupplyTaskState();
      const nextUsers = response.users || [];
      setHideForOtherRoles(response.hideForOtherRoles);
      setTotalSupplies(response.totalSupplies);
      setUsers(nextUsers);

      const hasSelectedUser = nextUsers.some((user) => String(user.id) === selectedUserId);
      if (!hasSelectedUser) {
        if (nextUsers.length > 0) {
          setSelectedUserId(String(nextUsers[0].id));
        } else {
          setSelectedUserId('');
          setSelectedSupplyIds(new Set());
        }
      }
    } catch (error) {
      toast({
        title: 'Không tải được trạng thái tác vụ',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải dữ liệu tác vụ',
        variant: 'destructive',
      });
    } finally {
      setLoadingState(false);
    }
  };

  const loadCatalog = async (keyword: string) => {
    setLoadingCatalog(true);
    try {
      const response = await apiService.getSupplyTaskCatalog(keyword);
      setCatalog((response.data || []).map(toCatalogItem));
    } catch (error) {
      toast({
        title: 'Không tải được danh mục vật tư',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh mục vật tư',
        variant: 'destructive',
      });
    } finally {
      setLoadingCatalog(false);
    }
  };

  const loadAssignments = async (userId: number) => {
    setLoadingAssignments(true);
    try {
      const response = await apiService.getSupplyTaskAssignments(userId);
      const assignedIds = new Set((response.assignments || []).map((item) => item.idx1));
      setSelectedSupplyIds(assignedIds);
    } catch (error) {
      toast({
        title: 'Không tải được danh sách phân công',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải phân công vật tư',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const loadManagedUsers = async () => {
    setLoadingManagedUsers(true);
    try {
      const response = await apiService.getManagedUsers();
      setManagedUsers(response.users || []);
    } catch (error) {
      toast({
        title: 'Không tải được danh sách tài khoản',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải danh sách tài khoản',
        variant: 'destructive',
      });
    } finally {
      setLoadingManagedUsers(false);
    }
  };

  useEffect(() => {
    void loadState();
    void loadManagedUsers();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCatalog(searchKeyword.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchKeyword]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedSupplyIds(new Set());
      return;
    }

    void loadAssignments(Number(selectedUserId));
  }, [selectedUserId]);

  const handleToggleHideAll = async (nextValue: boolean) => {
    setSavingVisibility(true);
    try {
      await apiService.updateSupplyTaskVisibility({ hideForOtherRoles: nextValue });
      setHideForOtherRoles(nextValue);
      toast({
        title: 'Đã cập nhật chế độ hiển thị',
        description: nextValue
          ? 'Đã bật chế độ chỉ hiển thị vật tư được phân công cho các role khác.'
          : 'Đã tắt chế độ giới hạn hiển thị vật tư cho các role khác.',
      });
    } catch (error) {
      toast({
        title: 'Không cập nhật được chế độ hiển thị',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu tùy chọn hiển thị',
        variant: 'destructive',
      });
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleToggleSupply = (idx1: number) => {
    setSelectedSupplyIds((previous) => {
      const next = new Set(previous);
      if (next.has(idx1)) {
        next.delete(idx1);
      } else {
        next.add(idx1);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedSupplyIds((previous) => {
      const next = new Set(previous);
      for (const item of filteredCatalog) {
        next.add(item.idx1);
      }
      return next;
    });
  };

  const handleClearAllVisible = () => {
    setSelectedSupplyIds((previous) => {
      const next = new Set(previous);
      for (const item of filteredCatalog) {
        next.delete(item.idx1);
      }
      return next;
    });
  };

  const handleTypeLevel1Toggle = (code: string) => {
    setSelectedTypeLevel1((prev) => {
      if (prev.includes(code)) {
        return prev.filter((item) => item !== code);
      }
      return [...prev, code];
    });
  };

  const handleSelectAllTypeLevel1 = () => {
    if (selectedTypeLevel1.length === typeLevel1Options.length) {
      setSelectedTypeLevel1([]);
    } else {
      setSelectedTypeLevel1([...typeLevel1Options]);
    }
  };

  const handleClearTypeLevel1 = () => {
    setSelectedTypeLevel1([]);
  };

  const handleSaveAssignments = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Chưa chọn tài khoản',
        description: 'Vui lòng chọn một tài khoản để lưu phân công vật tư.',
        variant: 'destructive',
      });
      return;
    }

    setSavingAssignments(true);
    try {
      await apiService.updateSupplyTaskAssignments({
        userId: Number(selectedUserId),
        supplyIdx1List: Array.from(selectedSupplyIds),
      });

      toast({
        title: 'Lưu phân công thành công',
        description: `Đã cập nhật ${selectedCount} vật tư cho ${selectedUser?.username || 'tài khoản được chọn'}.`,
      });

      await loadState();
    } catch (error) {
      toast({
        title: 'Không lưu được phân công',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi lưu phân công vật tư',
        variant: 'destructive',
      });
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleExportAssignments = async () => {
    setExportingAssignments(true);
    try {
      const { blob, filename } = await apiService.downloadSupplyTaskAssignmentsExport();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      toast({
        title: 'Đã xuất file phân quyền',
        description: 'File Excel đã được tải xuống. Có thể mở, chỉnh sửa và import lại đúng file này.',
      });
    } catch (error) {
      toast({
        title: 'Không xuất được file phân quyền',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải file export',
        variant: 'destructive',
      });
    } finally {
      setExportingAssignments(false);
    }
  };

  const handleTriggerImportAssignments = () => {
    importFileInputRef.current?.click();
  };

  const handleImportAssignmentsFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setImportingAssignments(true);

    try {
      const response = await apiService.importSupplyTaskAssignments(file);
      await Promise.all([
        loadState(),
        selectedUserId ? loadAssignments(Number(selectedUserId)) : Promise.resolve(),
      ]);

      toast({
        title: 'Import phân quyền thành công',
        description: `${response.updatedCount} dòng đã xử lý, ${response.assignedCount} vật tư đã gán và ${response.clearedCount} vật tư đã bỏ phụ trách.`,
      });
    } catch (error) {
      toast({
        title: 'Không import được file phân quyền',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi đọc file import',
        variant: 'destructive',
      });
    } finally {
      setImportingAssignments(false);
    }
  };

  const resetCreateUserForm = () => {
    setStaffName('');
    setStaffEmail('');
    setStaffPassword('');
    setStaffConfirmPassword('');
    setStaffRole('');
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!staffName.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập họ và tên', variant: 'destructive' });
      return;
    }

    if (!validateEmail(staffEmail)) {
      toast({ title: 'Lỗi', description: 'Email không hợp lệ', variant: 'destructive' });
      return;
    }

    if (staffPassword.length < 6) {
      toast({ title: 'Lỗi', description: 'Mật khẩu phải có ít nhất 6 ký tự', variant: 'destructive' });
      return;
    }

    if (staffPassword !== staffConfirmPassword) {
      toast({ title: 'Lỗi', description: 'Mật khẩu xác nhận không khớp', variant: 'destructive' });
      return;
    }

    if (!staffRole) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn vai trò', variant: 'destructive' });
      return;
    }

    if (!canAssignRole(currentUserRole, staffRole)) {
      toast({ title: 'Lỗi', description: 'Bạn không có quyền tạo tài khoản với vai trò này', variant: 'destructive' });
      return;
    }

    setCreatingUser(true);
    try {
      await apiService.register({
        username: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        password: staffPassword,
        role: staffRole,
      });

      toast({
        title: 'Tạo tài khoản thành công',
        description: 'Tài khoản mới đã được thêm vào hệ thống.',
      });

      resetCreateUserForm();
      await Promise.all([loadManagedUsers(), loadState()]);
    } catch (error) {
      toast({
        title: 'Tạo tài khoản thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateUserRole = async (user: ManagedAccountUser, role: AssignableRole) => {
    if (user.id === currentUserId) {
      toast({
        title: 'Không thể đổi role',
        description: 'Không thể thay đổi role của chính tài khoản đang đăng nhập.',
        variant: 'destructive',
      });
      return;
    }

    if (!canManageUserRole(currentUserRole, user.role)) {
      toast({
        title: 'Không thể đổi role',
        description: 'Bạn không có quyền quản lý tài khoản này.',
        variant: 'destructive',
      });
      return;
    }

    if (!canAssignRole(currentUserRole, role)) {
      toast({
        title: 'Không thể đổi role',
        description: 'Bạn không có quyền gán vai trò này.',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingRoleUserId(user.id);
    try {
      await apiService.updateManagedUserRole(user.id, { role });
      toast({
        title: 'Đã cập nhật role',
        description: `${user.username} đã được đổi sang ${formatRoleLabel(role)}.`,
      });
      await Promise.all([loadManagedUsers(), loadState()]);
    } catch (error) {
      toast({
        title: 'Không cập nhật được role',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleDeleteUser = async (user: ManagedAccountUser) => {
    if (user.id === currentUserId) {
      toast({
        title: 'Không thể xóa tài khoản',
        description: 'Không thể xóa chính tài khoản đang đăng nhập.',
        variant: 'destructive',
      });
      return;
    }

    if (!canManageUserRole(currentUserRole, user.role)) {
      toast({
        title: 'Không thể xóa tài khoản',
        description: 'Bạn không có quyền xóa tài khoản này.',
        variant: 'destructive',
      });
      return;
    }

    const isConfirmed = window.confirm(`Xóa tài khoản ${user.username} (${user.email})?`);
    if (!isConfirmed) {
      return;
    }

    setDeletingUserId(user.id);
    try {
      await apiService.deleteManagedUser(user.id);
      toast({
        title: 'Đã xóa tài khoản',
        description: `Đã xóa tài khoản ${user.username}.`,
      });
      await Promise.all([loadManagedUsers(), loadState()]);
    } catch (error) {
      toast({
        title: 'Không xóa được tài khoản',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tài khoản',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const openResetPasswordDialog = (user: ManagedAccountUser) => {
    if (user.id === currentUserId) {
      toast({
        title: 'Không thể đặt lại mật khẩu',
        description: 'Không thể đặt lại mật khẩu của chính tài khoản đang đăng nhập tại màn này.',
        variant: 'destructive',
      });
      return;
    }

    if (!canResetUserPassword(currentUserRole) || !canManageUserRole(currentUserRole, user.role)) {
      toast({
        title: 'Không thể đặt lại mật khẩu',
        description: 'Bạn không có quyền đặt lại mật khẩu cho tài khoản này.',
        variant: 'destructive',
      });
      return;
    }

    setResetPasswordUser(user);
    setResetPasswordValue('');
    setResetPasswordConfirmValue('');
  };

  const closeResetPasswordDialog = () => {
    if (resettingPassword) {
      return;
    }

    setResetPasswordUser(null);
    setResetPasswordValue('');
    setResetPasswordConfirmValue('');
  };

  const handleResetUserPassword = async () => {
    if (!resetPasswordUser) {
      return;
    }

    if (resetPasswordValue.trim().length < 6) {
      toast({
        title: 'Mật khẩu không hợp lệ',
        description: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
        variant: 'destructive',
      });
      return;
    }

    if (resetPasswordValue !== resetPasswordConfirmValue) {
      toast({
        title: 'Mật khẩu không khớp',
        description: 'Mật khẩu xác nhận không khớp.',
        variant: 'destructive',
      });
      return;
    }

    setResettingPassword(true);
    try {
      await apiService.resetManagedUserPassword(resetPasswordUser.id, { password: resetPasswordValue });
      toast({
        title: 'Đã đặt lại mật khẩu',
        description: `Mật khẩu mới của ${resetPasswordUser.username} đã được lưu. Hãy gửi lại mật khẩu này cho nhân viên.`,
      });
      closeResetPasswordDialog();
    } catch (error) {
      toast({
        title: 'Không đặt lại được mật khẩu',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi đặt lại mật khẩu',
        variant: 'destructive',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  if (loadingState) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="bg-neutral border-border">
          <CardContent className="py-12 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang tải trang tác vụ...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tác vụ phân quyền vật tư</h1>
        <p className="text-muted-foreground mt-1">Admin và Chỉ huy khoa có thể bật/tắt hiển thị vật tư và phân công vật tư theo từng tài khoản.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2 bg-slate-100 border border-slate-200">
          <TabsTrigger value="supplies">Phân quyền vật tư</TabsTrigger>
          <TabsTrigger value="accounts">Quản lí tài khoản</TabsTrigger>
        </TabsList>

        <TabsContent value="supplies" className="space-y-6">
          <Card className="bg-neutral border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Chế độ hiển thị vật tư
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={hideForOtherRoles}
                  disabled={savingVisibility}
                  onCheckedChange={(checked) => void handleToggleHideAll(checked === true)}
                  aria-label="Bật hoặc tắt ẩn vật tư cho các role khác"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Chỉ hiển thị vật tư được phân công cho người nhập dự trù</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tổng vật tư hiện có: {totalSupplies}. Khi bật chế độ này, chỉ Nhân viên thầu bị giới hạn theo vật tư được giao; Admin, Chỉ huy khoa, Thủ kho, Nhân viên kế toán và Nhân viên kho vẫn nhìn full danh mục.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Phân công vật tư theo tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 w-full lg:max-w-[70vw]">
                <div className="flex-none w-full lg:w-[40vw]">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-900">
                      <SelectValue placeholder="Chọn tài khoản cần phân công" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          ID {user.id} - {user.username} ({formatRoleLabel(user.role)}) - {user.assignedCount} vật tư
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {selectedUser ? (
                    <>
                      <Badge className="bg-slate-100 text-slate-800 border border-slate-300">ID {selectedUser.id} - {selectedUser.username}</Badge>
                      <Badge className="bg-sky-100 text-sky-800 border border-sky-300">{formatRoleLabel(selectedUser.role)}</Badge>
                      <Badge className="bg-blue-600 hover:bg-blue-600 text-white">Đã chọn {selectedCount} vật tư</Badge>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center w-full lg:max-w-[40vw]">
                <div className="lg:col-span-1">
                  <Popover open={typeLevel1PopoverOpen} onOpenChange={setTypeLevel1PopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-between w-full border border-slate-200 text-foreground hover:bg-slate-50">
                        <span className="truncate">{typeLevel1Label}</span>
                        <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2 border-violet-200" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Mã cấp 1</p>
                          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-violet-700 hover:text-violet-900 hover:bg-violet-100" onClick={handleSelectAllTypeLevel1}>
                            {isAllTypeLevel1Selected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                          </Button>
                        </div>
                        <div className="max-h-56 overflow-y-auto border border-violet-200 rounded-md divide-y divide-violet-100 bg-white">
                          {typeLevel1Options.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-3 py-2">Chưa có dữ liệu mã cấp 1</p>
                          ) : (
                            typeLevel1Options.map((code) => (
                              <label key={code} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-violet-50">
                                <Checkbox
                                  checked={selectedTypeLevel1.includes(code)}
                                  onCheckedChange={() => handleTypeLevel1Toggle(code)}
                                  aria-label={`Chọn mã cấp 1 ${code}`}
                                />
                                <span className="text-sm text-foreground truncate">{code}</span>
                              </label>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="sm" className="text-violet-700 hover:text-violet-900 hover:bg-violet-100" onClick={handleClearTypeLevel1}>Xóa lọc</Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="lg:col-span-2">
                  <Input
                    className="bg-white border border-slate-200 text-slate-900 placeholder:text-muted-foreground focus-visible:ring-cyan-500"
                    placeholder="Tìm vật tư theo mã hoặc tên..."
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                  />
                </div>

                {selectedTypeLevel1.length > 0 && (
                  <Badge className="bg-violet-600 hover:bg-violet-600 text-white">Đang lọc {selectedTypeLevel1.length} mã cấp 1</Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleSelectAllVisible} disabled={loadingCatalog || loadingAssignments}>
                  Chọn tất cả
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleClearAllVisible} disabled={loadingCatalog || loadingAssignments}>
                  Bỏ chọn
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => void handleExportAssignments()} disabled={exportingAssignments}>
                  {exportingAssignments ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Xuất Excel
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={handleTriggerImportAssignments} disabled={importingAssignments}>
                  {importingAssignments ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import Excel phân công
                </Button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) => void handleImportAssignmentsFile(event)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                File export Excel giữ nguyên format dữ liệu vật tư hiện tại và thêm cột cuối <code>id_thu_ki_phu_trach</code>. Cột này chỉ được nhập ID của tài khoản có role Nhân viên thầu.
              </p>

              <div className="border border-slate-300 rounded-md max-h-[420px] overflow-y-auto bg-slate-50/50">
                {loadingCatalog || loadingAssignments ? (
                  <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang tải dữ liệu vật tư...
                  </div>
                ) : filteredCatalog.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">Không có vật tư phù hợp với từ khóa tìm kiếm.</div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {filteredCatalog.map((item) => (
                      <label key={item.idx1} className="flex items-start gap-3 px-3 py-2.5 hover:bg-sky-50 cursor-pointer">
                        <Checkbox
                          checked={selectedSupplyIds.has(item.idx1)}
                          onCheckedChange={() => handleToggleSupply(item.idx1)}
                          aria-label={`Chọn vật tư ${item.name}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name || 'Chưa có tên vật tư'}</p>
                          <p className="text-xs text-muted-foreground">IDX1: {item.idx1} | Mã VT: {item.code || '—'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => void handleSaveAssignments()} disabled={savingAssignments || !selectedUserId}>
                  {savingAssignments ? 'Đang lưu...' : 'Lưu phân công'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card className="bg-neutral border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Tạo tài khoản mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} autoComplete="off" className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="staffName">Họ và tên</Label>
                  <Input
                    id="staffName"
                    name="staff-account-name"
                    value={staffName}
                    onChange={(event) => setStaffName(event.target.value)}
                    placeholder="Nhập họ và tên"
                    className="bg-slate-50 border-slate-300"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffEmail">Email</Label>
                  <Input
                    id="staffEmail"
                    name="staff-account-email"
                    type="email"
                    value={staffEmail}
                    onChange={(event) => setStaffEmail(event.target.value)}
                    placeholder="Nhập email"
                    className="bg-slate-50 border-slate-300"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffRole">Vai trò</Label>
                  <Select value={staffRole} onValueChange={(value) => setStaffRole(value as AssignableRole)}>
                    <SelectTrigger id="staffRole" className="bg-slate-50 border-slate-300">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoleOptions.map((roleOption) => (
                        <SelectItem key={roleOption.value} value={roleOption.value}>
                          {roleOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffPassword">Mật khẩu</Label>
                  <Input
                    id="staffPassword"
                    name="staff-account-password"
                    type="password"
                    value={staffPassword}
                    onChange={(event) => setStaffPassword(event.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className="bg-slate-50 border-slate-300"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffConfirmPassword">Xác nhận mật khẩu</Label>
                  <Input
                    id="staffConfirmPassword"
                    name="staff-account-password-confirm"
                    type="password"
                    value={staffConfirmPassword}
                    onChange={(event) => setStaffConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="bg-slate-50 border-slate-300"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={creatingUser}>
                    {creatingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-neutral border-border">
            <CardHeader>
              <CardTitle className="text-base">Quản lí toàn bộ tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingManagedUsers ? (
                <div className="py-10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tải danh sách tài khoản...
                </div>
              ) : managedUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground">Chưa có tài khoản nào.</div>
              ) : (
                <div className="space-y-2">
                  {managedUsers.map((user) => {
                    const normalizedRole = normalizeRole(user.role);
                    const canMutate = user.id !== currentUserId && canManageUserRole(currentUserRole, user.role);
                    const canResetPassword = user.id !== currentUserId
                      && canManageUserRole(currentUserRole, user.role)
                      && canResetUserPassword(currentUserRole);

                    return (
                      <div key={user.id} className="flex flex-col lg:flex-row lg:items-center gap-3 border border-slate-200 rounded-md p-3 bg-slate-50/50">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
                          <p className="text-xs text-slate-600 truncate">{user.email}</p>
                          <p className="text-xs text-slate-500">ID: {user.id}</p>
                        </div>

                        <div className="w-full lg:w-64">
                          {normalizedRole && canMutate ? (
                            <Select
                              value={normalizedRole}
                              onValueChange={(value) => void handleUpdateUserRole(user, value as AssignableRole)}
                              disabled={!canMutate || updatingRoleUserId === user.id}
                            >
                              <SelectTrigger className="bg-violet-50 border-violet-300 text-violet-900">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {assignableRoleOptions.map((roleOption) => (
                                  <SelectItem key={roleOption.value} value={roleOption.value}>
                                    {roleOption.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">{user.role}</Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          {user.id === currentUserId && (
                            <Badge variant="secondary">Tài khoản hiện tại</Badge>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!canResetPassword || resettingPassword}
                            onClick={() => openResetPasswordDialog(user)}
                          >
                            Đặt lại mật khẩu
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={!canMutate || deletingUserId === user.id}
                            onClick={() => void handleDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingUserId === user.id ? 'Đang xóa...' : 'Xóa'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={resetPasswordUser !== null} onOpenChange={(open) => { if (!open) closeResetPasswordDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
            <DialogDescription>
              {resetPasswordUser
                ? `Nhập mật khẩu mới cho ${resetPasswordUser.username} (${resetPasswordUser.email}).`
                : 'Nhập mật khẩu mới cho tài khoản.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetUserPassword">Mật khẩu mới</Label>
              <Input
                id="resetUserPassword"
                name="reset-user-password"
                type="password"
                value={resetPasswordValue}
                onChange={(event) => setResetPasswordValue(event.target.value)}
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resetUserPasswordConfirm">Xác nhận mật khẩu mới</Label>
              <Input
                id="resetUserPasswordConfirm"
                name="reset-user-password-confirm"
                type="password"
                value={resetPasswordConfirmValue}
                onChange={(event) => setResetPasswordConfirmValue(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeResetPasswordDialog} disabled={resettingPassword}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void handleResetUserPassword()} disabled={resettingPassword}>
              {resettingPassword ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
