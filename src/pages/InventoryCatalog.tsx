import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  AlertTriangle,
  FileUp,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import InventoryTable from "@/components/inventory/InventoryTable";
import ItemDetailModal from "@/components/inventory/ItemDetailModal";
import { MedicalSupply } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadExcel } from "@/lib/excel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  useAllSupplies,
  useSupplyGroups,
} from "@/hooks/use-supplies";
import Pagination from "@/components/ui/pagination";

const getTypeLevel1 = (typeName?: string): string => {
  if (!typeName) return "";
  const parts = typeName
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  const code = parts.length >= 1 ? parts[0] : "";
  const codeParts = code.split(".");
  if (codeParts.length <= 3) return code;
  return codeParts.slice(0, 3).join(".");
};

const getTypeLevel2 = (typeName?: string): string => {
  if (!typeName) return "";
  const parts = typeName
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= 2 ? parts[1] : "";
};

export default function InventoryCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypeLevel1, setSelectedTypeLevel1] = useState<string[]>([]);
  const [selectedTypeLevel2, setSelectedTypeLevel2] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<
    "all" | "low-stock" | "out-of-stock"
  >("all");
  const [selectedItem, setSelectedItem] = useState<MedicalSupply | null>(null);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [typeLevel1PopoverOpen, setTypeLevel1PopoverOpen] = useState(false);
  const [typeLevel2PopoverOpen, setTypeLevel2PopoverOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const { toast } = useToast();

  const {
    supplies,
    loading,
    error,
    total,
  } = useAllSupplies();
  const { groups: categories } = useSupplyGroups();
  const typeLevel1Options = useMemo(
    () =>
      [
        ...new Set(
          supplies.map((item) => getTypeLevel1(item.typeName)).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [supplies],
  );
  const typeLevel2Options = useMemo(() => {
    if (selectedTypeLevel1.length === 0) return [];
    const base = supplies.filter((item) =>
      selectedTypeLevel1.includes(getTypeLevel1(item.typeName)),
    );
    return [
      ...new Set(
        base.map((item) => getTypeLevel2(item.typeName)).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [supplies, selectedTypeLevel1]);

  useEffect(() => {
    if (selectedTypeLevel1.length === 0) return;
    const valid = selectedTypeLevel1.filter((code) =>
      typeLevel1Options.includes(code),
    );
    if (valid.length !== selectedTypeLevel1.length) {
      setSelectedTypeLevel1(valid);
    }
  }, [selectedTypeLevel1, typeLevel1Options]);

  useEffect(() => {
    if (selectedTypeLevel2.length === 0) return;
    const valid = selectedTypeLevel2.filter((code) =>
      typeLevel2Options.includes(code),
    );
    if (valid.length !== selectedTypeLevel2.length) {
      setSelectedTypeLevel2(valid);
    }
  }, [selectedTypeLevel2, typeLevel2Options]);

  useEffect(() => {
    if (selectedTypeLevel1.length === 0 && selectedTypeLevel2.length > 0) {
      setSelectedTypeLevel2([]);
    }
  }, [selectedTypeLevel1, selectedTypeLevel2]);

  // Đọc filter từ URL khi component mount
  useEffect(() => {
    const filterParam = searchParams.get("filter");
    if (filterParam === "low-stock" || filterParam === "out-of-stock") {
      setStockFilter(filterParam);
      return;
    }
    setStockFilter("all");
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Hiển thị thông báo lỗi nếu có
  useEffect(() => {
    if (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter trên toàn bộ catalog đã tải để tránh chỉ lọc trong trang hiện tại.
  const filteredItems = useMemo(() => {
    let filtered = supplies;

    const keyword = searchInput.trim().toLowerCase();
    if (keyword) {
      filtered = filtered.filter((item) => {
        const haystacks = [
          item.tenVtyt,
          item.maVtyt,
          item.id,
          item.tenThuongMai,
          item.nhaThau,
          item.maHieu,
        ];
        return haystacks.some((value) =>
          String(value || "").toLowerCase().includes(keyword),
        );
      });
    }

    // Filter theo danh mục (nhiều danh mục)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) =>
        selectedCategories.includes(item.tenNhom || ""),
      );
    }

    // Filter theo mã cấp 1 của typeName
    if (selectedTypeLevel1.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTypeLevel1.includes(getTypeLevel1(item.typeName)),
      );
    }

    // Filter theo mã cấp 2 của typeName (chỉ khi đã chọn mã cấp 1)
    if (selectedTypeLevel1.length > 0 && selectedTypeLevel2.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTypeLevel2.includes(getTypeLevel2(item.typeName)),
      );
    }

    // Filter theo tình trạng tồn kho
    if (stockFilter === "low-stock") {
      filtered = filtered.filter(
        (item) => item.soLuongTon > 0 && item.soLuongTon < item.soLuongToiThieu,
      );
    }

    if (stockFilter === "out-of-stock") {
      filtered = filtered.filter((item) => item.soLuongTon === 0);
    }

    return filtered;
  }, [
    supplies,
    searchInput,
    selectedCategories,
    selectedTypeLevel1,
    selectedTypeLevel2,
    stockFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [
    searchInput,
    selectedCategories,
    selectedTypeLevel1,
    selectedTypeLevel2,
    stockFilter,
    pageSize,
  ]);

  useEffect(() => {
    if (page <= totalPages) return;
    setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, page, pageSize]);

  // Tính toán lowStock từ dữ liệu supplies
  const lowStock = useMemo(() => {
    return supplies
      .filter(
        (item) => item.soLuongTon > 0 && item.soLuongTon < item.soLuongToiThieu,
      )
      .map((item) => item.maVtyt);
  }, [supplies]);

  const outOfStockCount = useMemo(() => {
    return supplies.filter((item) => item.soLuongTon === 0).length;
  }, [supplies]);

  const lowStockCount = lowStock.length;
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTypeLevel1.length > 0 ||
    selectedTypeLevel2.length > 0 ||
    stockFilter !== "all";
  const isTypeLevel2Disabled = selectedTypeLevel1.length === 0;
  const isAllTypeLevel1Selected =
    selectedTypeLevel1.length > 0 &&
    selectedTypeLevel1.length === typeLevel1Options.length;
  const isAllTypeLevel2Selected =
    selectedTypeLevel2.length > 0 &&
    selectedTypeLevel2.length === typeLevel2Options.length;
  const typeLevel1Label =
    selectedTypeLevel1.length === 0
      ? "Tất cả mã cấp 1"
      : selectedTypeLevel1.length === 1
        ? selectedTypeLevel1[0]
        : `${selectedTypeLevel1.length} mã cấp 1 đã chọn`;
  const typeLevel2Label = isTypeLevel2Disabled
    ? "Chọn mã cấp 1 trước"
    : selectedTypeLevel2.length === 0
      ? "Tất cả mã cấp 2"
      : selectedTypeLevel2.length === 1
        ? selectedTypeLevel2[0]
        : `${selectedTypeLevel2.length} mã cấp 2 đã chọn`;

  useEffect(() => {
    if (isTypeLevel2Disabled && typeLevel2PopoverOpen) {
      setTypeLevel2PopoverOpen(false);
    }
  }, [isTypeLevel2Disabled, typeLevel2PopoverOpen]);

  const handleStockFilterChange = (
    value: "all" | "low-stock" | "out-of-stock",
  ) => {
    setStockFilter(value);
    if (value === "all") {
      setSearchParams({});
      return;
    }
    setSearchParams({ filter: value });
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
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

  const handleTypeLevel2Toggle = (code: string) => {
    if (isTypeLevel2Disabled) return;
    setSelectedTypeLevel2((prev) => {
      if (prev.includes(code)) {
        return prev.filter((item) => item !== code);
      }
      return [...prev, code];
    });
  };

  const handleSelectAllTypeLevel2 = () => {
    if (isTypeLevel2Disabled) return;
    if (selectedTypeLevel2.length === typeLevel2Options.length) {
      setSelectedTypeLevel2([]);
    } else {
      setSelectedTypeLevel2([...typeLevel2Options]);
    }
  };

  const handleClearTypeLevel2 = () => {
    setSelectedTypeLevel2([]);
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTypeLevel1([]);
    setSelectedTypeLevel2([]);
  };

  const handleExport = () => {
    const rows = filteredItems.map((item, index) => ({
      STT: index + 1,
      "Mã VT": item.maVtyt,
      "Mã quản lý": item.id,
      "Tên vật tư": item.tenVtyt,
      "Tên thương mại": item.tenThuongMai,
      "Mã hiệu": item.maHieu,
      "Hãng sản xuất": item.hangSanXuat,
      "Nước sản xuất": item.nuocSanXuat,
      "Mã nhóm": item.maNhom,
      "Nhóm vật tư": item.tenNhom,
      Loại: item.typeName,
      "Đơn vị tính": item.donViTinh,
      "Quy cách": item.quyCach,
      "Đơn giá": item.donGia,
      "Số lượng kế hoạch": item.soLuongKeHoach,
      "Tổng thầu": item.tongThau,
      "Nhà thầu": item.nhaThau,
      "Quyết định": item.quyetDinh,
      "Tồn tối thiểu": item.soLuongToiThieu,
      "Tồn hiện tại": item.soLuongTon,
      "Số lượng tiêu hao": item.soLuongTieuHao,
    }));
    const fileName = `danh_muc_ton_kho_${new Date().toISOString().split("T")[0]}.xls`;
    downloadExcel(fileName, rows);

    toast({
      title: "Xuất file Excel thành công",
      description: `File "${fileName}" đã được tải xuống`,
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-tertiary/95 backdrop-blur supports-[backdrop-filter]:bg-tertiary/80 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Danh mục tồn kho
          </h1>
          <p className="text-muted-foreground">
            Quản lý và giám sát tồn kho vật tư y tế
            {!loading && total > 0 && (
              <span className="ml-2 text-primary font-medium">
                • {total.toLocaleString("vi-VN")} vật tư
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {lowStockCount > 0 && (
            <div
              onClick={() =>
                handleStockFilterChange(
                  stockFilter === "low-stock" ? "all" : "low-stock",
                )
              }
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                stockFilter === "low-stock"
                  ? "bg-warning/20 border-warning"
                  : "bg-warning/10 border-warning hover:bg-warning/20"
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={2} />
              <span className="text-sm font-medium text-foreground">
                {stockFilter === "low-stock" ? "Đang lọc: " : ""}
                {lowStockCount} vật tư sắp hết
              </span>
            </div>
          )}

          {outOfStockCount > 0 && (
            <div
              onClick={() =>
                handleStockFilterChange(
                  stockFilter === "out-of-stock" ? "all" : "out-of-stock",
                )
              }
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                stockFilter === "out-of-stock"
                  ? "bg-red-500/20 border-red-500"
                  : "bg-red-500/10 border-red-500 hover:bg-red-500/20"
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2} />
              <span className="text-sm font-medium text-foreground">
                {stockFilter === "out-of-stock" ? "Đang lọc: " : ""}
                {outOfStockCount} vật tư đã hết
              </span>
            </div>
          )}

          <Button
            variant="outline"
            className="bg-neutral text-foreground border-border hover:bg-tertiary font-normal"
            onClick={handleExport}
          >
            <FileUp className="w-4 h-4 mr-2" strokeWidth={2} />
            Xuất file Excel
          </Button>
        </div>
      </div>

      <Card className="bg-neutral border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Lọc & Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                strokeWidth={2}
              />
              <Input
                type="search"
                placeholder="Tìm theo tên hoặc mã vật tư..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-neutral text-foreground border-border w-full"
              />
            </div>

            {/* Multi-select Category Filter */}
            <Popover
              open={categoryPopoverOpen}
              onOpenChange={setCategoryPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full min-w-0 lg:w-72 bg-neutral text-foreground border-border justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedCategories.length === 0
                      ? "Tất cả danh mục"
                      : selectedCategories.length === 1
                        ? selectedCategories[0]
                        : `${selectedCategories.length} danh mục đã chọn`}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] max-w-72 p-0"
                align="start"
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Chọn danh mục
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllCategories}
                        className="text-xs text-secondary hover:text-secondary/80"
                      >
                        {selectedCategories.length === categories.length
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                    >
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm text-foreground cursor-pointer flex-1"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCategories}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Multi-select Type Level 1 Filter */}
            <Popover
              open={typeLevel1PopoverOpen}
              onOpenChange={setTypeLevel1PopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full min-w-0 lg:w-56 bg-neutral text-foreground border-border justify-between font-normal"
                >
                  <span className="truncate">{typeLevel1Label}</span>
                  <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] max-w-56 p-0"
                align="start"
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Chọn mã cấp 1
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllTypeLevel1}
                        className="text-xs text-secondary hover:text-secondary/80"
                      >
                        {isAllTypeLevel1Selected
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {typeLevel1Options.map((code) => (
                    <div
                      key={code}
                      className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                      onClick={() => handleTypeLevel1Toggle(code)}
                    >
                      <Checkbox
                        id={`type-level1-${code}`}
                        checked={selectedTypeLevel1.includes(code)}
                        onCheckedChange={() => handleTypeLevel1Toggle(code)}
                      />
                      <label
                        htmlFor={`type-level1-${code}`}
                        className="text-sm text-foreground cursor-pointer flex-1"
                      >
                        {code}
                      </label>
                    </div>
                  ))}
                  {typeLevel1Options.length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground">
                      Không có mã cấp 1
                    </div>
                  )}
                </div>
                {selectedTypeLevel1.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearTypeLevel1}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Multi-select Type Level 2 Filter */}
            <Popover
              open={typeLevel2PopoverOpen}
              onOpenChange={setTypeLevel2PopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isTypeLevel2Disabled}
                  className="w-full min-w-0 lg:w-56 bg-neutral text-foreground border-border justify-between font-normal"
                >
                  <span className="truncate">{typeLevel2Label}</span>
                  <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-2rem)] max-w-56 p-0"
                align="start"
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Chọn mã cấp 2
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllTypeLevel2}
                        className="text-xs text-secondary hover:text-secondary/80"
                      >
                        {isAllTypeLevel2Selected
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {typeLevel2Options.map((code) => (
                    <div
                      key={code}
                      className="flex items-center space-x-2 p-2 hover:bg-tertiary rounded-md cursor-pointer"
                      onClick={() => handleTypeLevel2Toggle(code)}
                    >
                      <Checkbox
                        id={`type-level2-${code}`}
                        checked={selectedTypeLevel2.includes(code)}
                        onCheckedChange={() => handleTypeLevel2Toggle(code)}
                      />
                      <label
                        htmlFor={`type-level2-${code}`}
                        className="text-sm text-foreground cursor-pointer flex-1"
                      >
                        {code}
                      </label>
                    </div>
                  ))}
                  {typeLevel2Options.length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground">
                      Không có mã cấp 2
                    </div>
                  )}
                </div>
                {selectedTypeLevel2.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearTypeLevel2}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Select
              value={stockFilter}
              onValueChange={(v) =>
                handleStockFilterChange(
                  v as "all" | "low-stock" | "out-of-stock",
                )
              }
            >
              <SelectTrigger className="w-full min-w-0 lg:w-48 bg-neutral text-foreground border-border">
                <SelectValue placeholder="Tình trạng tồn kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="low-stock">Sắp hết hàng</SelectItem>
                <SelectItem value="out-of-stock">Đã hết hàng</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size Selector */}
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="w-full min-w-0 lg:w-40 bg-neutral text-foreground border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 / trang</SelectItem>
                <SelectItem value="100">100 / trang</SelectItem>
                <SelectItem value="200">200 / trang</SelectItem>
                <SelectItem value="500">500 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hiển thị các danh mục đã chọn */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              {selectedCategories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {selectedTypeLevel1.map((code) => (
                <Badge
                  key={`type1-${code}`}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                  onClick={() => handleTypeLevel1Toggle(code)}
                >
                  Mã cấp 1: {code}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {selectedTypeLevel2.map((code) => (
                <Badge
                  key={`type2-${code}`}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                  onClick={() => handleTypeLevel2Toggle(code)}
                >
                  Mã cấp 2: {code}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Card className="bg-neutral border-border">
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="bg-neutral border-border">
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-warning mb-4" />
            <p className="text-foreground font-medium mb-2">
              Không thể tải dữ liệu
            </p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      {!loading && !error && (
        <>
          <InventoryTable
            items={paginatedItems}
            lowStockItems={lowStock}
            onRowClick={setSelectedItem}
            enableGrouping={true}
          />

          {filteredItems.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}

          {hasActiveFilters || searchInput.trim() ? (
            <div className="text-center text-sm text-muted-foreground">
              Đang hiển thị {paginatedItems.length} /{" "}
              {filteredItems.length.toLocaleString("vi-VN")} vật tư trong kết
              quả lọc, trên tổng {supplies.length.toLocaleString("vi-VN")} vật
              tư
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Đang hiển thị {paginatedItems.length} /{" "}
              {total.toLocaleString("vi-VN")} vật tư
            </div>
          )}
        </>
      )}

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          allSupplies={supplies}
          onItemChange={setSelectedItem}
        />
      )}
    </div>
  );
}
