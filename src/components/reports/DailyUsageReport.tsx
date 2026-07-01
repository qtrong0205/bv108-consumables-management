import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/ui/pagination";
import { MedicalSupply } from "@/types";

interface DailyUsageReportProps {
  supplies: MedicalSupply[];
  loading: boolean;
}

interface SupplyItem {
  mã_vt: string;
  tên_vật_tư: string;
  đvt: string;
  ton_cuoi_ky: number;
  xuat_trong_ky: number;
  ton_kho_min: number;
  mã_cap1: string;
  mã_cap2: string;
  hang_sx: string;
  nuoc_sx: string;
}

type Filters = {
  mãCap1: string;
  mãCap2: string;
};

const parseTypeNameParts = (typeName?: string): string[] => {
  if (!typeName) return [];
  return typeName.split('-').map(p => p.trim()).filter(Boolean);
};

const getMãCấp1 = (item: MedicalSupply): string => {
  if (item.maNhom) return item.maNhom.trim();
  const parts = parseTypeNameParts(item.typeName);
  return parts.length >= 1 ? parts[0] : '';
};

const getMãCấp2 = (item: MedicalSupply): string => {
  const maCấp1 = getMãCấp1(item);
  if (!maCấp1) return '';
  const parts = parseTypeNameParts(item.typeName);
  if (parts.length >= 2) {
    const part1 = parts[1].split(' ')[0];
    return `${maCấp1}-${part1}`;
  }
  return '';
};

const mapMedicalSupplyToSupplyItem = (item: MedicalSupply): SupplyItem => {
  return {
    mã_vt: item.maVtyt,
    tên_vật_tư: item.tenVtyt,
    đvt: item.donViTinh,
    ton_cuoi_ky: item.soLuongTon,
    xuat_trong_ky: item.soLuongTieuHao,
    ton_kho_min: item.soLuongToiThieu,
    mã_cap1: getMãCấp1(item),
    mã_cap2: getMãCấp2(item),
    hang_sx: item.hangSanXuat || '',
    nuoc_sx: item.nuocSanXuat || '',
  };
};



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

const PAGE_SIZE = 100;

export default function DailyUsageReport({ supplies: rawSupplies, loading }: DailyUsageReportProps) {

  const supplies = useMemo(() => {
    return rawSupplies.map(mapMedicalSupplyToSupplyItem);
  }, [rawSupplies]);

  const [draftFilters, setDraftFilters] = useState<Filters>({
    mãCap1: "all",
    mãCap2: "all",
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
  const [page, setPage] = useState(1);

  const level1Options = useMemo(() => {
    const list = supplies.map((item) => item.mã_cap1).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [supplies]);

  const level2Options = useMemo(() => {
    const targetCap1 = draftFilters.mãCap1;
    if (targetCap1 === "all") return [];
    const list = supplies
      .filter((item) => item.mã_cap1 === targetCap1)
      .map((item) => item.mã_cap2)
      .filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [supplies, draftFilters.mãCap1]);

  useEffect(() => {
    if (
      draftFilters.mãCap2 !== "all" &&
      !level2Options.includes(draftFilters.mãCap2)
    ) {
      setDraftFilters((current) => ({ ...current, mãCap2: "all" }));
    }
  }, [draftFilters.mãCap1, draftFilters.mãCap2, level2Options]);

  const periodDays = 30;

  const visibleRows = useMemo(() => {
    if (!appliedFilters) {
      return supplies;
    }

    return supplies.filter((item) => {
      const matchLevel1 =
        appliedFilters.mãCap1 === "all" ||
        item.mã_cap1 === appliedFilters.mãCap1;
      const matchLevel2 =
        appliedFilters.mãCap2 === "all" ||
        item.mã_cap2 === appliedFilters.mãCap2;
      return matchLevel1 && matchLevel2;
    });
  }, [supplies, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return visibleRows.slice(start, start + PAGE_SIZE);
  }, [page, visibleRows]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const handleReset = () => {
    const resetFilters: Filters = {
      mãCap1: "all",
      mãCap2: "all",
    };

    setDraftFilters(resetFilters);
    setAppliedFilters(null);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium text-sm animate-pulse">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          Đang tải dữ liệu từ máy chủ...
        </div>
      )}
      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
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
                    {level1Options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
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
                    {level2Options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Hãng sản xuất
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Nước sản xuất
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
                  paginatedRows.map((item, index) => {
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
                          {(page - 1) * PAGE_SIZE + index + 1}
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
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.hang_sx}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          {item.nuoc_sx}
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
          {visibleRows.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={visibleRows.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
