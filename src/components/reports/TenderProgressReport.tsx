import { useEffect, useMemo, useState } from "react";
import { FileDown, FileSpreadsheet, Mail, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenderItem {
  mã_vt: string;
  tên_vật_tư: string;
  nhà_cung_cấp: string;
  đvt: string;
  tongthau: number;
  tongnhap: number;
  price: number;
  mã_cap1: string;
  mã_cap2: string;
}

type Filters = {
  mãCap1: string;
  mãCap2: string;
  nhàCungCấp: string;
  từNgày: string;
  đếnNgày: string;
};

const LEVEL1_OPTIONS = [
  { value: "cap1-tieu-hao", label: "Vật tư tiêu hao" },
  { value: "cap1-tiem-truyen", label: "Vật tư tiêm truyền" },
  { value: "cap1-bao-ho", label: "Vật tư bảo hộ" },
];

const LEVEL2_OPTIONS: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  "cap1-tieu-hao": [
    { value: "cap2-gac-bong", label: "Gạc bông" },
    { value: "cap2-bang-keo", label: "Băng keo y tế" },
    { value: "cap2-khau-trang", label: "Khẩu trang y tế" },
  ],
  "cap1-tiem-truyen": [
    { value: "cap2-kim-tiem", label: "Kim tiêm" },
    { value: "cap2-bom-tiem", label: "Bơm tiêm" },
    { value: "cap2-day-truyen", label: "Dây truyền dịch" },
  ],
  "cap1-bao-ho": [
    { value: "cap2-gang-tay", label: "Găng tay" },
    { value: "cap2-ao-choang", label: "Áo choàng" },
  ],
};

const SUPPLIER_OPTIONS = [
  { value: "ncc-medline", label: "Medline Việt Nam" },
  { value: "ncc-hapharco", label: "Hapharco" },
  { value: "ncc-vimedimex", label: "Vimedimex" },
];

const MOCK_DATA: TenderItem[] = [
  {
    mã_vt: "VT-001",
    tên_vật_tư: "Gạc bông vô trùng 5x5",
    nhà_cung_cấp: "Medline Việt Nam",
    đvt: "Hộp",
    tongthau: 1000,
    tongnhap: 480,
    price: 85000,
    mã_cap1: "cap1-tieu-hao",
    mã_cap2: "cap2-gac-bong",
  },
  {
    mã_vt: "VT-002",
    tên_vật_tư: "Băng keo y tế 2.5cm",
    nhà_cung_cấp: "Hapharco",
    đvt: "Cuộn",
    tongthau: 500,
    tongnhap: 500,
    price: 12000,
    mã_cap1: "cap1-tieu-hao",
    mã_cap2: "cap2-bang-keo",
  },
  {
    mã_vt: "VT-003",
    tên_vật_tư: "Khẩu trang y tế 3 lớp",
    nhà_cung_cấp: "Vimedimex",
    đvt: "Thùng",
    tongthau: 300,
    tongnhap: 310,
    price: 150000,
    mã_cap1: "cap1-tieu-hao",
    mã_cap2: "cap2-khau-trang",
  },
  {
    mã_vt: "VT-004",
    tên_vật_tư: "Kim tiêm 5ml",
    nhà_cung_cấp: "Medline Việt Nam",
    đvt: "Hộp",
    tongthau: 800,
    tongnhap: 200,
    price: 95000,
    mã_cap1: "cap1-tiem-truyen",
    mã_cap2: "cap2-kim-tiem",
  },
  {
    mã_vt: "VT-005",
    tên_vật_tư: "Bơm tiêm 10ml",
    nhà_cung_cấp: "Hapharco",
    đvt: "Hộp",
    tongthau: 600,
    tongnhap: 420,
    price: 78000,
    mã_cap1: "cap1-tiem-truyen",
    mã_cap2: "cap2-bom-tiem",
  },
  {
    mã_vt: "VT-006",
    tên_vật_tư: "Dây truyền dịch",
    nhà_cung_cấp: "Vimedimex",
    đvt: "Cái",
    tongthau: 1200,
    tongnhap: 1100,
    price: 22000,
    mã_cap1: "cap1-tiem-truyen",
    mã_cap2: "cap2-day-truyen",
  },
  {
    mã_vt: "VT-007",
    tên_vật_tư: "Găng tay y tế không bột",
    nhà_cung_cấp: "Medline Việt Nam",
    đvt: "Hộp",
    tongthau: 400,
    tongnhap: 90,
    price: 185000,
    mã_cap1: "cap1-bao-ho",
    mã_cap2: "cap2-gang-tay",
  },
  {
    mã_vt: "VT-008",
    tên_vật_tư: "Áo choàng phẫu thuật",
    nhà_cung_cấp: "Hapharco",
    đvt: "Cái",
    tongthau: 200,
    tongnhap: 160,
    price: 45000,
    mã_cap1: "cap1-bao-ho",
    mã_cap2: "cap2-ao-choang",
  },
];

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}

function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + " ₫";
}

function calculateStatus(tyLe: number): { label: string; tone: string } {
  if (tyLe > 100) return { label: "Vượt thầu", tone: "destructive" };
  if (tyLe === 100) return { label: "Đã thực hiện đủ", tone: "success" };
  if (tyLe >= 80) return { label: "Sắp hết khối lượng thầu", tone: "warning" };
  if (tyLe >= 50) return { label: "Đang thực hiện", tone: "info" };
  return { label: "Thực hiện thấp", tone: "warning" };
}

export default function TenderProgressReport() {
  const [draftFilters, setDraftFilters] = useState<Filters>({
    mãCap1: "all",
    mãCap2: "all",
    nhàCungCấp: "all",
    từNgày: getDefaultFromDate(),
    đếnNgày: getTodayInputValue(),
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);

  // Reset mã cấp 2 khi mã cấp 1 thay đổi
  useEffect(() => {
    const availableLevel2 = LEVEL2_OPTIONS[draftFilters.mãCap1] ?? [];
    if (
      draftFilters.mãCap2 !== "all" &&
      !availableLevel2.some((opt) => opt.value === draftFilters.mãCap2)
    ) {
      setDraftFilters((cur) => ({ ...cur, mãCap2: "all" }));
    }
  }, [draftFilters.mãCap1, draftFilters.mãCap2]);

  const activeFilters = appliedFilters ?? draftFilters;

  const level2Options =
    activeFilters.mãCap1 === "all"
      ? []
      : (LEVEL2_OPTIONS[activeFilters.mãCap1] ?? []);

  const visibleRows = useMemo(() => {
    const filters = appliedFilters ?? null;
    if (!filters) return MOCK_DATA;

    return MOCK_DATA.filter((item) => {
      const matchCap1 =
        filters.mãCap1 === "all" || item.mã_cap1 === filters.mãCap1;
      const matchCap2 =
        filters.mãCap2 === "all" || item.mã_cap2 === filters.mãCap2;
      const matchNcc =
        filters.nhàCungCấp === "all" ||
        item.nhà_cung_cấp ===
          SUPPLIER_OPTIONS.find((s) => s.value === filters.nhàCungCấp)?.label;
      return matchCap1 && matchCap2 && matchNcc;
    });
  }, [appliedFilters]);

  // Tổng hợp cuối bảng
  const summary = useMemo(() => {
    const totalThau = visibleRows.reduce(
      (acc, r) => acc + r.tongthau * r.price,
      0,
    );
    const totalThucHien = visibleRows.reduce(
      (acc, r) => acc + r.tongnhap * r.price,
      0,
    );
    const tongTongnhap = visibleRows.reduce((acc, r) => acc + r.tongnhap, 0);
    const tongTongthau = visibleRows.reduce((acc, r) => acc + r.tongthau, 0);
    const tyLeTb = tongTongthau > 0 ? (tongTongnhap / tongTongthau) * 100 : 0;
    return { totalThau, totalThucHien, tyLeTb };
  }, [visibleRows]);

  const handleApply = () => setAppliedFilters(draftFilters);

  const handleReset = () => {
    const reset: Filters = {
      mãCap1: "all",
      mãCap2: "all",
      nhàCungCấp: "all",
      từNgày: getDefaultFromDate(),
      đếnNgày: getTodayInputValue(),
    };
    setDraftFilters(reset);
    setAppliedFilters(null);
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              {/* Mã cấp 1 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mã cấp 1
                </label>
                <Select
                  value={draftFilters.mãCap1}
                  onValueChange={(value) =>
                    setDraftFilters((cur) => ({ ...cur, mãCap1: value }))
                  }
                >
                  <SelectTrigger className="bg-neutral text-foreground border-border">
                    <SelectValue placeholder="Chọn mã cấp 1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mã cấp 1</SelectItem>
                    {LEVEL1_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mã cấp 2 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mã cấp 2
                </label>
                <Select
                  value={draftFilters.mãCap2}
                  onValueChange={(value) =>
                    setDraftFilters((cur) => ({ ...cur, mãCap2: value }))
                  }
                  disabled={draftFilters.mãCap1 === "all"}
                >
                  <SelectTrigger className="bg-neutral text-foreground border-border">
                    <SelectValue placeholder="Chọn mã cấp 2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mã cấp 2</SelectItem>
                    {level2Options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nhà cung cấp */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Nhà cung cấp
                </label>
                <Select
                  value={draftFilters.nhàCungCấp}
                  onValueChange={(value) =>
                    setDraftFilters((cur) => ({ ...cur, nhàCungCấp: value }))
                  }
                >
                  <SelectTrigger className="bg-neutral text-foreground border-border">
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả nhà cung cấp</SelectItem>
                    {SUPPLIER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Từ ngày */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={draftFilters.từNgày}
                  onChange={(e) =>
                    setDraftFilters((cur) => ({
                      ...cur,
                      từNgày: e.target.value,
                    }))
                  }
                  className="bg-neutral text-foreground border-border"
                />
              </div>

              {/* Đến ngày */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={draftFilters.đếnNgày}
                  onChange={(e) =>
                    setDraftFilters((cur) => ({
                      ...cur,
                      đếnNgày: e.target.value,
                    }))
                  }
                  className="bg-neutral text-foreground border-border"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Button onClick={handleApply} className="min-w-28">
                Áp dụng
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="min-w-28"
              >
                <RotateCcw className="h-4 w-4" />
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => console.log("Xuất Excel")}>
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </Button>
        <Button variant="outline" onClick={() => console.log("Xuất PDF")}>
          <FileDown className="h-4 w-4" />
          Xuất PDF
        </Button>
        <Button variant="outline" onClick={() => console.log("Gửi Email")}>
          <Mail className="h-4 w-4" />
          Gửi Email
        </Button>
      </div>

      {/* Bảng */}
      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">
            Theo dõi tiến độ thực hiện thầu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-[1400px] w-full border-collapse">
              <thead className="sticky top-0 z-20 bg-primary text-primary-foreground">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Mã VT
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Tên vật tư
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Nhà cung cấp
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    SL thầu
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Tổng nhập
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Còn lại
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Giá trị thầu
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    GT đã thực hiện
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium min-w-[140px]">
                    Tỷ lệ TH
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-neutral">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Không có dữ liệu phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((item, index) => {
                    const conLai = item.tongthau - item.tongnhap;
                    const giaTriThau = item.tongthau * item.price;
                    const giaTriThucHien = item.tongnhap * item.price;
                    const tyLe =
                      item.tongthau > 0
                        ? (item.tongnhap / item.tongthau) * 100
                        : 0;
                    const status = calculateStatus(tyLe);
                    const progressClamped = Math.min(tyLe, 100);

                    return (
                      <tr
                        key={item.mã_vt}
                        className="hover:bg-tertiary/60 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-foreground">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                          {item.mã_vt}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.tên_vật_tư}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.nhà_cung_cấp}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {item.tongthau.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {item.tongnhap.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {conLai.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {formatVND(item.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {formatVND(giaTriThau)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {formatVND(giaTriThucHien)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-border overflow-hidden flex-shrink-0">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  status.tone === "destructive"
                                    ? "bg-red-500"
                                    : status.tone === "warning"
                                      ? "bg-orange-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${progressClamped}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums whitespace-nowrap">
                              {tyLe.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            className={`rounded-full px-2 py-1 text-xs font-medium border ${
                              status.tone === "destructive"
                                ? "border-red-500 bg-red-500/10 text-red-600"
                                : status.tone === "warning"
                                  ? "border-orange-500 bg-orange-500/10 text-orange-600"
                                  : status.tone === "info"
                                    ? "border-blue-500 bg-blue-500/10 text-blue-600"
                                    : "border-green-500 bg-green-500/10 text-green-600"
                            }`}
                          >
                            {status.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Dòng tổng */}
              {visibleRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-tertiary/40 font-medium">
                    <td
                      colSpan={8}
                      className="px-4 py-3 text-sm text-foreground"
                    >
                      Tổng cộng ({visibleRows.length} vật tư)
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {formatVND(summary.totalThau)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right">
                      {formatVND(summary.totalThucHien)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 rounded-full bg-border overflow-hidden flex-shrink-0">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${Math.min(summary.tyLeTb, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums whitespace-nowrap">
                          {summary.tyLeTb.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
