import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  apiService,
  ApiCompareSupply,
  getNullableNumber,
  getNullableString,
} from '@/services/api';
import { Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { askGeminiCompare, resetGeminiChat } from '@/services/gemini';
import ChatBotDialog, { ChatMessage } from './dialog/ChatBotDialog';
import ResultDialog from './dialog/ResultDialog';
import Pagination from '@/components/ui/pagination';

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
  const [totalItems, setTotalItems] = useState(0);

  const [catalog, setCatalog] = useState<ApiCompareSupply[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [comparedItems, setComparedItems] = useState<ApiCompareSupply[]>([]);

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsedRows, setCollapsedRows] = useState<string[]>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [columnOrder, setColumnOrder] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoadingCatalog(true);
        setError(null);
        const res = await apiService.getCompareCatalog(keyword, page, pageSize);
        setCatalog(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalItems(res.total || 0);
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
      const items = res.data || [];
      setComparedItems(items);
      setColumnOrder(items.map((_: ApiCompareSupply, i: number) => i));

      const emptyRows = COMPARE_FIELDS
        .filter((field) => items.every((item: ApiCompareSupply) => !field.value(item)))
        .map((field) => field.label);
      setCollapsedRows(emptyRows);

      // Mở dialog kết quả so sánh
      if (items.length > 0) {
        setCompareDialogOpen(true);
      }
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

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
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
              <Button onClick={handleCompare} disabled={selectedCount < 2 || loadingCompare}>
                {loadingCompare ? 'ĐANG SO SÁNH...' : 'SO SÁNH'}
              </Button>
              {comparedItems.length > 0 && (
                <Button variant="secondary" onClick={() => setCompareDialogOpen(true)}>
                  Xem kết quả
                </Button>
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loadingCatalog && totalItems > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}

          {selectedFromCatalog.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Mã đã chọn: {selectedFromCatalog.map((item) => getMaThuVien(item)).join(', ')}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Dialog kết quả so sánh */}
      <ResultDialog
        open={compareDialogOpen}
        onOpenChange={setCompareDialogOpen}
        comparedItems={comparedItems}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        collapsedRows={collapsedRows}
        onCollapsedRowsChange={setCollapsedRows}
        onOpenChatbot={openChatbot}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
      />

      {/* Dialog Chatbot */}
      <ChatBotDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        chatMessages={chatMessages}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        isSendingChat={isSendingChat}
        onSendChat={handleSendChat}
        onResetChat={handleResetChat}
      />
    </div>
  );
}
