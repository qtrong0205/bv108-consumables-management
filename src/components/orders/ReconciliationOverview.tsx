import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderHistory, HoaDonUBot } from '@/types';
import { AlertTriangle, FileSearch, PackageCheck, PackageX } from 'lucide-react';

interface ReconciliationOverviewProps {
  orders: OrderHistory[];
  hoaDons: HoaDonUBot[];
}

type QtyStatus = 'DU_SO_LUONG' | 'THIEU_SO_LUONG' | 'THUA_SO_LUONG';
type MaterialStatus = 'DUNG_VAT_TU' | 'DUNG_VAT_TU_THEO_TEN' | 'SAI_VAT_TU' | 'CHUA_DANH_GIA';

interface InvoiceLine {
  idHoaDon: string;
  soHoaDon: string;
  congTy: string;
  maHangHoa: string;
  tenHangHoa: string;
  donViTinh: string;
  soLuong: number;
  ngayHoaDon: Date | null;
}

interface OrderMatch {
  order: OrderHistory;
  line: InvoiceLine;
  score: number;
  nameSimilarity: number;
}

interface InvoiceCompareRow {
  idHoaDon: string;
  soHoaDon: string;
  congTy: string;
  invoiceQty: number;
  matchedQty: number;
  diff: number;
  qtyStatus: QtyStatus;
  materialStatus: MaterialStatus;
  note: string;
}

const normalize = (value: string | undefined | null): string => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const parseDate = (value: string | Date | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const similarity = (a: string, b: string): number => {
  const aa = normalize(a);
  const bb = normalize(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.9;

  const aTokens = aa.split(' ');
  const bTokens = bb.split(' ');
  let hit = 0;
  for (const token of aTokens) {
    if (bTokens.includes(token)) hit += 1;
  }
  return hit / Math.max(aTokens.length, bTokens.length);
};

const getQtyStatus = (diff: number): QtyStatus => {
  if (Math.abs(diff) < 0.0001) return 'DU_SO_LUONG';
  if (diff < 0) return 'THIEU_SO_LUONG';
  return 'THUA_SO_LUONG';
};

const qtyStatusBadge = (status: QtyStatus) => {
  if (status === 'DU_SO_LUONG') {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Đủ số lượng</Badge>;
  }
  if (status === 'THIEU_SO_LUONG') {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Thiếu số lượng</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700 border-red-200">Thừa số lượng</Badge>;
};

const materialStatusBadge = (status: MaterialStatus) => {
  if (status === 'DUNG_VAT_TU') {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Đúng vật tư</Badge>;
  }
  if (status === 'DUNG_VAT_TU_THEO_TEN') {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Đúng theo tên</Badge>;
  }
  if (status === 'SAI_VAT_TU') {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Sai vật tư</Badge>;
  }
  return <Badge variant="outline">Chưa đánh giá</Badge>;
};

export default function ReconciliationOverview({ orders, hoaDons }: ReconciliationOverviewProps) {
  const report = useMemo(() => {
    const invoiceLines: InvoiceLine[] = hoaDons.map((hd) => ({
      idHoaDon: hd.idHoaDon || String(hd.id),
      soHoaDon: hd.soHoaDon || '',
      congTy: hd.congTy || '',
      maHangHoa: hd.maHangHoa || '',
      tenHangHoa: hd.tenHangHoa || '',
      donViTinh: hd.donViTinh || '',
      soLuong: Number(hd.soLuong || 0),
      ngayHoaDon: parseDate(hd.ngayHoaDon),
    }));

    const bySupplier = new Map<string, InvoiceLine[]>();
    const byInvoice = new Map<string, InvoiceLine[]>();

    for (const line of invoiceLines) {
      const supplierKey = normalize(line.congTy);
      const supplierList = bySupplier.get(supplierKey) || [];
      supplierList.push(line);
      bySupplier.set(supplierKey, supplierList);

      const invoiceList = byInvoice.get(line.idHoaDon) || [];
      invoiceList.push(line);
      byInvoice.set(line.idHoaDon, invoiceList);
    }

    const orderMatches: OrderMatch[] = [];
    const unmatchedOrders: OrderHistory[] = [];

    for (const order of orders) {
      if (!order.emailSent) {
        continue;
      }

      const supplierKey = normalize(order.nhaThau);
      const candidates = bySupplier.get(supplierKey) || [];
      if (!candidates.length) {
        unmatchedOrders.push(order);
        continue;
      }

      let bestLine: InvoiceLine | undefined;
      let bestScore = -1;
      let bestNameSim = 0;

      for (const line of candidates) {
        let score = 0;

        const orderCode = normalize(order.maVtytCu);
        const invoiceCode = normalize(line.maHangHoa);
        if (orderCode && invoiceCode && orderCode === invoiceCode) {
          score += 70;
        }

        const nameSim = similarity(order.tenVtytBv, line.tenHangHoa);
        score += nameSim * 25;

        if (normalize(order.donViTinh) && normalize(order.donViTinh) === normalize(line.donViTinh)) {
          score += 5;
        }

        const orderDate = parseDate(order.ngayDatHang);
        if (orderDate && line.ngayHoaDon) {
          const dayGap = Math.abs((orderDate.getTime() - line.ngayHoaDon.getTime()) / (24 * 60 * 60 * 1000));
          if (dayGap <= 7) score += 10;
          else if (dayGap <= 30) score += 6;
          else if (dayGap <= 60) score += 2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestLine = line;
          bestNameSim = nameSim;
        }
      }

      if (!bestLine || bestScore < 40) {
        unmatchedOrders.push(order);
        continue;
      }

      orderMatches.push({
        order,
        line: bestLine,
        score: Number(bestScore.toFixed(2)),
        nameSimilarity: Number(bestNameSim.toFixed(3)),
      });
    }

    const matchedQtyByInvoice = new Map<string, number>();
    const matchedCodesByInvoice = new Map<string, Set<string>>();
    const matchedNamesByInvoice = new Map<string, string[]>();

    for (const match of orderMatches) {
      const invoiceId = match.line.idHoaDon;
      matchedQtyByInvoice.set(invoiceId, (matchedQtyByInvoice.get(invoiceId) || 0) + Number(match.order.dotGoiHang || 0));

      const codeSet = matchedCodesByInvoice.get(invoiceId) || new Set<string>();
      const code = normalize(match.order.maVtytCu);
      if (code) codeSet.add(code);
      matchedCodesByInvoice.set(invoiceId, codeSet);

      const nameList = matchedNamesByInvoice.get(invoiceId) || [];
      nameList.push(match.order.tenVtytBv || '');
      matchedNamesByInvoice.set(invoiceId, nameList);
    }

    const invoiceRows: InvoiceCompareRow[] = [];
    for (const [invoiceId, lines] of byInvoice.entries()) {
      const invoiceQty = lines.reduce((acc, line) => acc + line.soLuong, 0);
      const matchedQty = matchedQtyByInvoice.get(invoiceId) || 0;
      const diff = Number((matchedQty - invoiceQty).toFixed(3));
      const qtyStatus = getQtyStatus(diff);

      let materialStatus: MaterialStatus = 'CHUA_DANH_GIA';
      let note = '';

      if (qtyStatus === 'DU_SO_LUONG') {
        const invoiceCodes = new Set(lines.map((line) => normalize(line.maHangHoa)).filter(Boolean));
        const matchedCodes = matchedCodesByInvoice.get(invoiceId) || new Set<string>();

        if (invoiceCodes.size > 0) {
          const sameSize = invoiceCodes.size === matchedCodes.size;
          let allIncluded = true;
          for (const code of invoiceCodes) {
            if (!matchedCodes.has(code)) {
              allIncluded = false;
              break;
            }
          }

          if (sameSize && allIncluded) {
            materialStatus = 'DUNG_VAT_TU';
          } else {
            materialStatus = 'SAI_VAT_TU';
            note = 'Mã vật tư trên đơn chưa khớp hoàn toàn với hóa đơn';
          }
        } else {
          const invoiceNames = lines.map((line) => line.tenHangHoa).filter(Boolean);
          const orderNames = matchedNamesByInvoice.get(invoiceId) || [];
          if (invoiceNames.length && orderNames.length) {
            let totalSim = 0;
            for (const orderName of orderNames) {
              let bestSim = 0;
              for (const invoiceName of invoiceNames) {
                bestSim = Math.max(bestSim, similarity(orderName, invoiceName));
              }
              totalSim += bestSim;
            }
            const avgSim = totalSim / orderNames.length;
            if (avgSim >= 0.8) {
              materialStatus = 'DUNG_VAT_TU_THEO_TEN';
            } else {
              materialStatus = 'SAI_VAT_TU';
              note = `Tên vật tư tương đồng thấp (${avgSim.toFixed(2)})`;
            }
          }
        }
      }

      invoiceRows.push({
        idHoaDon: invoiceId,
        soHoaDon: lines[0]?.soHoaDon || '',
        congTy: lines[0]?.congTy || '',
        invoiceQty: Number(invoiceQty.toFixed(3)),
        matchedQty: Number(matchedQty.toFixed(3)),
        diff,
        qtyStatus,
        materialStatus,
        note,
      });
    }

    const summary = {
      totalInvoices: invoiceRows.length,
      totalOrders: orders.filter((o) => o.emailSent).length,
      matchedOrders: orderMatches.length,
      unmatchedOrders: unmatchedOrders.length,
      qtyEnough: invoiceRows.filter((row) => row.qtyStatus === 'DU_SO_LUONG').length,
      qtyMissing: invoiceRows.filter((row) => row.qtyStatus === 'THIEU_SO_LUONG').length,
      qtyExtra: invoiceRows.filter((row) => row.qtyStatus === 'THUA_SO_LUONG').length,
      materialCorrect: invoiceRows.filter((row) => row.materialStatus === 'DUNG_VAT_TU' || row.materialStatus === 'DUNG_VAT_TU_THEO_TEN').length,
      materialWrong: invoiceRows.filter((row) => row.materialStatus === 'SAI_VAT_TU').length,
    };

    const quantityIssues = invoiceRows
      .filter((row) => row.qtyStatus !== 'DU_SO_LUONG')
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    const deepChecks = invoiceRows
      .filter((row) => row.qtyStatus === 'DU_SO_LUONG')
      .sort((a, b) => a.materialStatus.localeCompare(b.materialStatus));

    return { summary, quantityIssues, deepChecks };
  }, [orders, hoaDons]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hóa đơn đã phân tích</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{report.summary.totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">Tổng dữ liệu so sánh theo id_hoa_don</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn đã match</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{report.summary.matchedOrders}/{report.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Số dòng order_history đã match được với hóa đơn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kết quả số lượng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex items-center justify-between"><span>Đủ</span><span className="font-semibold text-green-700">{report.summary.qtyEnough}</span></div>
            <div className="flex items-center justify-between"><span>Thiếu</span><span className="font-semibold text-amber-700">{report.summary.qtyMissing}</span></div>
            <div className="flex items-center justify-between"><span>Thừa</span><span className="font-semibold text-red-700">{report.summary.qtyExtra}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kiểm tra vật tư</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex items-center justify-between"><span>Đúng vật tư</span><span className="font-semibold text-green-700">{report.summary.materialCorrect}</span></div>
            <div className="flex items-center justify-between"><span>Sai vật tư</span><span className="font-semibold text-red-700">{report.summary.materialWrong}</span></div>
            <p className="text-xs text-muted-foreground mt-2">Chỉ đánh giá vật tư khi hóa đơn đã đủ số lượng</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageX className="h-4 w-4 text-amber-600" />
            Danh sách hóa đơn thiếu hoặc thừa số lượng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.quantityIssues.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">Không có hóa đơn thiếu/thừa số lượng.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Số hóa đơn</th>
                    <th className="px-3 py-2 text-left">Công ty</th>
                    <th className="px-3 py-2 text-right">SL hóa đơn</th>
                    <th className="px-3 py-2 text-right">SL đặt match</th>
                    <th className="px-3 py-2 text-right">Chênh lệch</th>
                    <th className="px-3 py-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {report.quantityIssues.slice(0, 30).map((row) => (
                    <tr key={row.idHoaDon} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.soHoaDon || row.idHoaDon}</td>
                      <td className="px-3 py-2 max-w-[320px] truncate" title={row.congTy}>{row.congTy}</td>
                      <td className="px-3 py-2 text-right">{row.invoiceQty}</td>
                      <td className="px-3 py-2 text-right">{row.matchedQty}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${row.diff < 0 ? 'text-amber-700' : 'text-red-700'}`}>
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </td>
                      <td className="px-3 py-2">{qtyStatusBadge(row.qtyStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-4 w-4 text-blue-600" />
            Kiểm tra sâu vật tư (chỉ các hóa đơn đủ số lượng)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.deepChecks.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">Chưa có hóa đơn nào đủ số lượng để kiểm tra sâu vật tư.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Số hóa đơn</th>
                    <th className="px-3 py-2 text-left">Công ty</th>
                    <th className="px-3 py-2 text-left">Kết quả vật tư</th>
                    <th className="px-3 py-2 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {report.deepChecks.slice(0, 30).map((row) => (
                    <tr key={row.idHoaDon} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.soHoaDon || row.idHoaDon}</td>
                      <td className="px-3 py-2 max-w-[320px] truncate" title={row.congTy}>{row.congTy}</td>
                      <td className="px-3 py-2">{materialStatusBadge(row.materialStatus)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 mb-2"><PackageCheck className="h-3.5 w-3.5" />Logic hiện tại: so sánh theo nhà cung cấp + mã vật tư + tương đồng tên + độ gần ngày.</div>
            <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />Bản này ưu tiên hiển thị trực quan nhanh. Vòng sau có thể nâng cấp fuzzy matching và xác nhận thủ công.</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
