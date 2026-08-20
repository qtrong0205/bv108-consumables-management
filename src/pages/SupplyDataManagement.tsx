import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import { Download, RefreshCw, Upload } from 'lucide-react';
import { apiService, ApiSupply, getNullableNumber, getNullableString } from '@/services/api';
import { useStoredAuth } from '@/hooks/use-stored-auth';
import { canEditSupplyData } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const editableHeaders = new Set([
  'GROUPNAME',
  'QUY_CACH_DONG_GOI',
  'QUY_CACH_GIAO_HANG',
  'QUY_CACH_TOI_THIEU',
  'TONGTHAU',
  'TON_KHO_MIN',
]);

const valueString = (value: { String: string; Valid: boolean } | null | undefined): string =>
  getNullableString(value);

const valueNumber = (value: { Int32: number; Valid: boolean } | { Float64: number; Valid: boolean } | null | undefined): string =>
  String(getNullableNumber(value));

export default function SupplyDataManagement() {
  const auth = useStoredAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<ApiSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const isAdmin = canEditSupplyData(auth?.user.role);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSupplyMappingCatalog();
      setItems(response.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Không tải được dữ liệu vật tư', description: error instanceof Error ? error.message : 'Yêu cầu thất bại' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => [
      valueString(item.id),
      valueString(item.name),
      valueString(item.typeName),
      valueString(item.thongTinThau),
    ].some((value) => value.toLowerCase().includes(keyword)));
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleExport = async () => {
    setProcessing(true);
    try {
      const result = await apiService.downloadSupplyMappingExcel();
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Không tải được Excel', description: error instanceof Error ? error.message : 'Yêu cầu thất bại' });
    } finally {
      setProcessing(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setProcessing(true);
    try {
      const response = await apiService.importSupplyMappingExcel(file);
      toast({ title: 'Cập nhật thành công', description: `${response.count || 0} dòng dữ liệu Khoa Trang bị đã được cập nhật.` });
      await load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Không thể cập nhật Excel', description: error instanceof Error ? error.message : 'File không hợp lệ' });
    } finally {
      setProcessing(false);
    }
  };

  const cellClass = (header: string) => editableHeaders.has(header)
    ? 'bg-yellow-50 dark:bg-yellow-950/30'
    : 'bg-background';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Sửa dữ liệu vật tư</h1>
        <p className="text-sm text-muted-foreground">
          Chỉ các cột nền vàng là dữ liệu Khoa Trang bị được phép chỉnh sửa. Các cột API phải giữ nguyên khi nhập Excel.
        </p>
      </div>

      <Card className="bg-neutral border-border">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-base">Danh sách supplies ({filteredItems.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setPage(1); }} placeholder="Tìm mã hoặc tên vật tư" className="w-64" />
            <Button variant="outline" onClick={() => void load()} disabled={loading || processing}><RefreshCw className="w-4 h-4 mr-2" />Làm mới</Button>
            <Button variant="outline" onClick={() => void handleExport()} disabled={processing || loading}><Download className="w-4 h-4 mr-2" />Tải XLSX</Button>
            {isAdmin && (
              <>
                <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(event) => void handleImport(event)} />
                <Button onClick={() => fileRef.current?.click()} disabled={processing || loading}><Upload className="w-4 h-4 mr-2" />Nạp XLSX</Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[70vh] border border-border rounded-md">
            <table className="min-w-[2200px] w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  {['IDX1', 'GROUPNAME', 'ID', 'IDX2', 'MA_HIEU', 'TYPENAME', 'NAME', 'UNIT', 'QUY_CACH_DONG_GOI', 'QUY_CACH_GIAO_HANG', 'QUY_CACH_TOI_THIEU', 'THONG_TIN_THAU', 'TONGTHAU', 'HANGSX', 'NUOC_SX', 'NHA_CUNG_CAP', 'PRICE', 'TONDAUKY', 'NHAPTRONGKY', 'XUATTRONGKY', 'TONGNHAP', 'TON_KHO_MIN'].map((header) => (
                    <th key={header} className={`border border-border px-2 py-2 text-left whitespace-nowrap font-semibold ${cellClass(header)}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={22} className="p-6 text-center">Đang tải dữ liệu...</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td colSpan={22} className="p-6 text-center">Không có dữ liệu</td></tr>
                ) : pageItems.map((item) => (
                  <tr key={item.idx1} className="hover:bg-muted/40">
                    <td className="border border-border px-2 py-1">{item.idx1}</td>
                    <td className={`border border-border px-2 py-1 ${cellClass('GROUPNAME')}`}>{valueString(item.groupName)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.id)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.idx2)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.maHieu)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.typeName)}</td>
                    <td className="border border-border px-2 py-1 min-w-64">{valueString(item.name)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.unit)}</td>
                    <td className={`border border-border px-2 py-1 ${cellClass('QUY_CACH_DONG_GOI')}`}>{valueString(item.quyCach)}</td>
                    <td className={`border border-border px-2 py-1 ${cellClass('QUY_CACH_GIAO_HANG')}`}>{valueString(item.quyCachGiaoHang)}</td>
                    <td className={`border border-border px-2 py-1 ${cellClass('QUY_CACH_TOI_THIEU')}`}>{valueString(item.quyCachToiThieu)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.thongTinThau)}</td>
                    <td className={`border border-border px-2 py-1 ${cellClass('TONGTHAU')}`}>{valueString(item.tongThau)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.hangSx)}</td>
                    <td className="border border-border px-2 py-1">{valueString(item.nuocSx)}</td>
                    <td className="border border-border px-2 py-1 min-w-64">{valueString(item.nhaCungCap)}</td>
                    <td className="border border-border px-2 py-1">{valueNumber(item.price)}</td>
                    <td className="border border-border px-2 py-1">{valueNumber(item.tonDauKy)}</td>
                    <td className="border border-border px-2 py-1">{valueNumber(item.nhapTrongKy)}</td>
                    <td className="border border-border px-2 py-1">{valueNumber(item.xuatTrongKy)}</td>
                    <td className="border border-border px-2 py-1">{valueNumber(item.tongNhap)}</td>
                    <td className={`border border-border px-2 py-1 ${cellClass('TON_KHO_MIN')}`}>{valueNumber(item.tonKhoMin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredItems.length} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
