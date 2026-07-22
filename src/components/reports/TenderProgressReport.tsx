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

interface TenderProgressReportProps {
  supplies: MedicalSupply[];
  loading: boolean;
}

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

const mapMedicalSupplyToTenderItem = (item: MedicalSupply): TenderItem => {
  return {
    mã_vt: item.maVtyt,
    tên_vật_tư: item.tenVtyt,
    nhà_cung_cấp: item.nhaThau || 'Không rõ',
    đvt: item.donViTinh,
    tongthau: parseFloat(item.tongThau) || 0,
    tongnhap: item.tongNhap || 0,
    price: item.donGia || 0,
    mã_cap1: getMãCấp1(item),
    mã_cap2: getMãCấp2(item),
  };
};


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

const PAGE_SIZE = 100;

export default function TenderProgressReport({ supplies: rawSupplies, loading }: TenderProgressReportProps) {

  const supplies = useMemo(() => {
    return rawSupplies.map(mapMedicalSupplyToTenderItem);
  }, [rawSupplies]);

  const [draftFilters, setDraftFilters] = useState<Filters>({
    mãCap1: "all",
    mãCap2: "all",
    nhàCungCấp: "all",
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

  const supplierOptions = useMemo(() => {
    const list = supplies.map((item) => item.nhà_cung_cấp).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));
  }, [supplies]);

  // Reset mã cấp 2 khi mã cấp 1 thay đổi
  useEffect(() => {
    if (
      draftFilters.mãCap2 !== "all" &&
      !level2Options.includes(draftFilters.mãCap2)
    ) {
      setDraftFilters((cur) => ({ ...cur, mãCap2: "all" }));
    }
  }, [draftFilters.mãCap1, draftFilters.mãCap2, level2Options]);

  const visibleRows = useMemo(() => {
    if (!appliedFilters) return supplies;

    return supplies.filter((item) => {
      const matchCap1 =
        appliedFilters.mãCap1 === "all" ||
        item.mã_cap1 === appliedFilters.mãCap1;
      const matchCap2 =
        appliedFilters.mãCap2 === "all" ||
        item.mã_cap2 === appliedFilters.mãCap2;
      const matchNcc =
        appliedFilters.nhàCungCấp === "all" ||
        item.nhà_cung_cấp === appliedFilters.nhàCungCấp;
      return matchCap1 && matchCap2 && matchNcc;
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

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const handleReset = () => {
    const reset: Filters = {
      mãCap1: "all",
      mãCap2: "all",
      nhàCungCấp: "all",
    };
    setDraftFilters(reset);
    setAppliedFilters(null);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium text-sm animate-pulse">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          Đang tải dữ liệu thầu từ máy chủ...
        </div>
      )}
      {/* Filter bar */}
      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
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
                    {level1Options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
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
                      <SelectItem key={opt} value={opt}>
                        {opt}
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
                    {supplierOptions.map((opt) => (
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

      {/* Bảng */}
      <Card className="bg-neutral border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-foreground">
            Theo dõi tiến độ thực hiện thầu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[calc(100vh-12rem)] overflow-auto rounded-lg border border-border">
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
                  paginatedRows.map((item, index) => {
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
                          {(page - 1) * PAGE_SIZE + index + 1}
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
