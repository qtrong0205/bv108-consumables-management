import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  apiService,
  ApiCompareSupply,
  getNullableNumber,
  getNullableString,
} from '@/services/api';
import { Bot, ChevronDown, ChevronRight, FileDown, FileSpreadsheet, Loader2, Maximize2, Minimize2, Search, Send, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { askGeminiCompare, resetGeminiChat } from '@/services/gemini';

const formatNumber = (value: { Int32: number; Valid: boolean } | { Float64: number; Valid: boolean } | null | undefined): string => {
  if (!value?.Valid) return '';
  const numeric = 'Int32' in value ? value.Int32 : value.Float64;
  return numeric.toLocaleString('vi-VN');
};

const getMaThuVien = (item: ApiCompareSupply): string => getNullableString(item.maThuVien);
const getTenVatTu = (item: ApiCompareSupply): string => getNullableString(item.tenVatTu2025);

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatHtmlMultiline = (input: string): string => escapeHtml(input).replace(/\r?\n/g, '<br/>');

const markdownComponents: Components = {
  h2: ({ children, ...props }) => (
    <h2 className="mt-3 mb-1 text-sm font-semibold text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-3 mb-1 text-sm font-medium text-foreground" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-1 leading-6 text-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-1 list-disc space-y-1 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-1 list-decimal space-y-1 pl-5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-6" {...props}>
      {children}
    </li>
  ),
  table: ({ children, ...props }) => (
    <div className="my-2 overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[520px] border-collapse text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/40" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-border px-2 py-1.5 text-left font-semibold text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-border px-2 py-1.5 align-top text-foreground" {...props}>
      {children}
    </td>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, ...props }) => (
    <code className="rounded bg-muted px-1 py-0.5 text-[12px]" {...props}>
      {children}
    </code>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-primary underline underline-offset-2 hover:opacity-90"
      {...props}
    >
      {children}
    </a>
  ),
};

const COMPARE_FIELDS: Array<{
  label: string;
  value: (item: ApiCompareSupply) => string;
}> = [
  { label: 'STT', value: (i) => String(i.stt || '') },
  { label: 'Tên công ty', value: (i) => getNullableString(i.tenCongTy) },
  { label: 'Mã thư viện', value: (i) => getNullableString(i.maThuVien) },
  { label: 'Mã Thông tư 04', value: (i) => getNullableString(i.maThongTu04) },
  { label: 'Tên vật tư (sử dụng năm 2025)', value: (i) => getNullableString(i.tenVatTu2025) },
  { label: 'Thông số kỹ thuật của BV mời thầu (2025)', value: (i) => getNullableString(i.thongSoMoiThau2025) },
  { label: 'Thông số kỹ thuật (hiệu chỉnh cho 2026)', value: (i) => getNullableString(i.thongSoHieuChinh2026) },
  { label: 'Thông số kỹ thuật 1', value: (i) => getNullableString(i.thongSoKyThuat1) },
  { label: 'Thông số kỹ thuật 2', value: (i) => getNullableString(i.thongSoKyThuat2) },
  { label: 'Thông số kỹ thuật 3', value: (i) => getNullableString(i.thongSoKyThuat3) },
  { label: 'Thông số kỹ thuật 4', value: (i) => getNullableString(i.thongSoKyThuat4) },
  { label: 'Thông số kỹ thuật 5', value: (i) => getNullableString(i.thongSoKyThuat5) },
  { label: 'Thông số kỹ thuật 9', value: (i) => getNullableString(i.thongSoKyThuat9) },
  { label: 'Mã VTTH tương đương', value: (i) => getNullableString(i.maVtthTuongDuong) },
  { label: 'Công ty có VTTH tương đương', value: (i) => getNullableString(i.congTyVtthTuongDuong) },
  { label: 'ĐVT', value: (i) => getNullableString(i.dvt) },
  { label: 'Số lượng sử dụng 12 tháng', value: (i) => formatNumber(i.soLuongSuDung12Thang) },
  { label: 'Số lượng trúng thầu 2025 + bổ sung', value: (i) => formatNumber(i.soLuongTrungThau2025BoSung) },
  { label: 'Đơn giá trúng thầu năm 2025', value: (i) => formatNumber(i.donGiaTrungThau2025) },
  { label: 'Đơn giá đề xuất năm 2026', value: (i) => formatNumber(i.donGiaDeXuat2026) },
  { label: 'KQ trúng thầu THẤP NHẤT', value: (i) => formatNumber(i.ketQuaTrungThauThapNhat) },
  { label: 'TG/ĐV đăng tải giá THẤP NHẤT', value: (i) => getNullableString(i.thoiGianDangTaiThapNhat) },
  { label: 'KQ trúng thầu CAO NHẤT', value: (i) => formatNumber(i.ketQuaTrungThauCaoNhat) },
  { label: 'TG/ĐV đăng tải giá CAO NHẤT', value: (i) => getNullableString(i.thoiGianDangTaiCaoNhat) },
  { label: 'Công ty tham khảo', value: (i) => getNullableString(i.congTyThamKhao) },
  { label: 'Mã số thuế', value: (i) => getNullableString(i.maSoThue) },
  { label: 'Ký mã hiệu', value: (i) => getNullableString(i.kyMaHieu) },
  { label: 'Hãng sản xuất', value: (i) => getNullableString(i.hangSanXuat) },
  { label: 'Nước sản xuất', value: (i) => getNullableString(i.nuocSanXuat) },
  { label: 'Nhóm nước', value: (i) => getNullableString(i.nhomNuoc) },
  { label: 'Chất lượng', value: (i) => getNullableString(i.chatLuong) },
  { label: 'Mã 5086', value: (i) => getNullableString(i.ma5086) },
  { label: 'Tên thương mại', value: (i) => getNullableString(i.tenThuongMai) },
];

export default function CompareSuppliesTab() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [catalog, setCatalog] = useState<ApiCompareSupply[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [comparedItems, setComparedItems] = useState<ApiCompareSupply[]>([]);

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedRows, setCollapsedRows] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'bot'; content: string }>>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [chatFullscreen, setChatFullscreen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoadingCatalog(true);
        setError(null);
        const res = await apiService.getCompareCatalog(keyword, page, pageSize);
        setCatalog(res.data);
        setTotalPages(res.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách vật tư so sánh');
      } finally {
        setLoadingCatalog(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword, page, pageSize]);

  const selectedCount = selectedCodes.length;

  const selectedFromCatalog = useMemo(() => {
    const lookup = new Set(selectedCodes);
    return catalog.filter((item) => lookup.has(getMaThuVien(item)));
  }, [catalog, selectedCodes]);

  const toggleSelection = (code: string, checked: boolean) => {
    if (!code) return;
    setSelectedCodes((prev) => {
      if (checked) {
        if (prev.includes(code)) return prev;
        if (prev.length >= 10) return prev;
        return [...prev, code];
      }
      return prev.filter((x) => x !== code);
    });
  };

  const handleSelectAllOnPage = () => {
    const pageCodes = catalog.map((item) => getMaThuVien(item)).filter(Boolean);
    if (pageCodes.length === 0) return;

    setSelectedCodes((prev) => {
      const merged = [...prev];
      for (const code of pageCodes) {
        if (merged.includes(code)) continue;
        if (merged.length >= 10) break;
        merged.push(code);
      }
      return merged;
    });
  };

  const handleClearAllSelection = () => {
    setSelectedCodes([]);
  };

  const handleCompare = async () => {
    if (selectedCodes.length < 2) return;

    try {
      setLoadingCompare(true);
      setError(null);
      const res = await apiService.compareSupplies(selectedCodes);
      setComparedItems(res.data || []);
      setCollapsedRows([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lấy được kết quả so sánh');
      setComparedItems([]);
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleExportExcel = () => {
    if (comparedItems.length === 0) {
      setError('Chưa có dữ liệu so sánh để xuất Excel');
      return;
    }

    const rows = COMPARE_FIELDS.map((field) => {
      const row: Record<string, string> = { 'Thuộc tính': field.label };
      comparedItems.forEach((item, index) => {
        const code = getMaThuVien(item) || `Mã ${index + 1}`;
        const name = getTenVatTu(item) || 'Vật tư';
        row[`${code} - ${name}`] = field.value(item) || '';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SoSanhVatTu');

    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    XLSX.writeFile(workbook, `so_sanh_vat_tu_${ts}.xlsx`);
  };

  const handleExportPdf = () => {
    if (comparedItems.length === 0) {
      setError('Chưa có dữ liệu so sánh để xuất PDF');
      return;
    }

    const headers = comparedItems
      .map((item, index) => {
        const code = escapeHtml(getMaThuVien(item) || `Mã ${index + 1}`);
        const name = escapeHtml(getTenVatTu(item) || 'Vật tư');
        return `<th>${code}<br/><span style="font-weight:400">${name}</span></th>`;
      })
      .join('');

    const body = COMPARE_FIELDS
      .map((field) => {
        const cells = comparedItems
          .map((item) => `<td>${formatHtmlMultiline(field.value(item) || '')}</td>`)
          .join('');
        return `<tr><td><strong>${escapeHtml(field.label)}</strong></td>${cells}</tr>`;
      })
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bảng so sánh vật tư</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #1f2937; }
            h2 { margin: 0 0 12px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; font-size: 12px; }
            th { background: #0f3a68; color: #fff; }
            td:first-child { background: #f3f4f6; width: 240px; }
          </style>
        </head>
        <body>
          <h2>Bảng so sánh vật tư</h2>
          <table>
            <thead>
              <tr>
                <th>Thuộc tính</th>
                ${headers}
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Không thể mở cửa sổ in PDF. Hãy kiểm tra popup blocker.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingChat]);

  const openChatbot = () => {
    setChatOpen(true);
    if (!chatInitialized && comparedItems.length >= 2) {
      setChatInitialized(true);
      (async () => {
        try {
          setIsSendingChat(true);
          const botReply = await askGeminiCompare(
            comparedItems,
            'Phân tích nhanh các sản phẩm trên theo mẫu: Kết luận nhanh, Bảng so sánh chính, Khuyến nghị đấu thầu 2026, Rủi ro cần kiểm tra. Nếu thiếu dữ liệu nội bộ thì tra cứu web để bổ sung và nêu nguồn.',
          );
          setChatMessages([{ role: 'bot', content: botReply }]);
        } catch (err) {
          setChatMessages([{ role: 'bot', content: `Lỗi kết nối Gemini: ${err instanceof Error ? err.message : 'Không xác định'}` }]);
        } finally {
          setIsSendingChat(false);
        }
      })();
    }
  };

  const handleResetChat = () => {
    resetGeminiChat();
    setChatMessages([]);
    setChatInitialized(false);
  };

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || isSendingChat) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: message }]);
    setChatInput('');

    try {
      setIsSendingChat(true);
      const botReply = await askGeminiCompare(comparedItems, message);
      if (botReply?.trim()) {
        setChatMessages((prev) => [...prev, { role: 'bot', content: botReply }]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'bot', content: `Lỗi: ${err instanceof Error ? err.message : 'Không thể kết nối chatbot'}` },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const isRowCollapsed = (label: string): boolean => collapsedRows.includes(label);

  const toggleRowCollapse = (label: string) => {
    setCollapsedRows((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  };

  const collapseAllRows = () => {
    setCollapsedRows(COMPARE_FIELDS.map((f) => f.label));
  };

  const expandAllRows = () => {
    setCollapsedRows([]);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-neutral border-border">
        <CardHeader className="space-y-3">
          <CardTitle className="text-foreground">Chọn vật tư để so sánh</CardTitle>
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => {
                setPage(1);
                setKeyword(e.target.value);
              }}
              placeholder="Tìm theo mã thư viện, tên vật tư, công ty..."
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full min-w-[920px]">
              <thead className="bg-primary text-primary-foreground">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-medium">Chọn</th>
                  <th className="px-3 py-3 text-left text-xs font-medium">Mã thư viện</th>
                  <th className="px-3 py-3 text-left text-xs font-medium">Tên vật tư</th>
                  <th className="px-3 py-3 text-left text-xs font-medium">ĐVT</th>
                  <th className="px-3 py-3 text-left text-xs font-medium">Hãng SX</th>
                  <th className="px-3 py-3 text-left text-xs font-medium">Nước SX</th>
                  <th className="px-3 py-3 text-right text-xs font-medium">ĐG đề xuất 2026</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {catalog.map((item) => {
                  const code = getMaThuVien(item);
                  const checked = selectedCodes.includes(code);
                  return (
                    <tr key={`${item.stt}-${code}`} className="hover:bg-tertiary transition-colors">
                      <td className="px-3 py-3 text-center">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleSelection(code, value === true)}
                          disabled={!checked && selectedCodes.length >= 10}
                        />
                      </td>
                      <td className="px-3 py-3 text-sm font-mono text-foreground">{code}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{getTenVatTu(item)}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{getNullableString(item.dvt)}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{getNullableString(item.hangSanXuat)}</td>
                      <td className="px-3 py-3 text-sm text-foreground">{getNullableString(item.nuocSanXuat)}</td>
                      <td className="px-3 py-3 text-sm text-right text-foreground">{getNullableNumber(item.donGiaDeXuat2026).toLocaleString('vi-VN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loadingCatalog && catalog.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Không có dữ liệu để chọn</div>
            )}
            {loadingCatalog && (
              <div className="py-8 text-center text-sm text-muted-foreground">Đang tải danh sách vật tư...</div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Đã chọn <span className="font-medium text-foreground">{selectedCount}</span>/10 vật tư
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSelectAllOnPage} disabled={loadingCatalog || catalog.length === 0 || selectedCount >= 10}>
                Chọn tất cả trang
              </Button>
              <Button variant="outline" onClick={handleClearAllSelection} disabled={selectedCount === 0}>
                Bỏ chọn tất cả
              </Button>
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loadingCatalog}>
                Trang trước
              </Button>
              <span className="text-sm text-muted-foreground">{page}/{Math.max(totalPages, 1)}</span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loadingCatalog}>
                Trang sau
              </Button>
              <Button onClick={handleCompare} disabled={selectedCount < 2 || loadingCompare}>
                {loadingCompare ? 'ĐANG SO SÁNH...' : 'SO SÁNH'}
              </Button>
            </div>
          </div>

          {selectedFromCatalog.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Mã đã chọn: {selectedFromCatalog.map((item) => getMaThuVien(item)).join(', ')}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {comparedItems.length > 0 && (
        <Card className="bg-neutral border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-foreground">Kết quả so sánh</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={collapseAllRows} disabled={collapsedRows.length === COMPARE_FIELDS.length}>
                Thu gọn tất cả
              </Button>
              <Button variant="outline" onClick={expandAllRows} disabled={collapsedRows.length === 0}>
                Mở rộng tất cả
              </Button>
              <Button variant="outline" onClick={openChatbot}>
                <Bot className="w-4 h-4 mr-2" />
                Chatbot tư vấn
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
              <Button variant="outline" onClick={handleExportPdf}>
                <FileDown className="w-4 h-4 mr-2" />
                Xuất PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium min-w-[320px] sticky left-0 z-20 bg-primary">Thuộc tính</th>
                    {comparedItems.map((item) => (
                      <th key={`head-${getMaThuVien(item)}`} className="px-3 py-3 text-left text-xs font-medium min-w-[240px]">
                        <div>{getMaThuVien(item)}</div>
                        <div className="font-normal opacity-90 mt-1">{getTenVatTu(item)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARE_FIELDS.map((field) => {
                    const collapsed = isRowCollapsed(field.label);

                    return (
                      <tr key={field.label}>
                        <td
                          className={`font-bold text-primary-foreground bg-primary sticky left-0 z-10 ${collapsed ? 'px-3 py-1.5 text-xs' : 'px-3 py-3 text-sm'}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleRowCollapse(field.label)}
                            className="w-full flex items-center gap-2 text-left"
                            title={collapsed ? 'Mở rộng hàng' : 'Thu gọn hàng'}
                          >
                            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span>{field.label}</span>
                          </button>
                        </td>

                        {collapsed ? (
                          <td colSpan={Math.max(comparedItems.length, 1)} className="px-2 py-1 bg-muted/20 align-middle">
                            <div className="h-[2px] w-full rounded-full bg-border/80" />
                          </td>
                        ) : (
                          comparedItems.map((item) => (
                            <td
                              key={`${field.label}-${getMaThuVien(item)}`}
                              className="px-3 py-3 text-sm text-foreground align-top whitespace-pre-wrap break-words leading-6"
                            >
                              {field.value(item) || ''}
                            </td>
                          ))
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className={`flex flex-col transition-all duration-300 ${chatFullscreen ? 'sm:max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh]' : 'sm:max-w-2xl'}`}>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Tư vấn đấu thầu vật tư</DialogTitle>
                <DialogDescription>
                  Chatbot ưu tiên dữ liệu đang so sánh và có thể tra cứu web để bổ sung thông tin.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setChatFullscreen((f) => !f)}
                title={chatFullscreen ? 'Thu nhỏ' : 'Phóng to'}
                className="ml-2 flex-shrink-0"
              >
                {chatFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className={`border border-border rounded-md p-3 overflow-y-auto space-y-3 bg-muted/20 ${chatFullscreen ? 'flex-1 min-h-0' : 'h-[420px]'}`}>
            {chatMessages.length === 0 && !isSendingChat ? (
              <p className="text-sm text-muted-foreground">Bấm vào đây để bắt đầu phân tích. Chatbot sẽ tự động đánh giá các sản phẩm đang so sánh.</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={`max-w-[92%] rounded-md px-3 py-2 text-sm ${msg.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground whitespace-pre-wrap'
                    : 'mr-auto bg-background border border-border text-foreground'
                    }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              ))
            )}
            {isSendingChat && (
              <div className="mr-auto bg-background border border-border text-foreground max-w-[90%] rounded-md px-3 py-2 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gemini đang phân tích...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={handleResetChat} title="Làm mới hội thoại" disabled={isSendingChat}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Input
              className="flex-1"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Hỏi ví dụ: Nên đấu thầu loại nào để tối ưu giá và chất lượng?"
              disabled={isSendingChat}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
            />
            <Button onClick={handleSendChat} disabled={isSendingChat || !chatInput.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
