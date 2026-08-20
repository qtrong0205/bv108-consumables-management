import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Copy, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  apiService,
  VinmesExportFilters,
  VinmesExportResponse,
  VinmesMappedPurchaseOrder,
  VinmesPurchaseOrderBatchResponse,
  VinmesPurchaseOrderExecutionResult,
} from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();
type VinmesApiType = 'original' | 'mapped';

const isMappedPurchaseOrder = (item: Record<string, unknown> | VinmesMappedPurchaseOrder): item is VinmesMappedPurchaseOrder => (
  'master' in item && 'details' in item && 'source' in item && Array.isArray(item.validationErrors)
);

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) {
    throw new Error('Trình duyệt không cho phép sao chép tự động');
  }
};

export default function VinmesExport() {
  const { toast } = useToast();
  const location = useLocation();
  const [month, setMonth] = useState(String(currentMonth));
  const [year, setYear] = useState(String(currentYear));
  const [materialCode, setMaterialCode] = useState('');
  const [limit, setLimit] = useState('200');
  const [all, setAll] = useState(false);
  // Load the mapped view by default so the send controls are ready when this page opens.
  const [apiType, setApiType] = useState<VinmesApiType>('mapped');
  const [result, setResult] = useState<VinmesExportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<VinmesPurchaseOrderBatchResponse | null>(null);
  const [creatingRow, setCreatingRow] = useState<string | null>(null);
  const [rowResults, setRowResults] = useState<Record<string, VinmesPurchaseOrderExecutionResult>>({});

  const mappedOrders = useMemo(
    () => result?.data.filter(isMappedPurchaseOrder) ?? [],
    [result],
  );

  const jsonValue = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : ''),
    [result],
  );

  const load = async (event?: FormEvent) => {
    event?.preventDefault();

    const parsedMonth = Number(month);
    const parsedYear = Number(year);
    const parsedLimit = Number(limit);
    if (!all && (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
      toast({ variant: 'destructive', title: 'Tháng không hợp lệ', description: 'Tháng phải nằm trong khoảng từ 1 đến 12.' });
      return;
    }
    if (!all && (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 3000)) {
      toast({ variant: 'destructive', title: 'Năm không hợp lệ', description: 'Năm phải nằm trong khoảng từ 2000 đến 3000.' });
      return;
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      toast({ variant: 'destructive', title: 'Giới hạn không hợp lệ', description: 'Giới hạn phải nằm trong khoảng từ 1 đến 1000.' });
      return;
    }

    const filters: VinmesExportFilters = {
      all,
      limit: parsedLimit,
      materialCode: materialCode.trim(),
    };
    if (!all) {
      filters.month = parsedMonth;
      filters.year = parsedYear;
    }

    setLoading(true);
    try {
      const response = apiType === 'mapped'
        ? await apiService.getMappedExportToVinmes(filters)
        : await apiService.getExportToVinmes(filters);
      setResult(response);
      setBatchResult(null);
      setRowResults({});
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Không tải được dữ liệu Vinmes',
        description: error instanceof Error ? error.message : 'Yêu cầu thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // A route entry gets a fresh request, so stale mapped/export results are not reused.
    void load();
  }, [location.key]);

  const handleCopy = async () => {
    if (!jsonValue) return;
    try {
      await copyText(jsonValue);
      toast({ title: 'Đã sao chép JSON', description: 'Dữ liệu Vinmes đã được sao chép vào bộ nhớ tạm.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Không thể sao chép JSON',
        description: error instanceof Error ? error.message : 'Vui lòng thử lại',
      });
    }
  };

  const handleCreateBatch = async () => {
    if (!result || mappedOrders.length === 0 || result.invalidCount !== 0) return;
    const confirmed = window.confirm(
      `Bạn sắp tạo ${mappedOrders.length} phiếu Purchase Order trên VINMES. Tiếp tục?`,
    );
    if (!confirmed) return;

    setBatchLoading(true);
    setBatchResult(null);
    try {
      const response = await apiService.createVinmesPurchaseOrderBatch(mappedOrders);
      setBatchResult(response);
      toast({
        title: 'Đã xử lý danh sách VINMES',
        description: `${response.success}/${response.total} phiếu thành công.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Không thể đẩy danh sách lên VINMES',
        description: error instanceof Error ? error.message : 'Yêu cầu thất bại',
      });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleCreateOne = async (item: VinmesMappedPurchaseOrder, index: number) => {
    const key = `${item.source.soPhieu}-${index}`;
    setCreatingRow(key);
    try {
      const response = await apiService.createVinmesPurchaseOrder(item);
      setRowResults((current) => ({ ...current, [key]: response }));
      toast({
        title: response.result === 'PASS' ? 'Đã gửi phiếu lên VINMES' : 'VINMES không tạo được phiếu',
        description: `${item.source.soHoaDon}: ${response.result}`,
        variant: response.result === 'PASS' ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Không thể gửi hóa đơn ${item.source.soHoaDon}`,
        description: error instanceof Error ? error.message : 'Yêu cầu thất bại',
      });
    } finally {
      setCreatingRow(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">API to Vinmes</h1>
        <p className="text-sm text-muted-foreground">
          Chọn dữ liệu gốc hoặc dữ liệu đã map ID Vinmes và xem trực tiếp JSON trả về.
        </p>
      </div>

      <Card className="bg-neutral border-border">
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc dữ liệu xuất</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void load(event)} className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="block text-muted-foreground">Loại API</span>
              <Select value={apiType} onValueChange={(value) => setApiType(value as VinmesApiType)}>
                <SelectTrigger className="w-52 bg-neutral text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">API dữ liệu gốc</SelectItem>
                  <SelectItem value="mapped">API đã map ID</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="block text-muted-foreground">Tháng</span>
              <Input type="number" min={1} max={12} value={month} onChange={(event) => setMonth(event.target.value)} disabled={all} className="w-24" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block text-muted-foreground">Năm</span>
              <Input type="number" min={2000} max={3000} value={year} onChange={(event) => setYear(event.target.value)} disabled={all} className="w-28" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block text-muted-foreground">Mã vật tư</span>
              <Input value={materialCode} onChange={(event) => setMaterialCode(event.target.value)} placeholder="Tất cả mã" className="w-48" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="block text-muted-foreground">Số dòng</span>
              <Input type="number" min={1} max={1000} value={limit} onChange={(event) => setLimit(event.target.value)} className="w-24" />
            </label>
            <label className="flex h-9 items-center gap-2 px-1 text-sm cursor-pointer">
              <input type="checkbox" checked={all} onChange={(event) => setAll(event.target.checked)} className="h-4 w-4" />
              Tất cả thời gian
            </label>
            <Button type="submit" disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" /> : <CalendarDays />}
              {loading ? 'Đang tải...' : 'Lấy dữ liệu'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <>
        <Card className="bg-neutral border-border">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Tạo Purchase Order trên VINMES</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {mappedOrders.length} phiếu đã map, {result?.invalidCount ?? 0} phiếu không hợp lệ
              </p>
            </div>
            <Button
              type="button"
              onClick={() => void handleCreateBatch()}
              disabled={batchLoading || creatingRow !== null || mappedOrders.length === 0 || (result?.invalidCount ?? 0) !== 0}
            >
              {batchLoading ? <RefreshCw className="animate-spin" /> : <Send />}
              {batchLoading ? `Đang xử lý ${mappedOrders.length} phiếu...` : 'Đẩy lên VINMES'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {(result?.invalidCount ?? 0) > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Không thể đẩy theo lô khi còn phiếu chưa map đủ ID. Hãy sửa toàn bộ lỗi validation trước.
              </div>
            )}

            {batchResult && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-4 text-sm sm:grid-cols-4">
                <div><span className="text-muted-foreground">Tổng:</span> {batchResult.total}</div>
                <div><span className="text-muted-foreground">Thành công:</span> {batchResult.success}</div>
                <div><span className="text-muted-foreground">Thất bại:</span> {batchResult.failed}</div>
                <div><span className="text-muted-foreground">Bỏ qua:</span> {batchResult.skipped}</div>
              </div>
            )}

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Hóa đơn</th>
					<th className="px-3 py-2 font-medium">Số phiếu</th>
                    <th className="px-3 py-2 font-medium">Kết quả</th>
                    <th className="px-3 py-2 font-medium">po_id / rvalue</th>
                    <th className="px-3 py-2 font-medium">Lỗi</th>
                    <th className="px-3 py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedOrders.map((item, index) => {
                    const key = `${item.source.soPhieu}-${index}`;
                    const single = rowResults[key];
                    const batch = batchResult?.results.find((entry) => (
                      entry.soPhieu === item.source.soPhieu && entry.soHoaDon === item.source.soHoaDon
                    ));
                    const status = batch?.result ?? single?.result;
                    const poId = batch?.po_id ?? single?.poId;
                    const rvalue = batch?.master_rvalue ?? single?.master.rvalue;
                    const error = batch?.error ?? single?.error ?? single?.master.error;
                    const isCreating = creatingRow === key;
                    const isAlreadyHandled = status === 'PASS'
                      || status === 'SKIPPED'
                      || status === 'PARTIAL_FAIL'
                      || status === 'FAIL_UNCERTAIN';
                    return (
                      <tr key={key} className="border-t border-border align-top">
                        <td className="px-3 py-2">{item.source.soHoaDon}</td>
                        <td className="px-3 py-2">{item.source.soPhieu}</td>
                        <td className="px-3 py-2">{status ?? (item.validationErrors.length > 0 ? 'INVALID' : 'Chưa gửi')}</td>
                        <td className="px-3 py-2">{poId ?? rvalue ?? '—'}</td>
                        <td className="max-w-xs px-3 py-2 text-destructive">{error ?? item.validationErrors[0]?.message ?? '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void handleCreateOne(item, index)}
                            disabled={batchLoading || creatingRow !== null || item.validationErrors.length > 0 || isAlreadyHandled}
                          >
                            {isCreating ? <RefreshCw className="animate-spin" /> : <Send />}
                            {isCreating ? 'Đang gửi...' : 'Gửi VINMES'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {mappedOrders.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Không có phiếu mapped để gửi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </>

      <Card className="bg-neutral border-border">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">JSON trả về</CardTitle>
            {result && (
              <p className="mt-1 text-xs text-muted-foreground">
                {result.count} phiếu, {result.detailCount} dòng chi tiết
                {result.invalidCount !== undefined && `, ${result.invalidCount} phiếu chưa map đủ ID`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={loading ? 'animate-spin' : ''} />
              Làm mới
            </Button>
            <Button type="button" onClick={() => void handleCopy()} disabled={!jsonValue || loading}>
              <Copy />
              Sao chép JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jsonValue ? (
            <pre className="max-h-[70vh] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-5 text-slate-100 whitespace-pre-wrap break-words">
              {jsonValue}
            </pre>
          ) : (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu. Bấm “Lấy dữ liệu” để gọi API Vinmes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
