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

interface SupplyItem {
  mã_vt: string;
  tên_vật_tư: string;
  đvt: string;
  ton_cuoi_ky: number;
  xuat_trong_ky: number;
  ton_kho_min: number;
  mã_cap1: string;
  mã_cap2: string;
}

type Filters = {
  mãCap1: string;
  mãCap2: string;
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
    { value: "cap2-khan-trang", label: "Khăn trùm đầu" },
  ],
};

const MOCK_DATA: SupplyItem[] = [
  {
    mã_vt: "VT-001",
    tên_vật_tư: "Gạc bông vô trùng 5x5",
    đvt: "Hộp",
    ton_cuoi_ky: 0,
    xuat_trong_ky: 480,
    ton_kho_min: 100,
    mã_cap1: "cap1-tieu-hao",
    mã_cap2: "cap2-gac-bong",
  },
  {
    mã_vt: "VT-002",
    tên_vật_tư: "Băng keo y tế 2.5cm",
    đvt: "Cuộn",
    ton_cuoi_ky: 18,
    xuat_trong_ky: 220,
    ton_kho_min: 30,
    mã_cap1: "cap1-tieu-hao",
    mã_cap2: "cap2-bang-keo",
  },
  {
    mã_vt: "VT-003",
    tên_vật_tư: "Khẩu trang y tế 3 lớp",
    đvt: "Thùng",
    ton_cuoi_ky: 260,
    xuat_trong_ky: 180,
    ton_kho_min: 200,
    mã_cap1: "cap1-tieu-hao",
    mã_cap2: "cap2-khau-trang",
  },
  {
    mã_vt: "VT-004",
    tên_vật_tư: "Kim tiêm 5ml",
    đvt: "Hộp",
    ton_cuoi_ky: 50,
    xuat_trong_ky: 600,
    ton_kho_min: 80,
    mã_cap1: "cap1-tiem-truyen",
    mã_cap2: "cap2-kim-tiem",
  },
  {
    mã_vt: "VT-005",
    tên_vật_tư: "Bơm tiêm 10ml",
    đvt: "Hộp",
    ton_cuoi_ky: 120,
    xuat_trong_ky: 900,
    ton_kho_min: 100,
    mã_cap1: "cap1-tiem-truyen",
    mã_cap2: "cap2-bom-tiem",
  },
  {
    mã_vt: "VT-006",
    tên_vật_tư: "Dây truyền dịch",
    đvt: "Cái",
    ton_cuoi_ky: 180,
    xuat_trong_ky: 240,
    ton_kho_min: 150,
    mã_cap1: "cap1-tiem-truyen",
    mã_cap2: "cap2-day-truyen",
  },
  {
    mã_vt: "VT-007",
    tên_vật_tư: "Găng tay y tế không bột",
    đvt: "Hộp",
    ton_cuoi_ky: 340,
    xuat_trong_ky: 90,
    ton_kho_min: 200,
    mã_cap1: "cap1-bao-ho",
    mã_cap2: "cap2-gang-tay",
  },
  {
    mã_vt: "VT-008",
    tên_vật_tư: "Áo choàng phẫu thuật",
    đvt: "Cái",
    ton_cuoi_ky: 75,
    xuat_trong_ky: 60,
    ton_kho_min: 100,
    mã_cap1: "cap1-bao-ho",
    mã_cap2: "cap2-ao-choang",
  },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}

function calculatePeriodDays(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  const diffDays = Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
  return Math.max(1, diffDays);
}

function calculateWarning(
  item: SupplyItem,
  doi: number,
): { label: string; tone: string } {
  if (item.ton_cuoi_ky === 0) {
    return { label: "Gọi hàng khẩn cấp", tone: "destructive" };
  }

  if (doi <= 7) {
    return { label: "Nguy cơ hết trong 7 ngày", tone: "destructive" };
  }

  if (doi <= 30) {
    return { label: "Cần gọi hàng", tone: "warning" };
  }

  if (item.ton_cuoi_ky < item.ton_kho_min) {
    return { label: "Dưới định mức", tone: "warning" };
  }

  return { label: "Theo dõi", tone: "success" };
}

export default function DailyUsageReport() {
  const [draftFilters, setDraftFilters] = useState<Filters>({
    mãCap1: "all",
    mãCap2: "all",
    từNgày: getDefaultFromDate(),
    đếnNgày: getTodayInputValue(),
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);

  useEffect(() => {
    const availableLevel2 = LEVEL2_OPTIONS[draftFilters.mãCap1] ?? [];

    if (
      draftFilters.mãCap2 !== "all" &&
      !availableLevel2.some((option) => option.value === draftFilters.mãCap2)
    ) {
      setDraftFilters((current) => ({ ...current, mãCap2: "all" }));
    }
  }, [draftFilters.mãCap1, draftFilters.mãCap2]);

  const activeFilters = appliedFilters ?? draftFilters;
  const periodDays = calculatePeriodDays(
    activeFilters.từNgày,
    activeFilters.đếnNgày,
  );

  const visibleRows = useMemo(() => {
    if (!appliedFilters) {
      return MOCK_DATA;
    }

    return MOCK_DATA.filter((item) => {
      const matchLevel1 =
        appliedFilters.mãCap1 === "all" ||
        item.mã_cap1 === appliedFilters.mãCap1;
      const matchLevel2 =
        appliedFilters.mãCap2 === "all" ||
        item.mã_cap2 === appliedFilters.mãCap2;
      return matchLevel1 && matchLevel2;
    });
  }, [appliedFilters]);

  const level2Options =
    activeFilters.mãCap1 === "all"
      ? []
      : (LEVEL2_OPTIONS[activeFilters.mãCap1] ?? []);

  const handleApply = () => {
    setAppliedFilters(draftFilters);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      mãCap1: "all",
      mãCap2: "all",
      từNgày: getDefaultFromDate(),
      đếnNgày: getTodayInputValue(),
    };

    setDraftFilters(resetFilters);
    setAppliedFilters(null);
  };

  const handleExportExcel = () => {
    console.log("Xuất Excel");
  };

  const handleExportPdf = () => {
    console.log("Xuất PDF");
  };

  const handleSendEmail = () => {
    console.log("Gửi Email");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mã cấp 1
                </label>
                <Select
                  value={draftFilters.mãCap1}
                  onValueChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      mãCap1: value,
                    }))
                  }
                >
                  <SelectTrigger className="bg-neutral text-foreground border-border">
                    <SelectValue placeholder="Chọn mã cấp 1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mã cấp 1</SelectItem>
                    {LEVEL1_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Mã cấp 2
                </label>
                <Select
                  value={draftFilters.mãCap2}
                  onValueChange={(value) =>
                    setDraftFilters((current) => ({
                      ...current,
                      mãCap2: value,
                    }))
                  }
                  disabled={draftFilters.mãCap1 === "all"}
                >
                  <SelectTrigger className="bg-neutral text-foreground border-border">
                    <SelectValue placeholder="Chọn mã cấp 2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mã cấp 2</SelectItem>
                    {level2Options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={draftFilters.từNgày}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      từNgày: event.target.value,
                    }))
                  }
                  className="bg-neutral text-foreground border-border"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={draftFilters.đếnNgày}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      đếnNgày: event.target.value,
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

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </Button>
        <Button variant="outline" onClick={handleExportPdf}>
          <FileDown className="h-4 w-4" />
          Xuất PDF
        </Button>
        <Button variant="outline" onClick={handleSendEmail}>
          <Mail className="h-4 w-4" />
          Gửi Email
        </Button>
      </div>

      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">
            Mức sử dụng trung bình ngày và cảnh báo gọi hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-[1200px] w-full border-collapse">
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
                    ĐVT
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Tồn cuối kỳ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Xuất trong kỳ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Số ngày trong kỳ
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Mức dùng/ngày
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Số ngày còn dùng (DOI)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Tồn kho min
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Cảnh báo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-neutral">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Không có dữ liệu phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((item, index) => {
                    const mucDungNgay = item.xuat_trong_ky / periodDays;
                    const doi =
                      mucDungNgay > 0
                        ? item.ton_cuoi_ky / mucDungNgay
                        : Number.POSITIVE_INFINITY;
                    const warning = calculateWarning(item, doi);

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
                          {item.đvt}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {item.ton_cuoi_ky.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {item.xuat_trong_ky.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {periodDays.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {mucDungNgay.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {Number.isFinite(doi) ? Math.floor(doi) : "0"}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground text-right">
                          {item.ton_kho_min.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge
                            className={`rounded-full px-2 py-1 text-xs font-medium border ${
                              warning.tone === "destructive"
                                ? "border-red-500 bg-red-500/10 text-red-600"
                                : warning.tone === "warning"
                                  ? "border-orange-500 bg-orange-500/10 text-orange-600"
                                  : "border-green-500 bg-green-500/10 text-green-600"
                            }`}
                          >
                            {warning.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
